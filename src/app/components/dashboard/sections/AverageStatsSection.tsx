import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

import { average } from '@/core/application/pokemon/AverageStats';

import { getPokemonRepository } from '@/adapters/config';

import AverageStatsCard from '../cards/AverageStatsCard';

export default async function AverageStatsSection() {
  const repo = getPokemonRepository();
  const res = await average(repo);
  if (res._tag === 'Left') {
    const msg = res.left.message;
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-nowrap">平均六維：</CardTitle>
          <CardDescription>載入失敗：{msg}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return <AverageStatsCard data={res.right} />;
}
