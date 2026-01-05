// migrate_urls.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import path from 'path';

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

// Helper to transform URL
const transformUrl = (url) => {
    if (!url || typeof url !== 'string') return url;
    // Check if it matches our old pattern (IP or localhost)
    if (url.includes('/uploads/')) {
        const filename = url.split('/uploads/').pop();
        return `/machine_images/${filename}`;
    }
    return url;
};

async function migrate() {
    console.log('Starting URL migration...');
    const batch = writeBatch(db);
    let operationCount = 0;

    // 1. Machines
    const machineDocs = await getDocs(collection(db, 'machines'));
    machineDocs.forEach(d => {
        const data = d.data();
        if (data.imageUrl && data.imageUrl.includes('/uploads/')) {
            batch.update(d.ref, { imageUrl: transformUrl(data.imageUrl) });
            operationCount++;
        }
    });

    // 2. Parts
    const partDocs = await getDocs(collection(db, 'parts'));
    partDocs.forEach(d => {
        const data = d.data();
        let updates = {};
        if (data.imageUrl && data.imageUrl.includes('/uploads/')) {
            updates.imageUrl = transformUrl(data.imageUrl);
        }
        if (data.pdfUrl && data.pdfUrl.includes('/uploads/')) {
            updates.pdfUrl = transformUrl(data.pdfUrl);
        }
        if (Object.keys(updates).length > 0) {
            batch.update(d.ref, updates);
            operationCount++;
        }
    });

    // 3. Tools
    const toolDocs = await getDocs(collection(db, 'tools'));
    toolDocs.forEach(d => {
        const data = d.data();
        if (data.imageUrl && data.imageUrl.includes('/uploads/')) {
            batch.update(d.ref, { imageUrl: transformUrl(data.imageUrl) });
            operationCount++;
        }
    });

    // 4. Templates (and steps)
    const tmplDocs = await getDocs(collection(db, 'changeover_templates'));
    for (const tmpl of tmplDocs.docs) {
        // Steps are sub-collections
        const stepsSnapshot = await getDocs(collection(db, 'changeover_templates', tmpl.id, 'steps'));
        stepsSnapshot.forEach(stepDoc => {
            const step = stepDoc.data();
            let updates = {};
            
            // Check imageUrls array
            if (step.imageUrls && Array.isArray(step.imageUrls)) {
                const newUrls = step.imageUrls.map(url => transformUrl(url));
                // Check if any actually changed
                if (JSON.stringify(newUrls) !== JSON.stringify(step.imageUrls)) {
                    updates.imageUrls = newUrls;
                }
            }

            if (Object.keys(updates).length > 0) {
                batch.update(stepDoc.ref, updates);
                operationCount++;
            }
        });
    }

    if (operationCount > 0) {
        console.log(`Committing ${operationCount} updates...`);
        await batch.commit();
        console.log('Migration complete!');
    } else {
        console.log('No URLs needed updating.');
    }
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
