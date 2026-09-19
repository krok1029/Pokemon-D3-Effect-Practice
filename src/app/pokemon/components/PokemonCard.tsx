'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

import { rememberPokemonPosition } from '../lib/pokemonListPosition';
import { pokemonCardAnchor, pokemonDetailReturnHref } from '../lib/pokemonListQuery';

import type { PokemonCardViewModel } from '../view-models/pokemonCardViewModel';

type PokemonCardProps = {
  pokemon: PokemonCardViewModel;
  returnTo: string;
  index: number;
};

export function PokemonCard({ pokemon, returnTo, index }: PokemonCardProps) {
  const progressGradient = `linear-gradient(90deg, ${pokemon.accentColor} 0%, var(--chart-1) 100%)`;

  return (
    <Card
      id={pokemonCardAnchor(pokemon)}
      data-pokemon-index={index}
      className="h-full scroll-mt-24 border border-slate-200/70 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800"
    >
      <CardHeader className="gap-4 pb-2">
        <div className="flex gap-4">
          <div className="relative aspect-square w-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            {pokemon.imagePath ? (
              <Image
                src={pokemon.imagePath}
                alt={pokemon.name}
                fill
                sizes="96px"
                className="object-contain p-2"
                priority={pokemon.id <= 30}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-500 dark:text-slate-400">
                無圖片
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  #{pokemon.id.toString().padStart(3, '0')}
                </span>
                <CardTitle className="text-xl">{pokemon.name}</CardTitle>
              </div>
              {pokemon.isLegendary ? (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold tracking-wide text-amber-800 uppercase shadow-sm dark:bg-amber-900/80 dark:text-amber-100">
                  傳說
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <span>能力值總和</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-base text-slate-900 dark:bg-slate-800 dark:text-slate-50">
              {pokemon.total}
            </span>
          </div>
          <Link
            prefetch={false}
            onClick={() => rememberPokemonPosition(returnTo, pokemonCardAnchor(pokemon))}
            href={pokemonDetailReturnHref(
              pokemon.detailHref ?? `/pokemon/${pokemon.id}`,
              returnTo,
              pokemonCardAnchor(pokemon),
            )}
            aria-label={`查看 ${pokemon.name} 詳情`}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
          >
            查看詳情 →
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="space-y-3">
          {pokemon.stats.map((stat) => (
            <div key={stat.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="font-semibold text-slate-800 dark:text-slate-100">{stat.label}</div>
                <div className="text-slate-600 dark:text-slate-300">{stat.value}</div>
              </div>
              <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-2 rounded-full transition-[width]"
                  style={{
                    width: `${Math.round(stat.ratio * 100)}%`,
                    backgroundImage: progressGradient,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
