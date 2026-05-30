import { useState, useEffect } from "react";
import { subscribeToData, saveData, initIfEmpty, mergeUsers } from "../services/dataService";
import {
  SEED_USERS, SEED_EQUIPMENT, SEED_PM_PLANS, SEED_REQUESTS,
  SEED_WORK_ORDERS, SEED_TASK_TEMPLATES, SEED_CHECKLISTS
} from "../utils/constants";

const KEYS = ["users","equipment","plans","requests","workOrders","taskTemplates","checklists"];

export function useAppData() {
  const [data, setData] = useState({
    users: SEED_USERS,
    equip: SEED_EQUIPMENT,
    plans: SEED_PM_PLANS,
    requests: SEED_REQUESTS,
    wos: SEED_WORK_ORDERS,
    taskTemplates: SEED_TASK_TEMPLATES,
    checklists: SEED_CHECKLISTS,
  });
  const [initialized, setInitialized] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const seeds = {
      users: SEED_USERS,
      equipment: SEED_EQUIPMENT,
      plans: SEED_PM_PLANS,
      requests: SEED_REQUESTS,
      workOrders: SEED_WORK_ORDERS,
      taskTemplates: SEED_TASK_TEMPLATES,
      checklists: SEED_CHECKLISTS,
    };

    const init = async () => {
      await mergeUsers(SEED_USERS);
      for (const k of KEYS.filter(k => k !== "users")) {
        await initIfEmpty(k, seeds[k]);
      }
      setInitialized(true);
    };
    init();

    const unsub = subscribeToData(KEYS, (newData) => {
      setOnline(true);
      setData(prev => ({ ...prev, ...newData }));
    });

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { data, setData, saveData, initialized, online };
}
