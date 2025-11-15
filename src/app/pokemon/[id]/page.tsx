import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

import { loadPokemonDetailPageViewModel } from '../presenter';

import type { PokemonDetailEntryViewModel } from '../view-models/pokemonDetailViewModel';

type PokemonDetailRouteProps = {
  params: { id: string } | Promise<{ id: string }>;
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

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
        <Link href="/pokemon" className="font-semibold hover:text-slate-900 dark:hover:text-white">
          ← 回到列表
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-slate-500">#{paddedId}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
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
                  className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold text-slate-900 shadow-sm dark:text-slate-50"
                  style={{ backgroundColor: badge.color }}
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
