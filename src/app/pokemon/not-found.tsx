import Link from 'next/link';

export default function PokemonNotFound() {
  return (
    <section className="mx-auto max-w-xl space-y-6 py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">404 找不到寶可夢資料</h1>
      <p className="leading-relaxed text-slate-600 dark:text-slate-300">
        這個編號或型態不存在。請回到圖鑑，使用名稱或編號重新搜尋。
      </p>
      <Link
        href="/pokemon"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:outline-slate-100"
      >
        回圖鑑重新搜尋
      </Link>
    </section>
  );
}
