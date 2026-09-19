'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type PokemonCardImageProps = {
  src: string | null;
  name: string;
  priority?: boolean;
  defer?: boolean;
};

export function PokemonCardImage({
  src,
  name,
  priority = false,
  defer = false,
}: PokemonCardImageProps) {
  const container = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(priority);
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

  useEffect(() => {
    if (!src || requested || defer || !container.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRequested(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px' },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [src, requested, defer]);

  return (
    <div
      ref={container}
      aria-busy={Boolean(src && state === 'loading')}
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
    >
      {src && state === 'loading' ? (
        <div
          aria-hidden="true"
          className="absolute inset-2 rounded-full bg-slate-200/70 motion-safe:animate-pulse dark:bg-slate-700/60"
        />
      ) : null}
      {!src || state === 'error' ? (
        <div className="flex h-full items-center justify-center px-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {src ? '圖片暫無法載入' : '無圖片'}
        </div>
      ) : requested ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="96px"
          priority={priority}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={`object-contain p-2 transition-opacity duration-150 motion-reduce:transition-none ${state === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}
    </div>
  );
}
