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

      {hasMatchups ? <TypeMatchupPanel pokemon={pokemon} /> : null}
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

function TypeMatchupPanel({ pokemon }: { pokemon: PokemonDetailEntryViewModel }) {
  const ownTypes = pokemon.typeBadges.map((type) => type.label).join('或');
  return (
    <Card className="border border-slate-200/70 dark:border-slate-800">
      <CardHeader>
        <h2 className="text-xl font-semibold">屬性相剋對照</h2>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          跟著箭頭看攻擊方向；×2 傷害加倍、×0.5 傷害減半、×0 完全無效。
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid divide-y divide-slate-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0 dark:divide-slate-800">
          <section aria-label="攻擊相剋" className="min-w-0 space-y-6 pb-6 lg:pr-8 lg:pb-0">
            <div>
              <h3 className="text-lg font-semibold">攻擊方</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                這隻攻擊不同屬性的對手
              </p>
            </div>
            <MatchupPokemon pokemon={pokemon} roleLabel="攻擊方" />
            <AttackDirection label={`使用${ownTypes}屬性招式`} />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">對手的屬性 · 造成的倍率</h4>
              <MatchupChips matchups={pokemon.offenseMatchups} />
            </div>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              使用自身屬性的招式，選擇其中效果最好的一種；對手只按單一屬性計算。
            </p>
          </section>
          <section aria-label="防禦相剋" className="min-w-0 space-y-6 pt-6 lg:pt-0 lg:pl-8">
            <div>
              <h3 className="text-lg font-semibold">被攻擊方</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                不同屬性的招式攻擊這隻
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">對手的招式屬性 · 承受的倍率</h4>
              <MatchupChips matchups={pokemon.defenseMatchups} />
            </div>
            <AttackDirection label="受到這些屬性的招式攻擊" />
            <MatchupPokemon pokemon={pokemon} roleLabel="被攻擊方" />
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              大於 ×1 是弱點，小於 ×1 是抗性，×0 表示免疫。
            </p>
          </section>
        </div>
        <p className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
          這裡只計算屬性相剋，不含本系加成、特性、道具與實際招式配置，並非最終傷害。
        </p>
      </CardContent>
    </Card>
  );
}

function MatchupPokemon({
  pokemon,
  roleLabel,
}: {
  pokemon: PokemonDetailEntryViewModel;
  roleLabel: string;
}) {
  return (
    <figure className="mx-auto flex w-full max-w-56 flex-col items-center rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950/40">
      {pokemon.imagePath ? (
        <Image
          src={pokemon.imagePath}
          alt=""
          width={128}
          height={128}
          className="h-32 w-32 object-contain"
        />
      ) : (
        <div className="flex h-32 items-center text-sm text-slate-500">無圖片</div>
      )}
      <figcaption className="mt-2 text-center text-sm font-semibold">
        {pokemon.name} · {roleLabel}
      </figcaption>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {pokemon.typeBadges.map((type) => type.label).join(' / ')}
      </p>
    </figure>
  );
}

function AttackDirection({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
      <span className="text-center text-sm">{label}</span>
      <svg
        aria-hidden="true"
        width="24"
        height="32"
        viewBox="0 0 24 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2v27m-7-7 7 7 7-7" />
      </svg>
    </div>
  );
}

const MATCHUP_CHIP_COLORS: Record<PokemonTypeMatchupViewModel['category'], string> = {
  super:
    'border-orange-300 bg-orange-50 text-orange-900 dark:border-orange-700 dark:bg-orange-950/60 dark:text-orange-200',
  notVery:
    'border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-700 dark:bg-teal-950/60 dark:text-teal-200',
  immune:
    'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200',
  neutral:
    'border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100',
};

function MatchupChips({ matchups }: { matchups: PokemonTypeMatchupViewModel[] }) {
  if (!matchups.length) return <p className="text-sm text-slate-500">尚無屬性資料。</p>;
  return (
    <ul className="flex flex-wrap gap-2">
      {matchups.map((matchup) => (
        <li
          key={matchup.slug}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-sm ${MATCHUP_CHIP_COLORS[matchup.category]}`}
        >
          <Image
            src={matchup.iconPath}
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px]"
          />
          <span>{matchup.label}</span>
          <span className="font-bold tabular-nums">×{matchup.multiplierLabel}</span>
        </li>
      ))}
    </ul>
  );
}
