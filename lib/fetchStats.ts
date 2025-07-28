// fetchStats.ts
import { collection, getCountFromServer, query, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchStats() {
  // Nombre total de commandes
  const commandesCountSnap = await getCountFromServer(query(collection(db, "commandes")));

  // Nombre total de produits
  const produitsCountSnap = await getCountFromServer(query(collection(db, "produits")));

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
    produits: produitsCountSnap.data().count,
    clients: clientsCountSnap.data().count,
    revenus: totalRevenus
  };
}
