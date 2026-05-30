import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const COLL = 'mantek_v2';

const SEED_EQUIPMENT = [
  { id:"mol1", code:"MOL-01", name:"Mol 1", type:"Tracto Terminal", location:"Patio Terminal", criticality:"A", status:"operativo", hours:0 },
  { id:"mol2", code:"MOL-02", name:"Mol 2", type:"Tracto Terminal", location:"Patio Terminal", criticality:"A", status:"operativo", hours:0 },
  { id:"gru39", code:"GRU-39", name:"Grúa 39", type:"Grúa Portuaria", location:"Muelle", criticality:"A", status:"operativo", hours:0 },
  { id:"gru40", code:"GRU-40", name:"Grúa 40", type:"Grúa Portuaria", location:"Muelle", criticality:"A", status:"operativo", hours:0 },
  { id:"gru41", code:"GRU-41", name:"Grúa 41", type:"Grúa Portuaria", location:"Muelle", criticality:"A", status:"operativo", hours:0 },
];

const KEYS = ['users','equipment','plans','requests','workOrders','taskTemplates','checklists'];
const KEY_MAP = {
  users:'users', equipment:'equip', plans:'plans',
  requests:'requests', workOrders:'wos',
  taskTemplates:'taskTemplates', checklists:'checklists',
};
const SEEDS = {
  users:[], equipment:SEED_EQUIPMENT, plans:[], requests:[],
  workOrders:[], taskTemplates:[], checklists:[],
};

export function useLegacyData() {
  const [data, setData] = useState({
    users:[], equip:SEED_EQUIPMENT, plans:[], requests:[], wos:[], taskTemplates:[], checklists:[],
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize empty keys
    const init = async () => {
      for (const k of KEYS) {
        try {
          const s = await getDoc(doc(db, COLL, k));
          if (!s.exists()) await setDoc(doc(db, COLL, k), { data: SEEDS[k] });
        } catch (_) {}
      }
      setInitialized(true);
    };
    init();

    // Subscribe to real-time updates
    const unsubs = KEYS.map(key =>
      onSnapshot(doc(db, COLL, key), snap => {
        const stateKey = KEY_MAP[key] || key;
        setData(prev => ({
          ...prev,
          [stateKey]: snap.exists() ? (snap.data().data || []) : [],
        }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, []);

  const saveData = async (key, value) => {
    await setDoc(doc(db, COLL, key), { data: value });
  };

  return { data, setData, saveData, initialized };
}
