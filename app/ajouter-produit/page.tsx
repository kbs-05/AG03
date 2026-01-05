'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
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
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: '',
    category: '',
    prix: '',
    stock: '',
    quantity: '',
    unite: 'kg',
    published: true,
    description: ''
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  const stockInitial = parseInt(formData.stock, 10) || 0;
  const stockMinimum = Math.floor(stockInitial * 0.1);
  const statusPreview = stockInitial <= stockMinimum ? 'stock-faible' : 'en-stock';

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 5);
      const previews: string[] = [];

      filesArray.forEach((file) => {
        if (file.size > 5 * 1024 * 1024) {
          setError('Chaque image ne doit pas dépasser 5 Mo.');
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          previews.push(reader.result as string);
          if (previews.length === filesArray.length) {
            setImagePreviews(previews);
          }
        };
        reader.readAsDataURL(file);
      });

      setImageFiles(filesArray);
      setError(null);
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

      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadImageToStorage(file);
        uploadedUrls.push(url);
      }

      const mainImageUrl = uploadedUrls[0] || '';
      const galleryImages = uploadedUrls.slice(1);

      const categoryId = formData.category;
      const selectedCategory = categories.find((cat) => cat.id === categoryId);
      const categoryName = selectedCategory?.name || categoryId;

      const maxStock = stock;
      const stockMinimum = Math.floor(maxStock * 0.1);
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
        imageUrl: mainImageUrl,
        images: galleryImages,
        status,
        published: formData.published,
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
        description: ''
      });
      setImageFiles([]);
      setImagePreviews([]);
    } catch (err: any) {
      console.error('Erreur ajout produit:', err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header avec bouton retour */}
            <div className="mb-6 md:mb-8">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Retour
              </button>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Ajouter un nouveau produit</h1>
                  <p className="text-gray-600 mt-2">
                    Remplissez les informations ci-dessous pour ajouter un produit.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span>Statut: {statusPreview === 'en-stock' ? 'En stock' : 'Stock faible'}</span>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section Images */}
                  <div className="border-b pb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Images du produit</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG jusqu'à 5 Mo (max 5 images)</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handleFilesChange} 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      {imagePreviews.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Aperçu des images ({imagePreviews.length}/5)</p>
                          <div className="flex flex-wrap gap-3">
                            {imagePreviews.map((src, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={src}
                                  alt={`Aperçu ${index + 1}`}
                                  className="h-24 w-24 object-cover rounded-xl shadow-md"
                                />
                                {index === 0 && (
                                  <span className="absolute top-1 left-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                                    Principale
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section Informations */}
                  <div className="border-b pb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations du produit</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nom */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Nom du produit *</label>
                        <input
                          type="text"
                          name="nom"
                          value={formData.nom}
                          onChange={handleChange}
                          required
                          placeholder="Ex: Pommes Golden Bio"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                      </div>

                      {/* Catégorie */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Catégorie *</label>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        >
                          <option value="">Sélectionner une catégorie</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} - {cat.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Prix */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Prix de vente (FCFA) *</label>
                        <div className="relative">
                          <input
                            type="number"
                            name="prix"
                            value={formData.prix}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          />
                          <div className="absolute right-3 top-3 text-gray-500">FCFA</div>
                        </div>
                      </div>

                      {/* Unité */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Unité de vente</label>
                        <select
                          name="unite"
                          value={formData.unite}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        >
                          <option value="kg">Kilogramme (kg)</option>
                          <option value="g">Gramme (g)</option>
                          <option value="l">Litre (l)</option>
                          <option value="pièce">Unité</option>
                          <option value="sac">Sac</option>
                        </select>
                      </div>

                      {/* Stock */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Stock initial *</label>
                        <input
                          type="number"
                          name="stock"
                          value={formData.stock}
                          onChange={handleChange}
                          required
                          min="0"
                          placeholder="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                        {stockInitial > 0 && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Stock minimum (10%):</span>
                              <span className="font-medium">{stockMinimum} {formData.unite}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className={`w-2 h-2 rounded-full ${statusPreview === 'en-stock' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="text-sm">{statusPreview === 'en-stock' ? '✅ En stock' : '⚠️ Stock faible'}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Quantité vente */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Quantité mise en vente *</label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          required
                          min="0"
                          placeholder="0"
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Cette quantité sera disponible pour les commandes.
                        </p>
                      </div>

                      {/* Statut publication */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Statut de publication</label>
                        <select
                          name="published"
                          value={formData.published ? 'true' : 'false'}
                          onChange={(e) => setFormData({ ...formData, published: e.target.value === 'true' })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        >
                          <option value="true">🟢 Publié</option>
                          <option value="false">🔴 Masqué</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section Description */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                    <div className="space-y-2">
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={5}
                        maxLength={500}
                        placeholder="Décrivez votre produit en détail..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Maximum 500 caractères</span>
                        <span>{formData.description.length}/500</span>
                      </div>
                    </div>
                  </div>

                  {/* Erreur */}
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-700 font-medium">⚠️ {error}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
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
                        setImageFiles([]);
                        setImagePreviews([]);
                      }}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Effacer le formulaire
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Ajout en cours...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Ajouter le produit
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}