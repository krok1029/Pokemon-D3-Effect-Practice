'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { PokemonCard } from './PokemonCard';
import {
  readPokemonPosition,
  restorePokemonPosition,
  type PokemonListPosition,
} from '../lib/pokemonListPosition';
import {
  pokemonListHref,
  POKEMON_PAGE_SIZE,
  type PokemonListFilters,
} from '../lib/pokemonListQuery';

import type { PokemonListPage } from '../view-models/pokemonListViewModel';

type PokemonFeedProps = {
  filters: PokemonListFilters;
  initialPage: PokemonListPage;
  requestedPage: number;
};

export function PokemonFeed({ filters, initialPage, requestedPage }: PokemonFeedProps) {
  const [scope] = useState(() => ({
    filters,
    requestedPage,
    seed:
      pokemonListHref(initialPage.filters) === pokemonListHref(filters) &&
      initialPage.page === requestedPage
        ? initialPage
        : null,
  }));
  const { seed } = scope;
  const [pages, setPages] = useState<PokemonListPage[]>(() => (seed ? [seed] : []));
  const [loading, setLoading] = useState(!seed);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  const retryPage = useRef(requestedPage);
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const restore = useRef<PokemonListPosition | null>(null);
  const first = pages[0];
  const last = pages.at(-1);
  const total = first?.total ?? 0;
  const hasNext = Boolean(last && last.page * POKEMON_PAGE_SIZE < total);

  const loadPage = useCallback(
    async (page: number) => {
      if (request.current) return;
      const controller = new AbortController();
      request.current = controller;
      retryPage.current = page;
      setLoading(true);
      setError(false);
      try {
        const response = await fetch(
          pokemonListHref(scope.filters, page).replace('/pokemon', '/api/pokemon'),
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Could not load Pokémon');
        const data: PokemonListPage = await response.json();
        if (controller.signal.aborted) return;
        setPages((current) =>
          [...current.filter((entry) => entry.page !== data.page), data].sort(
            (a, b) => a.page - b.page,
          ),
        );
        if (data.page !== page) {
          window.history.replaceState(
            window.history.state,
            '',
            pokemonListHref(scope.filters, data.page),
          );
        }
      } catch {
        if (!controller.signal.aborted) setError(true);
      } finally {
        if (!controller.signal.aborted) {
          request.current = null;
          setLoading(false);
        }
      }
    },
    [scope],
  );

  useEffect(() => {
    restore.current = readPokemonPosition();
    const timer = !seed
      ? window.setTimeout(() => void loadPage(scope.requestedPage), 150)
      : undefined;
    return () => {
      window.clearTimeout(timer);
      request.current?.abort();
      request.current = null;
    };
  }, [scope, seed, loadPage]);

  useEffect(() => {
    if (!pages.length) return;
    const frame = requestAnimationFrame(() => {
      if (restore.current && restorePokemonPosition(restore.current)) restore.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [pages]);

  useEffect(() => {
    if (!hasNext || loading || error || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void loadPage(last!.page + 1);
      },
      { rootMargin: '600px' },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNext, loading, error, last, loadPage]);

  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (
          restore.current ||
          !listRef.current ||
          listRef.current.getBoundingClientRect().top > 112
        )
          return;
        const cards = listRef.current.querySelectorAll<HTMLElement>('[data-pokemon-index]');
        const card = Array.from(cards).find((item) => item.getBoundingClientRect().bottom > 112);
        if (!card) return;
        const page = Math.floor(Number(card.dataset.pokemonIndex) / POKEMON_PAGE_SIZE) + 1;
        const href = pokemonListHref(scope.filters, page);
        if (href !== window.location.pathname + window.location.search || window.location.hash) {
          window.history.replaceState(window.history.state, '', `${href}#${card.id}`);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [scope, pages]);

  function loadPrevious() {
    const card = listRef.current?.querySelector<HTMLElement>('[data-pokemon-index]');
    if (card) restore.current = { anchor: card.id, top: card.getBoundingClientRect().top };
    void loadPage(first!.page - 1);
  }

  return (
    <div className="space-y-4" ref={listRef} aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600 dark:text-slate-300">
        <p role="status">
          {first ? `共 ${total.toLocaleString()} 筆型態樣本符合條件。` : '正在搜尋寶可夢…'}
        </p>
        {first && total > 0 ? (
          <p data-testid="loaded-range">
            已載入第 {(first.page - 1) * POKEMON_PAGE_SIZE + 1}–
            {Math.min(last!.page * POKEMON_PAGE_SIZE, total)} 筆
          </p>
        ) : null}
      </div>
      {first && first.page > 1 ? (
        <button
          type="button"
          onClick={loadPrevious}
          disabled={loading}
          className="min-h-11 rounded-lg border px-4 py-2 disabled:opacity-50"
        >
          載入前 24 筆
        </button>
      ) : null}
      {pages.map((page) => (
        <div key={page.page} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {page.pokemons.map((pokemon, index) => (
            <PokemonCard
              key={`${pokemon.id}-${pokemon.formId}`}
              pokemon={pokemon}
              index={(page.page - 1) * POKEMON_PAGE_SIZE + index}
              returnTo={pokemonListHref(filters, page.page)}
            />
          ))}
        </div>
      ))}
      {first && total === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-slate-500">
          找不到符合條件的寶可夢，試試調整搜尋或篩選條件。
        </p>
      ) : null}
      <div
        ref={sentinelRef}
        className="flex min-h-16 items-center justify-center gap-3"
        aria-live="polite"
      >
        {loading ? (
          <p>正在載入更多寶可夢…</p>
        ) : error ? (
          <>
            <p>載入失敗，請再試一次。</p>
            <button
              type="button"
              onClick={() => void loadPage(retryPage.current)}
              className="min-h-11 rounded-lg border px-4 py-2"
            >
              重新載入
            </button>
          </>
        ) : hasNext ? (
          <button
            type="button"
            onClick={() => void loadPage(last!.page + 1)}
            className="min-h-11 rounded-lg border px-4 py-2"
          >
            載入更多
          </button>
        ) : total > 0 ? (
          <p className="text-sm text-slate-500">已到最後一筆</p>
        ) : null}
      </div>
    </div>
  );
}
