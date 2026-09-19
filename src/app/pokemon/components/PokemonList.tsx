'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';

import {
  pokemonCardAnchor,
  pokemonDetailReturnHref,
  pokemonListHref,
  readPokemonListFilters,
  type PokemonListFilters,
} from '../lib/pokemonListQuery';

import type {
  PokemonCardViewModel,
  PokemonTypeBadgeViewModel,
} from '../view-models/pokemonCardViewModel';

type PokemonListProps = {
  pokemons: PokemonCardViewModel[];
  typeOptions: PokemonTypeBadgeViewModel[];
};

export function PokemonList({ pokemons, typeOptions }: PokemonListProps) {
  const searchParams = useSearchParams();
  const query = searchParams?.toString() ?? '';
  const validTypes = useMemo(() => typeOptions.map((type) => type.slug), [typeOptions]);
  const [filters, setFilters] = useState(() =>
    readPokemonListFilters(new URLSearchParams(query), validTypes),
  );
  const { search, onlyLegendary, typeFilter } = filters;
  const editingSearch = useRef(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    if (query !== new URLSearchParams(window.location.search).toString()) return;
    const next = readPokemonListFilters(new URLSearchParams(query), validTypes);
    setFilters(next);
    const href = pokemonListHref(next);
    if (
      window.location.pathname === '/pokemon' &&
      href !== window.location.pathname + window.location.search
    ) {
      window.history.replaceState(null, '', href + window.location.hash);
    }
  }, [query, validTypes]);

  useEffect(() => {
    setIsInteractive(true);
    const finishEditing = () => {
      editingSearch.current = false;
    };
    window.addEventListener('popstate', finishEditing);
    return () => window.removeEventListener('popstate', finishEditing);
  }, []);

  function updateFilters(next: PokemonListFilters, typing = false) {
    setFilters(next);
    const href = pokemonListHref(next);
    const currentHref = window.location.pathname + window.location.search;
    if (href !== currentHref || window.location.hash) {
      if (typing && editingSearch.current) {
        window.history.replaceState(null, '', href);
      } else {
        window.history.pushState(null, '', href);
      }
    }
    editingSearch.current = typing;
  }

  useEffect(() => {
    const hash = window.location.hash;
    if (!/^#pokemon-\d+-[a-z0-9-]+$/.test(hash)) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [query]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return pokemons.filter((pokemon) => {
      if (onlyLegendary && !pokemon.isLegendary) {
        return false;
      }
      if (typeFilter && !pokemon.typeBadges.some((badge) => badge.slug === typeFilter)) {
        return false;
      }
      if (!keyword) {
        return true;
      }
      const idMatches = pokemon.id.toString().includes(keyword);
      const nameMatches = pokemon.name.toLowerCase().includes(keyword);
      return idMatches || nameMatches;
    });
  }, [pokemons, search, onlyLegendary, typeFilter]);

  return (
    <div className="space-y-6">
      <fieldset
        disabled={!isInteractive}
        aria-busy={!isInteractive}
        className="flex min-w-0 flex-col gap-4 rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
      >
        <legend className="sr-only">搜尋與篩選寶可夢</legend>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <label className="space-y-2 lg:w-2/3">
            <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              搜尋寶可夢
            </div>
            <input
              value={search}
              onChange={(event) => updateFilters({ ...filters, search: event.target.value }, true)}
              onBlur={() => {
                editingSearch.current = false;
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') editingSearch.current = false;
              }}
              placeholder="輸入編號或名稱，例如 25、Pikachu"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base shadow-sm transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
            />
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={onlyLegendary}
              onChange={(event) =>
                updateFilters({ ...filters, onlyLegendary: event.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500 dark:border-slate-600 dark:bg-slate-900"
            />
            只顯示傳說寶可夢
          </label>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">依屬性篩選</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateFilters({ ...filters, typeFilter: null })}
              aria-pressed={typeFilter === null}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition',
                typeFilter === null
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white dark:bg-white dark:text-slate-950'
                  : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              全部
            </button>
            {typeOptions.map((type) => {
              const active = type.slug === typeFilter;
              return (
                <button
                  key={type.slug}
                  type="button"
                  onClick={() =>
                    updateFilters({ ...filters, typeFilter: active ? null : type.slug })
                  }
                  aria-pressed={active}
                  style={
                    active
                      ? {
                          borderColor: type.color,
                          backgroundColor: type.color,
                          color: '#0b0f19',
                        }
                      : undefined
                  }
                  className={[
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold transition',
                    active
                      ? 'shadow-sm ring-1 ring-slate-900/10'
                      : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800',
                  ].join(' ')}
                >
                  <Image src={type.iconPath} alt="" width={16} height={16} className="h-4 w-4" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-sm text-slate-600 dark:text-slate-300">
            共 {filtered.length.toLocaleString()} 筆型態樣本符合條件。
          </p>
          <button
            type="button"
            onClick={() => updateFilters({ search: '', typeFilter: null, onlyLegendary: false })}
            disabled={!search && !typeFilter && !onlyLegendary}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40 dark:border-slate-600"
          >
            清除篩選
          </button>
        </div>
      </fieldset>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((pokemon) => (
          <PokemonCard
            key={`${pokemon.id}-${pokemon.formId ?? pokemon.name}`}
            pokemon={pokemon}
            returnTo={pokemonListHref(filters)}
          />
        ))}
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            找不到符合條件的寶可夢，試試調整搜尋或篩選條件。
          </div>
        ) : null}
      </div>
    </div>
  );
}

type PokemonCardProps = {
  pokemon: PokemonCardViewModel;
  returnTo: string;
};

function PokemonCard({ pokemon, returnTo }: PokemonCardProps) {
  const progressGradient = `linear-gradient(90deg, ${pokemon.accentColor} 0%, var(--chart-1) 100%)`;

  return (
    <Card
      id={pokemonCardAnchor(pokemon)}
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
