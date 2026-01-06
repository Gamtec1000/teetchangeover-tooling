// Add sample changeover template to Firestore
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where } = require('firebase/firestore');

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

async function addSampleTemplate() {
  console.log('Adding sample changeover template...\n');

  // First, get the Swaging machine ID
  const machinesCollection = collection(db, 'machines');
  const q = query(machinesCollection, where('name', '==', 'Swaging'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.log('Error: Swaging machine not found');
    process.exit(1);
  }

  const machineId = snapshot.docs[0].id;
  console.log(`Found Swaging machine: ${machineId}`);

  // Create the template
  const templateData = {
    name: 'Standard Swaging Changeover',
    machineId: machineId,
    estimatedTime: 45,
    documents: []
  };

  const templateRef = await addDoc(collection(db, 'changeover_templates'), templateData);
  console.log(`Created template: ${templateRef.id}`);

  // Add steps to the template
  const steps = [
    {
      order: 0,
      title: 'Safety Check',
      description: 'Ensure machine is powered off and locked out. Verify all safety guards are in place. Wear appropriate PPE (safety glasses, gloves).',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    },
    {
      order: 1,
      title: 'Remove Current Die Set',
      description: 'Loosen die holder bolts using the appropriate wrench. Carefully remove the current die set and place in designated storage area.',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    },
    {
      order: 2,
      title: 'Clean Die Holder',
      description: 'Clean the die holder area thoroughly. Remove any debris, metal shavings, or old lubricant. Inspect for any damage or wear.',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    },
    {
      order: 3,
      title: 'Install New Die Set',
      description: 'Select the correct die set for the target pipe size. Align the die properly in the holder. Tighten bolts to specified torque.',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    },
    {
      order: 4,
      title: 'Adjust Machine Settings',
      description: 'Set the stroke length according to the new pipe size. Adjust pressure settings as per specification sheet. Verify all parameters on control panel.',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    },
    {
      order: 5,
      title: 'Test Run',
      description: 'Power on the machine. Run a test cycle without material. Verify smooth operation and correct measurements.',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    },
    {
      order: 6,
      title: 'Quality Check',
      description: 'Run first article with actual material. Measure dimensions against specifications. Document results and get approval before production.',
      requiredPartNames: [],
      requiredTools: [],
      imageUrls: []
    }
  ];

  console.log('\nAdding steps...');
  for (const step of steps) {
    const stepRef = await addDoc(collection(db, 'changeover_templates', templateRef.id, 'steps'), step);
    console.log(`  Added step ${step.order + 1}: ${step.title}`);
  }

  console.log('\nDone! Sample template created successfully.');
  console.log(`Template: "${templateData.name}" with ${steps.length} steps`);
  process.exit(0);
}

addSampleTemplate().catch(console.error);
