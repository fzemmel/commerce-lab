import { ComparisonView } from "@/components/comparison/comparison-view";
import { getProductCatalog } from "@/lib/products-api";

export default async function ComparePage() {
  const catalog = await getProductCatalog();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ComparisonView products={catalog.products} />
    </main>
  );
}
