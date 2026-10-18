"use client";

import { useState } from "react";

import { MAX_COMPARISON_PRODUCTS } from "@/lib/comparison";
import { cn } from "@/lib/cn";

import { useComparison } from "@/components/comparison/comparison-provider";
import { buttonVariants } from "@/components/ui/button";

type CompareButtonProps = {
  productId: string;
  className?: string;
};

export function CompareButton({ productId, className }: CompareButtonProps) {
  const { products, dispatch } = useComparison();
  const [message, setMessage] = useState("");
  const isSelected = products.some((product) => product.id === productId);

  function toggleProduct() {
    if (isSelected) {
      dispatch({ type: "product-removed", productId });
      setMessage("");
      return;
    }

    if (products.length >= MAX_COMPARISON_PRODUCTS) {
      setMessage(`You can compare up to ${MAX_COMPARISON_PRODUCTS} products.`);
      return;
    }

    dispatch({ type: "product-added", product: { id: productId } });
    setMessage("");
  }

  return (
    <div className={cn("flex flex-col items-start gap-2", className)}>
      <button
        type="button"
        className={buttonVariants({ variant: isSelected ? "secondary" : "outline" })}
        onClick={toggleProduct}
        aria-pressed={isSelected}
      >
        {isSelected ? "Remove from comparison" : "Add to comparison"}
      </button>
      {message ? <p role="alert" className="text-sm font-medium text-amber-800">{message}</p> : null}
    </div>
  );
}
