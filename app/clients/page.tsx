'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import ClientsHeader from '@/components/ClientsHeader';
import ClientsTable from '@/components/ClientsTable';
import { getClients, assignCoupon, sendNotification, Client } from '@/lib/clients';
import { db } from '@/lib/firebase';
import { collection, doc, onSnapshot } from 'firebase/firestore';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<{ ordersCount: number; favoritesCount: number } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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
      setLoading(false);
    }
    fetchClients();
  }, []);

  // Gestion sélection client avec stats en temps réel
useEffect(() => {
  if (!selectedClient?.id) return;

  setLoadingDetails(true);
  setClientStats({ ordersCount: 0, favoritesCount: 0 });

  const clientDocRef = doc(db, 'clients', selectedClient.id);

  const unsubscribe = onSnapshot(clientDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      setClientStats({
        ordersCount: data.totalOrders ?? 0,
        favoritesCount: data.favoritesCount ?? 0
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
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientsHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Clients</h1>

            {loading ? (
              <p>Chargement des clients...</p>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {/* Table des clients */}
                <div className="col-span-2">
                  <ClientsTable clients={clients} onSelectClient={handleSelectClient} />
                </div>

                {/* Panneau détails + actions */}
                {selectedClient && (
                  <div className="bg-white shadow rounded-lg p-6 overflow-y-auto max-h-[80vh] flex flex-col items-center">
                    {/* Photo */}
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 mb-4 flex items-center justify-center">
                      {selectedClient.photoURL ? (
                        <Image
                          src={selectedClient.photoURL}
                          alt={selectedClient.displayName ?? 'Client'}
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <i className="ri-user-line text-5xl text-gray-400" aria-hidden="true"></i>
                      )}
                    </div>

                    {/* Nom */}
                    <h2 className="text-lg font-bold text-gray-900">{selectedClient.displayName}</h2>

                    {/* Infos utilisateur */}
                    <div className="mt-4 space-y-2 w-full">
                      <p className="text-sm text-gray-600"><span className="font-medium">Email :</span> {selectedClient.email ?? '—'}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Téléphone :</span> {selectedClient.phoneNumber ?? '—'}</p>
                      <p className="text-sm text-gray-600"><span className="font-medium">Adresse :</span> {selectedClient.adresse ?? '—'}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Date de création :</span> 
                        {selectedClient.date
                          ? new Date(selectedClient.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </p>
                    </div>

                    {/* Statistiques en temps réel */}
                    {loadingDetails ? (
                      <p className="mt-4 text-gray-500">Chargement des statistiques...</p>
                    ) : (
                      clientStats && (
                        <div className="mt-6 w-full">
                          <h3 className="font-semibold text-gray-800 mb-2">Statistiques</h3>
                          <div className="grid grid-cols-2 gap-4 text-center text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg shadow-inner">
                              <p className="text-lg font-bold text-gray-900">{clientStats.ordersCount}</p>
                              <p className="text-gray-500">Commandes</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg shadow-inner">
                              <p className="text-lg font-bold text-gray-900">{clientStats.favoritesCount}</p>
                              <p className="text-gray-500">Favoris</p>
                            </div>
                          </div>
                        </div>
                      )
                    )}

                    {/* Formulaire coupon */}
                    <div className="mt-6 border-t pt-4 w-full">
                      <h3 className="font-semibold mb-3">Assigner un coupon</h3>
                      <input type="text" placeholder="Code du coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} className="border rounded w-full p-2 mb-2"/>
                      <input type="number" placeholder="Réduction (%)" value={couponDiscount} onChange={(e) => setCouponDiscount(Number(e.target.value))} className="border rounded w-full p-2 mb-2"/>
                      <label className="flex items-center space-x-2 mb-3">
                        <input type="checkbox" checked={couponActive} onChange={(e) => setCouponActive(e.target.checked)} />
                        <span>Activer le coupon</span>
                      </label>
                      <button onClick={handleAssignCoupon} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full">Attribuer le coupon</button>
                    </div>

                    {/* Formulaire notification */}
                    <div className="mt-6 border-t pt-4 w-full">
                      <h3 className="font-semibold mb-3">Envoyer une notification</h3>
                      <input type="text" placeholder="Titre" value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} className="border rounded w-full p-2 mb-2"/>
                      <textarea placeholder="Message" value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} className="border rounded w-full p-2 mb-2"/>
                      <input type="text" placeholder="Motif" value={notifMotif} onChange={(e) => setNotifMotif(e.target.value)} className="border rounded w-full p-2 mb-2"/>
                      <button onClick={handleSendNotification} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full">Envoyer la notification</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
