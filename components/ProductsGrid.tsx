'use client';

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import { db } from '@/lib/firebase';
import { Product } from '@/types/product'; // Import du type centralisé

import {
  collection,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore';

interface ProductsGridProps {
  searchTerm: string;
  selectedCategory: string;
}

export default function ProductsGrid({ searchTerm, selectedCategory }: ProductsGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal édition
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editStock, setEditStock] = useState<number>(0);

  useEffect(() => {
    setLoading(true);

    const productsRef = collection(db, 'products');
    const q =
      selectedCategory !== 'all'
        ? query(productsRef, where('category', '==', selectedCategory))
        : productsRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Product, 'id'>),
        }));
        setProducts(items);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur Firestore:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [selectedCategory]);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditPrice(product.price);
    setEditStock(product.stock);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;

    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts((prev) => prev.filter((p) => p.id !== id));
      alert('Produit supprimé avec succès');
    } catch (error) {
      alert('Erreur lors de la suppression du produit');
      console.error(error);
    }
  };

  const saveEdit = async () => {
    if (!editingProduct) return;

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

    try {
      await updateDoc(doc(db, 'products', editingProduct.id), {
        name: editName,
        price: editPrice,
        stock: editStock,
      });
      alert('Produit mis à jour !');
      setEditingProduct(null);
    } catch (error) {
      alert('Erreur lors de la mise à jour');
      console.error(error);
    }
  };

  if (loading) return <p>Chargement des produits...</p>;
  if (filteredProducts.length === 0) return <p>Aucun produit trouvé.</p>;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product} // imageUrl est déjà dans product
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Modal d'édition */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">Modifier le produit</h2>

            <label className="block mb-2 font-medium">Nom</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2 font-medium">Prix (XAF)</label>
            <input
              type="number"
              value={isNaN(editPrice) ? '' : editPrice}
              onChange={(e) => {
                const val = e.target.value;
                setEditPrice(val === '' ? NaN : parseFloat(val));
              }}
              min={0}
              step={0.01}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2 font-medium">Stock</label>
            <input
              type="number"
              value={isNaN(editStock) ? '' : editStock}
              onChange={(e) => {
                const val = e.target.value;
                setEditStock(val === '' ? NaN : parseInt(val, 10));
              }}
              min={0}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border rounded"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
