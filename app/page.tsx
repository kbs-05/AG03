
'use client';

import Sidebar from '@/components/Sidebar';
import StatsCards from '@/components/StatsCards';
import ActionCards from '@/components/ActionCards';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>
            
            <div className="mt-8">
              <StatsCards />
            </div>
            
            <div className="mt-8">
              <ActionCards />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
