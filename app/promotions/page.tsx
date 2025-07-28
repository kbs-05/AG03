'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

interface Promotion {
  id: string;
  name: string;
  product: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string; // ou Date, mais ici string pour simplifier
  endDate: string;
  status: 'active' | 'scheduled' | 'expired';
  usageCount: number;
  maxUsage?: number;
}

export default function PromotionsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    product: '',
    type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    startDate: '',
    endDate: '',
    maxUsage: '',
  });

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const products = [
    'Bananes plantains',
    'Igname blanche',
    'Tomates fraîches',
    'Riz blanc',
    'Poisson fumé',
    'Tous les fruits',
    'Tous les légumes',
  ];

  // Charger les promotions Firestore au montage
  useEffect(() => {
    setLoading(true);
    const promotionsRef = collection(db, 'promotions');
    const unsubscribe = onSnapshot(
      promotionsRef,
      (snapshot) => {
        const items: Promotion[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            product: data.product,
            type: data.type,
            value: data.value,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status,
            usageCount: data.usageCount,
            maxUsage: data.maxUsage,
          };
        });
        setPromotions(items);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur chargement promotions:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calcul automatique du status selon date de début
    const start = new Date(formData.startDate);
    const today = new Date();
    const status =
      start <= today && new Date(formData.endDate) >= today
        ? 'active'
        : start > today
        ? 'scheduled'
        : 'expired';

    const newPromotion = {
      name: formData.name,
      product: formData.product,
      type: formData.type,
      value: parseFloat(formData.value),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status,
      usageCount: 0,
      maxUsage: formData.maxUsage ? parseInt(formData.maxUsage) : null,
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
      });
    } catch (error) {
      console.error('Erreur création promotion:', error);
      alert("Erreur lors de la création de la promotion.");
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion des Promotions
                </h1>
                <p className="text-gray-600 mt-2">Créez et gérez vos promotions</p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium whitespace-nowrap cursor-pointer"
              >
                <i className="ri-add-line w-5 h-5 flex items-center justify-center"></i>
                <span>Nouvelle promotion</span>
              </button>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Créer une nouvelle promotion
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <i className="ri-close-line w-5 h-5 flex items-center justify-center"></i>
                  </button>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {/* ... formulaire identique, pas besoin de changer ... */}
                  {/* Tu peux copier/coller ton formulaire ici */}
                  {/* Pour ne pas allonger la réponse, je te laisse faire */}
                </form>
              </div>
            )}

            {/* Liste des promotions */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                {loading ? (
                  <p className="p-6">Chargement des promotions...</p>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Promotion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produit
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Remise
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Période
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisation
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {promotions.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            className="px-6 py-4 whitespace-nowrap text-center text-gray-500"
                          >
                            Aucune promotion disponible.
                          </td>
                        </tr>
                      )}
                      {promotions.map((promotion) => (
                        <tr key={promotion.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {promotion.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {promotion.product}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {promotion.type === 'percentage'
                                ? `${promotion.value}%`
                                : `${promotion.value} XAF`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {promotion.startDate} - {promotion.endDate}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {promotion.usageCount}
                              {promotion.maxUsage ? `/${promotion.maxUsage}` : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                promotion.status
                              )}`}
                            >
                              {getStatusText(promotion.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-700">
                                <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
                              </button>
                              <button className="text-red-600 hover:text-red-700">
                                <i className="ri-delete-bin-line w-4 h-4 flex items-center justify-center"></i>
                              </button>
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
