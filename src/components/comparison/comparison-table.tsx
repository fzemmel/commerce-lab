import Link from "next/link";

import { normalizeComparisonRows } from "@/lib/comparison";
import type { Product } from "@/types/product";

type ComparisonTableProps = {
  products: Product[];
  onRemove: (productId: string) => void;
};

export function ComparisonTable({ products, onRemove }: ComparisonTableProps) {
  const rows = normalizeComparisonRows(products);

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="min-w-36 px-5 py-4 font-semibold text-slate-950">Attribute</th>
            {products.map((product) => (
              <th key={product.id} scope="col" className="min-w-52 px-5 py-4 align-top font-semibold text-slate-950">
                <Link href={`/products/${product.slug}`} className="transition hover:text-amber-800">{product.name}</Link>
                <button
                  type="button"
                  className="mt-3 block text-sm font-semibold text-slate-600 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-950"
                  onClick={() => onRemove(product.id)}
                >
                  Remove {product.name}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-200">
              <th scope="row" className="px-5 py-4 font-semibold text-slate-700">{row.label}</th>
              {row.values.map((value, index) => <td key={`${row.label}-${products[index]?.id}`} className="px-5 py-4 text-slate-600">{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
