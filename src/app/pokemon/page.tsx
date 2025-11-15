import { PokemonList } from './components/PokemonList';
import { loadPokemonDetailPageViewModel } from './presenter';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '寶可夢資料',
  description: '瀏覽每隻寶可夢的基礎能力值、屬性與傳說狀態。',
};

export default async function PokemonPage() {
  const viewModel = await loadPokemonDetailPageViewModel();

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">資料總表</p>
        <h1 className="text-3xl font-semibold tracking-tight">個別寶可夢資料</h1>
        <p className="text-muted-foreground text-sm">
          收錄 {viewModel.countLabel}{' '}
          隻寶可夢的六項基礎能力值、屬性與是否為傳說寶可夢。可用搜尋與屬性篩選快速找到想看的寶可夢。
        </p>
      </header>

      <PokemonList pokemons={viewModel.pokemons} typeOptions={viewModel.typeOptions} />
    </section>
  );
}
