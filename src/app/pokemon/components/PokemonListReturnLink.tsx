import Link from 'next/link';

import { TYPE_COLOR_MAP } from '@/app/(routes)/chart/view-models/typeAverageStatsViewModel';

import { safePokemonListReturnHref } from '../lib/pokemonListQuery';

export function PokemonListReturnLink({ returnTo }: { returnTo?: string }) {
  return (
    <Link
      href={safePokemonListReturnHref(returnTo, Object.keys(TYPE_COLOR_MAP))}
      className="font-semibold hover:text-slate-900 dark:hover:text-white"
    >
      ← 回到列表
    </Link>
  );
}
