'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  maxStock: number;
  stockChange: number;
  image: string;
  status: 'en-stock' | 'stock-faible';
}

interface ProductsGridProps {
  searchTerm: string;
  selectedCategory: string;
}

export default function ProductsGrid({ searchTerm, selectedCategory }: ProductsGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const productsRef = collection(db, 'products');

    const q = selectedCategory !== 'all' 
      ? query(productsRef, where('category', '==', selectedCategory)) 
      : productsRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Product, 'id'>),
      }));
      setProducts(items);
      setLoading(false);
    }, (error) => {
      console.error('Erreur Firestore:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Chargement des produits...</p>;
  if (filteredProducts.length === 0) return <p>Aucun produit trouvé.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map(product => (
        <ProductCard
  key={product.id}
  product={product}
  onEdit={() => {}}
  onDelete={() => {}}
/>

      ))}
    </div>
  );
}
