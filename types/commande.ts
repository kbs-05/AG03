// types/commande.ts

export interface Item {
  id: string;
  nom: string;
  prix: number;
  cartQuantity: number;
  totalPrice: number;
  imageUrl: string;
  category: string;
  discount: number;
  unite: string;
}

export interface Commande {
  id: string;
  client: string;           // nom du client
  status: string;           // ex: "en attente"
  commandetotal: number;
  orderNumber: number;
  date: string | Date;
  items: Item[];
  shippingCost: number;
  subtotal: number;
  userId: string;
}