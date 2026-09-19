'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

export function PokemonScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 400);
    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateVisibility);
  }, []);

  function scrollToTop() {
    document.getElementById('pokemon-list-heading')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="回到最上方"
      title="回到最上方"
      onClick={scrollToTop}
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-50 flex size-12 cursor-pointer items-center justify-center rounded-full border border-blue-500 bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:outline-none motion-reduce:transition-none dark:border-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus-visible:ring-blue-800"
    >
      <ArrowUp className="size-5" aria-hidden="true" />
    </button>
  );
}
