import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/app/components/ui/card';

import { loadDatasetSummaryViewModel } from './presenter';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const summary = await loadDatasetSummaryViewModel();

  return (
    <div className="space-y-8">
      <section className="space-y-4 py-8">
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          Pokemon D3 Effect
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">寶可夢圖鑑與能力探索</h1>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          查找寶可夢的六項基礎能力、屬性與相剋關係，透過雷達圖、屬性比較與散佈圖，探索不同型態的能力分布。
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/pokemon"
            className="bg-primary text-primary-foreground rounded-lg px-5 py-3 text-sm font-medium transition hover:opacity-90"
          >
            瀏覽圖鑑
          </Link>
          <Link
            href="/chart"
            className="border-border hover:bg-muted rounded-lg border px-5 py-3 text-sm font-medium transition"
          >
            探索圖表
          </Link>
        </div>
      </section>

      <section aria-labelledby="dataset-heading">
        <Card>
          <CardHeader>
            <h2 id="dataset-heading" className="text-xl font-semibold">
              目前資料範圍
            </h2>
          </CardHeader>
          <CardContent className="space-y-5">
            <dl className="grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground text-sm">型態樣本</dt>
                <dd className="text-2xl font-semibold">{summary.sampleCountLabel} 筆</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">不同圖鑑編號</dt>
                <dd className="text-2xl font-semibold">{summary.speciesCountLabel} 個</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">圖鑑編號範圍</dt>
                <dd className="text-2xl font-semibold">{summary.numberRangeLabel}</dd>
              </div>
            </dl>
            <p className="text-muted-foreground text-sm leading-relaxed">
              每筆型態資料為一個樣本；一般、Mega
              與地區型態可能共用圖鑑編號，因此樣本筆數不等於不同物種數。
              統計依目前載入的資料計算，傳說狀態沿用資料來源的標記。
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
