'use client';

import React, { useEffect, useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { Product } from '@/types/product';
import {
  collectionGroup,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProductsGridProps {
  searchTerm: string;
  selectedCategory: string;
  viewMode?: 'grid' | 'list';
}

export default function ProductsGrid({ searchTerm, selectedCategory, viewMode = 'grid' }: ProductsGridProps) {
  const [products, setProducts] = useState<(Product & { categoryId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product & { categoryId: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editUnite, setEditUnite] = useState<string>('');
  const [editPublished, setEditPublished] = useState<boolean>(true);
  const [editDiscount, setEditDiscount] = useState<number | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = collectionGroup(db, 'produits');

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allProducts: (Product & { categoryId: string })[] = [];

      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Product;
        const pathParts = docSnap.ref.path.split('/');
        const categoryIdIndex = pathParts.indexOf('categories') + 1;
        const categoryId = pathParts[categoryIdIndex];

        allProducts.push({ id: docSnap.id, categoryId, ...data });
      });

      let filtered = allProducts;
      if (selectedCategory !== 'all') {
        filtered = allProducts.filter((p) => p.categoryId === selectedCategory);
      }

      setProducts(filtered);
      setLoading(false);
    }, (err) => {
      console.error('Erreur produits:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedCategory]);

  const filteredProducts = products.filter((product) =>
    (product.nom ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product & { categoryId: string }) => {
    setEditingProduct(product);
    setEditName(product.nom ?? '');
    setEditPrice(product.prix ?? 0);
    setEditStock(product.stock ?? 0);
    setEditQuantity(product.quantity ?? 0);
    setEditUnite(product.unite ?? '');
    setEditPublished(product.published ?? true);
    setEditDiscount(product.discount ?? null);
    setNewImageFile(null);
  };

  const handleDelete = async (product: Product & { categoryId: string }) => {
    if (!product.id || !product.categoryId) return;
    if (!confirm(`Supprimer "${product.nom}" ?`)) return;

    try {
      await deleteDoc(doc(db, 'categories', product.categoryId, 'produits', product.id));
      
      const categoryRef = doc(db, 'categories', product.categoryId);
      await updateDoc(categoryRef, {
        nombreProduits: increment(-1),
        updatedAt: serverTimestamp(),
      });

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const saveEdit = async () => {
    if (!editingProduct || !editingProduct.id || !editingProduct.categoryId) return;

    if (editName.trim() === '') {
      alert('Nom du produit requis');
      return;
    }
    if (editPrice < 0) {
      alert('Prix doit être positif');
      return;
    }
    if (editStock < 0) {
      alert('Stock doit être positif');
      return;
    }
    if (editQuantity <= 0) {
      alert('Quantité > 0 requise');
      return;
    }

    try {
      const productRef = doc(db, 'categories', editingProduct.categoryId, 'produits', editingProduct.id);
      const stockMinimum = editingProduct.stockMinimum ?? Math.floor(editingProduct.maxStock * 0.1);
      const updatedStatus = editStock <= stockMinimum ? 'stock-faible' : 'en-stock';

      let updatedData: Partial<Product> = {
        nom: editName,
        prix: editPrice,
        stock: editStock,
        quantity: editQuantity,
        unite: editUnite,
        status: updatedStatus,
        published: editPublished,
        discount: editDiscount,
        updatedAt: new Date(),
      };

      if (newImageFile) {
        const imageRef = ref(storage, `products/${editingProduct.id}_${newImageFile.name}`);
        await uploadBytes(imageRef, newImageFile);
        const downloadURL = await getDownloadURL(imageRef);
        updatedData.imageUrl = downloadURL;
      }

      await updateDoc(productRef, updatedData);
      setEditingProduct(null);
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const handleRemoveDiscount = async () => {
    if (!editingProduct || !editingProduct.id || !editingProduct.categoryId) return;

    try {
      const productRef = doc(db, 'categories', editingProduct.categoryId, 'produits', editingProduct.id);
      await updateDoc(productRef, {
        discount: null,
        updatedAt: new Date(),
      });
      setEditDiscount(null);
    } catch (error) {
      console.error('Erreur suppression rabais:', error);
    }
  };

  const uniteOptions = [
    'pièce',
    'kg',
    'g',
    'L',
    'mL', 
    'paquet',
    'boîte',
    'sachet',
    'bouteille',
    'carton',
    'lot'
  ];

  const ProductCard = ({ product, onEdit, onDelete }: { 
    product: Product & { categoryId: string }, 
    onEdit: () => void, 
    onDelete: () => void 
  }) => {
    const [imageError, setImageError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const originalPrice = product.prix || 0;
    const discount = product.discount || 0;
    const finalPrice = discount > 0 
      ? Math.round(originalPrice * (100 - discount) / 100)
      : originalPrice;

    const stockStatus = product.status || 'en-stock';
    const stockPercentage = product.maxStock && product.stock 
      ? (product.stock / product.maxStock) * 100 
      : 100;

    return (
      <div 
        className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Header avec image et badges */}
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {/* Badge discount */}
          {discount > 0 && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
                <span className="text-sm">-{discount}%</span>
              </div>
            </div>
          )}

          {/* Badge catégorie */}
          <div className="absolute top-3 right-3 z-10">
            <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm">
              {product.category}
            </div>
          </div>

          {/* Image */}
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          ) : (
            <img
              src={product.imageUrl || '/placeholder.jpg'}
              alt={product.nom}
              className={`w-full h-full object-cover transition-transform duration-500 ${isHovered ? 'scale-105' : 'scale-100'}`}
              onError={() => setImageError(true)}
            />
          )}

          {/* Actions au hover */}
          {isHovered && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 transition-opacity duration-300">
              <button
                onClick={onEdit}
                className="bg-white p-3 rounded-full text-blue-600 hover:bg-blue-50 transition-all hover:scale-110"
                title="Modifier"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={onDelete}
                className="bg-white p-3 rounded-full text-red-600 hover:bg-red-50 transition-all hover:scale-110"
                title="Supprimer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Contenu */}
        <div className="p-5">
          {/* Nom et statut */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 truncate">{product.nom}</h3>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${stockStatus === 'en-stock' ? 'bg-green-500' : stockStatus === 'stock-faible' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-600 capitalize">
                  {stockStatus === 'en-stock' ? 'En stock' : stockStatus === 'stock-faible' ? 'Stock faible' : 'Rupture'}
                </span>
              </div>
            </div>
            <div className={`px-2 py-1 rounded text-xs font-bold ${product.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {product.published ? 'PUBLIÉ' : 'MASQUÉ'}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
          )}

          {/* Prix - Section mise en avant */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-end justify-between">
              <div>
                {discount > 0 ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">{finalPrice.toLocaleString()} FCFA</span>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">-{discount}%</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-gray-500 line-through">{originalPrice.toLocaleString()} FCFA</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-red-600 font-medium">
                        Économie: {(originalPrice - finalPrice).toLocaleString()} FCFA
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{originalPrice.toLocaleString()} FCFA</span>
                    <span className="text-sm text-gray-500">/ {product.quantity} {product.unite}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 mb-1">Vendu par</div>
                <div className="px-2 py-1 bg-white border rounded text-sm font-medium">{product.quantity} {product.unite}</div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Stock: {product.stock} {product.unite}</span>
              <span className="font-medium">{Math.round(stockPercentage)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${stockPercentage > 20 ? 'bg-green-500' : stockPercentage > 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(stockPercentage, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Infos bas */}
          <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {product.createdAt ? new Date(product.createdAt.seconds * 1000).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : 'N/A'}
              </span>
            </div>
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              ID: {product.id?.substring(0, 6)}...
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onEdit}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Supprimer"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <div className="h-7 w-48 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-2"></div>
        </div>
        <div className="h-10 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse"></div>
              <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse mt-3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (filteredProducts.length === 0) return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-100 rounded-full">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun produit</h3>
      <p className="text-gray-600">Modifiez vos critères de recherche</p>
    </div>
  );

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-medium text-gray-700">Produit</th>
              <th className="text-left p-4 font-medium text-gray-700">Prix</th>
              <th className="text-left p-4 font-medium text-gray-700">Stock</th>
              <th className="text-left p-4 font-medium text-gray-700">Statut</th>
              <th className="text-left p-4 font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProducts.map((product) => {
              const discount = product.discount || 0;
              const originalPrice = product.prix || 0;
              const finalPrice = discount > 0 
                ? Math.round(originalPrice * (100 - discount) / 100)
                : originalPrice;

              return (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          src={product.imageUrl || '/placeholder.jpg'} 
                          alt={product.nom}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        {discount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                            -{discount}%
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{product.nom}</div>
                        <div className="text-sm text-gray-500">{product.category} • {product.quantity} {product.unite}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-semibold text-gray-900">{finalPrice.toLocaleString()} FCFA</div>
                      {discount > 0 && (
                        <div className="text-sm text-gray-500 line-through">{originalPrice.toLocaleString()} FCFA</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${product.status === 'en-stock' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span>{product.stock} {product.unite}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${product.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {product.published ? 'Publié' : 'Masqué'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        {filteredProducts.length} produit(s) trouvé(s)
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={() => handleEdit(product)}
            onDelete={() => handleDelete(product)}
          />
        ))}
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Modifier produit</h2>
                  <p className="text-sm text-gray-600">{editingProduct.nom}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Nom du produit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prix (FCFA) *</label>
                  <input
                    type="number"
                    value={isNaN(editPrice) ? '' : editPrice}
                    onChange={(e) => setEditPrice(e.target.value === '' ? NaN : parseFloat(e.target.value))}
                    min={0}
                    step={0.01}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    value={isNaN(editStock) ? '' : editStock}
                    onChange={(e) => setEditStock(e.target.value === '' ? NaN : parseInt(e.target.value, 10))}
                    min={0}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantité vente *</label>
                  <input
                    type="number"
                    value={isNaN(editQuantity) ? '' : editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value === '' ? NaN : parseInt(e.target.value, 10))}
                    min={1}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unité</label>
                  <select
                    value={editUnite}
                    onChange={(e) => setEditUnite(e.target.value)}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner</option>
                    {uniteOptions.map((unite) => (
                      <option key={unite} value={unite}>{unite}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Promotion</label>
                  <div className="flex gap-3">
                    <select
                      value={editDiscount !== null ? editDiscount.toString() : ''}
                      onChange={(e) => setEditDiscount(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                      className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucune promotion</option>
                      {[5, 10, 15, 20, 25, 30, 40, 50].map(percent => (
                        <option key={percent} value={percent}>-{percent}%</option>
                      ))}
                    </select>
                    {editDiscount !== null && (
                      <button
                        onClick={handleRemoveDiscount}
                        className="px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nouvelle image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewImageFile(e.target.files ? e.target.files[0] : null)}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">Cliquez pour télécharger</p>
                      {newImageFile && (
                        <p className="text-sm text-blue-600 mt-1">{newImageFile.name}</p>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibilité</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editPublished}
                        onChange={() => setEditPublished(true)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Publié</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editPublished}
                        onChange={() => setEditPublished(false)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span>Masqué</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-6 py-3 border text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}