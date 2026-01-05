'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Définition des icônes SVG
const icons = {
  add: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  database: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  ),
  promotion: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  )
};

interface ActionCardProps {
  title: string;
  buttonText: string;
  buttonColor: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  description?: string;
  onClick: () => void;
}

function ActionCard({ 
  title, 
  buttonText, 
  buttonColor, 
  icon, 
  isLoading, 
  description,
  onClick 
}: ActionCardProps) {
  return (
    <div 
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100 hover:shadow-lg transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-4 mb-5">
          <div className={`p-3 rounded-lg ${buttonColor.replace('600', '100')}`}>
            <div className={buttonColor.replace('bg-', 'text-').replace('600', '600')}>
              {icon}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>

        <button
          disabled={isLoading}
          className={`w-full ${buttonColor} text-white py-3 px-4 rounded-lg font-medium mt-auto flex items-center justify-center gap-2 ${
            isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:opacity-90'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Chargement...</span>
            </>
          ) : (
            <>
              <span>{buttonText}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function ActionCards() {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const actions = [
    {
      id: 'add',
      title: 'Ajouter Produit',
      buttonText: 'Nouveau',
      buttonColor: 'bg-green-600',
      icon: icons.add,
      description: 'Ajouter un produit',
      path: '/ajouter-produit'
    },
    {
      id: 'stock',
      title: 'Gérer Stock',
      buttonText: 'Voir Stock',
      buttonColor: 'bg-blue-600',
      icon: icons.database,
      description: 'Gérer l\'inventaire',
      path: '/produits'
    },
    {
      id: 'promo',
      title: 'Promotions',
      buttonText: 'Créer',
      buttonColor: 'bg-orange-600',
      icon: icons.promotion,
      description: 'Créer promotion',
      path: '/promotions'
    }
  ];

  const handleClick = (path: string, id: string) => {
    setLoadingAction(id);
    router.push(path);
    setTimeout(() => setLoadingAction(null), 1500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action) => (
        <ActionCard
          key={action.id}
          {...action}
          isLoading={loadingAction === action.id}
          onClick={() => handleClick(action.path, action.id)}
        />
      ))}
    </div>
  );
}