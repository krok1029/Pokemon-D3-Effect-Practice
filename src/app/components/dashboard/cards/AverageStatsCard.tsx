import Link from 'next/link';

import RadarChart from '@/app/components/charts/RadarChart';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';

import { type AverageStats, type StatKey } from '@/core/application/pokemon/AverageStats';
import { MAX_STAT } from '@/core/domain/constants';

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
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <div className="text-emerald-400">
            <RadarChart labels={labels} values={values} maxValue={max} />
          </div>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {avgs.map((a) => (
              <li key={a.key} className="flex min-w-[160px] justify-between">
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
