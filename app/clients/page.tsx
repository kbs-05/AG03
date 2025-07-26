'use client';

import Sidebar from '@/components/Sidebar';
import ClientsHeader from '@/components/ClientsHeader';
import ClientsTable from '@/components/ClientsTable';
import ClientsStats from '@/components/ClientsStats';

export default function ClientsPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientsHeader />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Clients</h1>
            
            <ClientsTable />
            
            <div className="mt-8">
              <ClientsStats />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}