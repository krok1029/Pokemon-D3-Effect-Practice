import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PokemonFeed } from '@/app/pokemon/components/PokemonFeed';
import type { PokemonCardViewModel } from '@/app/pokemon/view-models/pokemonCardViewModel';
import { buildPokemonListPage } from '@/app/pokemon/view-models/pokemonListViewModel';

vi.mock('@/app/pokemon/components/PokemonVirtualGrid', () => ({
  PokemonVirtualGrid: ({ pokemons }: { pokemons: PokemonCardViewModel[] }) => (
    <ul>
      {pokemons.map((pokemon) => (
        <li key={pokemon.id}>{pokemon.name}</li>
      ))}
    </ul>
  ),
}));

const entries = Array.from({ length: 48 }, (_, index) => ({
  id: index + 1,
  name: `Pokemon ${index + 1}`,
  isLegendary: false,
  primaryType: 'Normal',
  secondaryType: null,
  stats: { hp: 50, attack: 50, defense: 50, spAtk: 50, spDef: 50, speed: 50 },
}));
const initialPage = buildPokemonListPage(entries, new URLSearchParams());
const secondPage = buildPokemonListPage(entries, new URLSearchParams('page=2'));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('PokemonFeed request deadlines', () => {
  it('times out after 15 seconds, keeps cards and retries exactly the same batch', async () => {
    // Arrange: This request deliberately ignores abort to expose late-response races.
    const pending = deferred<Response>();
    const mockFetch = vi
      .fn()
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => secondPage,
      });
    vi.stubGlobal('fetch', mockFetch);
    const target = render(
      <PokemonFeed filters={initialPage.filters} initialPage={initialPage} requestedPage={1} />,
    );

    // Act
    fireEvent.click(screen.getByRole('button', { name: '載入更多' }));
    await act(() => vi.advanceTimersByTimeAsync(14999));
    expect(screen.queryByText('載入逾時，請再試一次。')).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1));

    // Assert: The deadline ends loading and retains the previous batch.
    expect(screen.getByText('載入逾時，請再試一次。')).toBeInTheDocument();
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.getByTestId('loaded-range')).toHaveTextContent('已載入第 1–24 筆');
    expect(screen.getByText('Pokemon 1')).toBeInTheDocument();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '重新載入' })));
    expect(mockFetch.mock.calls.map(([url]) => url)).toEqual([
      '/api/pokemon?page=2',
      '/api/pokemon?page=2',
    ]);
    expect(screen.getByTestId('loaded-range')).toHaveTextContent('已載入第 1–48 筆');
    await act(async () => pending.resolve({ ok: true, json: async () => secondPage } as Response));
    expect(screen.getAllByRole('listitem')).toHaveLength(48);
    target.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('includes body decoding in the same request deadline', async () => {
    // Arrange: Headers arrive immediately but the body never finishes.
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: () => new Promise(() => {}) });
    vi.stubGlobal('fetch', mockFetch);
    render(
      <PokemonFeed filters={initialPage.filters} initialPage={initialPage} requestedPage={1} />,
    );

    // Act
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '載入更多' })));
    await act(() => vi.advanceTimersByTimeAsync(15000));

    // Assert
    expect(screen.getByText('載入逾時，請再試一次。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重新載入' })).toBeEnabled();
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('cancels old filter requests without leaking errors or results to the replacement feed', async () => {
    // Arrange
    const pending = deferred<Response>();
    const mockFetch = vi.fn().mockReturnValue(pending.promise);
    vi.stubGlobal('fetch', mockFetch);
    const target = render(
      <PokemonFeed
        key="old"
        filters={initialPage.filters}
        initialPage={initialPage}
        requestedPage={1}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: '載入更多' }));
    const replacement = buildPokemonListPage(entries, new URLSearchParams('q=Pokemon+2'));

    // Act: PokemonList remounts the feed when the filter identity changes.
    target.rerender(
      <PokemonFeed
        key="new"
        filters={replacement.filters}
        initialPage={replacement}
        requestedPage={1}
      />,
    );
    await act(() => vi.advanceTimersByTimeAsync(15000));
    await act(async () => pending.resolve({ ok: true, json: async () => secondPage } as Response));

    // Assert
    expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(screen.queryByText('載入逾時，請再試一次。')).not.toBeInTheDocument();
    expect(screen.queryByText('載入失敗，請再試一次。')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(replacement.total);
    expect(screen.queryByText('Pokemon 48')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the deadline after a successful response', async () => {
    // Arrange
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => secondPage }));
    render(
      <PokemonFeed filters={initialPage.filters} initialPage={initialPage} requestedPage={1} />,
    );

    // Act
    await act(async () => fireEvent.click(screen.getByRole('button', { name: '載入更多' })));
    await act(() => vi.advanceTimersByTimeAsync(15000));

    // Assert
    expect(screen.getByTestId('loaded-range')).toHaveTextContent('已載入第 1–48 筆');
    expect(screen.queryByText('載入逾時，請再試一次。')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
});
