// Add machines to Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');

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

const machines = [
  { name: 'Swaging', description: 'Swaging machine for pipe end forming' },
  { name: 'Stress Relief', description: 'Stress relief heat treatment machine' },
  { name: 'Threading', description: 'Threading machine for pipe connections' },
  { name: 'Buck On', description: 'Buck on coupling machine' }
];

async function addMachines() {
  console.log('Adding machines to Firestore...\n');

  for (const machine of machines) {
    try {
      const docRef = await addDoc(collection(db, 'machines'), machine);
      console.log(`Added: ${machine.name} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`Error adding ${machine.name}:`, error.message);
    }
  }

  console.log('\nDone! Machines added successfully.');
  process.exit(0);
}

addMachines();
