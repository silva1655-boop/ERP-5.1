import { db } from "./firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { COLL } from "../utils/constants";

const KEY_MAP = {
  users: "users",
  equipment: "equip",
  plans: "plans",
  requests: "requests",
  workOrders: "wos",
  taskTemplates: "taskTemplates",
  checklists: "checklists",
};

export function subscribeToData(keys, callback) {
  const unsubscribers = [];
  const state = {};
  let loaded = 0;
  for (const key of keys) {
    const unsub = onSnapshot(doc(db, COLL, key), (snap) => {
      state[KEY_MAP[key] || key] = snap.exists() ? (snap.data().data || []) : [];
      loaded++;
      if (loaded >= keys.length) callback({ ...state });
    });
    unsubscribers.push(unsub);
  }
  return () => unsubscribers.forEach(u => u());
}

export async function saveData(key, value) {
  try {
    await setDoc(doc(db, COLL, key), { data: value });
  } catch (e) {
    console.error(`saveData(${key}):`, e);
    throw e;
  }
}

export async function initIfEmpty(key, seed) {
  try {
    const s = await getDoc(doc(db, COLL, key));
    if (!s.exists()) await setDoc(doc(db, COLL, key), { data: seed });
  } catch (e) { console.error(`initIfEmpty(${key}):`, e); }
}

export async function mergeUsers(seed) {
  try {
    const s = await getDoc(doc(db, COLL, "users"));
    if (!s.exists()) { await setDoc(doc(db, COLL, "users"), { data: seed }); return; }
    const existing = s.data().data || [];
    const missing = seed.filter(su => !existing.find(eu => eu.id === su.id));
    if (missing.length > 0) await setDoc(doc(db, COLL, "users"), { data: [...existing, ...missing] });
  } catch (e) { console.error("mergeUsers:", e); }
}
