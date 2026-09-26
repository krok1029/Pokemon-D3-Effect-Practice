import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const suiteArg = args.find((arg) => arg.startsWith('--suite='));
const suite = suiteArg?.slice('--suite='.length) ?? 'all';
const playwrightArgs = args.filter((arg) => arg !== suiteArg);
const externalURL = process.env.PLAYWRIGHT_BASE_URL;
if (!['all', 'catalog', 'averages'].includes(suite))
  throw new Error('Use --suite=all|catalog|averages.');
if (externalURL && suite === 'all') {
  throw new Error(
    'An external PLAYWRIGHT_BASE_URL requires --suite=catalog or --suite=averages to identify its CSV.',
  );
}

const resultsRoot = path.join(root, 'test-results');
await mkdir(resultsRoot, { recursive: true });
const output = await mkdtemp(path.join(resultsRoot, 'regression-'));
const children = new Set();
let scratch;
let interrupted = false;

function signalChild(child, signal) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  try {
    if (process.platform === 'win32') child.kill(signal);
    else process.kill(-child.pid, signal);
  } catch (error) {
    if (error.code !== 'ESRCH') throw error;
  }
}

function launch(name, command, commandArgs, cwd, env) {
  const logPath = path.join(output, `${name}.log`);
  const log = createWriteStream(logPath);
  const child = spawn(command, commandArgs, {
    cwd,
    env,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const completed = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      children.delete(child);
      log.end();
      resolve({ code, signal });
    });
  });
  return { child, completed, logPath };
}

async function finish(stage) {
  const { code, signal } = await stage.completed;
  if (code !== 0) throw new Error(`Command failed (${signal ?? code}); see ${stage.logPath}`);
}

async function stop(stage) {
  signalChild(stage.child, 'SIGTERM');
  const force = setTimeout(() => signalChild(stage.child, 'SIGKILL'), 5000);
  try {
    await stage.completed;
  } finally {
    clearTimeout(force);
  }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    interrupted = true;
    for (const child of children) signalChild(child, 'SIGTERM');
    setTimeout(() => {
      for (const child of children) signalChild(child, 'SIGKILL');
    }, 5000).unref();
  });
}

async function availablePort() {
  const socket = createServer();
  await new Promise((resolve, reject) => {
    socket.once('error', reject);
    socket.listen(0, '127.0.0.1', resolve);
  });
  const port = socket.address().port;
  await new Promise((resolve, reject) =>
    socket.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

async function snapshot() {
  scratch = await mkdtemp(path.join(tmpdir(), 'pokemon-e2e-'));
  const project = path.join(scratch, 'project');
  await mkdir(project);
  const files = execFileSync(
    'git',
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8' },
  );
  for (const file of new Set(files.split('\0').filter(Boolean))) {
    if (interrupted) throw new Error('Interrupted');
    await mkdir(path.dirname(path.join(project, file)), { recursive: true });
    try {
      await cp(path.join(root, file), path.join(project, file));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  await symlink(
    path.join(root, 'node_modules'),
    path.join(project, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  return project;
}

async function ready(stage, url, count) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline && !interrupted) {
    if (stage.child.exitCode !== null || stage.child.signalCode !== null) await finish(stage);
    try {
      const response = await fetch(`${url}/api/pokemon`, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.json()).total === count) return;
    } catch {
      /* The new process may not have bound its port yet. */
    }
    await delay(200);
  }
  throw new Error(`Server did not expose the expected ${count}-row CSV; see ${stage.logPath}`);
}

async function runSuite(name, project, url, env) {
  console.log(`[e2e] ${name}: ${url}; results ${path.join(output, name)}`);
  await finish(
    launch(
      name,
      process.execPath,
      [path.join(root, 'node_modules/playwright/cli.js'), 'test', ...playwrightArgs],
      project,
      {
        ...env,
        PLAYWRIGHT_BASE_URL: url,
        E2E_SUITE: name,
        E2E_OUTPUT_DIR: path.join(output, name, 'results'),
        E2E_REPORT_DIR: path.join(output, name, 'report'),
      },
    ),
  );
}

console.log(`[e2e] Logs and failure artifacts: ${output}`);
try {
  const suites = suite === 'all' ? ['catalog', 'averages'] : [suite];
  await writeFile(
    path.join(output, 'run.json'),
    JSON.stringify(
      { node: process.version, suites, playwrightArgs, externalURL: externalURL ?? null },
      null,
      2,
    ),
  );
  if (externalURL) {
    await runSuite(suite, root, externalURL, process.env);
  } else {
    const project = await snapshot();
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      POKEMON_DATA_PATH: path.join(project, 'data/pokemonCsv.csv'),
    };
    delete env.PLAYWRIGHT_BASE_URL;
    const next = path.join(root, 'node_modules/next/dist/bin/next');
    if (interrupted) throw new Error('Interrupted');
    console.log(`[e2e] Building current workspace in ${project}`);
    await finish(launch('build', process.execPath, [next, 'build'], project, env));
    for (const name of suites) {
      if (interrupted) throw new Error('Interrupted');
      const fixture = name === 'averages';
      const port = await availablePort();
      const url = `http://127.0.0.1:${port}`;
      const serverEnv = {
        ...env,
        POKEMON_DATA_PATH: path.join(
          project,
          fixture ? 'tests/e2e/fixtures/navigation.csv' : 'data/pokemonCsv.csv',
        ),
      };
      const server = launch(
        `${name}-server`,
        process.execPath,
        [next, 'start', '--hostname', '127.0.0.1', '--port', String(port)],
        project,
        serverEnv,
      );
      try {
        await ready(server, url, fixture ? 4 : 1032);
        await runSuite(name, project, url, serverEnv);
      } finally {
        await stop(server);
      }
    }
  }
  console.log('[e2e] All selected suites passed.');
} catch (error) {
  console.error(`[e2e] ${error.message}`);
  process.exitCode = interrupted ? 130 : 1;
} finally {
  for (const child of children) signalChild(child, 'SIGKILL');
  if (scratch) await rm(scratch, { recursive: true, force: true });
}
