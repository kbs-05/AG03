'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

import { db, storage } from '@/lib/firebase'; // Assure-toi que storage est exporté ici
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AjouterProduitPage() {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    description: '',
    supplier: '',
    unit: 'kg',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Conversion et validation des champs numériques
      const price = parseFloat(formData.price);
      const cost = parseFloat(formData.cost);
      const stock = parseInt(formData.stock, 10);
      const minStock = parseInt(formData.minStock, 10);

      if (
        isNaN(price) ||
        isNaN(cost) ||
        isNaN(stock) ||
        isNaN(minStock)
      ) {
        throw new Error('Veuillez remplir correctement les champs numériques.');
      }

      // Upload image si elle existe
      let imageUrl = '';
      if (imageFile) {
        const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const newProduct = {
        name: formData.name,
        category: formData.category,
        price,
        cost,
        stock,
        minStock,
        description: formData.description,
        supplier: formData.supplier,
        unit: formData.unit,
        imageUrl, // URL de l'image stockée
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'products'), newProduct);

      alert('Produit ajouté avec succès !');

      // Reset formulaire + image
      setFormData({
        name: '',
        category: '',
        price: '',
        cost: '',
        stock: '',
        minStock: '',
        description: '',
        supplier: '',
        unit: 'kg',
      });
      setImageFile(null);
    } catch (err: any) {
      console.error('Erreur ajout produit:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const categories = [
    { id: 'fruits', name: 'Fruits' },
    { id: 'legumes', name: 'Légumes' },
    { id: 'tubercules', name: 'Tubercules' },
    { id: 'cereales', name: 'Céréales' },
    { id: 'poissons', name: 'Poissons' },
    { id: 'viandes', name: 'Viandes' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Ajouter un nouveau produit
              </h1>
              <p className="text-gray-600 mt-2">
                Remplissez les informations ci-dessous pour ajouter un produit
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              {/* Champ Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image du produit
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                {imageFile && (
                  <p className="mt-2 text-sm text-gray-700">
                    Image sélectionnée : {imageFile.name}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du produit *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Bananes plantains"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix de vente (XAF) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 3500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coût d'achat (XAF) *
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 2500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock initial *
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock minimum *
                  </label>
                  <input
                    type="number"
                    name="minStock"
                    value={formData.minStock}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: 10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unité de mesure *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                  >
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="g">Gramme (g)</option>
                    <option value="l">Litre (l)</option>
                    <option value="pièce">Pièce</option>
                    <option value="sac">Sac</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: Ferme Mbolo"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Description du produit..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/500 caractères
                </p>
              </div>

              {error && (
                <p className="mt-4 text-red-600 font-medium">{error}</p>
              )}

              <div className="mt-8 flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium whitespace-nowrap cursor-pointer"
                  disabled={loading}
                  onClick={() =>
                    {
                      setFormData({
                        name: '',
                        category: '',
                        price: '',
                        cost: '',
                        stock: '',
                        minStock: '',
                        description: '',
                        supplier: '',
                        unit: 'kg',
                      });
                      setImageFile(null);
                    }
                  }
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap cursor-pointer"
                  disabled={loading}
                >
                  {loading ? 'Ajout en cours...' : 'Ajouter le produit'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
