import { arc } from 'd3-shape';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

import { loadPokemonDetailPageViewModel } from '../presenter';

import type {
  PokemonDetailEntryViewModel,
  PokemonTypeMatchupCategory,
  PokemonTypeMatchupViewModel,
} from '../view-models/pokemonDetailViewModel';

type MatchupIntent = 'defense' | 'offense';

const MATCHUP_TEXT_CLASS_MAP: Record<MatchupIntent, Record<PokemonTypeMatchupCategory, string>> = {
  defense: {
    super: 'text-rose-600 dark:text-rose-300',
    notVery: 'text-emerald-600 dark:text-emerald-300',
    neutral: 'text-slate-700 dark:text-slate-100',
    immune: 'text-slate-500 dark:text-slate-400',
  },
  offense: {
    super: 'text-emerald-600 dark:text-emerald-300',
    notVery: 'text-amber-600 dark:text-amber-300',
    neutral: 'text-slate-700 dark:text-slate-100',
    immune: 'text-slate-500 dark:text-slate-400',
  },
};

const MATCHUP_RING_COLOR_MAP: Record<MatchupIntent, Record<PokemonTypeMatchupCategory, string>> = {
  defense: {
    super: '#fb7185',
    notVery: '#34d399',
    neutral: '#94a3b8',
    immune: '#a5b4fc',
  },
  offense: {
    super: '#34d399',
    notVery: '#fbbf24',
    neutral: '#94a3b8',
    immune: '#a855f7',
  },
};

type PokemonDetailRouteProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PokemonDetailRouteProps) {
  const resolvedParams = await params;
  const id = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isInteger(id)) {
    return {
      title: '寶可夢資料',
      description: '瀏覽每隻寶可夢的基礎能力值與屬性。',
    };
  }

  const viewModel = await loadPokemonDetailPageViewModel();
  const pokemon = viewModel.pokemons.find((entry) => entry.id === id);

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

export default async function PokemonDetailRoute({ params }: PokemonDetailRouteProps) {
  const resolvedParams = await params;
  const id = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const viewModel = await loadPokemonDetailPageViewModel();
  const pokemon = viewModel.pokemons.find((entry) => entry.id === id);

  if (!pokemon) {
    notFound();
  }

  const paddedId = pokemon.id.toString().padStart(3, '0');
  const hasMatchups = pokemon.defenseMatchups.length > 0 || pokemon.offenseMatchups.length > 0;

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <Link href="/pokemon" className="font-semibold hover:text-slate-900 dark:hover:text-white">
          ← 回到列表
        </Link>
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
        <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">屬性弱點倍率表</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              以環狀圖呈現此寶可夢的屬性相剋關係，左側為承受攻擊時的倍率，右側為主屬性攻擊他人時的倍率。
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <TypeMatchupPanel
              defenseMatchups={pokemon.defenseMatchups}
              offenseMatchups={pokemon.offenseMatchups}
            />
          </CardContent>
        </Card>
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
  defenseMatchups: PokemonTypeMatchupViewModel[];
  offenseMatchups: PokemonTypeMatchupViewModel[];
};

function TypeMatchupPanel({ defenseMatchups, offenseMatchups }: TypeMatchupPanelProps) {
  const orderedDefense = [...defenseMatchups].sort((a, b) => a.order - b.order);
  const orderedOffense = [...offenseMatchups].sort((a, b) => a.order - b.order);
  const hasDefense = orderedDefense.length > 0;
  const hasOffense = orderedOffense.length > 0;

  if (!hasDefense && !hasOffense) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">尚無屬性資料。</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
      <div className="flex justify-center">
        <TypeMatchupWheel defense={orderedDefense} offense={orderedOffense} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <MatchupDetailList
          title="防禦方"
          description="不同屬性攻擊此寶可夢時的傷害倍率"
          matchups={defenseMatchups}
          intent="defense"
        />
        <MatchupDetailList
          title="攻擊方"
          description="此寶可夢本系招式攻擊他人時可造成的倍率"
          matchups={offenseMatchups}
          intent="offense"
        />
      </div>
    </div>
  );
}

type MatchupDetailListProps = {
  title: string;
  description: string;
  matchups: PokemonTypeMatchupViewModel[];
  intent: MatchupIntent;
};

