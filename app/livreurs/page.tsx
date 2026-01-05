'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import {
  collection,
  doc,
  orderBy,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';

type Livreur = {
  id: string;
  nom: string;
  email: string;
  phone: string;
  quartier: string;
  typeVehicule: string;
  photo?: string;
  permisConduire?: string;
  pieceIdentite?: string;
  statut: 'livreur';
  dateCreation: any;
  uid?: string;
  stats?: {
    history: number;
    enCours: number;
  };
};

type Livraison = {
  id: string;
  // Vous pouvez ajouter d'autres champs si nécessaire
  date?: any;
  statut?: string;
  commandeId?: string;
};

export default function GestionLivreursPage() {
  const [loading, setLoading] = useState(true);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [showAddLivreurModal, setShowAddLivreurModal] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState<Livreur | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statsLoading, setStatsLoading] = useState<{[key: string]: boolean}>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const permisInputRef = useRef<HTMLInputElement>(null);
  const pieceIdentiteInputRef = useRef<HTMLInputElement>(null);

  // 🔹 État pour le formulaire d'ajout de livreur
  const [newLivreur, setNewLivreur] = useState({
    nom: '',
    email: '',
    phone: '',
    quartier: '',
    typeVehicule: '',
    password: '',
    confirmPassword: '',
    photo: '',
    permisConduire: '',
    pieceIdentite: '',
  });

  // 🔹 État pour suivre les noms des fichiers PDF
  const [pdfFiles, setPdfFiles] = useState({
    permisName: '',
    pieceIdentiteName: ''
  });

  // Fonction utilitaire pour mettre à jour les stats
  const updateLivreurStats = (prev: Livreur | null, updates: Partial<{history: number, enCours: number}>) => {
    if (!prev) return null;
    return {
      ...prev,
      stats: {
        history: updates.history !== undefined ? updates.history : (prev.stats?.history || 0),
        enCours: updates.enCours !== undefined ? updates.enCours : (prev.stats?.enCours || 0)
      }
    };
  };

  // 🔹 Charger les livreurs en temps réel avec snapshot
  useEffect(() => {
    setLoading(true);
    
    const q = query(collection(db, 'livreurs'), orderBy('dateCreation', 'desc'));
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Livreur[];
        
        // Pour chaque livreur, charger ses statistiques
        const loadStats = async () => {
          const livreursWithStats = await Promise.all(
            data.map(async (livreur) => {
              try {
                const [historySnap, enCoursSnap] = await Promise.all([
                  getDocs(collection(db, `livreurs/${livreur.id}/history`)),
                  getDocs(collection(db, `livreurs/${livreur.id}/enCours`))
                ]);
                
                return {
                  ...livreur,
                  stats: {
                    history: historySnap.size,
                    enCours: enCoursSnap.size
                  }
                };
              } catch (error) {
                console.error(`Erreur chargement stats livreur ${livreur.id}:`, error);
                return {
                  ...livreur,
                  stats: { history: 0, enCours: 0 }
                };
              }
            })
          );
          
          setLivreurs(livreursWithStats);
          setLoading(false);
        };
        
        loadStats();
      },
      (error) => {
        console.error('Erreur lors du chargement des livreurs :', error);
        setLoading(false);
      }
    );

    // Nettoyer l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);

  // 🔹 Souscrire aux statistiques en temps réel pour un livreur spécifique
  useEffect(() => {
    if (!selectedLivreur?.id) return;

    const unsubscribeHistory = onSnapshot(
      collection(db, `livreurs/${selectedLivreur.id}/history`),
      (snapshot) => {
        setSelectedLivreur(prev => updateLivreurStats(prev, { history: snapshot.size }));
      }
    );

    const unsubscribeEnCours = onSnapshot(
      collection(db, `livreurs/${selectedLivreur.id}/enCours`),
      (snapshot) => {
        setSelectedLivreur(prev => updateLivreurStats(prev, { enCours: snapshot.size }));
      }
    );

    return () => {
      unsubscribeHistory();
      unsubscribeEnCours();
    };
  }, [selectedLivreur?.id]);

  // 🔹 Ouvrir le sélecteur de fichiers
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handlePermisClick = () => {
    permisInputRef.current?.click();
  };

  const handlePieceIdentiteClick = () => {
    pieceIdentiteInputRef.current?.click();
  };

  // 🔹 Gérer la sélection d'image
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        setSelectedImage(imageDataUrl);
        setNewLivreur(prev => ({ ...prev, photo: imageDataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Gérer la sélection des documents PDF
  const handleDocumentSelect = (event: React.ChangeEvent<HTMLInputElement>, documentType: 'permis' | 'pieceIdentite') => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Veuillez sélectionner un fichier PDF');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const pdfDataUrl = e.target?.result as string;
        setNewLivreur(prev => ({ 
          ...prev, 
          [documentType === 'permis' ? 'permisConduire' : 'pieceIdentite']: pdfDataUrl 
        }));

        // Stocker le nom du fichier pour l'affichage
        setPdfFiles(prev => ({
          ...prev,
          [documentType === 'permis' ? 'permisName' : 'pieceIdentiteName']: file.name
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Ajouter un nouveau livreur avec Firebase Auth
  const addLivreur = async () => {
    if (!newLivreur.nom || !newLivreur.email || !newLivreur.phone || !newLivreur.quartier || !newLivreur.typeVehicule || !newLivreur.password) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (newLivreur.password.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newLivreur.password !== newLivreur.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Créer l'utilisateur dans Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newLivreur.email, 
        newLivreur.password
      );
      
      const user = userCredential.user;

      // 2. Ajouter le livreur dans Firestore avec les documents
      const livreurData = {
        nom: newLivreur.nom,
        email: newLivreur.email,
        phone: newLivreur.phone,
        quartier: newLivreur.quartier,
        typeVehicule: newLivreur.typeVehicule,
        photo: newLivreur.photo || '',
        permisConduire: newLivreur.permisConduire || '',
        pieceIdentite: newLivreur.pieceIdentite || '',
        statut: 'livreur' as const,
        uid: user.uid,
        dateCreation: new Date(),
      };

      await addDoc(collection(db, 'livreurs'), livreurData);

      // 3. Réinitialiser le formulaire
      setShowAddLivreurModal(false);
      setNewLivreur({
        nom: '',
        email: '',
        phone: '',
        quartier: '',
        typeVehicule: '',
        password: '',
        confirmPassword: '',
        photo: '',
        permisConduire: '',
        pieceIdentite: '',
      });
      setSelectedImage(null);
      setPdfFiles({
        permisName: '',
        pieceIdentiteName: ''
      });
      
      alert('Livreur ajouté avec succès !');

    } catch (error: any) {
      console.error('Erreur lors de l\'ajout du livreur :', error);
      
      if (error.code === 'auth/email-already-in-use') {
        alert('Cette adresse email est déjà utilisée');
      } else if (error.code === 'auth/invalid-email') {
        alert('Adresse email invalide');
      } else if (error.code === 'auth/weak-password') {
        alert('Le mot de passe est trop faible');
      } else {
        alert('Une erreur est survenue lors de l\'ajout du livreur');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔹 Mettre à jour la photo d'un livreur existant
  const updateLivreurPhoto = async (livreurId: string, photoUrl: string) => {
    try {
      const livreurRef = doc(db, 'livreurs', livreurId);
      await updateDoc(livreurRef, { photo: photoUrl });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la photo :', error);
    }
  };

  // 🔹 Gérer la sélection de photo pour un livreur existant
  const handleExistingLivreurImageSelect = (event: React.ChangeEvent<HTMLInputElement>, livreurId: string) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        updateLivreurPhoto(livreurId, imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🔹 Télécharger un document
  const downloadDocument = (documentUrl: string, filename: string) => {
    if (!documentUrl) {
      alert('Document non disponible');
      return;
    }

    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = filename;
    link.click();
  };

  // 🔹 Supprimer un livreur (Firestore + Authentication)
  const deleteLivreur = async (id: string, uid?: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce livreur ? Cette action est irréversible.')) {
      return;
    }

    try {
      // 1. Supprimer le document Firestore
      await deleteDoc(doc(db, 'livreurs', id));
      
      // 2. Si un UID existe, tenter de supprimer le compte Auth
      if (uid) {
        try {
          const user = auth.currentUser;
          
          if (user && user.uid === uid) {
            await deleteUser(user);
            console.log('Compte Authentication supprimé');
          } else {
            console.warn('Impossible de supprimer le compte Authentication: nécessite une Cloud Function');
          }
        } catch (authError) {
          console.warn('Erreur suppression Auth, continuation avec Firestore seulement:', authError);
        }
      }
      
      setSelectedLivreur(null);
      alert('Livreur supprimé avec succès !');
      
    } catch (error) {
      console.error('Erreur lors de la suppression du livreur :', error);
      alert('Erreur lors de la suppression du livreur');
    }
  };

  // 🔹 Voir les détails d'une sous-collection
  const viewCollectionDetails = async (livreurId: string, collectionType: 'history' | 'enCours') => {
    try {
      setStatsLoading(prev => ({ ...prev, [livreurId]: true }));
      
      const snapshot = await getDocs(collection(db, `livreurs/${livreurId}/${collectionType}`));
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      alert(`${collectionType.toUpperCase()} - ${documents.length} document(s) trouvé(s)`);
      
      // Vous pourriez ouvrir un modal ici pour afficher les détails
      console.log(`${collectionType} documents:`, documents);
      
    } catch (error) {
      console.error(`Erreur chargement ${collectionType}:`, error);
      alert(`Erreur lors du chargement des données ${collectionType}`);
    } finally {
      setStatsLoading(prev => ({ ...prev, [livreurId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">Chargement des livreurs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8 overflow-auto">
        {/* Header avec bouton d'ajout et statistiques */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">Gestion des Livreurs</h1>
              <p className="text-gray-600 mt-2 text-lg">Gérez votre équipe de livreurs en temps réel</p>
            </div>
            <button
              onClick={() => setShowAddLivreurModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un Livreur
            </button>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Livreurs</p>
                  <p className="text-2xl font-bold text-gray-900">{livreurs.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Livraisons en cours</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {livreurs.reduce((sum, l) => sum + (l.stats?.enCours || 0), 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Livraisons terminées</p>
                  <p className="text-2xl font-bold text-green-600">
                    {livreurs.reduce((sum, l) => sum + (l.stats?.history || 0), 0)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 text-green-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grille des livreurs - CARTES PLUS GRANDES ET MIEUX ORGANISÉES */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
  {livreurs.map((livreur) => (
    <div
      key={livreur.id}
      onClick={() => setSelectedLivreur(livreur)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition cursor-pointer p-5 relative"
    >

      {/* Badge type véhicule */}
      <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1 rounded-full bg-blue-600 text-white">
        {livreur.typeVehicule?.toUpperCase() || 'LIVREUR'}
      </span>

      {/* En-tête */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl">
          {livreur.photo ? (
            <img src={livreur.photo} alt={livreur.nom} className="w-full h-full object-cover" />
          ) : (
            livreur.nom.charAt(0).toUpperCase()
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {livreur.nom}
          </h3>
          <p className="text-sm text-gray-500">{livreur.quartier}</p>
        </div>
      </div>

      {/* Infos rapides */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          📞
        </div>
        <p className="text-sm text-gray-700">{livreur.phone}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="rounded-lg bg-blue-50 p-3 text-center"
          onClick={(e) => {
            e.stopPropagation();
            viewCollectionDetails(livreur.id, 'enCours');
          }}
        >
          <p className="text-xs text-blue-700">En cours</p>
          <p className="text-xl font-bold text-blue-900">
            {livreur.stats?.enCours || 0}
          </p>
        </div>

        <div
          className="rounded-lg bg-green-50 p-3 text-center"
          onClick={(e) => {
            e.stopPropagation();
            viewCollectionDetails(livreur.id, 'history');
          }}
        >
          <p className="text-xs text-green-700">Terminées</p>
          <p className="text-xl font-bold text-green-900">
            {livreur.stats?.history || 0}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t text-sm">
        <span className="text-gray-500">
          {livreur.dateCreation?.seconds
            ? new Date(livreur.dateCreation.seconds * 1000).toLocaleDateString('fr-FR')
            : '—'}
        </span>

        <button className="text-blue-600 font-medium hover:underline">
          Voir détails →
        </button>
      </div>
    </div>
  ))}
</div>


        {/* Message si aucun livreur */}
        {livreurs.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 mt-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🚴</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucun livreur trouvé</h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Commencez par constituer votre équipe de livreurs pour assurer vos livraisons
            </p>
            <button
              onClick={() => setShowAddLivreurModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-xl font-semibold shadow-lg transition-all duration-200 hover:shadow-xl text-lg"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter votre premier livreur
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Inputs files cachés */}
      <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
      <input type="file" ref={permisInputRef} onChange={(e) => handleDocumentSelect(e, 'permis')} accept=".pdf" className="hidden" />
      <input type="file" ref={pieceIdentiteInputRef} onChange={(e) => handleDocumentSelect(e, 'pieceIdentite')} accept=".pdf" className="hidden" />

      {/* Modal d'ajout de livreur - DESIGN AMÉLIORÉ */}
      {showAddLivreurModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            {/* En-tête gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Nouveau Livreur</h2>
                    <p className="text-blue-100 text-sm">Remplissez les informations du livreur</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddLivreurModal(false);
                    setSelectedImage(null);
                    setNewLivreur({
                      nom: '',
                      email: '',
                      phone: '',
                      quartier: '',
                      typeVehicule: '',
                      password: '',
                      confirmPassword: '',
                      photo: '',
                      permisConduire: '',
                      pieceIdentite: '',
                    });
                    setPdfFiles({
                      permisName: '',
                      pieceIdentiteName: ''
                    });
                  }}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Contenu avec 2 colonnes */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Colonne gauche - Photo et documents */}
                <div className="space-y-8">
                  {/* Photo upload */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Photo de profil</h3>
                    <div 
                      className="w-32 h-32 mx-auto bg-gradient-to-br from-gray-50 to-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:from-gray-100 hover:to-gray-200 transition-all relative overflow-hidden border-4 border-white shadow-lg"
                      onClick={handleImageClick}
                    >
                      {selectedImage ? (
                        <img 
                          src={selectedImage} 
                          alt="Photo sélectionnée"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="text-center">
                          <div className="text-3xl text-gray-400 mb-2">📷</div>
                          <span className="text-gray-500 text-sm block">Ajouter photo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all flex items-center justify-center rounded-full">
                        <span className="text-white text-xs opacity-0 hover:opacity-100 transition-all">
                          {selectedImage ? 'Changer' : 'Ajouter'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Documents PDF */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                    
                    <div className="space-y-4">
                      <div 
                        onClick={handlePermisClick}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer hover:bg-blue-50/50"
                      >
                        <div className="text-3xl text-gray-400 mb-3">🚗</div>
                        <h4 className="font-medium text-gray-900 mb-1">Permis de conduire</h4>
                        <p className="text-gray-600 text-sm mb-3">PDF (max 10MB)</p>
                        {pdfFiles.permisName ? (
                          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm truncate max-w-[150px]">{pdfFiles.permisName}</span>
                          </div>
                        ) : (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            + Ajouter un fichier
                          </button>
                        )}
                      </div>

                      <div 
                        onClick={handlePieceIdentiteClick}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-all cursor-pointer hover:bg-blue-50/50"
                      >
                        <div className="text-3xl text-gray-400 mb-3">🆔</div>
                        <h4 className="font-medium text-gray-900 mb-1">Pièce d'identité</h4>
                        <p className="text-gray-600 text-sm mb-3">PDF (max 10MB)</p>
                        {pdfFiles.pieceIdentiteName ? (
                          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm truncate max-w-[150px]">{pdfFiles.pieceIdentiteName}</span>
                          </div>
                        ) : (
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            + Ajouter un fichier
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne droite - Formulaire */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                      <input
                        type="text"
                        value={newLivreur.nom}
                        onChange={(e) => setNewLivreur({...newLivreur, nom: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        value={newLivreur.email}
                        onChange={(e) => setNewLivreur({...newLivreur, email: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone *</label>
                      <input
                        type="tel"
                        value={newLivreur.phone}
                        onChange={(e) => setNewLivreur({...newLivreur, phone: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quartier *</label>
                      <input
                        type="text"
                        value={newLivreur.quartier}
                        onChange={(e) => setNewLivreur({...newLivreur, quartier: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Centre-ville, Quartier des affaires..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Type de véhicule *</label>
                      <select
                        value={newLivreur.typeVehicule}
                        onChange={(e) => setNewLivreur({...newLivreur, typeVehicule: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="">Sélectionnez un véhicule</option>
                        <option value="moto">🏍️ Moto</option>
                        <option value="voiture">🚗 Voiture</option>
                        <option value="velo">🚲 Vélo</option>
                        <option value="scooter">🛵 Scooter</option>
                        <option value="camionnette">🚐 Camionnette</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Sécurité</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                      <input
                        type="password"
                        value={newLivreur.password}
                        onChange={(e) => setNewLivreur({...newLivreur, password: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Minimum 6 caractères"
                      />
                      <p className="text-xs text-gray-500 mt-1">Le mot de passe doit contenir au moins 6 caractères</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe *</label>
                      <input
                        type="password"
                        value={newLivreur.confirmPassword}
                        onChange={(e) => setNewLivreur({...newLivreur, confirmPassword: e.target.value})}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Répétez le mot de passe"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowAddLivreurModal(false);
                    setSelectedImage(null);
                    setNewLivreur({
                      nom: '',
                      email: '',
                      phone: '',
                      quartier: '',
                      typeVehicule: '',
                      password: '',
                      confirmPassword: '',
                      photo: '',
                      permisConduire: '',
                      pieceIdentite: '',
                    });
                    setPdfFiles({
                      permisName: '',
                      pieceIdentiteName: ''
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={addLivreur}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Ajout en cours...
                    </div>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Ajouter le livreur
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PROFESSIONNEL POUR LES DÉTAILS DU LIVREUR */}
{selectedLivreur && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
    <button
  onClick={() => setSelectedLivreur(null)}
  className="absolute top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
  aria-label="Fermer"
>
  ✕
</button>
    <div 
className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto relative animate-slideUp"
      onClick={(e) => e.stopPropagation()}
    >
      {/* En-tête élégant avec gradient */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl overflow-hidden border-4 border-white/30 shadow-lg">
                {selectedLivreur.photo ? (
                  <img 
                    src={selectedLivreur.photo} 
                    alt={selectedLivreur.nom}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">
                      {selectedLivreur.nom.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-white truncate">{selectedLivreur.nom}</h2>
              <div className="flex items-center gap-2 mt-1">
                <svg className="w-4 h-4 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-blue-100 text-sm truncate">{selectedLivreur.email}</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                  {selectedLivreur.typeVehicule || 'LIVREUR'}
                </span>
                <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                  {selectedLivreur.quartier}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedLivreur(null)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors ml-2"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Corps du modal avec stats et informations */}
      <div className="p-6">
        {/* Statistiques de performance */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Activité en temps réel
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Carte livraisons en cours */}
            <div 
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={(e) => {
                e.stopPropagation();
                viewCollectionDetails(selectedLivreur.id, 'enCours');
              }}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide">En cours</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{selectedLivreur.stats?.enCours || 0}</p>
                  <p className="text-xs text-blue-600 mt-1">Livraisons actives</p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 backdrop-blur-sm">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Carte livraisons terminées */}
            <div 
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 border border-emerald-200 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={(e) => {
                e.stopPropagation();
                viewCollectionDetails(selectedLivreur.id, 'history');
              }}
            >
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">Terminées</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-900">{selectedLivreur.stats?.history || 0}</p>
                  <p className="text-xs text-emerald-600 mt-1">Livraisons complétées</p>
                </div>
                <div className="p-3 rounded-xl bg-white/50 backdrop-blur-sm">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informations détaillées */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Informations détaillées
          </h3>
          <div className="space-y-4">
            {/* Téléphone */}
            <div className="flex items-center gap-4 p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/50 transition-colors">
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">Téléphone</p>
                <p className="text-lg font-semibold text-gray-900 truncate">{selectedLivreur.phone}</p>
              </div>
              <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            {/* Quartier */}
            <div className="flex items-center gap-4 p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/50 transition-colors">
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">Zone de couverture</p>
                <p className="text-lg font-semibold text-gray-900">{selectedLivreur.quartier}</p>
              </div>
            </div>

            {/* Date d'ajout */}
            <div className="flex items-center gap-4 p-3 bg-gray-50/70 rounded-xl hover:bg-gray-100/50 transition-colors">
              <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">Membre depuis</p>
                <p className="text-lg font-semibold text-gray-900">
                  {selectedLivreur.dateCreation?.seconds 
                    ? new Date(selectedLivreur.dateCreation.seconds * 1000).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Date inconnue'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Documents
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {/* Permis */}
            <button
              onClick={() => downloadDocument(selectedLivreur.permisConduire || '', `permis-${selectedLivreur.nom}.pdf`)}
              disabled={!selectedLivreur.permisConduire}
              className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedLivreur.permisConduire 
                  ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 hover:shadow-md' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                selectedLivreur.permisConduire 
                  ? 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <span className="text-2xl">🚗</span>
              </div>
              <span className={`font-medium ${
                selectedLivreur.permisConduire ? 'text-emerald-800' : 'text-gray-400'
              }`}>
                Permis
              </span>
              {selectedLivreur.permisConduire ? (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-emerald-600">Disponible</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 mt-1">Manquant</span>
              )}
            </button>

            {/* Pièce d'identité */}
            <button
              onClick={() => downloadDocument(selectedLivreur.pieceIdentite || '', `piece-identite-${selectedLivreur.nom}.pdf`)}
              disabled={!selectedLivreur.pieceIdentite}
              className={`group relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${
                selectedLivreur.pieceIdentite 
                  ? 'border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md' 
                  : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              }`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                selectedLivreur.pieceIdentite 
                  ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <span className="text-2xl">🆔</span>
              </div>
              <span className={`font-medium ${
                selectedLivreur.pieceIdentite ? 'text-blue-800' : 'text-gray-400'
              }`}>
                Pièce d'identité
              </span>
              {selectedLivreur.pieceIdentite ? (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-blue-600">Disponible</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400 mt-1">Manquant</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-5 bg-gray-50/80 border-t border-gray-200">
        <div className="flex gap-3">
          <button
            onClick={() => {
              // Fonction pour modifier le livreur (à implémenter)
              alert('Fonction de modification à implémenter');
            }}
            className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </button>
          <button
            onClick={() => deleteLivreur(selectedLivreur.id, selectedLivreur.uid)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mt-3">
          La suppression est irréversible et affectera les livraisons en cours
        </p>
      </div>
    </div>
  </div>
)}
    </div>
  );
}