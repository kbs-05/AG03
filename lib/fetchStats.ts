// fetchStats.ts
import { collection, getCountFromServer, query, getDocs, collectionGroup } from "firebase/firestore";
import { db } from "./firebase";

export async function fetchStats() {
  try {
    // 1. Nombre total de commandes
    const commandesCountSnap = await getCountFromServer(query(collection(db, "commandes")));

    // 2. Calcul du total revenus des commandes LIVRÉES uniquement
    const commandesCol = collection(db, "commandes");
    const commandesSnap = await getDocs(commandesCol);
    
    let totalRevenusLivrees = 0;
    let commandesLivreesCount = 0;
    
    commandesSnap.forEach(doc => {
      const data = doc.data();
      const status = data.status;
      
      // Vérifier si la commande est livrée (insensible à la casse)
      if (status && status.toString().toLowerCase() === 'livrée') {
        // Utiliser commandetotal au lieu de montant
        const commandeTotal = data.commandetotal || 0;
        totalRevenusLivrees += Number(commandeTotal);
        commandesLivreesCount++;
      }
    });

    console.log(`Revenus commandes livrées: ${totalRevenusLivrees} XAF (${commandesLivreesCount} commandes)`);

    // 3. Nombre total de produits via categories/{categoryId}/produits
    let produitsCount = 0;
    try {
      const produitsQuery = query(collectionGroup(db, "produits"));
      const produitsCountSnap = await getCountFromServer(produitsQuery);
      produitsCount = produitsCountSnap.data().count;
      console.log('Nombre de produits récupérés:', produitsCount);
    } catch (error) {
      console.error('Erreur lors du comptage des produits:', error);
    }

    // 4. Nombre total de clients
    const clientsCountSnap = await getCountFromServer(query(collection(db, "clients")));

    return {
      commandes: commandesCountSnap.data().count,
      commandesLivrees: commandesLivreesCount,
      produits: produitsCount,
      clients: clientsCountSnap.data().count,
      revenus: totalRevenusLivrees // Revenu des commandes livrées uniquement
    };
    
  } catch (error) {
    console.error('Erreur dans fetchStats:', error);
    // Retourner des valeurs par défaut en cas d'erreur
    return {
      commandes: 0,
      commandesLivrees: 0,
      produits: 0,
      clients: 0,
      revenus: 0
    };
  }
}