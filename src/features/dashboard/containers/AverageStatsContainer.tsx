import { getPokemonRepository } from '@/infrastructure/config';
import { average } from '@/application/pokemon/AverageStats';
import AverageStatsCard from '../components/AverageStatsCard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/uikit/card';

export default async function AverageStatsContainer() {
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
