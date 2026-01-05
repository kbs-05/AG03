'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ProductsGrid from '@/components/ProductsGrid';
import ProductsHeader from '@/components/ProductsHeader';

export default function ProduitsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
    
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestion des Produits</h1>
            
            <ProductsHeader 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            <div className="mt-6">
              <ProductsGrid 
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
            />
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}