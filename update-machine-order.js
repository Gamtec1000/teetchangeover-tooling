// Update machines with order field
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCQdV6juev_fqawgWbDeQufui17LBO4EyY",
  authDomain: "teetchangeover-tooling.firebaseapp.com",
  projectId: "teetchangeover-tooling",
  storageBucket: "teetchangeover-tooling.firebasestorage.app",
  messagingSenderId: "511419432642",
  appId: "1:511419432642:web:7c352c6d171fdac915855b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define the correct order
const machineOrder = {
  'Swaging': 1,
  'Stress Relief': 2,
  'Threading': 3,
  'Buck On': 4
};

async function updateMachineOrder() {
  console.log('Updating machine order...\n');

  const machinesCollection = collection(db, 'machines');
  const snapshot = await getDocs(machinesCollection);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const order = machineOrder[data.name];

    if (order !== undefined) {
      await updateDoc(doc(db, 'machines', docSnap.id), { order: order });
      console.log(`Updated: ${data.name} -> order: ${order}`);
    }
  }

  console.log('\nDone!');
  process.exit(0);
}

updateMachineOrder();
