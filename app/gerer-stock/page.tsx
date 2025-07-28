'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import DashboardHeader from '@/components/DashboardHeader';

import { 
  collection, 
  doc, 
  getFirestore, 
  onSnapshot, 
  query, 
  updateDoc 
} from 'firebase/firestore';
import { app } from '@/lib/firebase'; // adapte le chemin vers ton fichier d'initialisation Firebase

interface StockItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  lastUpdate: string;
  status: 'en-stock' | 'stock-faible' | 'rupture';
}

export default function GererStockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingStock, setEditingStock] = useState<string | null>(null);
  const [newStock, setNewStock] = useState('');

  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const categories = [
    { id: 'all', name: 'Toutes catégories' },
    { id: 'fruits', name: 'Fruits' },
    { id: 'legumes', name: 'Légumes' },
    { id: 'tubercules', name: 'Tubercules' },
    { id: 'cereales', name: 'Céréales' },
    { id: 'poissons', name: 'Poissons' },
    { id: 'viandes', name: 'Viandes' },
  ];

  const statusOptions = [
    { id: 'all', name: 'Tous les statuts' },
    { id: 'en-stock', name: 'En stock' },
    { id: 'stock-faible', name: 'Stock faible' },
    { id: 'rupture', name: 'Rupture' }
  ];

  // Firestore reference
  const db = getFirestore(app);

  useEffect(() => {
    const q = query(collection(db, 'stockItems'));
    // onSnapshot écoute les changements en temps réel
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items: StockItem[] = [];
      querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name,
          category: data.category,
          currentStock: data.currentStock,
          minStock: data.minStock,
          maxStock: data.maxStock,
          unit: data.unit,
          lastUpdate: data.lastUpdate,
          status: data.status
        });
      });
      setStockItems(items);
    });

    return () => unsubscribe();
  }, [db]);

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Mets à jour Firestore + état local
  const handleStockUpdate = async (id: string, newStockValue: number) => {
    const item = stockItems.find(i => i.id === id);
    if (!item) return;

    let status: 'en-stock' | 'stock-faible' | 'rupture' = 'en-stock';
    if (newStockValue === 0) status = 'rupture';
    else if (newStockValue <= item.minStock) status = 'stock-faible';

    const lastUpdate = new Date().toISOString().split('T')[0];

    try {
      const itemRef = doc(db, 'stockItems', id);
      await updateDoc(itemRef, {
        currentStock: newStockValue,
        status,
        lastUpdate
      });
      // L'état local sera mis à jour par onSnapshot en temps réel, donc pas besoin de setStockItems ici
    } catch (error) {
      console.error('Erreur lors de la mise à jour du stock:', error);
    }

    setEditingStock(null);
    setNewStock('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en-stock': return 'bg-green-100 text-green-800';
      case 'stock-faible': return 'bg-yellow-100 text-yellow-800';
      case 'rupture': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'en-stock': return 'En stock';
      case 'stock-faible': return 'Stock faible';
      case 'rupture': return 'Rupture';
      default: return status;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Gestion du Stock</h1>
              <p className="text-gray-600 mt-2">Gérez les niveaux de stock de vos produits</p>
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rechercher</label>
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 flex items-center justify-center"></i>
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm pr-8"
                  >
                    {statusOptions.map(status => (
                      <option key={status.id} value={status.id}>{status.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tableau des stocks */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Produit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock actuel
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock min/max
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dernière MAJ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingStock === item.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="number"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                min="0"
                              />
                              <button
                                onClick={() => {
                                  const parsedStock = parseInt(newStock, 10);
                                  if (isNaN(parsedStock) || parsedStock < 0) {
                                    alert('Veuillez entrer un nombre valide');
                                    return;
                                  }
                                  handleStockUpdate(item.id, parsedStock);
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <i className="ri-check-line w-4 h-4 flex items-center justify-center"></i>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStock(null);
                                  setNewStock('');
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <i className="ri-close-line w-4 h-4 flex items-center justify-center"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-900">
                              {item.currentStock} {item.unit}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {item.minStock} / {item.maxStock} {item.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.lastUpdate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingStock(item.id);
                                setNewStock(item.currentStock.toString());
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <i className="ri-edit-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                            <button className="text-green-600 hover:text-green-700">
                              <i className="ri-add-line w-4 h-4 flex items-center justify-center"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
