import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { PokemonList } from '@/app/pokemon/components/PokemonList';
import type { PokemonDetailEntryViewModel } from '@/app/pokemon/view-models/pokemonDetailViewModel';

vi.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string | { src: string } }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} data-testid={`image-${alt}`} src={typeof src === 'string' ? src : src?.src} />
  ),
}));

vi.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const buildPokemon = (
  overrides: Partial<PokemonDetailEntryViewModel> = {},
): PokemonDetailEntryViewModel => ({
  id: 1,
  name: 'Alpha',
  isLegendary: false,
  accentColor: '#ff0000',
  imagePath: null,
  total: 310,
  typeBadges: [
    { slug: 'fire', label: '火', iconPath: '/types/fire.svg', color: '#ff0000' },
    { slug: 'flying', label: '飛行', iconPath: '/types/flying.svg', color: '#00aaff' },
  ],
  stats: [
    { key: 'hp', label: 'HP', value: 50, ratio: 0.5 },
    { key: 'attack', label: '物攻', value: 80, ratio: 0.8 },
    { key: 'defense', label: '物防', value: 60, ratio: 0.6 },
    { key: 'spAtk', label: '特攻', value: 70, ratio: 0.7 },
    { key: 'spDef', label: '特防', value: 65, ratio: 0.65 },
    { key: 'speed', label: '速度', value: 85, ratio: 0.85 },
  ],
  ...overrides,
});

const typeOptions = [
  { slug: 'fire', label: '火', iconPath: '/types/fire.svg', color: '#f97316' },
  { slug: 'electric', label: '電', iconPath: '/types/electric.svg', color: '#facc15' },
  { slug: 'water', label: '水', iconPath: '/types/water.svg', color: '#38bdf8' },
];

describe('PokemonList', () => {
  it('renders pokemon cards with images, badges and details', () => {
    const pokemons = [
      buildPokemon({
        id: 25,
        name: 'Pikachu',
        imagePath: '/img/025.png',
        isLegendary: true,
      }),
      buildPokemon({
        id: 7,
        name: 'Squirtle',
        typeBadges: [
          { slug: 'water', label: '水', iconPath: '/types/water.svg', color: '#38bdf8' },
        ],
        imagePath: null,
        isLegendary: false,
      }),
    ];

    render(<PokemonList pokemons={pokemons} typeOptions={typeOptions} />);

    expect(screen.getByText('Pikachu')).toBeInTheDocument();
    expect(screen.getByText('Squirtle')).toBeInTheDocument();
    expect(screen.getByTestId('image-Pikachu')).toHaveAttribute('src', '/img/025.png');
    expect(screen.getByText('無圖片')).toBeInTheDocument();

    const detailLink = screen.getAllByText('查看詳情 →')[0].closest('a');
    expect(detailLink).toHaveAttribute('href', '/pokemon/25');

    expect(screen.getByText('傳說')).toBeInTheDocument();
    expect(screen.getAllByText('能力值總和')[0]).toBeInTheDocument();
  });

  it('filters by keyword, legendary toggle, and type selection', async () => {
    const pokemons = [
      buildPokemon({
        id: 1,
        name: 'Alpha',
        isLegendary: false,
        typeBadges: [{ slug: 'fire', label: '火', iconPath: '/types/fire.svg', color: '#f97316' }],
      }),
      buildPokemon({
        id: 2,
        name: 'Beta',
        isLegendary: true,
        typeBadges: [
          { slug: 'electric', label: '電', iconPath: '/types/electric.svg', color: '#facc15' },
        ],
      }),
    ];

    render(<PokemonList pokemons={pokemons} typeOptions={typeOptions} />);

    const [searchInput] = screen.getAllByPlaceholderText('輸入編號或名稱，例如 25、Pikachu');
    fireEvent.change(searchInput, { target: { value: 'Beta' } });

    expect(screen.getByText('Beta')).toBeInTheDocument();

    const legendaryToggle = screen.getByLabelText('只顯示傳說寶可夢');
    fireEvent.click(legendaryToggle);
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /火/ }));
    expect(
      screen.getByText('找不到符合條件的寶可夢，試試調整搜尋或篩選條件。'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '全部' }));
    expect(screen.getByText('Beta')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /火/ }));
    fireEvent.click(legendaryToggle); // disable toggle
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).not.toBeInTheDocument();
  });
});
