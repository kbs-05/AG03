'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
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
}

export default function ProductsGrid({ searchTerm, selectedCategory }: ProductsGridProps) {
  const [products, setProducts] = useState<(Product & { categoryId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product & { categoryId: string } | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);
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
    setEditPublished(product.published ?? true);
    setEditDiscount(product.discount ?? null);
    setNewImageFile(null);
  };

  const handleDelete = async (product: Product & { categoryId: string }) => {
    if (!product.id || !product.categoryId) return;
    if (!confirm(`Voulez-vous vraiment supprimer ${product.nom} ?`)) return;

    try {
      // Supprimer le produit
      await deleteDoc(doc(db, 'categories', product.categoryId, 'produits', product.id));
      
      // Mettre à jour le compteur nombreProduits dans la catégorie
      const categoryRef = doc(db, 'categories', product.categoryId);
      await updateDoc(categoryRef, {
        nombreProduits: increment(-1),
        updatedAt: serverTimestamp(),
      });

      // Mettre à jour l'état local
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      alert('Produit supprimé avec succès');
    } catch (error) {
      alert('Erreur lors de la suppression du produit');
      console.error(error);
    }
  };

  const saveEdit = async () => {
    if (!editingProduct || !editingProduct.id || !editingProduct.categoryId) {
      alert('Impossible de mettre à jour : données manquantes.');
      return;
    }

    if (editName.trim() === '') {
      alert('Le nom du produit est obligatoire.');
      return;
    }
    if (editPrice < 0) {
      alert('Le prix doit être positif.');
      return;
    }
    if (editStock < 0) {
      alert('Le stock doit être positif.');
      return;
    }
    if (editDiscount !== null && (editDiscount < 0 || editDiscount > 100)) {
      alert('Le rabais doit être compris entre 0 et 100%.');
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
      alert('Produit mis à jour !');
      setEditingProduct(null);
    } catch (error) {
      alert('Erreur lors de la mise à jour');
      console.error(error);
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
      alert('Rabais supprimé avec succès !');
    } catch (error) {
      alert('Erreur lors de la suppression du rabais');
      console.error(error);
    }
  };

  if (loading) return <p className="text-gray-600 text-lg">Chargement des produits...</p>;
  if (filteredProducts.length === 0) return <p className="text-gray-600 text-lg">Aucun produit trouvé.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onEdit={() => handleEdit(product)}
          onDelete={() => handleDelete(product)}
        />
      ))}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-extrabold text-green-custom mb-6">Modifier le produit</h2>

            <label className="block mb-2 text-base font-extrabold text-green-custom">Nom</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border px-4 py-3 rounded mb-6 focus:ring-2 focus:ring-green-custom"
            />

            <label className="block mb-2 text-base font-extrabold text-green-custom">Prix (XAF)</label>
            <input
              type="number"
              value={isNaN(editPrice) ? '' : editPrice}
              onChange={(e) => setEditPrice(e.target.value === '' ? NaN : parseFloat(e.target.value))}
              min={0}
              step={0.01}
              className="w-full border px-4 py-3 rounded mb-6 focus:ring-2 focus:ring-green-custom"
            />

            <label className="block mb-2 text-base font-extrabold text-green-custom">Stock</label>
            <input
              type="number"
              value={isNaN(editStock) ? '' : editStock}
              onChange={(e) => setEditStock(e.target.value === '' ? NaN : parseInt(e.target.value, 10))}
              min={0}
              className="w-full border px-4 py-3 rounded mb-6 focus:ring-2 focus:ring-green-custom"
            />

            <label className="block mb-2 text-base font-extrabold text-green-custom">Rabais (%)</label>
            <div className="flex items-center space-x-3 mb-6">
              <select
                value={editDiscount !== null ? editDiscount.toString() : ''}
                onChange={(e) => setEditDiscount(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                className="w-full border px-4 py-3 rounded focus:ring-2 focus:ring-green-custom"
              >
                <option value="">Aucun rabais</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
                <option value="30">30%</option>
                <option value="40">40%</option>
                <option value="50">50%</option>
              </select>
              {editDiscount !== null && (
                <button
                  onClick={handleRemoveDiscount}
                  className="p-2 bg-dark-gray text-white rounded-lg hover:bg-green-500 transition-all duration-300"
                  aria-label="Supprimer le rabais"
                >
                  <i className="ri-delete-bin-line w-5 h-5 flex items-center justify-center" />
                </button>
              )}
            </div>

            <label className="block mb-2 text-base font-extrabold text-green-custom">Publié</label>
            <select
              value={editPublished ? 'true' : 'false'}
              onChange={(e) => setEditPublished(e.target.value === 'true')}
              className="w-full border px-4 py-3 rounded mb-6 focus:ring-2 focus:ring-green-custom"
            >
              <option value="true">Oui</option>
              <option value="false">Non</option>
            </select>

            <label className="block mb-2 text-base font-extrabold text-green-custom">Nouvelle image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImageFile(e.target.files ? e.target.files[0] : null)}
              className="w-full mb-6"
            />

            <div className="flex justify-end space-x-6">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-6 py-3 border rounded bg-dark-gray text-white hover:bg-gray-700 transition-all duration-300"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                className="px-6 py-3 rounded bg-green-500 text-white hover:bg-green-600 transition-all duration-300"
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