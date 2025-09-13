import { Effect } from 'effect';
import { getPokemonRepository } from '@/infrastructure/config';
import { list } from '@/application/pokemon/list';
import TotalCountCard from '../components/TotalCountCard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/ui/uikit/card';

export default async function TotalCountContainer() {
  const repo = getPokemonRepository();
  const res = await Effect.runPromise(list(repo, {}));
  if (res._tag === 'Left') {
    return (
      <Card className="w-64">
        <CardHeader>
          <CardTitle className="text-nowrap">網站統計寶可夢數：</CardTitle>
          <CardDescription>載入失敗：{res.left.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return <TotalCountCard total={res.right.total} />;
}

