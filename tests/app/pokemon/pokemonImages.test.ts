import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createModule = async () => {
  vi.resetModules();
  return import('@/app/pokemon/lib/pokemonImages');
};

describe('findPokemonImagePath', () => {
  let originalCwd: string;
  let tmpDir: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pokemon-img-test-'));
    process.chdir(tmpDir);
    fs.mkdirSync(path.join(tmpDir, 'public', 'img'), { recursive: true });
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns image path when a file with matching id prefix exists', async () => {
    const filePath = path.join(tmpDir, 'public', 'img', '025_Pikachu.png');
    fs.writeFileSync(filePath, 'fake image bytes');

    const { findPokemonImagePath } = await createModule();

    expect(findPokemonImagePath(25)).toBe('/img/025_Pikachu.png');
  });

  it('returns null when no matching image is found', async () => {
    const { findPokemonImagePath } = await createModule();

    expect(findPokemonImagePath(999)).toBeNull();
  });
});

describe('image filename and form identity', () => {
  afterEach(() => vi.restoreAllMocks());

  function mockFiles(names: string[]) {
    vi.spyOn(fs, 'readdirSync').mockReturnValue(
      names.map((name) => ({ name, isFile: () => true })) as unknown as ReturnType<
        typeof fs.readdirSync
      >,
    );
  }

  it.each([
    ['100_Voltorb.png', '1000_Gholdengo.png', '1001-Wo-Chien.webp'],
    ['1001-Wo-Chien.webp', '1000_Gholdengo.png', '100_Voltorb.png'],
  ])('keeps full three/four digit ids independent of enumeration order: %j', async (...names) => {
    // Arrange
    mockFiles(names);
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(100)).toBe('/img/100_Voltorb.png');
    expect(target.findPokemonImagePath(1000)).toBe('/img/1000_Gholdengo.png');
    expect(target.findPokemonImagePath(1001)).toBe('/img/1001-Wo-Chien.webp');
  });

  it('rejects missing delimiters and unsupported files', async () => {
    // Arrange
    mockFiles(['1000bad.png', '10001_Bad.png', '10_Short.png', '100_Notes.txt', '100.png']);
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(100)).toBeNull();
    expect(target.findPokemonImagePath(1000)).toBeNull();
  });

  it.each([
    ['019_小拉達.png', '019_小拉達(阿羅拉型態).png'],
    ['019_小拉達(阿羅拉型態).png', '019_小拉達.png'],
  ])('selects regular and regional assets by form identity: %j', async (...names) => {
    // Arrange
    mockFiles(names);
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(19, 'rattata')).toBe('/img/019_小拉達.png');
    expect(target.findPokemonImagePath(19, 'alolan-rattata')).toBe(
      '/img/019_小拉達(阿羅拉型態).png',
    );
    expect(target.findPokemonImagePath(19)).toBeNull();
    expect(target.findPokemonImagePath(19, 'unknown-form')).toBeNull();
  });

  it('never presents regular Charizard as either Mega form', async () => {
    // Arrange
    mockFiles(['006_噴火龍.png']);
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(6, 'charizard')).toBe('/img/006_噴火龍.png');
    expect(target.findPokemonImagePath(6, 'mega-charizard-x')).toBeNull();
    expect(target.findPokemonImagePath(6, 'mega-charizard-y')).toBeNull();
  });

  it.each([
    ['006_噴火龍.png', '006_mega-charizard-x.png', '006_mega-charizard-y.png'],
    ['006_mega-charizard-y.png', '006_噴火龍.png', '006_mega-charizard-x.png'],
  ])(
    'selects each downloaded Mega asset independently of enumeration order: %j',
    async (...names) => {
      // Arrange
      mockFiles(names);
      const target = await createModule();

      // Act / Assert
      expect(target.findPokemonImagePath(6, 'charizard')).toBe('/img/006_噴火龍.png');
      expect(target.findPokemonImagePath(6, 'mega-charizard-x')).toBe(
        '/img/006_mega-charizard-x.png',
      );
      expect(target.findPokemonImagePath(6, 'mega-charizard-y')).toBe(
        '/img/006_mega-charizard-y.png',
      );
      expect(target.findPokemonImagePath(6)).toBeNull();
    },
  );

  it('does not use a regional or Zen Mode image for another form of the same species', async () => {
    // Arrange
    mockFiles([
      '555_galarian-darmanitan-zen-mode.png',
      '555_darmanitan-zen-mode.png',
      '555_galarian-darmanitan.png',
    ]);
    const target = await createModule();

    // Act / Assert
    expect(target.findPokemonImagePath(555, 'darmanitan-zen-mode')).toBe(
      '/img/555_darmanitan-zen-mode.png',
    );
    expect(target.findPokemonImagePath(555, 'galarian-darmanitan')).toBe(
      '/img/555_galarian-darmanitan.png',
    );
    expect(target.findPokemonImagePath(555, 'galarian-darmanitan-zen-mode')).toBe(
      '/img/555_galarian-darmanitan-zen-mode.png',
    );
    expect(target.findPokemonImagePath(555, 'darmanitan')).toBeNull();
  });

  it.each([
    [710, 'pumpkaboo'],
    [711, 'gourgeist'],
  ])(
    'keeps unconfirmed sizes missing when only the average size for #%s is available',
    async (id, species) => {
      // Arrange
      const filename = `${id}_average-size-${species}.png`;
      mockFiles([filename]);
      const target = await createModule();

      // Act / Assert
      expect(target.findPokemonImagePath(id, `average-size-${species}`)).toBe(`/img/${filename}`);
      expect(target.findPokemonImagePath(id, `small-size-${species}`)).toBeNull();
      expect(target.findPokemonImagePath(id, `large-size-${species}`)).toBeNull();
      expect(target.findPokemonImagePath(id, `super-size-${species}`)).toBeNull();
    },
  );

  it('keeps Ash-Greninja missing when regular Greninja artwork is available', async () => {
    // Arrange
    mockFiles(['658_甲賀忍蛙.png']);
    const target = await createModule();

    // Act / Assert
    expect(target.findPokemonImagePath(658, 'greninja')).toBe('/img/658_甲賀忍蛙.png');
    expect(target.findPokemonImagePath(658, 'ash-greninja')).toBeNull();
  });

  it('returns a placeholder when a mapped asset is absent', async () => {
    // Arrange
    mockFiles(['006_unrelated.png']);
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(6, 'charizard')).toBeNull();
  });

  it('ignores directories with image-like names', async () => {
    // Arrange
    vi.spyOn(fs, 'readdirSync').mockReturnValue([
      { name: '006_噴火龍.png', isFile: () => false },
    ] as unknown as ReturnType<typeof fs.readdirSync>);
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(6, 'charizard')).toBeNull();
  });

  it('returns a placeholder when the image directory cannot be read', async () => {
    // Arrange
    vi.spyOn(fs, 'readdirSync').mockImplementation(() => {
      throw new Error('EACCES');
    });
    const target = await createModule();
    // Act / Assert
    expect(target.findPokemonImagePath(6, 'charizard')).toBeNull();
  });
});

it('resolves every maintained form mapping to a real asset and CSV identity', async () => {
  // Arrange: Check the maintained mapping against the real dataset, not the test fixture.
  const { parse } = await import('csv-parse/sync');
  const { createPokemonFormId } = await import('@/core/domain/valueObjects/PokemonFormId');
  const { default: mappings } = await import('@/app/pokemon/lib/pokemonFormImages.json');
  const rows = parse(fs.readFileSync('data/pokemonCsv.csv', 'utf8'), { columns: true }) as {
    Number: string;
    Name: string;
  }[];
  const identities = new Set(
    rows.map((row) => `${Number(row.Number)}:${createPokemonFormId(row.Name)}`),
  );
  const target = await createModule();
  // Act / Assert: Renamed, deleted or incorrectly numbered assets cannot silently drift.
  for (const [identity, filename] of Object.entries(mappings)) {
    const [id, formId] = identity.split(':');
    expect(identities.has(identity), identity).toBe(true);
    expect(target.findPokemonImagePath(Number(id), formId), identity).toBe(`/img/${filename}`);
  }
});
