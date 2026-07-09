export default function ProductsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="sr-only" aria-live="polite">
        Loading product listing...
      </p>
      <div className="mb-8 h-56 animate-pulse rounded-[2rem] bg-slate-200" />
      <div className="mb-8 h-32 animate-pulse rounded-3xl bg-white" />
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, index) => (
          <li key={index} className="h-96 animate-pulse rounded-3xl bg-white" />
        ))}
      </ul>
    </main>
  );
}
