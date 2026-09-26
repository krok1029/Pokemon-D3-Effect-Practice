'use client';

import Image from 'next/image';
import { useState } from 'react';

type PokemonDetailImageProps = {
  src: string | null;
  name: string;
  compact?: boolean;
  priority?: boolean;
};

export function PokemonDetailImage({
  src,
  name,
  compact = false,
  priority = false,
}: PokemonDetailImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center px-3 text-center text-sm text-slate-500 dark:text-slate-400 ${compact ? 'h-32 w-32' : 'h-full w-full'}`}
      >
        {src ? (
          '圖片暫無法載入'
        ) : (
          <span>
            <span className="block">無圖片</span>尚無此型態對應圖檔
          </span>
        )}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={compact ? '' : name}
      {...(compact ? { width: 128, height: 128 } : { fill: true, sizes: '320px' })}
      className={compact ? 'h-32 w-32 object-contain' : 'object-contain p-4'}
      priority={priority}
      onError={() => setFailed(true)}
    />
  );
}
