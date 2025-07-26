
'use client';

import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';
import StatsCards from '@/components/StatsCards';
import RecentOrders from '@/components/RecentOrders';
import ActionCards from '@/components/ActionCards';

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>
            
            <StatsCards />
            
            <div className="mt-8">
              <RecentOrders />
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
