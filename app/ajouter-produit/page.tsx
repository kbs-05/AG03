'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import { db } from '@/lib/firebase';
import {
  doc,
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { uploadImageToStorage } from '@/src/lib/firebase/uploadImageToStorage';

export default function AjouterProduitPage() {
  const [formData, setFormData] = useState({
    nom: '',
    category: '',
    prix: '',
    stock: '',
    quantity: '',
    unite: 'kg',
    published: true, // Ajout du champ published
    description: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'fruits', name: 'Fruits', description: 'Fruits frais et bio' },
    { id: 'legumes', name: 'Légumes', description: 'Légumes de saison' },
    { id: 'confitures', name: 'Confitures', description: 'Confitures artisanales' },
    { id: 'poissons', name: 'Poissons', description: 'Produits de la mer' },
    { id: 'viandes', name: 'Viandes', description: 'Viandes locales' },
    { id: 'boissons', name: 'Boissons', description: 'Boissons naturelles' },
  ];

  // Calculs pour la prévisualisation
  const stockInitial = parseInt(formData.stock, 10) || 0;
  const stockMinimum = Math.floor(stockInitial * 0.1);
  const statusPreview = stockInitial <= stockMinimum ? 'stock-faible' : 'en-stock';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const prix = parseFloat(formData.prix);
      const stock = parseInt(formData.stock, 10);
      const quantity = parseInt(formData.quantity, 10);

      if (isNaN(prix) || prix < 0 || isNaN(stock) || stock < 0 || isNaN(quantity) || quantity < 0) {
        throw new Error('Veuillez remplir correctement les champs numériques.');
      }

      if (quantity > stock) {
        throw new Error('La quantité mise en vente ne peut pas dépasser le stock initial.');
      }

      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile);
      }

      const categoryId = formData.category;
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      const categoryName = selectedCategory?.name || categoryId;

      // Calculer stockMinimum (10% de maxStock)
      const maxStock = stock;
      const stockMinimum = Math.floor(maxStock * 0.1);
      // Définir status
      const status = stock <= stockMinimum ? 'stock-faible' : 'en-stock';

      const newProduct = {
        nom: formData.nom,
        prix,
        category: categoryName,
        stock,
        maxStock,
        stockMinimum,
        description: formData.description,
        quantity,
        unite: formData.unite,
        imageUrl,
        status,
        published: formData.published, // Ajout du champ published
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const categoryRef = doc(db, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      if (!categorySnap.exists()) {
        await setDoc(categoryRef, {
          nom: categoryName,
          nombreProduits: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(categoryRef, {
          nombreProduits: increment(1),
          updatedAt: serverTimestamp(),
        });
      }

      await addDoc(collection(categoryRef, 'produits'), newProduct);

      alert('✅ Produit ajouté avec succès !');

      setFormData({
        nom: '',
        category: '',
        prix: '',
        stock: '',
        quantity: '',
        unite: 'kg',
        published: true,
        description:''
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Erreur ajout produit:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('La taille de l’image ne doit pas dépasser 5 Mo.');
        setImageFile(null);
        setImagePreview(null);
        return;
      }
      setImageFile(file);
      setError(null);

      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Ajouter un nouveau produit</h1>
            <p className="text-gray-600 mb-6">
              Remplissez les informations ci-dessous pour ajouter un produit. La quantité mise en vente sera utilisée pour les commandes.
            </p>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
              {/* Image */}
              <div>
                <label className="block text-sm font-medium mb-2">Image du produit</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
                {imagePreview && (
                  <img src={imagePreview} alt="Aperçu produit" className="mt-3 max-h-48 rounded-lg shadow" />
                )}
              </div>

              {/* Grille principale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom du produit</label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    placeholder="Nom du produit"
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Prix de vente</label>
                  <input
                    type="number"
                    name="prix"
                    value={formData.prix}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="Prix"
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Stock initial</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Stock"
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  />
                  {stockInitial > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Stock minimum (10%): {stockMinimum} {formData.unite} | Statut: {statusPreview === 'en-stock' ? 'En stock' : 'Stock faible'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Quantité mise en vente</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Quantité"
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Cette quantité sera utilisée pour les commandes.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Unité</label>
                  <select
                    name="unite"
                    value={formData.unite}
                    onChange={handleChange}
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  >
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="g">Gramme (g)</option>
                    <option value="l">Litre (l)</option>
                    <option value="pièce">Unité</option>
                    <option value="sac">Sac</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Publié</label>
                  <select
                    name="published"
                    value={formData.published ? 'true' : 'false'}
                    onChange={(e) => setFormData({ ...formData, published: e.target.value === 'true' })}
                    className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                  >
                    <option value="true">Oui</option>
                    <option value="false">Non</option>
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  placeholder="Description du produit"
                  className="border p-3 rounded w-full focus:ring-2 focus:ring-green-400"
                />
              </div>

              {error && <p className="text-red-600">{error}</p>}

              {/* Boutons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      nom: '',
                      category: '',
                      prix: '',
                      stock: '',
                      quantity: '',
                      unite: 'kg',
                      published: true,
                      description: ''
                    });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="px-6 py-2 rounded border hover:bg-gray-100"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  {loading ? 'Ajout...' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}