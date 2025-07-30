'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Ici on utilise directement product.imageUrl (URL complète)
  useEffect(() => {
    setImageUrl(product.imageUrl);
  }, [product.imageUrl]);

  const stockPercentage = (product.stock / product.maxStock) * 100;

  const categoryNames: { [key: string]: string } = {
    fruits: 'Fruits',
    legumes: 'Légumes',
    tubercules: 'Tubercules',
    cereales: 'Céréales',
    poissons: 'Poissons',
    viandes: 'Viandes',
  };

  const getStockColor = () => {
    if (stockPercentage >= 70) return 'bg-green-500';
    if (stockPercentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCardBackground = () => {
    if (product.status === 'stock-faible') {
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200';
    }
    return 'bg-white border-gray-200';
  };

  return (
    <div
      className={`rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${getCardBackground()}`}
    >
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-48 object-cover object-top"
          />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
            Chargement de l’image...
          </div>
        )}

        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 text-xs font-medium rounded-full ${
              product.status === 'en-stock' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}
          >
            {product.status === 'en-stock' ? 'En stock' : 'Stock faible'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
          <span className="text-green-600 font-bold text-lg">{product.price.toLocaleString()} XAF</span>
        </div>

        <p className="text-sm text-gray-600 mb-3">{categoryNames[product.category]}</p>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Stock: {product.stock} unités</span>
            <span
              className={`font-medium ${product.stockChange >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {product.stockChange >= 0 ? '+' : ''}
              {product.stockChange}% ce mois
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStockColor()}`}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                aria-label="Editer le produit"
              >
                <i className="ri-edit-line w-4 h-4 flex items-center justify-center" />
              </button>
              <button
                onClick={() => onDelete(product.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                aria-label="Supprimer le produit"
              >
                <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center" />
              </button>
            </div>
            <button className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm cursor-pointer">
              <i className="ri-eye-line w-4 h-4 flex items-center justify-center" />
              <span>Détails</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
