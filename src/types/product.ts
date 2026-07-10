export type ProductCategory = string;

export type ProductAttributes = {
  color?: string;
  size?: string;
  material?: string;
  [key: string]: string | undefined;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  isNew?: boolean;
  isSale?: boolean;
  source?: "api" | "local";
  attributes: ProductAttributes;
};
