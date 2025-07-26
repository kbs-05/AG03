'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';

interface Product {
  id: number;
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
  const [products] = useState<Product[]>([
    {
      id: 1,
      name: 'Bananes plantains',
      price: 3500,
      category: 'fruits',
      stock: 90,
      maxStock: 100,
      stockChange: 15,
      image: 'https://readdy.ai/api/search-image?query=Fresh%20yellow%20plantain%20bananas%20on%20a%20clean%20white%20background%2C%20tropical%20fruit%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20organic%20food%2C%20grocery%20store%20product&width=300&height=200&seq=plantains001&orientation=landscape',
      status: 'en-stock'
    },
    {
      id: 2,
      name: 'Igname blanche',
      price: 4500,
      category: 'tubercules',
      stock: 15,
      maxStock: 50,
      stockChange: 18,
      image: 'https://readdy.ai/api/search-image?query=Fresh%20white%20yam%20tubers%20on%20a%20clean%20white%20background%2C%20African%20root%20vegetable%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20organic%20food%2C%20traditional%20African%20cuisine%20ingredient&width=300&height=200&seq=yam001&orientation=landscape',
      status: 'stock-faible'
    },
    {
      id: 3,
      name: 'Poisson fumé',
      price: 5000,
      category: 'poissons',
      stock: 65,
      maxStock: 80,
      stockChange: 12,
      image: 'https://readdy.ai/api/search-image?query=Traditional%20smoked%20fish%20on%20a%20clean%20white%20background%2C%20African%20cuisine%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20preserved%20seafood%2C%20healthy%20protein%20food&width=300&height=200&seq=fish001&orientation=landscape',
      status: 'en-stock'
    },
    {
      id: 4,
      name: 'Tomates fraîches',
      price: 2500,
      category: 'legumes',
      stock: 8,
      maxStock: 60,
      stockChange: -5,
      image: 'https://readdy.ai/api/search-image?query=Fresh%20red%20tomatoes%20on%20a%20clean%20white%20background%2C%20organic%20vegetables%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20food%2C%20garden%20fresh%20produce&width=300&height=200&seq=tomatoes001&orientation=landscape',
      status: 'stock-faible'
    },
    {
      id: 5,
      name: 'Riz blanc',
      price: 1200,
      category: 'cereales',
      stock: 120,
      maxStock: 150,
      stockChange: 8,
      image: 'https://readdy.ai/api/search-image?query=White%20rice%20grains%20on%20a%20clean%20white%20background%2C%20staple%20food%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20carbohydrate%2C%20cooking%20ingredient&width=300&height=200&seq=rice001&orientation=landscape',
      status: 'en-stock'
    },
    {
      id: 6,
      name: 'Manioc pelé',
      price: 1800,
      category: 'tubercules',
      stock: 25,
      maxStock: 80,
      stockChange: 22,
      image: 'https://readdy.ai/api/search-image?query=Peeled%20cassava%20root%20on%20a%20clean%20white%20background%2C%20African%20staple%20food%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20organic%20food%2C%20traditional%20ingredient&width=300&height=200&seq=cassava001&orientation=landscape',
      status: 'stock-faible'
    },
    {
      id: 7,
      name: 'Avocat mûr',
      price: 800,
      category: 'fruits',
      stock: 45,
      maxStock: 60,
      stockChange: 10,
      image: 'https://readdy.ai/api/search-image?query=Ripe%20avocados%20on%20a%20clean%20white%20background%2C%20healthy%20fruit%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20organic%20food%2C%20nutritious%20superfood&width=300&height=200&seq=avocado001&orientation=landscape',
      status: 'en-stock'
    },
    {
      id: 8,
      name: 'Poulet fermier',
      price: 8500,
      category: 'viandes',
      stock: 12,
      maxStock: 30,
      stockChange: -3,
      image: 'https://readdy.ai/api/search-image?query=Fresh%20farm%20chicken%20on%20a%20clean%20white%20background%2C%20free%20range%20poultry%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20protein%20food%2C%20organic%20meat&width=300&height=200&seq=chicken001&orientation=landscape',
      status: 'stock-faible'
    },
    {
      id: 9,
      name: 'Ananas sweet',
      price: 2200,
      category: 'fruits',
      stock: 85,
      maxStock: 100,
      stockChange: 20,
      image: 'https://readdy.ai/api/search-image?query=Fresh%20sweet%20pineapple%20on%20a%20clean%20white%20background%2C%20tropical%20fruit%2C%20high%20quality%20product%20photography%2C%20natural%20lighting%2C%20healthy%20organic%20food%2C%20juicy%20fruit&width=300&height=200&seq=pineapple001&orientation=landscape',
      status: 'en-stock'
    }
  ]);

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}