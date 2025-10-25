import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';

import { RadarChart } from './components/RadarChart';
import { loadAverageStatsViewModel } from './presenter';

export async function ChartPage() {
  const averages = await loadAverageStatsViewModel();

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">寶可夢能力平均值</h1>
        <p className="text-muted-foreground text-sm">
          目前共彙整 {averages.countLabel} 隻寶可夢，以下列表顯示六項基礎能力的平均值。
        </p>
      </header>

      <Card className="py-0">
        <CardHeader className="gap-2 px-6 pt-6">
          <CardTitle className="text-xl">六項能力雷達圖</CardTitle>
          <CardDescription>雷達圖展示六項能力值的平均表現，越靠外代表能力越高。</CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="mx-auto aspect-square w-full max-w-md">
            <RadarChart stats={averages.stats} />
          </div>
        </CardContent>
      </Card>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {averages.stats.map(({ label, value }) => (
          <Card key={label} className="py-4 transition hover:shadow-md">
            <CardHeader className="gap-2 px-4">
              <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
              <dd className="text-primary text-3xl font-semibold">{value}</dd>
            </CardHeader>
          </Card>
        ))}
      </dl>
    </section>
  );
}
