// lib/clients.ts
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export type Client = {
  id?: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
};

export async function getClients(): Promise<Client[]> {
  const snapshot = await getDocs(collection(db, 'clients'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
}
