'use client';

import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PokemonFeed } from './PokemonFeed';
import { PokemonScrollToTop } from './PokemonScrollToTop';
import {
  pokemonListHref,
  readPokemonListFilters,
  readPokemonListPage,
  type PokemonListFilters,
} from '../lib/pokemonListQuery';

import type { PokemonListPage } from '../view-models/pokemonListViewModel';

type PokemonListProps = { initialPage: PokemonListPage };

export function PokemonList({ initialPage }: PokemonListProps) {
  const { typeOptions } = initialPage;
  const [navigation, setNavigation] = useState({ initialPage, version: 0 });

  // Route navigation delivers a new seed; scroll-driven history updates keep the same seed.
  if (navigation.initialPage !== initialPage) {
    setNavigation({ initialPage, version: navigation.version + 1 });
  }

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
    const href = pokemonListHref(next, readPokemonListPage(new URLSearchParams(query)));
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
      setNavigation((current) => ({ ...current, version: current.version + 1 }));
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

      <PokemonFeed
        key={`${pokemonListHref(filters)}:${navigation.version}`}
        filters={filters}
        initialPage={initialPage}
        requestedPage={readPokemonListPage(new URLSearchParams(query))}
      />
      <PokemonScrollToTop />
    </div>
  );
}
