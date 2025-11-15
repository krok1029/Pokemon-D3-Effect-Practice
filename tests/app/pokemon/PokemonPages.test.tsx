import { render, screen } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const notFoundMock = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
);

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={typeof src === 'string' ? src : src?.src} />
  ),
}));

vi.mock('@/app/pokemon/components/PokemonList', () => ({
  PokemonList: vi.fn(() => <div data-testid="pokemon-list-mock" />),
}));

vi.mock('@/app/pokemon/presenter', () => ({
  loadPokemonDetailPageViewModel: vi.fn(),
}));

import PokemonDetailRoute, { generateMetadata } from '@/app/pokemon/[id]/page';
import { PokemonList } from '@/app/pokemon/components/PokemonList';
import PokemonPage from '@/app/pokemon/page';
import { loadPokemonDetailPageViewModel } from '@/app/pokemon/presenter';
import type {
  PokemonDetailEntryViewModel,
  PokemonDetailPageViewModel,
} from '@/app/pokemon/view-models/pokemonDetailViewModel';

const baseEntry: Omit<PokemonDetailEntryViewModel, 'id' | 'name'> = {
  isLegendary: false,
  accentColor: '#ff0000',
  imagePath: '/img/001.png',
  typeBadges: [{ slug: 'fire', label: '火', iconPath: '/types/fire.svg', color: '#f97316' }],
  stats: [{ key: 'hp', label: 'HP', value: 45, ratio: 0.5 }],
  total: 45,
};

const buildViewModel = (): PokemonDetailPageViewModel => ({
  countLabel: '2',
  pokemons: [
    { id: 1, name: 'Alpha', ...baseEntry },
    { id: 2, name: 'Beta', ...baseEntry },
  ],
  typeOptions: [{ slug: 'fire', label: '火', iconPath: '/types/fire.svg', color: '#f97316' }],
});

describe('Pokemon pages', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders PokemonPage with header and passes data into PokemonList', async () => {
    const viewModel = buildViewModel();
    (loadPokemonDetailPageViewModel as vi.Mock).mockResolvedValue(viewModel);

    render(await PokemonPage());

    expect(screen.getByText('個別寶可夢資料')).toBeInTheDocument();
    expect(screen.getByText(/收錄 2 隻寶可夢/)).toBeInTheDocument();
    expect(screen.getByTestId('pokemon-list-mock')).toBeInTheDocument();
    expect(PokemonList).toHaveBeenCalledWith(
      {
        pokemons: viewModel.pokemons,
        typeOptions: viewModel.typeOptions,
      },
      undefined,
    );
  });

  it('generates metadata for specific pokemon and uses fallback for invalid ids', async () => {
    const viewModel = buildViewModel();
    (loadPokemonDetailPageViewModel as vi.Mock).mockResolvedValue(viewModel);

    const metadata = await generateMetadata({ params: { id: '1' } });
    expect(metadata.title).toContain('Alpha');
    expect(metadata.description).toContain('Alpha');

    const fallback = await generateMetadata({ params: { id: 'abc' } });
    expect(fallback.title).toBe('寶可夢資料');
  });

  it('renders PokemonDetailRoute with pokemon data and image', async () => {
    const viewModel = buildViewModel();
    (loadPokemonDetailPageViewModel as vi.Mock).mockResolvedValue(viewModel);

    render(await PokemonDetailRoute({ params: { id: '1' } }));

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getAllByText('#001')[0]).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Alpha' })).toHaveAttribute('src', '/img/001.png');
    expect(screen.getByText('能力值總和')).toBeInTheDocument();
  });

  it('renders fallback text when pokemon image is missing', async () => {
    const viewModel = buildViewModel();
    viewModel.pokemons = [{ ...viewModel.pokemons[0], id: 3, name: 'Gamma', imagePath: null }];
    (loadPokemonDetailPageViewModel as vi.Mock).mockResolvedValue(viewModel);

    render(await PokemonDetailRoute({ params: { id: '3' } }));

    expect(screen.getByText('Gamma')).toBeInTheDocument();
    expect(screen.getByText('無圖片')).toBeInTheDocument();
  });

  it('calls notFound when id is invalid or missing', async () => {
    await expect(PokemonDetailRoute({ params: { id: 'xyz' } })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(1);

    (loadPokemonDetailPageViewModel as vi.Mock).mockResolvedValue(buildViewModel());
    await expect(PokemonDetailRoute({ params: { id: '999' } })).rejects.toThrow('NEXT_NOT_FOUND');
    expect(notFoundMock).toHaveBeenCalledTimes(2);
  });
});
