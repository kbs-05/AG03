'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState('dashboard');

  useEffect(() => {
    if (pathname === '/') {
      setActiveItem('dashboard');
    } else if (pathname.startsWith('/produits')) {
      setActiveItem('produits');
    } else if (pathname.startsWith('/clients')) {
      setActiveItem('clients');
    } else if (pathname.startsWith('/commandes')) {
      setActiveItem('commandes');
    } else if (pathname.startsWith('/livreurs')) {
      setActiveItem('livreurs');
    }
  }, [pathname]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-line', href: '/' },
    { id: 'produits', label: 'Produits', icon: 'ri-product-hunt-line', href: '/produits' },
    { id: 'clients', label: 'Clients', icon: 'ri-team-line', href: '/clients' },
    { id: 'commandes', label: 'Commandes', icon: 'ri-shopping-cart-line', href: '/commandes' },
    { id: 'livreurs', label: 'Livreurs', icon: 'ri-truck-line', href: '/livreurs' }, // ✅ Nouveau
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <i className="ri-plant-line text-white text-lg"></i>
          </div>
          <span className="text-xl font-bold text-gray-900">Agri-Gabon</span>
        </div>
      </div>

      {/* Profil Admin */}
      <div className="p-6 border-b">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <i className="ri-user-line text-green-600 text-lg"></i>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin</p>
            <p className="text-xs text-gray-500">Administrateur</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="mt-6 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-colors ${
              activeItem === item.id
                ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
            onClick={() => setActiveItem(item.id)}
          >
            <i className={`${item.icon} w-5 h-5 flex items-center justify-center`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Bas de sidebar */}
      <div className="p-4 border-t text-center text-xs text-gray-500">
        <p>© 2025 Agri-Gabon</p>
      </div>
    </div>
  );
}
