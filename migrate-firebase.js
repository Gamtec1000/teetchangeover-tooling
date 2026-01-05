// Firebase Migration Script
// Copies data from shop-floor-kiosk to teetchangeover-tooling

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc, addDoc, writeBatch } = require('firebase/firestore');

// OLD Firebase project (source)
const oldConfig = {
  apiKey: "AIzaSyBMJ0bA0R1dPH6S-H4MIvHemIhTWtKxehs",
  authDomain: "shop-floor-kiosk.firebaseapp.com",
  projectId: "shop-floor-kiosk",
  storageBucket: "shop-floor-kiosk.firebasestorage.app",
  messagingSenderId: "357012202474",
  appId: "1:357012202474:web:598771fdd7be3cc7b80893"
};

// NEW Firebase project (destination)
const newConfig = {
  apiKey: "AIzaSyCQdV6juev_fqawgWbDeQufui17LBO4EyY",
  authDomain: "teetchangeover-tooling.firebaseapp.com",
  projectId: "teetchangeover-tooling",
  storageBucket: "teetchangeover-tooling.firebasestorage.app",
  messagingSenderId: "511419432642",
  appId: "1:511419432642:web:7c352c6d171fdac915855b"
};

// Initialize both apps
const oldApp = initializeApp(oldConfig, 'old');
const newApp = initializeApp(newConfig, 'new');

const oldDb = getFirestore(oldApp);
const newDb = getFirestore(newApp);

// Collections to migrate
const collectionsToMigrate = [
  'machines',
  'parts',
  'tools',
  'pipe_sizes',
  'changeover_templates',
  'changeover_logs',
  'consumable_items',
  'consumable_logs'
];

async function migrateCollection(collectionName) {
  console.log(`\nMigrating: ${collectionName}...`);

  try {
    const oldCollection = collection(oldDb, collectionName);
    const snapshot = await getDocs(oldCollection);

    if (snapshot.empty) {
      console.log(`  No documents found in ${collectionName}`);
      return 0;
    }

    let count = 0;
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const newDocRef = doc(newDb, collectionName, docSnap.id);
      await setDoc(newDocRef, data);
      count++;

      // Handle subcollections for changeover_templates (steps)
      if (collectionName === 'changeover_templates') {
        const stepsCollection = collection(oldDb, collectionName, docSnap.id, 'steps');
        const stepsSnapshot = await getDocs(stepsCollection);

        for (const stepDoc of stepsSnapshot.docs) {
          const stepData = stepDoc.data();
          const newStepRef = doc(newDb, collectionName, docSnap.id, 'steps', stepDoc.id);
          await setDoc(newStepRef, stepData);
        }

        if (!stepsSnapshot.empty) {
          console.log(`    - Migrated ${stepsSnapshot.size} steps for template: ${data.name || docSnap.id}`);
        }
      }
    }

    console.log(`  Migrated ${count} documents from ${collectionName}`);
    return count;
  } catch (error) {
    console.error(`  Error migrating ${collectionName}:`, error.message);
    return 0;
  }
}

async function migrate() {
  console.log('='.repeat(50));
  console.log('Firebase Data Migration');
  console.log('From: shop-floor-kiosk');
  console.log('To:   teetchangeover-tooling');
  console.log('='.repeat(50));

  let totalDocs = 0;

  for (const collectionName of collectionsToMigrate) {
    const count = await migrateCollection(collectionName);
    totalDocs += count;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Migration complete! Total documents migrated: ${totalDocs}`);
  console.log('='.repeat(50));

  process.exit(0);
}

migrate().catch(console.error);
