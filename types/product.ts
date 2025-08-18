export interface Product {
  id?: string;                // Optionnel si généré par Firestore
  nom: string;                // Nom du produit
  prix: number;               // Prix de vente
  category: string;           // Nom de la catégorie
  stock: number;              // Stock actuel
  maxStock: number;           // Stock maximal initial
  stockMinimum?: number;      // Seuil minimal pour déclencher "stock faible", 10% de maxStock
  quantity: number;           // Quantité mise en vente
  unite?: string;             // Unité (kg, g, l, pièce, sac)
  imageUrl?: string;          // URL complète de l'image dans Firebase Storage
  status?: 'en-stock' | 'stock-faible'; // Statut calculé automatiquement
  published: boolean;         // Indique si le produit est affiché
  createdAt?: any;            // Timestamp Firestore
  updatedAt?: any;            // Timestamp Firestore
  description: string;
  discount: any;
}