// Add pipe sizes to Firestore
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

const pipeSizes = [
  { size: '4.5 in', order: 1 },
  { size: '5 in', order: 2 },
  { size: '5.5 in', order: 3 },
  { size: '7 in', order: 4 },
  { size: '9 5/8 in', order: 5 },
  { size: '13 3/8 in', order: 6 }
];

async function addPipeSizes() {
  console.log('Adding pipe sizes to Firestore...\n');

  for (const pipeSize of pipeSizes) {
    try {
      const docRef = await addDoc(collection(db, 'pipe_sizes'), pipeSize);
      console.log(`Added: ${pipeSize.size} (ID: ${docRef.id})`);
    } catch (error) {
      console.error(`Error adding ${pipeSize.size}:`, error.message);
    }
  }

  console.log('\nDone! Pipe sizes added successfully.');
  process.exit(0);
}

addPipeSizes();
