'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChangeEvent, useTransition } from 'react';

type LegendaryToggleProps = {
  excludeLegendaries: boolean;
  className?: string;
};

export function LegendaryToggle({ excludeLegendaries, className }: LegendaryToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const rootClassName = [
    'flex items-center gap-3 text-sm font-medium text-muted-foreground',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;

    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (checked) {
        params.set('excludeLegendaries', 'true');
      } else {
        params.delete('excludeLegendaries');
      }

      const queryString = params.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      router.replace(nextUrl, { scroll: false });
    });
  };

  return (
    <label className={rootClassName}>
      <span>排除傳說寶可夢</span>
      <span className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          className="border-border text-primary focus-visible:outline-primary h-4 w-4 rounded border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          checked={excludeLegendaries}
          onChange={handleChange}
          disabled={isPending}
        />
        <span className="text-muted-foreground text-xs">
          {excludeLegendaries ? '已排除' : '包含傳說'}
        </span>
      </span>
    </label>
  );
}
