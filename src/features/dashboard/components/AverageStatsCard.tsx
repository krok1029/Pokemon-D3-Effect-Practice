import { type AverageStats, type StatKey } from '@/application/pokemon/AverageStats';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/uikit/card';
import RadarChart from '@/ui/charts/RadarChart';
import Link from 'next/link';
import { MAX_STAT } from '@/domain/constants';

const DISPLAY_LABEL: Record<StatKey, string> = {
  hp: 'HP（體力）',
  attack: '攻擊',
  defense: '防禦',
  sp_atk: '特攻',
  sp_def: '特防',
  speed: '速度',
};

export default function AverageStatsCard({ data }: { data: AverageStats }) {
  const { count, avgs } = data;
  const labels = avgs.map((x) => DISPLAY_LABEL[x.key]);
  const values = avgs.map((x) => x.value);

  if (count === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-nowrap">平均六維：</CardTitle>
          <CardDescription>目前沒有資料</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const max = MAX_STAT;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-nowrap">平均六維：</CardTitle>
        <CardDescription>
          資料來源：
          <Link
            className="px-1 text-cyan-700 underline underline-offset-4"
            href="https://github.com/Laetitia-Deken/Pokemon_Dataset_Exploratory"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
        </CardDescription>
        <CardAction />
      </CardHeader>

      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="text-emerald-400">
            <RadarChart labels={labels} values={values} maxValue={max} />
          </div>

          <ul className="text-sm grid grid-cols-2 gap-x-6 gap-y-1">
            {avgs.map((a) => (
              <li key={a.key} className="flex justify-between min-w-[160px]">
                <span className="text-muted-foreground">{DISPLAY_LABEL[a.key]}</span>
                <span className="font-medium">{a.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
