import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export const uploadImageToStorage = async (file: File): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `products/${fileName}`);

    // Upload du fichier dans Storage
    const snapshot = await uploadBytes(storageRef, file);

    // Récupération de l'URL publique
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Erreur lors de l’upload de l’image:', error);
    throw error;
  }
};
