// lib/firestoreService.ts
import { db } from './firebase';
import { collection, addDoc, getDocs, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export const addDocument = async (collectionName: string, data: any) => {
  const docRef = await addDoc(collection(db, collectionName), data);
  return docRef.id;
};

export const getDocuments = async (collectionName: string) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const listenDocuments = (collectionName: string, callback: (docs: any[]) => void) => {
  return onSnapshot(collection(db, collectionName), snapshot => {
    const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
};

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, data);
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
};
