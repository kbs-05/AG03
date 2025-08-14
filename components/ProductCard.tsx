'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl ?? null);

  useEffect(() => {
    setImageUrl(product.imageUrl ?? null);
  }, [product.imageUrl]);

  // --- sécurisation des valeurs numériques ---
  const stockNumber = Number(product.stock ?? 0);
  const maxStockNumber = Number(product.maxStock ?? 0);
  const stockChangeNumber = Number(product.stockChange ?? 0);

  // si maxStock absent ou invalide, on ne divise pas par 0
  let stockPercentage = 0;
  let maxStockDefined = true;

  if (isNaN(stockNumber)) {
    console.warn('product.stock n’est pas un nombre:', product);
  }
  if (!maxStockNumber || isNaN(maxStockNumber) || maxStockNumber <= 0) {
    maxStockDefined = false;
    // si on n'a pas de maxStock, on affiche 100% si on a du stock, ou 0 sinon
    stockPercentage = stockNumber > 0 ? 100 : 0;
  } else {
    stockPercentage = Math.round((stockNumber / maxStockNumber) * 100);
  }

  // clamp entre 0 et 100
  if (!isFinite(stockPercentage)) stockPercentage = 0;
  stockPercentage = Math.max(0, Math.min(100, stockPercentage));

  const getStockColor = () => {
    if (stockPercentage >= 70) return 'bg-green-500';
    if (stockPercentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const categoryNames: { [key: string]: string } = {
    fruits: 'Fruits',
    legumes: 'Légumes',
    tubercules: 'Tubercules',
    cereales: 'Céréales',
    poissons: 'Poissons',
    viandes: 'Viandes',
  };

  const getCardBackground = () => {
    if (product.status === 'stock-faible') {
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200';
    }
    return 'bg-white border-gray-200';
  };

  return (
    <div className={`rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${getCardBackground()}`}>
      <div className="relative">
        {imageUrl ? (
          <img src={imageUrl} alt={product.name} className="w-full h-48 object-cover object-top" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-400">
            Chargement de l’image...
          </div>
        )}

        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.status === 'en-stock' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
            {product.status === 'en-stock' ? 'En stock' : 'Stock faible'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
          <span className="text-green-600 font-bold text-lg">{Number(product.price ?? 0).toLocaleString()} XAF</span>
        </div>

        <p className="text-sm text-gray-600 mb-3">{categoryNames[product.category] ?? product.category}</p>

        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Stock: {isNaN(stockNumber) ? '—' : stockNumber} unités</span>
            <span className={`font-medium ${stockChangeNumber >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stockChangeNumber >= 0 ? '+' : ''}
              {stockChangeNumber}% ce mois
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={stockPercentage}>
            <div
              className={`h-2 rounded-full ${getStockColor()}`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center pt-2 text-xs text-gray-500">
            <div>
              {maxStockDefined ? `Max: ${maxStockNumber}` : <span className="italic">maxStock non défini</span>}
            </div>
            <div>{maxStockDefined ? `${stockPercentage}%` : (stockNumber > 0 ? 'Disponible' : 'Rupture')}</div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="flex space-x-2">
              <button onClick={() => onEdit(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" aria-label="Editer le produit">
                <i className="ri-edit-line w-4 h-4 flex items-center justify-center" />
              </button>
              <button onClick={() => onDelete(product.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" aria-label="Supprimer le produit">
                <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center" />
              </button>
            </div>
            <button className="flex items-center space-x-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-sm">
              <i className="ri-eye-line w-4 h-4 flex items-center justify-center" />
              <span>Détails</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
