'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ClientsHeader from '@/components/ClientsHeader';
import ClientsTable from '@/components/ClientsTable';
import ClientsStats from '@/components/ClientsStats';
import { getClients, Client } from '@/lib/clients';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      const data = await getClients();
      setClients(data);
      setLoading(false);
    }

    fetchClients();
  }, []);

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
              <>
                <ClientsTable clients={clients} />
                <div className="mt-8">
                  <ClientsTable clients={clients} />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