function MatchupDetailList({ title, description, matchups, intent }: MatchupDetailListProps) {
  const textClassMap = MATCHUP_TEXT_CLASS_MAP[intent];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/60 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/30">
      <div>
        <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {matchups.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">尚無對應資料。</p>
        ) : (
          matchups.map((matchup) => (
            <div
              key={`${intent}-${matchup.slug}`}
              className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-3 py-2 text-sm dark:border-slate-800/60 dark:bg-slate-950/30"
            >
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-semibold text-slate-900 dark:text-slate-50"
                style={{ borderColor: matchup.color }}
              >
                <Image
                  src={matchup.iconPath}
                  alt={matchup.label}
                  width={16}
                  height={16}
                  className="h-4 w-4"
                />
                {matchup.label}
              </span>
              <span className={`text-base font-bold ${textClassMap[matchup.category]}`}>
                {matchup.multiplierLabel}×
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

type TypeMatchupWheelProps = {
  defense: PokemonTypeMatchupViewModel[];
  offense: PokemonTypeMatchupViewModel[];
};

function TypeMatchupWheel({ defense, offense }: TypeMatchupWheelProps) {
  const maxDefenseOrder = defense.reduce((max, entry) => Math.max(max, entry.order), -1);
  const maxOffenseOrder = offense.reduce((max, entry) => Math.max(max, entry.order), -1);
  const segmentCount = Math.max(maxDefenseOrder, maxOffenseOrder) + 1;

  if (segmentCount <= 0) {
    return null;
  }

  const defenseByOrder = new Map(defense.map((entry) => [entry.order, entry]));
  const offenseByOrder = new Map(offense.map((entry) => [entry.order, entry]));
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const defenseEntry = defenseByOrder.get(index) ?? null;
    const offenseEntry = offenseByOrder.get(index) ?? null;
    return {
      index,
      defense: defenseEntry,
      offense: offenseEntry,
      type: defenseEntry ?? offenseEntry,
    };
  });

  const VIEWBOX_SIZE = 320;
  const center = VIEWBOX_SIZE / 2;
  const defenseInnerRadius = 108;
  const defenseOuterRadius = 126;
  const offenseInnerRadius = 144;
  const offenseOuterRadius = 162;
  const iconRadius = offenseOuterRadius + 22;
  const angleStep = (2 * Math.PI) / segmentCount;
  const gap = angleStep * 0.12;
  const ringColors = MATCHUP_RING_COLOR_MAP;

  const defenseArcGenerator = arc()
    .innerRadius(defenseInnerRadius)
    .outerRadius(defenseOuterRadius)
    .cornerRadius(4);

  const offenseArcGenerator = arc()
    .innerRadius(offenseInnerRadius)
    .outerRadius(offenseOuterRadius)
    .cornerRadius(4);

  return (
    <div className="relative h-[320px] w-[320px] max-w-full">
      <svg
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        className="h-full w-full"
        aria-hidden="true"
      >
        <g transform={`translate(${center} ${center})`}>
          {segments.map((segment) => {
            if (!segment.defense) {
              return null;
            }
            const startAngle = -Math.PI / 2 + segment.index * angleStep + gap / 2;
            const endAngle = startAngle + angleStep - gap;
            const path = defenseArcGenerator({
              startAngle,
              endAngle,
              innerRadius: defenseInnerRadius,
              outerRadius: defenseOuterRadius,
            });
            if (!path) {
              return null;
            }
            return (
              <path
                key={`def-arc-${segment.defense.slug}`}
                d={path}
                fill={ringColors.defense[segment.defense.category]}
              >
                <title>{`${segment.defense.label} 防禦：${segment.defense.multiplierLabel}×`}</title>
              </path>
            );
          })}
          {segments.map((segment) => {
            if (!segment.offense) {
              return null;
            }
            const startAngle = -Math.PI / 2 + segment.index * angleStep + gap / 2;
            const endAngle = startAngle + angleStep - gap;
            const path = offenseArcGenerator({
              startAngle,
              endAngle,
              innerRadius: offenseInnerRadius,
              outerRadius: offenseOuterRadius,
            });
            if (!path) {
              return null;
            }
            return (
              <path
                key={`atk-arc-${segment.offense.slug}`}
                d={path}
                fill={ringColors.offense[segment.offense.category]}
              >
                <title>{`${segment.offense.label} 攻擊：${segment.offense.multiplierLabel}×`}</title>
              </path>
            );
          })}
        </g>
      </svg>
      {segments.map((segment) => {
        if (!segment.type) {
          return null;
        }
        const startAngle = -Math.PI / 2 + segment.index * angleStep;
        const angle = startAngle + angleStep / 2;
        const x = center + iconRadius * Math.cos(angle);
        const y = center + iconRadius * Math.sin(angle);
        return (
          <span
            key={`icon-${segment.type.slug}-${segment.index}`}
            className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/60 shadow-sm dark:border-slate-900/70"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              borderColor: segment.type.color,
            }}
          >
            <Image
              src={segment.type.iconPath}
              alt={segment.type.label}
              width={22}
              height={22}
              className="h-5 w-5"
            />
          </span>
        );
      })}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">雙層相剋圖</span>
        <div className="text-lg font-bold text-slate-900 dark:text-white">防禦 / 攻擊</div>
        <p className="text-[11px] tracking-[0.3em] text-slate-400 uppercase dark:text-slate-500">
          {segmentCount} TYPES
        </p>
      </div>
    </div>
  );
}
