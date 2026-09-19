import { Suspense } from 'react';

import { buildDatasetSummaryViewModel } from '@/app/view-models/datasetSummaryViewModel';

import { PokemonList } from './components/PokemonList';
import { loadPokemonDetailPageViewModel } from './presenter';

import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '寶可夢資料',
  description: '瀏覽每隻寶可夢的基礎能力值、屬性與傳說狀態。',
};

export default async function PokemonPage() {
  const viewModel = await loadPokemonDetailPageViewModel();
  const summary = buildDatasetSummaryViewModel(viewModel.pokemons);

  return (
    <section className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">資料總表</p>
        <h1 className="text-3xl font-semibold tracking-tight">個別寶可夢資料</h1>
        <p className="text-muted-foreground text-sm">
          收錄 {summary.sampleCountLabel} 筆型態樣本，涵蓋 {summary.speciesCountLabel}{' '}
          個不同圖鑑編號。可用搜尋與屬性篩選查找六項基礎能力值、屬性與傳說狀態。
        </p>
        <p className="text-muted-foreground text-sm">
          每筆型態資料為一個樣本；同一圖鑑編號可能有多種型態。雙屬性樣本在屬性統計中同時計入兩組，各組筆數不可直接相加作為物種數。
        </p>
      </header>

      <Suspense fallback={<p className="text-muted-foreground text-sm">載入圖鑑中…</p>}>
        <PokemonList pokemons={viewModel.pokemons} typeOptions={viewModel.typeOptions} />
      </Suspense>
    </section>
  );
}
