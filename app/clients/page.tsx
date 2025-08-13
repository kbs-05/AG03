'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ClientsHeader from '@/components/ClientsHeader';
import ClientsTable from '@/components/ClientsTable';
import {
  getClients,
  getClientDetails,
  assignCoupon,
  sendNotification,
  Client
} from '@/lib/clients';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientStats, setClientStats] = useState<{ ordersCount: number; favoritesCount: number } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // States pour formulaire coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<number>(0);
  const [couponActive, setCouponActive] = useState(true);

  // States pour formulaire notification
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifMotif, setNotifMotif] = useState('');

  useEffect(() => {
    async function fetchClients() {
      const data = await getClients();
      setClients(data);
      setLoading(false);
    }
    fetchClients();
  }, []);

  async function handleSelectClient(client: Client) {
    setSelectedClient(client);
    setLoadingDetails(true);
    const stats = await getClientDetails(client.id!);
    setClientStats(stats);
    setLoadingDetails(false);
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
                  <div className="bg-white shadow rounded-lg p-4 overflow-y-auto max-h-[80vh]">
                    <h2 className="text-lg font-bold mb-2">{selectedClient.displayName}</h2>
                    <p>Email : {selectedClient.email}</p>
                    <p>Téléphone : {selectedClient.phoneNumber}</p>
                    <p>Adresse : {selectedClient.adresse}</p>
                    <p>Date de création : {selectedClient.date}</p>

                    {loadingDetails ? (
                      <p className="mt-4 text-gray-500">Chargement des statistiques...</p>
                    ) : (
                      clientStats && (
                        <div className="mt-4">
                          <p className="font-semibold">Statistiques :</p>
                          <ul className="list-disc ml-5 text-sm text-gray-700">
                            <li>Commandes : {clientStats.ordersCount}</li>
                            <li>Favoris : {clientStats.favoritesCount}</li>
                          </ul>
                        </div>
                      )
                    )}

                    {/* Formulaire coupon */}
                    <div className="mt-6 border-t pt-4">
                      <h3 className="font-semibold mb-2">Assigner un coupon</h3>
                      <input
                        type="text"
                        placeholder="Code du coupon"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="border rounded w-full p-2 mb-2"
                      />
                      <input
                        type="number"
                        placeholder="Réduction (%)"
                        value={couponDiscount}
                        onChange={(e) => setCouponDiscount(Number(e.target.value))}
                        className="border rounded w-full p-2 mb-2"
                      />
                      <label className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          checked={couponActive}
                          onChange={(e) => setCouponActive(e.target.checked)}
                        />
                        <span>Activer le coupon</span>
                      </label>
                      <button
                        onClick={handleAssignCoupon}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full"
                      >
                        Attribuer le coupon
                      </button>
                    </div>

                    {/* Formulaire notification */}
                    <div className="mt-6 border-t pt-4">
                      <h3 className="font-semibold mb-2">Envoyer une notification</h3>
                      <input
                        type="text"
                        placeholder="Titre"
                        value={notifTitle}
                        onChange={(e) => setNotifTitle(e.target.value)}
                        className="border rounded w-full p-2 mb-2"
                      />
                      <textarea
                        placeholder="Message"
                        value={notifMessage}
                        onChange={(e) => setNotifMessage(e.target.value)}
                        className="border rounded w-full p-2 mb-2"
                      />
                      <input
                        type="text"
                        placeholder="Motif"
                        value={notifMotif}
                        onChange={(e) => setNotifMotif(e.target.value)}
                        className="border rounded w-full p-2 mb-2"
                      />
                      <button
                        onClick={handleSendNotification}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                      >
                        Envoyer la notification
                      </button>
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
