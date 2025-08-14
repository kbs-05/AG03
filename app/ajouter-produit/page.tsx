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
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    supplier: '',
    unit: 'kg',
    bio: false,
    origine: '',
    dateRecolte: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    { id: 'fruits', name: 'Fruits', description: 'Fruits frais et bio', imageUrl: '' },
    { id: 'legumes', name: 'Légumes', description: 'Légumes de saison', imageUrl: '' },
    { id: 'confitures', name: 'Confitures', description: 'Confitures artisanales', imageUrl: '' },
    { id: 'poissons', name: 'Poissons', description: 'Produits de la mer', imageUrl: '' },
    { id: 'viandes', name: 'Viandes', description: 'Viandes locales', imageUrl: '' },
    { id: 'boissons', name: 'Boissons', description: 'Boissons naturelles', imageUrl: '' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validation
      const price = parseFloat(formData.price);
      const stock = parseInt(formData.stock, 10);

      if (
        isNaN(price) || price < 0 ||
        isNaN(stock) || stock < 0
      ) {
        throw new Error('Veuillez remplir correctement les champs numériques.');
      }

      // Upload image si nécessaire
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await uploadImageToStorage(imageFile);
      }

      // Structure produit
      const newProduct = {
        nom: formData.name,
        description: formData.description,
        prix: price,
        unite: formData.unit,
        stock,
        bio: formData.bio,
        imageUrl,
        origine: formData.supplier || 'Gabon', // Par défaut "Gabon" si vide
        dateRecolte: formData.dateRecolte ? serverTimestamp() : null, // Timestamp si date fournie
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const categoryId = formData.category;
      const categoryRef = doc(db, 'categories', categoryId);
      const categorySnap = await getDoc(categoryRef);

      // Si la catégorie n’existe pas → création avec tous les champs
      if (!categorySnap.exists()) {
        const selectedCategory = categories.find((cat) => cat.id === categoryId);
        await setDoc(categoryRef, {
          nom: selectedCategory?.name || categoryId,
          nombreProduits: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Mise à jour du compteur
        await updateDoc(categoryRef, {
          nombreProduits: increment(1),
          updatedAt: serverTimestamp(),
        });
      }

      // Ajout du produit dans la sous-collection
      await addDoc(collection(categoryRef, 'produits'), newProduct);

      alert('✅ Produit ajouté avec succès !');

      // Reset
      setFormData({
        name: '',
        category: '',
        price: '',
        stock: '',
        description: '',
        supplier: '',
        unit: 'kg',
        bio: false,
        origine: '',
        dateRecolte: '',
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Ajouter un nouveau produit
            </h1>
            <p className="text-gray-600 mb-6">
              Remplissez les informations ci-dessous pour ajouter un produit
            </p>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
              {/* Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Image du produit</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {imagePreview && (
                  <img src={imagePreview} alt="Aperçu produit" className="mt-3 max-h-48" />
                )}
              </div>

              {/* Form principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Nom du produit"
                  className="border p-2 rounded"
                />

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded"
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  placeholder="Prix de vente"
                  min="0"
                  step="0.01"
                  className="border p-2 rounded"
                />

                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                  placeholder="Stock initial"
                  min="0"
                  className="border p-2 rounded"
                />

                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                  className="border p-2 rounded"
                >
                  <option value="kg">Kilogramme (kg)</option>
                  <option value="g">Gramme (g)</option>
                  <option value="l">Litre (l)</option>
                  <option value="pièce">Pièce</option>
                  <option value="sac">Sac</option>
                </select>

                <input
                  type="text"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="Origine (ex: Gabon)"
                  className="border p-2 rounded"
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="bio"
                    checked={formData.bio}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-sm font-medium">Produit bio</label>
                </div>

                <input
                  type="date"
                  name="dateRecolte"
                  value={formData.dateRecolte}
                  onChange={handleChange}
                  placeholder="Date de récolte"
                  className="border p-2 rounded"
                />
              </div>

              {/* Description */}
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                placeholder="Description"
                className="border p-2 rounded mt-6 w-full"
              />

              {error && <p className="text-red-600 mt-4">{error}</p>}

              {/* Boutons */}
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      name: '',
                      category: '',
                      price: '',
                      stock: '',
                      description: '',
                      supplier: '',
                      unit: 'kg',
                      bio: false,
                      origine: '',
                      dateRecolte: '',
                    });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="border px-6 py-2 rounded"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-6 py-2 rounded"
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