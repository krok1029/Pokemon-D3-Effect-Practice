import { list } from '@/application/pokemon/list';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import '@/infrastructure/config'; // 初始化 DI 容器（Composition Root）
import { container } from 'tsyringe';
import { TOKENS } from '@/di/tokens';
import { Effect } from 'effect';
import Link from 'next/link';

export default async function Home() {
  const repo = container.resolve(TOKENS.PokemonRepository);
  const result = await Effect.runPromise(list(repo, {}));

  if (result._tag === 'Left') {
    return <div>錯誤: {result.left.message}</div>;
  }

  return (
    <div className='flex flex-wrap gap-4'> 
      <Card className="w-64">
        <CardHeader>
          <CardTitle className="text-nowrap">網站統計寶可夢數：</CardTitle>
          <CardDescription>
            資料來源:
            <Link
              className="px-1 text-cyan-700"
              href="https://github.com/Laetitia-Deken/Pokemon_Dataset_Exploratory"
            >
              GitHub
            </Link>
          </CardDescription>
          <CardAction></CardAction>
        </CardHeader>
        <CardContent className="text-5xl font-extrabold text-end">
          {result.right.total}
        </CardContent>
      </Card>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-nowrap">平均六維：</CardTitle>
          <CardDescription>
            資料來源:
            <Link
              className="px-1 text-cyan-700"
              href="https://github.com/Laetitia-Deken/Pokemon_Dataset_Exploratory"
            >
              GitHub
            </Link>
          </CardDescription>
          <CardAction></CardAction>
        </CardHeader>
        <CardContent className="text-5xl font-extrabold text-end">
          {result.right.total}
        </CardContent>
      </Card>
    </div>
  );
}
