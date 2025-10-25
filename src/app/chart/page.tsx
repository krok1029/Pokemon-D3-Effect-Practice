import { getPokemonRepository } from '@/server/pokemonRepository';

import { Card, CardHeader } from '@/app/components/ui/card';

import { getAveragePokemonStats } from '@/core/application/getAveragePokemonStats';
import { BASE_STAT_LABELS } from '@/core/domain/pokemon';

export default async function ChartPage() {
  const repo = getPokemonRepository();
  const averages = await getAveragePokemonStats(repo);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">寶可夢能力平均值</h1>
        <p className="text-muted-foreground text-sm">
          目前共彙整 {averages.count.toLocaleString()} 隻寶可夢，以下列表顯示六項基礎能力的平均值。
        </p>
      </header>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {averages.stats.map(({ key, average }) => (
          <Card key={key} className="py-4 transition hover:shadow-md">
            <CardHeader className="gap-2 px-4">
              <dt className="text-muted-foreground text-sm font-medium">{BASE_STAT_LABELS[key]}</dt>
              <dd className="text-primary text-3xl font-semibold">{average.toFixed(1)}</dd>
            </CardHeader>
          </Card>
        ))}
      </dl>
    </section>
  );
}
