// types/product.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  maxStock: number;
  stockChange: number;        // Pourcentage d'évolution du stock
  imageUrl: string;           // URL complète de l'image dans Firebase Storage
  status: 'en-stock' | 'stock-faible'; // Statut calculé automatiquement
  lastMonthStock?: number;    // Stock du mois précédent pour calcul du % d'évolution
  stockMinimum?: number;      // Seuil minimal pour déclencher "stock faible"
}
