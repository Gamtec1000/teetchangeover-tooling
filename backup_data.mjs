// backup_data.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

// Copied config from client/src/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBMJ0bA0R1dPH6S-H4MIvHemIhTWtKxehs",
  authDomain: "shop-floor-kiosk.firebaseapp.com",
  projectId: "shop-floor-kiosk",
  storageBucket: "shop-floor-kiosk.firebasestorage.app",
  messagingSenderId: "357012202474",
  appId: "1:357012202474:web:598771fdd7be3cc7b80893",
  measurementId: "G-B8M4T1V92G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const collectionsToBackup = [
    'machines',
    'parts',
    'tools',
    'pipe_sizes',
    'changeover_templates',
    'changeover_logs' // Added logs just in case
];

async function backup() {
    console.log('Starting backup...');
    const data = {};

    for (const colName of collectionsToBackup) {
        console.log(`Fetching ${colName}...`);
        const querySnapshot = await getDocs(collection(db, colName));
        const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Special handling for templates to get sub-collections (steps)
        if (colName === 'changeover_templates') {
            for (const tmpl of docs) {
                console.log(`  Fetching steps for template ${tmpl.id}...`);
                const stepsSnapshot = await getDocs(collection(db, 'changeover_templates', tmpl.id, 'steps'));
                tmpl.steps = stepsSnapshot.docs.map(s => ({ id: s.id, ...s.data() }));
            }
        }

        data[colName] = docs;
    }

    fs.writeFileSync('backup_full.json', JSON.stringify(data, null, 2));
    console.log('Backup complete! Data saved to backup_full.json');
    process.exit(0);
}

backup().catch(err => {
    console.error('Backup failed:', err);
    process.exit(1);
});
