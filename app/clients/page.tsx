'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import { getClients, assignCoupon, sendNotification, Client } from '@/lib/clients';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<{ ordersCount: number; favoritesCount: number; totalSpent: number } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // States coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponActive, setCouponActive] = useState(true);

  // States notification
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifMotif, setNotifMotif] = useState('');

  // Charger les clients
  useEffect(() => {
    async function fetchClients() {
      const data = await getClients();
      setClients(data);
      setFilteredClients(data);
      setLoading(false);
    }
    fetchClients();
  }, []);

  // Filtrer les clients
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const filtered = clients.filter(client =>
        client.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phoneNumber?.includes(searchTerm)
      );
      setFilteredClients(filtered);
    }
  }, [searchTerm, clients]);

  // Gestion sélection client avec stats en temps réel
  useEffect(() => {
    if (!selectedClient?.id) return;

    setLoadingDetails(true);
    setClientStats({ ordersCount: 0, favoritesCount: 0, totalSpent: 0 });

    const clientDocRef = doc(db, 'clients', selectedClient.id);

    const unsubscribe = onSnapshot(clientDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setClientStats({
          ordersCount: data.totalOrders ?? 0,
          favoritesCount: data.favoritesCount ?? 0,
          totalSpent: data.totalSpent ?? 0
        });
      }
      setLoadingDetails(false);
    });

    return () => unsubscribe();
  }, [selectedClient]);

  function handleSelectClient(client: Client) {
    setSelectedClient(client);
  }

  async function handleAssignCoupon() {
    if (!selectedClient || !couponCode) {
      alert('Veuillez saisir un code de coupon');
      return;
    }
    await assignCoupon(selectedClient.id!, {
      code: couponCode,
      discount: couponDiscount,
      active: couponActive,
      used: false
    });
    alert(`Coupon "${couponCode}" attribué à ${selectedClient.displayName}`);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponActive(true);
  }

  async function handleSendNotification() {
    if (!selectedClient || !notifTitle || !notifMessage) {
      alert('Veuillez remplir tous les champs de notification');
      return;
    }
    await sendNotification(selectedClient.id!, {
      title: notifTitle,
      message: notifMessage,
      motif: notifMotif
    });
    alert(`Notification envoyée à ${selectedClient.displayName}`);
    setNotifTitle('');
    setNotifMessage('');
    setNotifMotif('');
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestion des Clients</h1>
              <p className="text-gray-600 mt-1">Consultez et gérez vos clients</p>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{clients.length}</span> clients
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Chargement des clients...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Barre de recherche et filtres */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Rechercher un client par nom, email ou téléphone..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-600">
                        {filteredClients.length} résultat(s)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table des clients */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-700">Client</th>
                          <th className="text-left p-4 font-medium text-gray-700">Email</th>
                          <th className="text-left p-4 font-medium text-gray-700">Téléphone</th>
                          <th className="text-left p-4 font-medium text-gray-700">Adresse</th>
                          <th className="text-left p-4 font-medium text-gray-700">Inscrit le</th>
                          <th className="text-left p-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredClients.map((client) => (
                          <tr 
                            key={client.id} 
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  {client.photoURL ? (
                                    <img 
                                      src={client.photoURL} 
                                      alt={client.displayName || 'Client'}
                                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                                      <span className="text-white font-semibold text-sm">
                                        {client.displayName?.charAt(0).toUpperCase() || 'C'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{client.displayName}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">{client.email || '—'}</td>
                            <td className="p-4 text-gray-600">{client.phoneNumber || '—'}</td>
                            <td className="p-4 text-gray-600 max-w-xs truncate">{client.adresse || '—'}</td>
                            <td className="p-4 text-gray-600">
                              {client.date ? new Date(client.date).toLocaleDateString('fr-FR') : '—'}
                            </td>
                            <td className="p-4">
                              <button
                                onClick={() => handleSelectClient(client)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                              >
                                Voir détails
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {filteredClients.length === 0 && (
                      <div className="text-center py-12">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun client trouvé</h3>
                        <p className="text-gray-600">Essayez avec d'autres termes de recherche</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal des détails client */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header du modal */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-white/30 overflow-hidden bg-white">
                      {selectedClient.photoURL ? (
                        <Image
                          src={selectedClient.photoURL}
                          alt={selectedClient.displayName ?? 'Client'}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-100">
                          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{selectedClient.displayName}</h2>
                    <p className="text-blue-100 text-sm">{selectedClient.email ?? '—'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu du modal */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Informations client */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations personnelles</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Email</div>
                          <div className="font-medium">{selectedClient.email ?? '—'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Téléphone</div>
                          <div className="font-medium">{selectedClient.phoneNumber ?? '—'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Adresse</div>
                          <div className="font-medium">{selectedClient.adresse ?? '—'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <div className="text-sm text-gray-500">Membre depuis</div>
                          <div className="font-medium">
                            {selectedClient.date
                              ? new Date(selectedClient.date).toLocaleDateString('fr-FR', { 
                                  day: '2-digit', 
                                  month: 'long', 
                                  year: 'numeric'
                                })
                              : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistiques */}
                  {loadingDetails ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    clientStats && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-blue-50 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-blue-700">{clientStats.ordersCount}</div>
                            <div className="text-sm text-blue-600 font-medium">Commandes</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-purple-700">{clientStats.favoritesCount}</div>
                            <div className="text-sm text-purple-600 font-medium">Favoris</div>
                          </div>
                          <div className="bg-green-50 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-green-700">{clientStats.totalSpent.toLocaleString()} FCFA</div>
                            <div className="text-sm text-green-600 font-medium">Dépenses</div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-6">
                  {/* Formulaire coupon */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <h3 className="font-semibold text-green-800">Attribuer un coupon</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Code du coupon *</label>
                        <input
                          type="text"
                          placeholder="Ex: WELCOME10"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Réduction (%) *</label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="10"
                            min="0"
                            max="100"
                            value={couponDiscount}
                            onChange={(e) => setCouponDiscount(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          />
                          <div className="absolute right-3 top-3 text-gray-500">%</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                        <input
                          type="checkbox"
                          id="coupon-active"
                          checked={couponActive}
                          onChange={(e) => setCouponActive(e.target.checked)}
                          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                        />
                        <label htmlFor="coupon-active" className="text-sm text-gray-700">
                          Activer immédiatement
                        </label>
                      </div>
                      
                      <button
                        onClick={handleAssignCoupon}
                        className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                        </svg>
                        Attribuer le coupon
                      </button>
                    </div>
                  </div>

                  {/* Formulaire notification */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <h3 className="font-semibold text-blue-800">Envoyer une notification</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                        <input
                          type="text"
                          placeholder="Ex: Nouvelle promotion !"
                          value={notifTitle}
                          onChange={(e) => setNotifTitle(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                        <textarea
                          placeholder="Rédigez votre message ici..."
                          value={notifMessage}
                          onChange={(e) => setNotifMessage(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Motif (optionnel)</label>
                        <input
                          type="text"
                          placeholder="Ex: Promotion spéciale..."
                          value={notifMotif}
                          onChange={(e) => setNotifMotif(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      <button
                        onClick={handleSendNotification}
                        className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all font-medium flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Envoyer la notification
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}