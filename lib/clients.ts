import { collection, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/** --- Types --- **/
export type Client = {
  id?: string;
  displayName: string;
  email: string;
  phoneNumber: string;
  adresse: string;
  date: string;
  photoURL:string;
};

export type Coupon = {
  code: string;
  discount: number;
  active: boolean;
  used: boolean;
};

export type Notification = {
  title: string;
  message: string;
  motif: string;
  date?: string; // auto-généré à l'envoi
};

/** --- Récupérer tous les clients --- **/
export async function getClients(): Promise<Client[]> {
  const snapshot = await getDocs(collection(db, 'clients'));
  return snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  } as Client));
}

/** --- Récupérer les détails d’un client avec commandes & favoris --- **/
export async function getClientDetails(clientId: string) {
  const clientRef = doc(db, 'clients', clientId);
  const clientSnap = await getDoc(clientRef);

  if (!clientSnap.exists()) {
    throw new Error('Client introuvable');
  }

  // Récupérer le nombre de commandes
  const ordersSnap = await getDocs(collection(db, 'clients', clientId, 'orders'));
  const ordersCount = ordersSnap.size;

  // Récupérer le nombre de favoris
  const favoritesSnap = await getDocs(collection(db, 'clients', clientId, 'favorites'));
  const favoritesCount = favoritesSnap.size;

  return {
    id: clientId,
    ...clientSnap.data(),
    ordersCount,
    favoritesCount
  };
}

/** --- Assigner un coupon à un client --- **/
export async function assignCoupon(clientId: string, coupon: Coupon) {
  const couponsRef = collection(db, 'clients', clientId, 'coupons');
  await addDoc(couponsRef, coupon);
}

/** --- Envoyer une notification à un client --- **/
export async function sendNotification(clientId: string, notification: Notification) {
  const notificationsRef = collection(db, 'clients', clientId, 'notifications');
  await addDoc(notificationsRef, {
    ...notification,
    date: new Date().toISOString()
  });
}
