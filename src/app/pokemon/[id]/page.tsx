import Image from 'next/image';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

import { PokemonListReturnLink } from '../components/PokemonListReturnLink';
import { loadPokemonFormViewModel } from '../presenter';

import type {
  PokemonDetailEntryViewModel,
  PokemonTypeMatchupViewModel,
} from '../view-models/pokemonDetailViewModel';

type PokemonDetailRouteProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ form?: string | string[]; returnTo?: string | string[] }>;
};

async function loadRoutePokemon({ params, searchParams }: PokemonDetailRouteProps) {
  const [{ id: rawId }, query] = await Promise.all([params, searchParams]);
  const id = Number(rawId);
  const formId = query?.form;
  if (!/^\d+$/.test(rawId) || !Number.isSafeInteger(id) || id <= 0) return null;
  if (
    formId !== undefined &&
    (typeof formId !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formId))
  )
    return null;
  return loadPokemonFormViewModel(id, formId);
}

export async function generateMetadata(props: PokemonDetailRouteProps) {
  const pokemon = await loadRoutePokemon(props);
  if (!pokemon) {
    return {
      title: '寶可夢資料',
      description: '瀏覽每隻寶可夢的基礎能力值與屬性。',
    };
  }
  const paddedId = pokemon.id.toString().padStart(3, '0');
  return {
    title: `${pokemon.name} #${paddedId}｜寶可夢資料`,
    description: `${pokemon.name} 的基礎能力值、屬性與傳說狀態。`,
  };
}

export default async function PokemonDetailRoute(props: PokemonDetailRouteProps) {
  const [pokemon, searchParams] = await Promise.all([loadRoutePokemon(props), props.searchParams]);
  if (!pokemon) notFound();
  const returnTo = typeof searchParams?.returnTo === 'string' ? searchParams.returnTo : undefined;

  const paddedId = pokemon.id.toString().padStart(3, '0');
  const hasMatchups = pokemon.defenseMatchups.length > 0 || pokemon.offenseMatchups.length > 0;

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <PokemonListReturnLink returnTo={returnTo} />
        <span aria-hidden="true">/</span>
        <span className="text-slate-500">#{paddedId}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800">
          <CardHeader className="items-center gap-3 pb-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              <PokemonImage pokemon={pokemon} />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase dark:text-slate-400">
                #{paddedId}
              </p>
              <CardTitle className="mt-1 text-3xl">{pokemon.name}</CardTitle>
            </div>
            {pokemon.isLegendary ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800 uppercase shadow-sm dark:bg-amber-900/80 dark:text-amber-100">
                傳說寶可夢
              </span>
            ) : null}
            <div className="flex flex-wrap justify-center gap-2">
              {pokemon.typeBadges.map((badge) => (
                <span
                  key={badge.slug}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm dark:text-slate-50"
                  style={{ borderColor: badge.color }}
                >
                  <Image
                    src={badge.iconPath}
                    alt={badge.label}
                    width={16}
                    height={16}
                    className="h-4 w-4"
                  />
                  {badge.label}
                </span>
              ))}
            </div>
          </CardHeader>

          <CardContent className="mt-2 space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-900 dark:text-slate-100">
              <span>能力值總和</span>
              <span className="text-base">{pokemon.total}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              圖片來源為專案提供的本機圖檔。若未找到對應圖檔，將顯示灰階佔位符。
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">能力值細節</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {pokemon.stats.map((stat) => (
              <div key={stat.key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {stat.label}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">{stat.value}</div>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full transition-[width]"
                    style={{
                      width: `${Math.round(stat.ratio * 100)}%`,
                      backgroundColor: pokemon.accentColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {hasMatchups ? (
        <TypeMatchupPanel
          defenseMatchups={pokemon.defenseMatchups}
          offenseMatchups={pokemon.offenseMatchups}
          ownTypeLabels={pokemon.typeBadges.map((type) => type.label)}
        />
      ) : null}
    </section>
  );
}

function PokemonImage({ pokemon }: { pokemon: PokemonDetailEntryViewModel }) {
  if (!pokemon.imagePath) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        無圖片
      </div>
    );
  }

  return (
    <Image
      src={pokemon.imagePath}
      alt={pokemon.name}
      fill
      sizes="320px"
      className="object-contain p-4"
      priority={pokemon.id <= 30}
    />
  );
}

type TypeMatchupPanelProps = {
  ownTypeLabels: string[];
  defenseMatchups: PokemonTypeMatchupViewModel[];
  offenseMatchups: PokemonTypeMatchupViewModel[];
};

