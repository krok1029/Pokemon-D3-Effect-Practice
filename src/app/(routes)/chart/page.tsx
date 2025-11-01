import { ChartPage } from './ChartPage';

type ChartRouteProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChartRoute({ searchParams }: ChartRouteProps) {
  const mergedSearchParams = (await searchParams) ?? {};

  console.log('ChartRoute searchParams:', mergedSearchParams);
  const excludeLegendariesParam = mergedSearchParams.excludeLegendaries;
  const excludeLegendariesValue = Array.isArray(excludeLegendariesParam)
    ? excludeLegendariesParam[0]
    : excludeLegendariesParam;

  const excludeLegendaries =
    typeof excludeLegendariesValue === 'string'
      ? ['1', 'true', 'yes'].includes(excludeLegendariesValue.toLowerCase())
      : false;

  return <ChartPage excludeLegendaries={excludeLegendaries} />;
}
