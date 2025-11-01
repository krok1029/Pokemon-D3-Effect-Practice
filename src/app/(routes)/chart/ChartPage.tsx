import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';

import { LegendaryToggle } from './components/LegendaryToggle';
import { RadarChart } from './components/RadarChart';
import { TypeAverageStatsComparison } from './components/TypeAverageStatsComparison';
import { loadAverageStatsViewModel, loadTypeAverageStatsViewModel } from './presenter';

type ChartPageProps = {
  excludeLegendaries?: boolean;
};

export async function ChartPage({ excludeLegendaries = false }: ChartPageProps) {
  const [averages, typeAverages] = await Promise.all([
    loadAverageStatsViewModel({ excludeLegendaries }),
    loadTypeAverageStatsViewModel({ excludeLegendaries }),
  ]);

  return (
    <section className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">寶可夢能力平均值</h1>
          <p className="text-muted-foreground text-sm">
            目前共彙整 {averages.countLabel} 隻{excludeLegendaries ? '非傳說' : ''}
            寶可夢，以下列表顯示六項基礎能力的平均值。
          </p>
        </div>
        <LegendaryToggle excludeLegendaries={excludeLegendaries} />
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

      <Card className="py-0">
        <CardHeader className="gap-2 px-6 pt-6">
          <CardTitle className="text-xl">依屬性比較能力平均值</CardTitle>
          <CardDescription>
            各屬性依選擇的能力值排序，橫條越長代表平均值越高。切換「排除傳說寶可夢」會更新結果。
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <TypeAverageStatsComparison viewModel={typeAverages} />
        </CardContent>
      </Card>
    </section>
  );
}