function TypeMatchupPanel({
  defenseMatchups,
  offenseMatchups,
  ownTypeLabels,
}: TypeMatchupPanelProps) {
  const neutralDefense = defenseMatchups.filter((entry) => entry.multiplier === 1);

  return (
    <Card className="border border-slate-200/70 dark:border-slate-800">
      <CardHeader>
        <h2 className="text-xl font-semibold">屬性相剋指南</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          先看防禦，知道這隻怕什麼；再看攻擊，找出適合對付的屬性。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section aria-label="防禦相剋" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">被攻擊時：這隻怕什麼？</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              下列屬性是對手的招式。倍率越高，這隻受到的屬性傷害越多。
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <MatchupGroup
              title="弱點"
              description="2× 兩倍傷害 · 4× 四倍傷害"
              tone="danger"
              matchups={defenseMatchups.filter((entry) => entry.multiplier > 1)}
              empty="沒有屬性弱點"
            />
            <MatchupGroup
              title="抗性"
              description="0.5× 一半傷害 · 0.25× 四分之一傷害"
              tone="resist"
              matchups={defenseMatchups.filter(
                (entry) => entry.multiplier > 0 && entry.multiplier < 1,
              )}
              empty="沒有屬性抗性"
            />
            <MatchupGroup
              title="免疫"
              description="0× 不受這種屬性的招式傷害"
              tone="immune"
              matchups={defenseMatchups.filter((entry) => entry.multiplier === 0)}
              empty="沒有免疫的屬性"
            />
          </div>
          <details className="rounded-xl border border-slate-200 dark:border-slate-800">
            <summary className="min-h-11 cursor-pointer rounded-xl px-4 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500">
              一般傷害 · 1×（{neutralDefense.length} 種屬性）
            </summary>
            <div className="px-4 pb-4">
              <MatchupChips matchups={neutralDefense} />
            </div>
          </details>
        </section>
        <details className="rounded-xl border border-slate-200 dark:border-slate-800">
          <summary className="min-h-11 cursor-pointer rounded-xl px-4 py-4 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500">
            <h3 className="inline">攻擊時：打哪些屬性更有效？</h3>
          </summary>
          <section aria-label="攻擊相剋" className="space-y-4 px-4 pb-4">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              下列屬性是對手的屬性。假設使用這隻的{ownTypeLabels.join('或')}
              屬性招式，選擇其中效果最好的一種；只考慮單一屬性的對手。
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <MatchupGroup
                title="效果絕佳"
                description="2× 傷害加倍"
                tone="resist"
                matchups={offenseMatchups.filter((entry) => entry.multiplier > 1)}
                empty="沒有可造成加倍傷害的屬性"
              />
              <MatchupGroup
                title="效果不佳"
                description="0.5× 傷害減半"
                tone="danger"
                matchups={offenseMatchups.filter(
                  (entry) => entry.multiplier > 0 && entry.multiplier < 1,
                )}
                empty="沒有傷害減半的屬性"
              />
              <MatchupGroup
                title="無法造成傷害"
                description="0× 對手免疫"
                tone="immune"
                matchups={offenseMatchups.filter((entry) => entry.multiplier === 0)}
                empty="沒有完全免疫這些攻擊的屬性"
              />
              <MatchupGroup
                title="一般效果"
                description="1× 正常傷害"
                tone="neutral"
                matchups={offenseMatchups.filter((entry) => entry.multiplier === 1)}
                empty="沒有一般效果的屬性"
              />
            </div>
          </section>
        </details>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          這裡只計算屬性相剋，不含本系加成、特性、道具與實際招式配置，並非最終傷害。
        </p>
      </CardContent>
    </Card>
  );
}

const GROUP_TONES = {
  danger:
    'border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/25 dark:text-rose-100',
  resist:
    'border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100',
  immune:
    'border-violet-200 bg-violet-50 text-violet-950 dark:border-violet-900 dark:bg-violet-950/25 dark:text-violet-100',
  neutral:
    'border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
};

function MatchupGroup({
  title,
  description,
  matchups,
  empty,
  tone,
}: {
  title: string;
  description: string;
  matchups: PokemonTypeMatchupViewModel[];
  empty: string;
  tone: keyof typeof GROUP_TONES;
}) {
  return (
    <section
      aria-label={title}
      className={`min-w-0 space-y-3 rounded-xl border p-4 ${GROUP_TONES[tone]}`}
    >
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="mt-1 text-sm leading-relaxed">{description}</p>
      </div>
      {matchups.length ? <MatchupChips matchups={matchups} /> : <p className="text-sm">{empty}</p>}
    </section>
  );
}

function MatchupChips({ matchups }: { matchups: PokemonTypeMatchupViewModel[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {matchups.map((matchup) => (
        <li
          key={matchup.slug}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <Image
            src={matchup.iconPath}
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px]"
          />
          <span>{matchup.label}</span>
          <span className="font-bold tabular-nums">{matchup.multiplierLabel}×</span>
        </li>
      ))}
    </ul>
  );
}
