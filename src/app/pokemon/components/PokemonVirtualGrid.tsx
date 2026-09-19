'use client';

import { defaultRangeExtractor, useWindowVirtualizer } from '@tanstack/react-virtual';
import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';

import { PokemonCard } from './PokemonCard';
import {
  readPokemonPosition,
  restorePokemonPosition,
  visiblePokemonPosition,
  type PokemonListPosition,
} from '../lib/pokemonListPosition';
import {
  pokemonCardAnchor,
  pokemonListHref,
  POKEMON_PAGE_SIZE,
  type PokemonListFilters,
} from '../lib/pokemonListQuery';

import type { PokemonCardViewModel } from '../view-models/pokemonCardViewModel';

type PokemonVirtualGridProps = {
  pokemons: PokemonCardViewModel[];
  startIndex: number;
  total: number;
  filters: PokemonListFilters;
  restore: RefObject<PokemonListPosition | null>;
};

export function PokemonVirtualGrid({
  pokemons,
  startIndex,
  total,
  filters,
  restore,
}: PokemonVirtualGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState({ columns: 1, margin: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const initialized = useRef(false);
  const virtualized = pokemons.length > POKEMON_PAGE_SIZE * 2;
  const { columns, margin } = metrics;
  const rowCount = Math.ceil(pokemons.length / columns);
  const getItemKey = useCallback(
    (row: number) => `${columns}:${pokemonCardAnchor(pokemons[row * columns])}`,
    [columns, pokemons],
  );
  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const visible = defaultRangeExtractor(range);
      if (focusedIndex === null) return visible;
      const row = Math.floor((focusedIndex - startIndex) / columns);
      return [...new Set([...visible, row - 1, row, row + 1])]
        .filter((index) => index >= 0 && index < rowCount)
        .sort((a, b) => a - b);
    },
    [focusedIndex, startIndex, columns, rowCount],
  );
  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: rowCount,
    estimateSize: () => 560,
    gap: 16,
    overscan: 2,
    enabled: virtualized,
    scrollMargin: margin,
    scrollPaddingStart: 96,
    getItemKey,
    rangeExtractor,
    isScrollingResetDelay: 160,
  });

  useLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const measure = () => {
      const nextColumns = window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      const nextMargin = grid.getBoundingClientRect().top + window.scrollY;
      setMetrics((current) => {
        if (current.columns === nextColumns && Math.abs(current.margin - nextMargin) < 1)
          return current;
        return { columns: nextColumns, margin: nextMargin };
      });
    };
    measure();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(grid);
    if (grid.parentElement) observer?.observe(grid.parentElement);
    const resize = () => {
      restore.current ??= visiblePokemonPosition(grid);
      measure();
    };
    window.addEventListener('resize', resize);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [restore]);

  useLayoutEffect(() => {
    if (!initialized.current) {
      restore.current ??= readPokemonPosition();
      initialized.current = true;
    }
    const position = restore.current;
    if (!position || !pokemons.length) return;
    const index = pokemons.findIndex((pokemon) => pokemonCardAnchor(pokemon) === position.anchor);
    if (index < 0) {
      restore.current = null;
      return;
    }
    if (virtualized) {
      const offset = virtualizer.getOffsetForIndex(Math.floor(index / columns), 'start');
      if (offset) window.scrollTo({ top: offset[0], behavior: 'instant' });
    }
    let frame = 0;
    let attempts = 0;
    const settle = () => {
      if (restore.current !== position) return;
      if (restorePokemonPosition(position)) {
        // Recheck after measurement so switching layouts or prepending a batch keeps the same card.
        if (++attempts >= 3) {
          restore.current = null;
          return;
        }
      } else if (++attempts >= 12) {
        restore.current = null;
        return;
      }
      frame = requestAnimationFrame(settle);
    };
    frame = requestAnimationFrame(settle);
    return () => cancelAnimationFrame(frame);
  }, [pokemons, columns, margin, virtualized, virtualizer, restore]);

  useLayoutEffect(() => {
    const cancel = () => {
      restore.current = null;
    };
    window.addEventListener('wheel', cancel, { passive: true });
    window.addEventListener('touchstart', cancel, { passive: true });
    window.addEventListener('pointerdown', cancel, { passive: true });
    window.addEventListener('keydown', cancel);
    return () => {
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchstart', cancel);
      window.removeEventListener('pointerdown', cancel);
      window.removeEventListener('keydown', cancel);
    };
  }, [restore]);

  function card(index: number) {
    const pokemon = pokemons[index];
    return (
      <div
        key={pokemonCardAnchor(pokemon)}
        role="listitem"
        aria-posinset={startIndex + index + 1}
        aria-setsize={total}
      >
        <PokemonCard
          pokemon={pokemon}
          index={startIndex + index}
          imagePriority={index < 3}
          deferImages={virtualized && virtualizer.isScrolling}
          returnTo={pokemonListHref(
            filters,
            Math.floor((startIndex + index) / POKEMON_PAGE_SIZE) + 1,
          )}
        />
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      role="list"
      aria-label="寶可夢卡片"
      data-virtualized={virtualized}
      className={virtualized ? 'relative' : 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'}
      style={
        virtualized ? { height: virtualizer.getTotalSize(), overflowAnchor: 'none' } : undefined
      }
      onFocusCapture={(event) => {
        const card = (event.target as HTMLElement).closest<HTMLElement>('[data-pokemon-index]');
        if (card) setFocusedIndex(Number(card.dataset.pokemonIndex));
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocusedIndex(null);
      }}
    >
      {virtualized
        ? virtualizer.getVirtualItems().map((row) => (
            <div
              key={row.key}
              ref={virtualizer.measureElement}
              data-index={row.index}
              role="presentation"
              className="absolute top-0 left-0 grid w-full gap-4"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                transform: `translateY(${row.start - margin}px)`,
              }}
            >
              {Array.from(
                { length: Math.min(columns, pokemons.length - row.index * columns) },
                (_, column) => card(row.index * columns + column),
              )}
            </div>
          ))
        : pokemons.map((_, index) => card(index))}
    </div>
  );
}
