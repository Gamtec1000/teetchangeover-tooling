// src/firebase.ts
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithEmailAndPassword as firebaseSignIn,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  writeBatch,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import type { Machine, Part, PipeSize, Tool, ChangeoverTemplate, Step, ConsumableItem, ConsumableLog } from './types'; // Removed ChangeoverLog

const firebaseConfig = {
  apiKey: "AIzaSyCQdV6juev_fqawgWbDeQufui17LBO4EyY",
  authDomain: "teetchangeover-tooling.firebaseapp.com",
  projectId: "teetchangeover-tooling",
  storageBucket: "teetchangeover-tooling.firebasestorage.app",
  messagingSenderId: "511419432642",
  appId: "1:511419432642:web:7c352c6d171fdac915855b",
  measurementId: "G-C2626PXJCZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth state listener for auto-anonymous sign-in
firebaseAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch((error) => {
      console.error("Anonymous sign-in failed:", error);
    });
  }
});

// Wrapper functions to simplify auth usage (hide auth parameter)
const signInWithEmailAndPassword = (email: string, password: string) =>
  firebaseSignIn(auth, email, password);

const signOut = () => firebaseSignOut(auth);

const onAuthStateChanged = (callback: (user: any) => void) =>
  firebaseAuthStateChanged(auth, callback);

// Function to get real-time updates for a collection
const getCollectionSnapshot = (collectionName: string, callback: (data: any[]) => void) => {
  const coll = collection(db, collectionName);
  return onSnapshot(coll, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error(`Error fetching ${collectionName}:`, error);
  });
};

