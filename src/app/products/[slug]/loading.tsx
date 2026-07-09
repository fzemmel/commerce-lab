export default function ProductDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="sr-only" aria-live="polite">
        Loading product details...
      </p>
      <div className="mb-8 h-5 w-40 animate-pulse rounded-full bg-slate-200" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="h-[520px] animate-pulse rounded-[2rem] bg-white" />
        <div className="h-[520px] animate-pulse rounded-[2rem] bg-white" />
      </div>
    </main>
  );
}
