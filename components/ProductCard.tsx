'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Product } from '@/types/product';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

interface ProductCardProps {
  product: Product & { id?: string; categoryId?: string };
  onEdit: (product: Product) => void;
  onDelete: (id: string, categoryId?: string) => Promise<void>;
}

export default function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(product.imageUrl ?? null);

  // Synchronise l'image si elle change
  useEffect(() => {
    setImageUrl(product.imageUrl ?? null);
  }, [product.imageUrl]);

  const stockNumber = useMemo(() => Number(product.stock ?? 0), [product.stock]);
  const maxStockNumber = useMemo(() => Number(product.maxStock ?? 0), [product.maxStock]);
  const stockMinimumNumber = useMemo(() => Number(product.stockMinimum ?? Math.floor(maxStockNumber * 0.1)), [product.stockMinimum, maxStockNumber]);
  const quantityNumber = useMemo(() => Number(product.quantity ?? 0), [product.quantity]);

  // Calculer le statut localement
  const calculatedStatus = useMemo(() => {
    return stockNumber <= stockMinimumNumber ? 'stock-faible' : 'en-stock';
  }, [stockNumber, stockMinimumNumber]);

  const stockPercentage = useMemo(() => {
    if (!maxStockNumber || maxStockNumber <= 0) return stockNumber > 0 ? 100 : 0;
    return Math.max(0, Math.min(100, Math.round((stockNumber / maxStockNumber) * 100)));
  }, [stockNumber, maxStockNumber]);

  const maxStockDefined = Boolean(maxStockNumber && maxStockNumber > 0);

  const getStockColor = () => {
    if (stockPercentage >= 70) return 'bg-green-500';
    if (stockPercentage >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Nom lisible pour la catégorie
  const categoryNames: Record<string, string> = {
    fruits: 'Fruits',
    legumes: 'Légumes',
    tubercules: 'Tubercules',
    cereales: 'Céréales',
    poissons: 'Poissons',
    viandes: 'Viandes',
    boissons: 'Boissons',
    confitures: 'Confitures',
  };

  const getCardBackground = () => {
    if (calculatedStatus === 'stock-faible') {
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200';
    }
    return 'bg-white border-gray-200';
  };

  // Fonction pour gérer la suppression avec mise à jour du nombre de produits
  const handleDelete = async () => {
    if (!product.id || !product.categoryId) return;

    try {
      // Appeler la fonction onDelete pour supprimer le produit
      await onDelete(product.id, product.categoryId);

      // Mettre à jour le champ nombreProduits dans la catégorie
      const categoryRef = doc(db, 'categories', product.categoryId);
      await updateDoc(categoryRef, {
        nombreProduits: increment(-1),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
    }
  };

  return (
    <div className={`rounded-lg border shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 ${getCardBackground()}`}>
      {/* Image */}
      <div className="relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.nom ?? 'Produit'}
            className="w-full h-64 object-cover object-top"
          />
        ) : (
          <div className="w-full h-64 flex items-center justify-center bg-gray-100 text-gray-400 text-base font-medium">
            Pas d’image disponible
          </div>
        )}

        {/* Statut */}
        <div className="absolute top-3 right-3">
          <span
            className={`px-3 py-1 text-sm font-semibold rounded-full ${
              calculatedStatus === 'en-stock' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
            }`}
          >
            {calculatedStatus === 'en-stock' ? 'En stock' : 'Stock faible'}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-extrabold text-green-custom text-xl">{product.nom ?? 'Nom non défini'}</h3>
          <span className="text-green-custom font-extrabold text-xl">
            {(Number(product.prix ?? 0)).toLocaleString()} XAF
          </span>
        </div>

        <p className="text-base font-extrabold text-green-custom mb-4">
          {categoryNames[product.category ?? ''] ?? product.category ?? 'Catégorie non définie'}
        </p>

        {/* Stock */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Stock: {isNaN(stockNumber) ? '—' : stockNumber} {product.unite ?? 'unités'}
            </span>
            <span className="text-gray-600">
              Quantité en vente: {isNaN(quantityNumber) ? '—' : quantityNumber} {product.unite ?? 'unités'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              Stock minimum: {isNaN(stockMinimumNumber) ? '—' : stockMinimumNumber} {product.unite ?? 'unités'}
            </span>
            <span className="text-gray-600">
              Rabais: {product.discount ?? 'Aucun rabais'}%
            </span>
          </div>

          <div
            className="w-full bg-gray-200 rounded-full h-3"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stockPercentage}
          >
            <div className={`h-3 rounded-full ${getStockColor()}`} style={{ width: `${stockPercentage}%` }} />
          </div>

          <div className="flex justify-between items-center pt-3 text-sm text-gray-500">
            <div>{maxStockDefined ? `Max: ${maxStockNumber}` : <span className="italic">maxStock non défini</span>}</div>
            <div>{maxStockDefined ? `${stockPercentage}%` : stockNumber > 0 ? 'Disponible' : 'Rupture'}</div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4">
            <div className="flex space-x-3">
              <button
                onClick={() => product.id && onEdit(product)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Éditer le produit"
              >
                <i className="ri-edit-line w-5 h-5 flex items-center justify-center" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                aria-label="Supprimer le produit"
              >
                <i className="ri-delete-bin-line w-5 h-5 flex items-center justify-center" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}