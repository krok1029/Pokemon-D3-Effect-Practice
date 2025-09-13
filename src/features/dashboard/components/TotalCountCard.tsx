import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/uikit/card';
import Link from 'next/link';

export default function TotalCountCard({ total }: { total: number }) {
  return (
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
        {total}
      </CardContent>
    </Card>
  );
}

