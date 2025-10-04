import { getPokemonRepository } from '@/adapters/config';
import { list } from '@/core/application/pokemon/ListPokemons';
import TotalCountCard from './TotalCountCard';
import { Card, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

export default async function TotalCountSection() {
  const repo = getPokemonRepository();
  const res = await list(repo, {});
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
