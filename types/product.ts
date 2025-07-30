// types/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  maxStock: number;
  stockChange: number;
  imageUrl: string; // URL complète de l'image dans Firebase Storage
  status: 'en-stock' | 'stock-faible';
}
