'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

// -------------------- Types --------------------
interface Promotion {
  id: string;
  name: string;
  product?: string | null;
  type: 'percentage' | 'fixed' | 'free_shipping';
  value?: number | null;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
  usageCount: number;
  maxUsage?: number | null;
  couponCode?: string | null;
  createdAt?: any;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  link?: string | null;
  type: 'news' | 'advertisement';
  isPublished: boolean;
  createdAt?: any;
}

// -------------------- Helpers --------------------
const computeStatus = (startDate?: string | null, endDate?: string | null) => {
  if (!startDate || !endDate) return 'scheduled';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();
  if (start <= now && end >= now) return 'active';
  if (start > now) return 'scheduled';
  return 'expired';
};

const generateCouponCode = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
};

const formatDateDisplay = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // already a simple string like '2025-08-10'
    return d.toLocaleDateString();
  } catch {
    return dateStr;
  }
};

// -------------------- Component --------------------
export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<'promotions' | 'news'>('promotions');

  // --- Promotions ---
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadingPromotions, setLoadingPromotions] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    product: '',
    type: 'percentage' as 'percentage' | 'fixed' | 'free_shipping',
    value: '',
    startDate: '',
    endDate: '',
    maxUsage: '',
    generateCode: false,
    code: '',
  });

  const [editPromotionId, setEditPromotionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>(null);

  const products = [
    'Bananes plantains',
    'Igname blanche',
    'Tomates fraîches',
    'Riz blanc',
    'Poisson fumé',
    'Tous les fruits',
    'Tous les légumes',
  ];

  useEffect(() => {
    setLoadingPromotions(true);
    const promotionsRef = collection(db, 'promotions');
    const unsubscribe = onSnapshot(
      promotionsRef,
      (snapshot) => {
        const items: Promotion[] = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name ?? '',
            product: data.product ?? null,
            type: data.type ?? 'percentage',
            value: data.value ?? null,
            startDate: data.startDate ?? '',
            endDate: data.endDate ?? '',
            status: data.status ?? computeStatus(data.startDate, data.endDate),
            usageCount: data.usageCount ?? 0,
            maxUsage: data.maxUsage ?? null,
            couponCode: data.couponCode ?? null,
            createdAt: data.createdAt ?? null,
          };
        });
        setPromotions(items);
        setLoadingPromotions(false);
      },
      (error) => {
        console.error('Erreur chargement promotions:', error);
        setLoadingPromotions(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // validation minimale
    if (!formData.name || !formData.startDate || !formData.endDate) {
      alert('Veuillez renseigner au moins le nom et la période.');
      return;
    }

    if (formData.type !== 'free_shipping' && (!formData.value || Number.isNaN(Number(formData.value)))) {
      alert('Veuillez saisir une valeur valide pour la remise.');
      return;
    }

    const status = computeStatus(formData.startDate, formData.endDate) as
      | 'active'
      | 'scheduled'
      | 'expired';

    const couponCode = formData.generateCode ? (formData.code || generateCouponCode()) : formData.code || null;

    const newPromotion: any = {
      name: formData.name,
      product: formData.product || null,
      type: formData.type,
      value: formData.type !== 'free_shipping' ? Number(formData.value) : null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      status,
      usageCount: 0,
      maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null,
      couponCode,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'promotions'), newPromotion);
      setShowCreateForm(false);
      setFormData({
        name: '',
        product: '',
        type: 'percentage',
        value: '',
        startDate: '',
        endDate: '',
        maxUsage: '',
        generateCode: false,
        code: '',
      });
    } catch (error) {
      console.error('Erreur création promotion:', error);
      alert("Erreur lors de la création de la promotion.");
    }
  };

  const startEditPromotion = (p: Promotion) => {
    setEditPromotionId(p.id);
    setEditFormData({
      name: p.name,
      product: p.product ?? '',
      type: p.type,
      value: p.value ?? '',
      startDate: p.startDate,
      endDate: p.endDate,
      maxUsage: p.maxUsage ?? '',
      code: p.couponCode ?? '',
    });
    // scroll to top or focus could be added
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPromotionId || !editFormData) return;

    const status = computeStatus(editFormData.startDate, editFormData.endDate) as
      | 'active'
      | 'scheduled'
      | 'expired';

    const updates: any = {
      name: editFormData.name,
      product: editFormData.product || null,
      type: editFormData.type,
      value: editFormData.type !== 'free_shipping' ? Number(editFormData.value) : null,
      startDate: editFormData.startDate,
      endDate: editFormData.endDate,
      status,
      maxUsage: editFormData.maxUsage ? Number(editFormData.maxUsage) : null,
      couponCode: editFormData.code || null,
    };

    try {
      const ref = doc(db, 'promotions', editPromotionId);
      await updateDoc(ref, updates);
      setEditPromotionId(null);
      setEditFormData(null);
    } catch (error) {
      console.error('Erreur mise à jour promotion:', error);
      alert('Erreur lors de la mise à jour.');
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm("Supprimer cette promotion ?")) return;
    try {
      await deleteDoc(doc(db, 'promotions', id));
    } catch (error) {
      console.error('Erreur suppression promotion:', error);
      alert('Impossible de supprimer la promotion.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'scheduled':
        return 'Programmée';
      case 'expired':
        return 'Expirée';
      default:
        return status;
    }
  };

  // --- News / Advertisements ---
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const [showNewsForm, setShowNewsForm] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    imageUrl: '',
    link: '',
    type: 'news' as 'news' | 'advertisement',
    isPublished: true,
  });

  const [editNewsId, setEditNewsId] = useState<string | null>(null);
  const [editNewsData, setEditNewsData] = useState<any>(null);

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
            title: data.title ?? '',
            content: data.content ?? '',
            imageUrl: data.imageUrl ?? null,
            link: data.link ?? null,
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

  const handleNewsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title || !newsForm.content) {
      alert('Titre et contenu requis.');
      return;
    }

    try {
      await addDoc(collection(db, 'news'), {
        ...newsForm,
        imageUrl: newsForm.imageUrl || null,
        link: newsForm.link || null,
        createdAt: serverTimestamp(),
      } as any);

      setShowNewsForm(false);
      setNewsForm({ title: '', content: '', imageUrl: '', link: '', type: 'news', isPublished: true });
    } catch (error) {
      console.error('Erreur création actualité:', error);
      alert("Erreur lors de la création de l'actualité/publicité.");
    }
  };

  const startEditNews = (n: NewsItem) => {
    setEditNewsId(n.id);
    setEditNewsData({
      title: n.title,
      content: n.content,
      imageUrl: n.imageUrl || '',
      link: n.link || '',
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
        imageUrl: editNewsData.imageUrl || null,
        link: editNewsData.link || null,
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
      alert('Impossible de supprimer l\'actualité.');
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
        <DashboardHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Tabs */}
            <div className="flex space-x-4 border-b mb-6">
              <button
                onClick={() => setActiveTab('promotions')}
                className={`px-4 py-2 ${activeTab === 'promotions' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>
                Promotions / Coupons
              </button>
              <button
                onClick={() => setActiveTab('news')}
                className={`px-4 py-2 ${activeTab === 'news' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}>
                Actualités / Publicités
              </button>
            </div>

            {/* PROMOTIONS TAB */}
            {activeTab === 'promotions' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Promotions & Coupons</h1>
                    <p className="text-gray-600 mt-2">Créez et gérez vos promotions, réductions et offres (ex: livraison gratuite).</p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium"
                    >
                      <i className="ri-add-line"></i>
                      <span>Nouvelle promotion</span>
                    </button>
                  </div>
                </div>

                {/* Create form */}
                {showCreateForm && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Créer une nouvelle promotion</h2>
                      <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-600"><i className="ri-close-line"></i></button>
                    </div>

                    <form onSubmit={handlePromotionSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nom de la promotion" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border rounded px-3 py-2" required />

                      <select value={formData.product} onChange={(e) => setFormData({ ...formData, product: e.target.value })} className="border rounded px-3 py-2">
                        <option value="">Choisir un produit (optionnel)</option>
                        {products.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>

                      <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })} className="border rounded px-3 py-2">
                        <option value="percentage">Réduction (%)</option>
                        <option value="fixed">Réduction fixe</option>
                        <option value="free_shipping">Livraison gratuite</option>
                      </select>

                      {formData.type !== 'free_shipping' && (
                        <input type="number" placeholder="Valeur (ex: 10 pour 10% ou 1000 pour 1000 XAF)" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className="border rounded px-3 py-2" required />
                      )}

                      <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="border rounded px-3 py-2" required />
                      <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="border rounded px-3 py-2" required />

                      <input type="number" placeholder="Max utilisations (optionnel)" value={formData.maxUsage} onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })} className="border rounded px-3 py-2" />

                      <div className="flex items-center space-x-2">
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={formData.generateCode} onChange={(e) => setFormData({ ...formData, generateCode: e.target.checked })} />
                          <span>Générer un code coupon</span>
                        </label>
                        {formData.generateCode && (
                          <input type="text" placeholder="Code (laisser vide pour auto)" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="border rounded px-3 py-2" />
                        )}
                      </div>

                      <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Enregistrer</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Edit form (inline) */}
                {editPromotionId && editFormData && (
                  <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">Modifier la promotion</h2>
                      <button onClick={() => { setEditPromotionId(null); setEditFormData(null); }} className="text-gray-400 hover:text-gray-600"><i className="ri-close-line"></i></button>
                    </div>

                    <form onSubmit={handleUpdatePromotion} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Nom" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="border rounded px-3 py-2" required />
                      <select value={editFormData.product} onChange={(e) => setEditFormData({ ...editFormData, product: e.target.value })} className="border rounded px-3 py-2">
                        <option value="">Choisir un produit (optionnel)</option>
                        {products.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>

                      <select value={editFormData.type} onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })} className="border rounded px-3 py-2">
                        <option value="percentage">Réduction (%)</option>
                        <option value="fixed">Réduction fixe</option>
                        <option value="free_shipping">Livraison gratuite</option>
                      </select>

                      {editFormData.type !== 'free_shipping' && (
                        <input type="number" placeholder="Valeur" value={editFormData.value} onChange={(e) => setEditFormData({ ...editFormData, value: e.target.value })} className="border rounded px-3 py-2" required />
                      )}

                      <input type="date" value={editFormData.startDate} onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} className="border rounded px-3 py-2" required />
                      <input type="date" value={editFormData.endDate} onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })} className="border rounded px-3 py-2" required />

                      <input type="number" placeholder="Max utilisations" value={editFormData.maxUsage} onChange={(e) => setEditFormData({ ...editFormData, maxUsage: e.target.value })} className="border rounded px-3 py-2" />

                      <input type="text" placeholder="Code coupon" value={editFormData.code} onChange={(e) => setEditFormData({ ...editFormData, code: e.target.value })} className="border rounded px-3 py-2" />

                      <div className="md:col-span-2 flex justify-end space-x-2">
                        <button type="button" onClick={() => { setEditPromotionId(null); setEditFormData(null); }} className="px-4 py-2 border rounded">Annuler</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Mettre à jour</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Promotion list table */}
                <div className="bg-white rounded-lg shadow-sm border">
                  <div className="overflow-x-auto">
                    {loadingPromotions ? (
                      <p className="p-6">Chargement des promotions...</p>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Promotion</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remise</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisation</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {promotions.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">Aucune promotion disponible.</td>
                            </tr>
                          )}

                          {promotions.map((promotion) => (
                            <tr key={promotion.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promotion.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{promotion.product || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {promotion.type === 'percentage' ? `${promotion.value}%` : promotion.type === 'fixed' ? `${promotion.value} XAF` : 'Livraison gratuite'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{promotion.couponCode || '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateDisplay(promotion.startDate)} - {formatDateDisplay(promotion.endDate)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{promotion.usageCount}{promotion.maxUsage ? `/${promotion.maxUsage}` : ''}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(promotion.status)}`}>{getStatusText(promotion.status)}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button onClick={() => startEditPromotion(promotion)} className="text-blue-600 hover:text-blue-700"><i className="ri-edit-line"></i></button>
                                  <button onClick={() => handleDeletePromotion(promotion.id)} className="text-red-600 hover:text-red-700"><i className="ri-delete-bin-line"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* NEWS TAB */}
            {activeTab === 'news' && (
              <>
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
                      <input type="text" placeholder="Titre" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} className="border rounded px-3 py-2" required />
                      <select value={newsForm.type} onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value as any })} className="border rounded px-3 py-2">
                        <option value="news">Actualité</option>
                        <option value="advertisement">Publicité</option>
                      </select>

                      <textarea placeholder="Contenu" value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" required />

                      <input type="url" placeholder="Image URL (optionnel)" value={newsForm.imageUrl} onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })} className="border rounded px-3 py-2" />
                      <input type="url" placeholder="Lien (optionnel)" value={newsForm.link} onChange={(e) => setNewsForm({ ...newsForm, link: e.target.value })} className="border rounded px-3 py-2" />

                      <label className="inline-flex items-center space-x-2 md:col-span-2">
                        <input type="checkbox" checked={newsForm.isPublished} onChange={(e) => setNewsForm({ ...newsForm, isPublished: e.target.checked })} />
                        <span>Publié</span>
                      </label>

                      <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Enregistrer</button>
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
                      <input type="text" placeholder="Titre" value={editNewsData.title} onChange={(e) => setEditNewsData({ ...editNewsData, title: e.target.value })} className="border rounded px-3 py-2" required />
                      <select value={editNewsData.type} onChange={(e) => setEditNewsData({ ...editNewsData, type: e.target.value })} className="border rounded px-3 py-2">
                        <option value="news">Actualité</option>
                        <option value="advertisement">Publicité</option>
                      </select>

                      <textarea placeholder="Contenu" value={editNewsData.content} onChange={(e) => setEditNewsData({ ...editNewsData, content: e.target.value })} className="border rounded px-3 py-2 md:col-span-2" required />

                      <input type="url" placeholder="Image URL" value={editNewsData.imageUrl} onChange={(e) => setEditNewsData({ ...editNewsData, imageUrl: e.target.value })} className="border rounded px-3 py-2" />
                      <input type="url" placeholder="Lien" value={editNewsData.link} onChange={(e) => setEditNewsData({ ...editNewsData, link: e.target.value })} className="border rounded px-3 py-2" />

                      <label className="inline-flex items-center space-x-2 md:col-span-2">
                        <input type="checkbox" checked={editNewsData.isPublished} onChange={(e) => setEditNewsData({ ...editNewsData, isPublished: e.target.checked })} />
                        <span>Publié</span>
                      </label>

                      <div className="md:col-span-2 flex justify-end space-x-2">
                        <button type="button" onClick={() => { setEditNewsId(null); setEditNewsData(null); }} className="px-4 py-2 border rounded">Annuler</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Mettre à jour</button>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publié</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {news.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-center text-gray-500">Aucune actualité disponible.</td>
                            </tr>
                          )}

                          {news.map((n) => (
                            <tr key={n.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{n.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{n.type === 'news' ? 'Actualité' : 'Publicité'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{n.createdAt ? formatDateDisplay(n.createdAt?.toDate ? n.createdAt.toDate() : n.createdAt) : '-'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{n.isPublished ? 'Oui' : 'Non'}</td>
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
              </>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
