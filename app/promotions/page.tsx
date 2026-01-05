'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// === STRUCTURE POUR ACTUALITÉS / PUBLICITÉS ===
interface NewsItem {
  id: string;

  // champs style "carte" (comme sur l'image)
  badge: string;         // ex: "-20%" ou "Nouveau"
  badgeBg: string;       // ex: "bg-red-50"
  badgeText: string;     // ex: "text-red-500"
  subtext: string;       // ex: "Offre limitée"
  title: string;         // ex: "Offre de la semaine !"
  description: string;   // ex: "Profitez de -20% ..."
  buttonText: string;    // ex: "En profiter"
  icon: string;          // ex: "arrow-forward-outline"
  backgroundUrl: string; // URL de l'image de fond
  // meta
  type: 'news' | 'advertisement';        // pour filtrer côté app
  isPublished: boolean;                  // visible côté client ?
  createdAt?: any;
}

// -------------------- Helpers --------------------
const formatDateDisplay = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return (dateStr as any)?.toLocaleDateString ? (dateStr as any).toLocaleDateString() : String(dateStr);
    return d.toLocaleDateString();
  } catch {
    return String(dateStr);
  }
};

// -------------------- Component --------------------
export default function NewsPage() {
  const [activeTab, setActiveTab] = useState<'news'>('news');

  // --- News / Advertisements (structure de l'image) ---
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({
    badge: '',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-500',
    subtext: '',
    title: '',
    description: '',
    buttonText: '',
    icon: 'arrow-forward-outline',
    backgroundUrl: '',
    type: 'news' as 'news' | 'advertisement',
    isPublished: true,
  });

  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [editNewsData, setEditNewsData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLoadingNews(true);
    const newsRef = collection(db, 'news');
    const unsubscribe = onSnapshot(
      newsRef,
      (snapshot) => {
        const items: NewsItem[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            badge: data.badge ?? '',
            badgeBg: data.badgeBg ?? 'bg-gray-100',
            badgeText: data.badgeText ?? 'text-gray-800',
            subtext: data.subtext ?? '',
            title: data.title ?? '',
            description: data.description ?? '',
            buttonText: data.buttonText ?? '',
            icon: data.icon ?? 'arrow-forward-outline',
            backgroundUrl: data.backgroundUrl ?? '',
            type: data.type ?? 'news',
            isPublished: data.isPublished ?? false,
            createdAt: data.createdAt ?? null,
          };
        });
        setNews(items);
        setLoadingNews(false);
      },
      (error) => {
        console.error('Erreur chargement actualités:', error);
        setLoadingNews(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Fonction pour uploader une image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploading(true);
    try {
      // Créer une référence unique pour le fichier
      const timestamp = Date.now();
      const fileName = `news/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Uploader le fichier
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Mettre à jour le formulaire avec l'URL
      if (editNewsId && editNewsData) {
        setEditNewsData({ ...editNewsData, backgroundUrl: downloadURL });
      } else {
        setNewsForm({ ...newsForm, backgroundUrl: downloadURL });
      }

      alert('Image uploadée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsForm.title || !newsForm.description) {
      alert('Titre et description requis.');
      return;
    }

    try {
      await addDoc(collection(db, 'news'), {
        badge: newsForm.badge,
        badgeBg: newsForm.badgeBg,
        badgeText: newsForm.badgeText,
        subtext: newsForm.subtext,
        title: newsForm.title,
        description: newsForm.description,
        buttonText: newsForm.buttonText,
        icon: newsForm.icon,
        backgroundUrl: newsForm.backgroundUrl,
        type: newsForm.type,
        isPublished: newsForm.isPublished,
        createdAt: serverTimestamp(),
      } as any);

      setShowNewsForm(false);
      setNewsForm({
        badge: '',
        badgeBg: 'bg-red-50',
        badgeText: 'text-red-500',
        subtext: '',
        title: '',
        description: '',
        buttonText: '',
        icon: 'arrow-forward-outline',
        backgroundUrl: '',
        type: 'news',
        isPublished: true,
      });
    } catch (error) {
      console.error('Erreur création actualité:', error);
      alert("Erreur lors de la création de l'actualité/publicité.");
    }
  };

  const startEditNews = (n: NewsItem) => {
    setEditNewsId(n.id);
    setEditNewsData({
      badge: n.badge,
      badgeBg: n.badgeBg,
      badgeText: n.badgeText,
      subtext: n.subtext,
      title: n.title,
      description: n.description,
      buttonText: n.buttonText,
      icon: n.icon,
      backgroundUrl: n.backgroundUrl,
      type: n.type,
      isPublished: n.isPublished,
    });
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNewsId || !editNewsData) return;
    try {
      const ref = doc(db, 'news', editNewsId);
      await updateDoc(ref, {
        ...editNewsData,
      } as any);
      setEditNewsId(null);
      setEditNewsData(null);
    } catch (error) {
      console.error('Erreur mise à jour actualité:', error);
      alert("Erreur lors de la mise à jour de l'actualité/publicité.");
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!confirm("Supprimer cette actualité/publicité ?")) return;
    try {
      await deleteDoc(doc(db, 'news', id));
    } catch (error) {
      console.error('Erreur suppression actualité:', error);
      alert("Impossible de supprimer l'actualité.");
    }
  };

  const togglePublishNews = async (n: NewsItem) => {
    try {
      await updateDoc(doc(db, 'news', n.id), { isPublished: !n.isPublished } as any);
    } catch (error) {
      console.error('Erreur changement statut publication:', error);
      alert("Impossible de modifier le statut de publication.");
    }
  };

  // --- UI ---
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Actualités & Publicités</h1>
                <p className="text-gray-600 mt-2">Ajoutez des informations, annonces ou publicités visibles depuis l'application client.</p>
              </div>

              <div>
                <button onClick={() => setShowNewsForm(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium">
                  <i className="ri-add-line"></i>
                  <span>Nouvelle actualité</span>
                </button>
              </div>
            </div>

            {/* Create news form */}
            {showNewsForm && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Créer une actualité / publicité</h2>
                  <button onClick={() => setShowNewsForm(false)} className="text-gray-400 hover:text-gray-600"><i className="ri-close-line"></i></button>
                </div>

                <form onSubmit={handleNewsSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Badge (ex: -20% / Nouveau)" value={newsForm.badge} onChange={(e) => setNewsForm({ ...newsForm, badge: e.target.value })} className="border rounded px-3 py-2" />

                  <input type="text" placeholder="Classe Tailwind badgeBg (ex: bg-red-50)" value={newsForm.badgeBg} onChange={(e) => setNewsForm({ ...newsForm, badgeBg: e.target.value })} className="border rounded px-3 py-2" />

                  <input type="text" placeholder="Classe Tailwind badgeText (ex: text-red-500)" value={newsForm.badgeText} onChange={(e) => setNewsForm({ ...newsForm, badgeText: e.target.value })} className="border rounded px-3 py-2" />

                  <input type="text" placeholder="Sous-texte (ex: Offre limitée)" value={newsForm.subtext} onChange={(e) => setNewsForm({ ...newsForm, subtext: e.target.value })} className="border rounded px-3 py-2" />

                  <input type="text" placeholder="Titre" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} className="border rounded px-3 py-2" required />

                  <select value={newsForm.type} onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value as any })} className="border rounded px-3 py-2">
                    <option value="news">Actualité</option>
                    <option value="advertisement">Publicité</option>
                  </select>

                  <textarea placeholder="Description" value={newsForm.description} onChange={(e) => setNewsForm({ ...newsForm, description: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" required />

                  <input type="text" placeholder="Texte du bouton (ex: En profiter)" value={newsForm.buttonText} onChange={(e) => setNewsForm({ ...newsForm, buttonText: e.target.value })} className="border rounded px-3 py-2" required />

                  <input type="text" placeholder="Icône (ex: arrow-forward-outline)" value={newsForm.icon} onChange={(e) => setNewsForm({ ...newsForm, icon: e.target.value })} className="border rounded px-3 py-2" />

                  {/* Bouton pour uploader une image */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de fond
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <i className="ri-image-add-line mr-2"></i>
                        {uploading ? 'Upload en cours...' : 'Choisir une image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {newsForm.backgroundUrl && (
                        <span className="text-sm text-green-600 flex items-center">
                          <i className="ri-checkbox-circle-line mr-1"></i>
                          Image sélectionnée
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formats supportés: JPG, PNG, WebP (max. 5MB)
                    </p>
                  </div>

                  {/* Champ URL manuelle (optionnel) */}
                  <div className="md:col-span-2">
                    <input 
                      type="url" 
                      placeholder="Ou coller une URL d'image (optionnel)" 
                      value={newsForm.backgroundUrl} 
                      onChange={(e) => setNewsForm({ ...newsForm, backgroundUrl: e.target.value })} 
                      className="border rounded px-3 py-2 w-full" 
                    />
                  </div>

                  <label className="inline-flex items-center space-x-2 md:col-span-2">
                    <input type="checkbox" checked={newsForm.isPublished} onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })} />
                    <span>Publié</span>
                  </label>

                  {/* Aperçu de l'image de fond */}
                  {newsForm.backgroundUrl && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de la carte :</p>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div 
                          className="bg-gradient-to-r from-green-500 rounded-md shadow-lg border border-green-500 overflow-hidden max-w-sm mx-auto bg-cover bg-center h-32"
                          style={{ backgroundImage: `url(${newsForm.backgroundUrl})` }}
                        >
                          <div className="bg-black/40 backdrop-blur-sm h-full flex items-center justify-center p-4">
                            <div className="text-center text-white">
                              <span className="text-sm font-medium">{newsForm.title || 'Votre titre ici'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 flex justify-end">
                    <button 
                      type="submit" 
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      disabled={uploading}
                    >
                      {uploading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit news inline */}
            {editNewsId && editNewsData && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Modifier actualité / publicité</h2>
                  <button onClick={() => { setEditNewsId(null); setEditNewsData(null); }} className="text-gray-400 hover:text-gray-600"><i className="ri-close-line"></i></button>
                </div>

                <form onSubmit={handleUpdateNews} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Badge" value={editNewsData.badge} onChange={(e) => setEditNewsData({ ...editNewsData, badge: e.target.value })} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="badgeBg" value={editNewsData.badgeBg} onChange={(e) => setEditNewsData({ ...editNewsData, badgeBg: e.target.value })} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="badgeText" value={editNewsData.badgeText} onChange={(e) => setEditNewsData({ ...editNewsData, badgeText: e.target.value })} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Sous-texte" value={editNewsData.subtext} onChange={(e) => setEditNewsData({ ...editNewsData, subtext: e.target.value })} className="border rounded px-3 py-2" />
                  <input type="text" placeholder="Titre" value={editNewsData.title} onChange={(e) => setEditNewsData({ ...editNewsData, title: e.target.value })} className="border rounded px-3 py-2" required />
                  <select value={editNewsData.type} onChange={(e) => setEditNewsData({ ...editNewsData, type: e.target.value })} className="border rounded px-3 py-2">
                    <option value="news">Actualité</option>
                    <option value="advertisement">Publicité</option>
                  </select>
                  <textarea placeholder="Description" value={editNewsData.description} onChange={(e) => setEditNewsData({ ...editNewsData, description: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" required />
                  <input type="text" placeholder="Texte du bouton" value={editNewsData.buttonText} onChange={(e) => setEditNewsData({ ...editNewsData, buttonText: e.target.value })} className="border rounded px-3 py-2" required />
                  <input type="text" placeholder="Icône" value={editNewsData.icon} onChange={(e) => setEditNewsData({ ...editNewsData, icon: e.target.value })} className="border rounded px-3 py-2" />
                  
                  {/* Bouton pour uploader une image (édition) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de fond
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <i className="ri-image-add-line mr-2"></i>
                        {uploading ? 'Upload en cours...' : 'Changer l\'image'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                      {editNewsData.backgroundUrl && (
                        <span className="text-sm text-green-600 flex items-center">
                          <i className="ri-checkbox-circle-line mr-1"></i>
                          Image sélectionnée
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Formats supportés: JPG, PNG, WebP (max. 5MB)
                    </p>
                  </div>

                  {/* Champ URL manuelle (optionnel) */}
                  <div className="md:col-span-2">
                    <input 
                      type="url" 
                      placeholder="Ou coller une URL d'image" 
                      value={editNewsData.backgroundUrl} 
                      onChange={(e) => setEditNewsData({ ...editNewsData, backgroundUrl: e.target.value })} 
                      className="border rounded px-3 py-2 w-full" 
                    />
                  </div>

                  <label className="inline-flex items-center space-x-2 md:col-span-2">
                    <input type="checkbox" checked={editNewsData.isPublished} onChange={(e) => setEditNewsData({ ...editNewsData, isPublished: e.target.checked })} />
                    <span>Publié</span>
                  </label>

                  {/* Aperçu de l'image de fond */}
                  {editNewsData.backgroundUrl && (
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700 mb-2">Aperçu de la carte :</p>
                      <div className="bg-gray-100 rounded-lg p-4">
                        <div 
                          className="bg-gradient-to-r from-green-500 rounded-md shadow-lg border border-green-500 overflow-hidden max-w-sm mx-auto bg-cover bg-center h-32"
                          style={{ backgroundImage: `url(${editNewsData.backgroundUrl})` }}
                        >
                          <div className="bg-black/40 backdrop-blur-sm h-full flex items-center justify-center p-4">
                            <div className="text-center text-white">
                              <span className="text-sm font-medium">{editNewsData.title || 'Votre titre ici'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2 flex justify-end space-x-2">
                    <button type="button" onClick={() => { setEditNewsId(null); setEditNewsData(null); }} className="px-4 py-2 border rounded">Annuler</button>
                    <button 
                      type="submit" 
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                      disabled={uploading}
                    >
                      {uploading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* News list */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                {loadingNews ? (
                  <p className="p-6">Chargement des actualités...</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publié</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {news.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">Aucune actualité disponible.</td>
                        </tr>
                      )}

                      {news.map((n) => (
                        <tr key={n.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={`inline-flex px-2 py-1 rounded ${n.badgeBg} ${n.badgeText}`}>{n.badge || '-'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{n.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{n.type === 'news' ? 'Actualité' : 'Publicité'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {n.backgroundUrl ? (
                              <div className="w-10 h-10 bg-cover bg-center rounded border" style={{ backgroundImage: `url(${n.backgroundUrl})` }}></div>
                            ) : (
                              <span className="text-gray-400">Aucune</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{n.isPublished ? 'Oui' : 'Non'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{n.createdAt ? formatDateDisplay(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt) : '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button onClick={() => startEditNews(n)} className="text-blue-600 hover:text-blue-700"><i className="ri-edit-line"></i></button>
                              <button onClick={() => handleDeleteNews(n.id)} className="text-red-600 hover:text-red-700"><i className="ri-delete-bin-line"></i></button>
                              <button onClick={() => togglePublishNews(n)} className="text-gray-700 hover:text-gray-900">{n.isPublished ? 'Retirer' : 'Publier'}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}