'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

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
    { id: 'livreurs', label: 'Livreurs', icon: 'ri-truck-line', href: '/livreurs' },
  ];

  return (
    <div className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Logo avec bouton de réduction */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className={`flex items-center space-x-3 ${collapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
            <i className="ri-leaf-line text-white text-xl"></i>
          </div>
          
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">Agri-Gabon</span>
              <span className="text-xs text-green-300 font-medium">Administration</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          <i className={`ri-${collapsed ? 'menu-unfold' : 'menu-fold'}-line text-lg`}></i>
        </button>
      </div>

      {/* Profil Admin */}
      <div className="p-6 border-b border-gray-700">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <i className="ri-user-3-line text-white text-xl"></i>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-gray-900 rounded-full"></div>
          </div>
          
          {!collapsed && (
            <div className="flex-1">
              <p className="font-semibold">Bienvenue</p>
              <div className="flex items-center mt-1">
                <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-300 rounded-full">En ligne</span>
                <span className="text-xs text-gray-400 ml-2">Admin</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <nav className="mt-6 flex-1 px-3">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center rounded-xl transition-all duration-200 group ${
                collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
              } ${
                activeItem === item.id
                  ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/10 text-green-300 border-l-4 border-green-500'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}
              onClick={() => setActiveItem(item.id)}
              title={collapsed ? item.label : ''}
            >
              <div className={`relative ${collapsed ? '' : 'mr-3'}`}>
                <i className={`${item.icon} text-lg ${activeItem === item.id ? 'text-green-400' : 'text-gray-400 group-hover:text-white'}`}></i>
                {activeItem === item.id && (
                  <div className="absolute -inset-2 bg-green-500/10 rounded-full blur-sm"></div>
                )}
              </div>
              
              {!collapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {activeItem === item.id && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Déconnexion et bas de sidebar */}
      <div className="p-4 border-t border-gray-700">
        
        <div className={`text-center mt-4 ${collapsed ? 'text-xs' : 'text-sm'}`}>
          <p className="text-gray-500">© 2025 Agri-Gabon</p>
        </div>
      </div>

      {/* Indicateur de réduction (mobile) */}
      <div className="lg:hidden absolute -right-3 top-1/2 transform -translate-y-1/2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-10 bg-gray-800 rounded-r-lg flex items-center justify-center border border-gray-700"
        >
          <i className={`ri-arrow-${collapsed ? 'right' : 'left'}-s-line text-gray-400`}></i>
        </button>
      </div>
    </div>
  );
}