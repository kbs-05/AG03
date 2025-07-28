'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import ClientsHeader from '@/components/ClientsHeader';

import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function NouveauClientPage() {
  const [formData, setFormData] = useState({
    type: 'particulier',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
    companyName: '',
    siret: '',
    contactPerson: '',
    website: ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      // Préparation des données à envoyer
      const dataToSave = {
        ...formData,
        createdAt: serverTimestamp()
      };

      // Ajout dans la collection "clients"
      await addDoc(collection(db, 'clients'), dataToSave);

      setSuccessMsg('Client créé avec succès !');
      setFormData({
        type: 'particulier',
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        notes: '',
        companyName: '',
        siret: '',
        contactPerson: '',
        website: ''
      });
    } catch (error) {
      console.error('Erreur lors de la création du client:', error);
      setErrorMsg('Une erreur est survenue, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const cities = [
    'Libreville',
    'Port-Gentil',
    'Franceville',
    'Oyem',
    'Moanda',
    'Mouila',
    'Lambaréné',
    'Tchibanga',
    'Koulamoutou',
    'Bitam'
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ClientsHeader />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Ajouter un nouveau client</h1>
              <p className="text-gray-600 mt-2">Remplissez les informations ci-dessous pour créer un nouveau client</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
              {/* Messages de succès / erreur */}
              {successMsg && (
                <p className="mb-4 text-green-600 font-medium">{successMsg}</p>
              )}
              {errorMsg && (
                <p className="mb-4 text-red-600 font-medium">{errorMsg}</p>
              )}

              {/* Type de client */}
              {/* ... (le reste de ton formulaire inchangé, je ne le recopie pas pour ne pas trop alourdir) ... */}

              {/* Boutons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium whitespace-nowrap cursor-pointer"
                  disabled={loading}
                  onClick={() => setFormData({
                    type: 'particulier',
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    city: '',
                    postalCode: '',
                    notes: '',
                    companyName: '',
                    siret: '',
                    contactPerson: '',
                    website: ''
                  })}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium whitespace-nowrap cursor-pointer ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Enregistrement...' : 'Créer le client'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
