'use client';

import Link from 'next/link';
import { useId, useMemo, useState } from 'react';

import type { PokemonScatterPointViewModel } from '../view-models/pokemonStatsMatrixViewModel';

type PokemonChartSelectionProps = {
  pokemons: PokemonScatterPointViewModel[];
  isSelected: (pokemon: PokemonScatterPointViewModel) => boolean;
  onTogglePokemon: (pokemon: PokemonScatterPointViewModel) => void;
};

const RESULT_LIMIT = 12;

export function PokemonChartSelection({
  pokemons,
  isSelected,
  onTogglePokemon,
}: PokemonChartSelectionProps) {
  const id = useId();
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!query) return [];
    const numberQuery = /^\d+$/.test(query) ? String(Number(query)) : null;
    return pokemons.filter(
      (pokemon) =>
        pokemon.name.toLowerCase().includes(query) ||
        (numberQuery !== null && String(pokemon.id).includes(numberQuery)),
    );
  }, [pokemons, query]);

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="border-border bg-muted/20 space-y-3 rounded-lg border p-3"
    >
      <h3 id={`${id}-title`} className="text-foreground text-sm font-semibold">
        搜尋並選取寶可夢
      </h3>
      <p id={`${id}-help`} className="text-muted-foreground text-xs">
        可用鍵盤或觸控選取，不需拖曳。候選清單沿用目前的傳說與主屬性篩選。
      </p>
      <div className="space-y-1">
        <label htmlFor={`${id}-search`} className="text-foreground text-sm font-medium">
          搜尋圖表中的寶可夢
        </label>
        <input
          id={`${id}-search`}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-describedby={`${id}-help`}
          placeholder="輸入英文名稱或圖鑑編號"
          className="border-border bg-background text-foreground focus-visible:outline-primary w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
        />
      </div>
      <p role="status" className="text-muted-foreground text-xs">
        {!query
          ? '輸入名稱或圖鑑編號以尋找樣本。'
          : matches.length === 0
            ? '目前條件下找不到符合的寶可夢。'
            : `符合 ${matches.length} 筆型態${matches.length > RESULT_LIMIT ? `，顯示前 ${RESULT_LIMIT} 筆，請縮小搜尋範圍` : ''}。`}
      </p>
      {matches.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {matches.slice(0, RESULT_LIMIT).map((pokemon) => {
            const selected = isSelected(pokemon);
            return (
              <li
                key={`${pokemon.id}-${pokemon.formId}`}
                className="border-border bg-background flex min-w-0 flex-wrap items-center gap-2 rounded-md border p-2"
              >
                <span className="text-foreground w-full text-sm break-words">
                  #{String(pokemon.id).padStart(3, '0')} {pokemon.name}
                </span>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${selected ? '取消選取' : '選取'} ${pokemon.name}`}
                  onClick={() => onTogglePokemon(pokemon)}
                  className="border-border text-foreground focus-visible:outline-primary min-h-11 rounded-md border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {selected ? '已選取（取消）' : '選取'}
                </button>
                <Link
                  href={pokemon.detailHref}
                  prefetch={false}
                  aria-label={`查看 ${pokemon.name} 詳情`}
                  className="text-primary focus-visible:outline-primary inline-flex min-h-11 items-center rounded-md px-3 py-2 text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  查看詳情
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
