'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  query,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Commande = {
  id: string;
  user: {
    displayName: string;
    phoneNumber: string;
  };
  livreur?: {
    nom: string;
    phone?: string;
    statut?: string;
  };
  date: any;
  commandetotal: number;
  livraisonStatus?: string;
  status?: string;
};

type HistoriqueLivraison = {
  commandeId: string;
  clientNom: string;
  livreurNom?: string;
  total: number;
  dateLivraison: string;
  statut: string;
};

export default function SuiviLivraisonPage() {
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [livreurInfo, setLivreurInfo] = useState<any>(null);
  const [historique, setHistorique] = useState<HistoriqueLivraison[]>([]);

  // 🔹 Filtres pour l'historique
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // 🔹 Charger les commandes
  useEffect(() => {
    const fetchCommandes = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'commandes'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Commande[];
        setCommandes(data);
      } catch (error) {
        console.error('Erreur lors du chargement des livraisons :', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommandes();
  }, []);

  // 🔹 Charger l'historique en temps réel
  useEffect(() => {
    const q = query(collection(db, 'historique_livraisons'), orderBy('dateLivraison', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => docSnap.data()) as HistoriqueLivraison[];
      setHistorique(data);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Met à jour le statut et ajoute à l’historique
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const ref = doc(db, 'commandes', id);
      await updateDoc(ref, { livraisonStatus: newStatus });

      setCommandes((prev) =>
        prev.map((cmd) => (cmd.id === id ? { ...cmd, livraisonStatus: newStatus } : cmd))
      );

      // ✅ Ajouter ou mettre à jour dans l’historique
      const commandeLivree = commandes.find((c) => c.id === id);
      if (commandeLivree) {
        await addDoc(collection(db, 'historique_livraisons'), {
          commandeId: commandeLivree.id,
          clientNom: commandeLivree.user.displayName,
          livreurNom: commandeLivree.livreur?.nom || 'Non assigné',
          total: commandeLivree.commandetotal,
          dateLivraison: new Date().toISOString(),
          statut: newStatus,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut :', error);
    }
  };

  // 🔹 Sélection d'une commande pour voir les infos du livreur
  const selectCommande = (cmd: Commande) => {
    setSelectedCommande(cmd);

    if (cmd.livreur?.nom) {
      const livreurRef = doc(db, 'livreurs', cmd.livreur.nom);
      const unsubscribe = onSnapshot(livreurRef, (snap) => {
        if (snap.exists()) {
          setLivreurInfo(snap.data());
        }
      });
      return () => unsubscribe();
    } else {
      setLivreurInfo(null);
    }
  };

  // 🔹 Filtrage de l’historique
  const filteredHistorique = historique.filter((h) => {
    const date = new Date(h.dateLivraison);
    const day = date.getDate().toString();
    const month = (date.getMonth() + 1).toString();
    const year = date.getFullYear().toString();

    return (
      (!selectedDay || selectedDay === day) &&
      (!selectedMonth || selectedMonth === month) &&
      (!selectedYear || selectedYear === year)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        Chargement des livraisons...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Suivi des livraisons
        </h1>

        {/* ✅ Tableau principal */}
        {commandes.length === 0 ? (
          <p className="text-gray-500">Aucune commande trouvée.</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Téléphone</th>
                  <th className="px-4 py-2">Livreur</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Statut livraison</th>
                  <th className="px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {commandes.map((cmd, index) => (
                  <tr
                    key={cmd.id}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => selectCommande(cmd)}
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{cmd.user.displayName}</td>
                    <td className="px-4 py-2">{cmd.user.phoneNumber}</td>
                    <td className="px-4 py-2">
                      {cmd.livreur?.nom || (
                        <span className="text-gray-400 italic">Non assigné</span>
                      )}
                    </td>
                    <td className="px-4 py-2">{cmd.commandetotal} FCFA</td>
                    <td className="px-4 py-2">
                      {new Date(cmd.date.seconds * 1000).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          cmd.livraisonStatus === 'Livrée'
                            ? 'bg-green-100 text-green-700'
                            : cmd.livraisonStatus === 'En cours'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {cmd.livraisonStatus || 'Non livrée'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(cmd.id, 'En cours');
                          }}
                          className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                        >
                          En cours
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(cmd.id, 'Livrée');
                          }}
                          className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Livrée
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(cmd.id, 'Non livrée');
                          }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Non livrée
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ✅ Infos du livreur */}
        {selectedCommande && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-bold mb-2">Infos du livreur</h2>
            {livreurInfo ? (
              <div className="space-y-1">
                <p><strong>Nom :</strong> {livreurInfo.nom}</p>
                <p><strong>Téléphone :</strong> {livreurInfo.phone}</p>
                <p><strong>Statut :</strong> {livreurInfo.statut || 'Inconnu'}</p>
              </div>
            ) : (
              <p className="text-gray-500 italic">Aucun livreur assigné.</p>
            )}
          </div>
        )}

        {/* ✅ Historique avec filtres */}
        <div className="mt-8 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-bold mb-3">Historique des livraisons</h2>

          <div className="flex flex-wrap gap-4 mb-4">
            <input
              type="number"
              placeholder="Jour (ex: 5)"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="border rounded px-3 py-1"
            />
            <input
              type="number"
              placeholder="Mois (ex: 11)"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border rounded px-3 py-1"
            />
            <input
              type="number"
              placeholder="Année (ex: 2025)"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border rounded px-3 py-1"
            />
          </div>

          {filteredHistorique.length === 0 ? (
            <p className="text-gray-500">Aucune livraison trouvée pour cette période.</p>
          ) : (
            <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Client</th>
                  <th className="px-4 py-2">Livreur</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Date de livraison</th>
                  <th className="px-4 py-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistorique.map((h, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">{h.clientNom}</td>
                    <td className="px-4 py-2">{h.livreurNom}</td>
                    <td className="px-4 py-2">{h.total} FCFA</td>
                    <td className="px-4 py-2">
                      {new Date(h.dateLivraison).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          h.statut === 'Livrée'
                            ? 'bg-green-100 text-green-700'
                            : h.statut === 'En cours'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {h.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