// --- File Upload ---
const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`File upload failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url;
  } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
  }
};


// --- CRUD Functions for Machines ---
const getMachines = async (): Promise<Machine[]> => {
    const machinesCollection = collection(db, 'machines');
    const machineSnapshot = await getDocs(machinesCollection);
    return machineSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Machine));
};
const addMachine = (machineData: Partial<Machine>) => addDoc(collection(db, 'machines'), machineData);
const updateMachine = (id: string, machineData: Partial<Machine>) => updateDoc(doc(db, 'machines', id), machineData);
const deleteMachine = (id: string) => deleteDoc(doc(db, 'machines', id));

// --- CRUD Functions for Parts ---
const getParts = async (): Promise<Part[]> => {
    const partsCollection = collection(db, 'parts');
    const partSnapshot = await getDocs(partsCollection);
    return partSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Part));
};
const getPartsForMachineAndSize = async (machineId: string, pipeSize: string): Promise<Part[]> => {
    const partsCollection = collection(db, 'parts');
    const q = query(partsCollection, where('machineId', '==', machineId), where('pipeSize', '==', pipeSize));
    const partSnapshot = await getDocs(q);
    return partSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Part));
};
const getPartsForMachine = async (machineId: string): Promise<Part[]> => {
    const partsCollection = collection(db, 'parts');
    const q = query(partsCollection, where('machineId', '==', machineId));
    const partSnapshot = await getDocs(q);
    return partSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Part));
};
const addPart = (partData: Partial<Part>) => addDoc(collection(db, 'parts'), partData);
const updatePart = (id: string, partData: Partial<Part>) => updateDoc(doc(db, 'parts', id), partData);
const deletePart = (id: string) => deleteDoc(doc(db, 'parts', id));

const getPartForMachinePipeAndFamily = async (machineId: string, pipeSize: string, partFamily: string): Promise<Part | null> => {
    const partsCollection = collection(db, 'parts');
    const q = query(
        partsCollection,
        where('machineId', '==', machineId),
        where('pipeSize', '==', pipeSize),
        where('partFamily', '==', partFamily)
    );
    const partSnapshot = await getDocs(q);
    if (partSnapshot.empty) {
        return null;
    }
    return { id: partSnapshot.docs[0].id, ...partSnapshot.docs[0].data() } as Part;
};

const getPartForMachinePipeAndName = async (machineId: string, pipeSize: string, partName: string): Promise<Part | null> => {
    const partsCollection = collection(db, 'parts');
    const q = query(
        partsCollection,
        where('machineId', '==', machineId),
        where('pipeSize', '==', pipeSize),
        where('name', '==', partName)
    );
    const partSnapshot = await getDocs(q);
    if (partSnapshot.empty) {
        return null;
    }
    return { id: partSnapshot.docs[0].id, ...partSnapshot.docs[0].data() } as Part;
};

// --- CRUD Functions for Tools ---
const getTools = async (): Promise<Tool[]> => {
    const toolsCollection = collection(db, 'tools');
    const toolSnapshot = await getDocs(toolsCollection);
    return toolSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tool));
};
const addTool = (toolData: Partial<Tool>) => addDoc(collection(db, 'tools'), toolData);
const updateTool = (id: string, toolData: Partial<Tool>) => updateDoc(doc(db, 'tools', id), toolData);
const deleteTool = (id: string) => deleteDoc(doc(db, 'tools', id));

// --- CRUD Functions for Pipe Sizes ---
const getPipeSizes = async (): Promise<PipeSize[]> => {
    const pipeSizesCollection = collection(db, 'pipe_sizes');
    const pipeSizeSnapshot = await getDocs(pipeSizesCollection);
    return pipeSizeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PipeSize));
};
const addPipeSize = (pipeSizeData: Partial<PipeSize>) => addDoc(collection(db, 'pipe_sizes'), pipeSizeData);
const updatePipeSize = (id: string, pipeSizeData: Partial<PipeSize>) => updateDoc(doc(db, 'pipe_sizes', id), pipeSizeData);
const deletePipeSize = (id: string) => deleteDoc(doc(db, 'pipe_sizes', id));


// --- CRUD Functions for Changeover Templates ---
const getChangeoverTemplates = async (): Promise<ChangeoverTemplate[]> => {
    const templatesCollection = collection(db, 'changeover_templates');
    const templateSnapshot = await getDocs(templatesCollection);
    return templateSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangeoverTemplate));
};

const getChangeoverTemplate = async (machineId: string): Promise<ChangeoverTemplate | null> => {
    const templatesCollection = collection(db, 'changeover_templates');
    const q = query(templatesCollection, where('machineId', '==', machineId));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    const templateDoc = querySnapshot.docs[0];
    const stepsCollection = collection(db, 'changeover_templates', templateDoc.id, 'steps');
    const stepsSnapshot = await getDocs(stepsCollection);
    // Corrected the id spread issue
    const steps = stepsSnapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, id: doc.id } as Step;
    });
    return { ...templateDoc.data(), id: templateDoc.id, steps } as ChangeoverTemplate;
};

const addChangeoverTemplate = (templateData: Partial<ChangeoverTemplate>) => addDoc(collection(db, 'changeover_templates'), templateData);

const updateChangeoverTemplate = (templateId: string, templateData: Partial<ChangeoverTemplate>) =>
  updateDoc(doc(db, 'changeover_templates', templateId), templateData);

const deleteChangeoverTemplate = async (templateId: string) => {
    const batch = writeBatch(db);
    const stepsCollection = collection(db, 'changeover_templates', templateId, 'steps');
    const stepsSnapshot = await getDocs(stepsCollection);
    stepsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    batch.delete(doc(db, 'changeover_templates', templateId));
    return batch.commit();
};

const addStep = (templateId: string, stepData: Partial<Step>) => addDoc(collection(db, 'changeover_templates', templateId, 'steps'), stepData);
const deleteStep = (templateId: string, stepId: string) => deleteDoc(doc(db, 'changeover_templates', templateId, 'steps', stepId));
const updateStep = (templateId: string, stepId: string, stepData: Partial<Step>) => updateDoc(doc(db, 'changeover_templates', templateId, 'steps', stepId), stepData);

// Subscribe to steps subcollection for real-time updates
const subscribeToSteps = (templateId: string, callback: (steps: Step[]) => void) => {
  const stepsCollection = collection(db, 'changeover_templates', templateId, 'steps');
  return onSnapshot(stepsCollection, (snapshot) => {
    const steps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Step));
    callback(steps);
  }, (error) => {
    console.error('Error subscribing to steps:', error);
  });
};

// --- CRUD Functions for Changeover Logs ---
const addChangeoverLog = (logData: {
  machineId: string;
  fromSize: string;
  toSize: string;
  duration: number;
  stepNotes: any[];
  finalNote: string;
  operatorName: string;
}) => addDoc(collection(db, 'changeover_logs'), { ...logData, date: serverTimestamp() });

const deleteChangeoverLog = (logId: string) => deleteDoc(doc(db, 'changeover_logs', logId));

const deleteAllChangeoverLogs = async () => {
    const logsCollection = collection(db, 'changeover_logs');
    const snapshot = await getDocs(logsCollection);
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();
};

// --- CRUD Functions for Consumable Items ---
const getConsumables = async (machineId?: string): Promise<ConsumableItem[]> => {
  const coll = collection(db, 'consumable_items');
  let q;
  if (machineId) {
    q = query(coll, where('machineId', '==', machineId));
  } else {
    q = coll;
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsumableItem));
};

const addConsumable = (data: Partial<ConsumableItem>) => addDoc(collection(db, 'consumable_items'), data);
const updateConsumable = (id: string, data: Partial<ConsumableItem>) => updateDoc(doc(db, 'consumable_items', id), data);
const deleteConsumable = (id: string) => deleteDoc(doc(db, 'consumable_items', id));

// --- Functions for Consumable Usage Logs ---
const getConsumableLogs = async (machineId?: string): Promise<ConsumableLog[]> => {
  const coll = collection(db, 'consumable_logs');
  let q;
  if (machineId) {
    q = query(coll, where('machineId', '==', machineId));
  } else {
    q = coll;
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConsumableLog));
};

const consumeItem = async (itemId: string, quantity: number, logData: Partial<ConsumableLog>) => {
    return runTransaction(db, async (transaction) => {
        const itemRef = doc(db, 'consumable_items', itemId);
        const itemDoc = await transaction.get(itemRef);
        
        if (!itemDoc.exists()) {
            throw "Document does not exist!";
        }

        const currentStock = itemDoc.data().stock || 0;
        const newStock = currentStock - quantity;

        transaction.update(itemRef, { stock: newStock });
        
        const logRef = doc(collection(db, 'consumable_logs'));
        transaction.set(logRef, {
            ...logData,
            itemId,
            quantityUsed: quantity,
            timestamp: serverTimestamp()
        });
    });
};

export { 
  auth, 
  db, 
  uploadFile,
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  getCollectionSnapshot,
  getMachines,
  addMachine,
  updateMachine,
  deleteMachine,
  getParts,
  getPartsForMachineAndSize,
  getPartsForMachine,
  getPartForMachinePipeAndFamily,
  getPartForMachinePipeAndName,
  addPart,
  updatePart,
  deletePart,
  getTools,
  addTool,
  updateTool,
  deleteTool,
  getPipeSizes,
  addPipeSize,
  updatePipeSize,
  deletePipeSize,
  getChangeoverTemplates,
  getChangeoverTemplate,
  addChangeoverTemplate,
  updateChangeoverTemplate,
  deleteChangeoverTemplate,
  addStep,
  deleteStep,
  updateStep,
  subscribeToSteps,
  addChangeoverLog,
  deleteChangeoverLog,
  deleteAllChangeoverLogs,
  getConsumables,
  addConsumable,
  updateConsumable,
  deleteConsumable,
  getConsumableLogs,
  consumeItem
};
