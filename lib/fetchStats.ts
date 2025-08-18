// fetchStats.ts
import { collection, getCountFromServer, query, getDocs, collectionGroup } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchStats() {
  // Nombre total de commandes
  const commandesCountSnap = await getCountFromServer(query(collection(db, "commandes")));

  // Nombre total de produits via categories/{categoryId}/produits
  let produitsCount = 0;
  try {
    const produitsQuery = query(collectionGroup(db, "produits"));
    const produitsCountSnap = await getCountFromServer(produitsQuery);
    produitsCount = produitsCountSnap.data().count;
    console.log('Nombre de produits récupérés:', produitsCount);
  } catch (error) {
    console.error('Erreur lors du comptage des produits:', error);
  }

  // Nombre total de clients
  const clientsCountSnap = await getCountFromServer(query(collection(db, "clients")));

  // Calcul du total revenus (somme des montants des commandes)
  const commandesCol = collection(db, "commandes");
  const commandesSnap = await getDocs(commandesCol);
  let totalRevenus = 0;
  commandesSnap.forEach(doc => {
    const data = doc.data();
    if (data.montant) totalRevenus += Number(data.montant);
  });

  return {
    commandes: commandesCountSnap.data().count,
    categories: produitsCount,
    clients: clientsCountSnap.data().count,
    revenus: totalRevenus
  };
}
