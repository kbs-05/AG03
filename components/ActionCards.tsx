'use client';

import { useRouter } from 'next/navigation';

interface ActionCardProps {
  title: string;
  buttonText: string;
  buttonColor: string;
  icon: string;
  onClick: () => void;
}

function ActionCard({ title, buttonText, buttonColor, icon, onClick }: ActionCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <button
        onClick={onClick}
        className={`w-full ${buttonColor} text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer`}
      >
        <i className={`${icon} w-5 h-5 flex items-center justify-center`}></i>
        <span>{buttonText}</span>
      </button>
    </div>
  );
}

export default function ActionCards() {
  const router = useRouter();

  const actions = [
    {
      title: 'Ajouter Produit',
      buttonText: 'Nouveau',
      buttonColor: 'bg-green-600',
      icon: 'ri-add-line',
      onClick: () => router.push('/ajouter-produit')
    },
    {
      title: 'Gérer Stock',
      buttonText: 'Voir Stock',
      buttonColor: 'bg-blue-600',
      icon: 'ri-database-line',
      onClick: () => router.push('/gerer-stock')
    },
    {
      title: 'Promotions',
      buttonText: 'Créer',
      buttonColor: 'bg-orange-600',
      icon: 'ri-heart-line',
      onClick: () => router.push('/promotions')
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {actions.map((action, index) => (
        <ActionCard key={index} {...action} />
      ))}
    </div>
  );
}