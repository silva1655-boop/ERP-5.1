import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLL = 'mantek_v2';

const SEED_EQUIPMENT = [
  { id:"mol1",  code:"MOL-01",  name:"Mol 1",   type:"Tracto Terminal", location:"Patio Terminal", criticality:"A", status:"operativo", hours:0 },
  { id:"mol2",  code:"MOL-02",  name:"Mol 2",   type:"Tracto Terminal", location:"Patio Terminal", criticality:"A", status:"operativo", hours:0 },
  { id:"gru39", code:"GRU-39",  name:"Grúa 39", type:"Grúa Portuaria",  location:"Muelle",         criticality:"A", status:"operativo", hours:0 },
  { id:"gru40", code:"GRU-40",  name:"Grúa 40", type:"Grúa Portuaria",  location:"Muelle",         criticality:"A", status:"operativo", hours:0 },
  { id:"gru41", code:"GRU-41",  name:"Grúa 41", type:"Grúa Portuaria",  location:"Muelle",         criticality:"A", status:"operativo", hours:0 },
];

const KEYS = ['users', 'equipment', 'plans', 'requests', 'workOrders', 'taskTemplates', 'checklists'];
const KEY_MAP = {
  users: 'users', equipment: 'equip', plans: 'plans',
  requests: 'requests', workOrders: 'wos',
  taskTemplates: 'taskTemplates', checklists: 'checklists',
};
const SEEDS = {
  users: [], equipment: SEED_EQUIPMENT, plans: [], requests: [],
  workOrders: [], taskTemplates: [], checklists: [],
};

const INIT_STATE = {
  users: [], equip: SEED_EQUIPMENT, plans: [], requests: [],
  wos: [], taskTemplates: [], checklists: [],
};

// isAuthenticated should be passed from the auth context so Firestore
// subscriptions only start after a valid session exists — avoids permission-denied
// errors during the login screen.
export function useLegacyData(isAuthenticated = false) {
  const [data, setData]           = useState(INIT_STATE);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Try to seed any missing documents
    const init = async () => {
      for (const k of KEYS) {
        try {
          const s = await getDoc(doc(db, COLL, k));
          if (!s.exists()) await setDoc(doc(db, COLL, k), { data: SEEDS[k] });
        } catch (_) { /* permission-denied or network — skip silently */ }
      }
      setInitialized(true);
    };
    init();

    // Real-time subscriptions — only active when authenticated
    const unsubs = KEYS.map(key =>
      onSnapshot(
        doc(db, COLL, key),
        snap => {
          const stateKey = KEY_MAP[key] || key;
          setData(prev => ({
            ...prev,
            [stateKey]: snap.exists() ? (snap.data().data || []) : [],
          }));
        },
        err => {
          // permission-denied is expected for legacy sessions without Firebase Auth
          if (err.code !== 'permission-denied') {
            console.error('Firestore snapshot error:', key, err);
          }
        }
      )
    );

    return () => unsubs.forEach(u => u());
  }, [isAuthenticated]);

  const saveData = async (key, value) => {
    try {
      await setDoc(doc(db, COLL, key), { data: value });
    } catch (err) {
      if (err.code !== 'permission-denied') console.error('saveData error:', key, err);
    }
  };

  return { data, setData, saveData, initialized };
}
