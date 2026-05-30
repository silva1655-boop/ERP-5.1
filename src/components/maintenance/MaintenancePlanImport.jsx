import { useState } from 'react';
import Modal from '../modals/Modal';
import Toast from '../common/Toast';
import { parseMaintenanceWorkbook, importMaintenanceWorkbook } from '../../services/maintenanceImportService';
import { handleError } from '../../utils/errorHandler';

export default function MaintenancePlanImport({ companyId, user, canImport }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  if (!canImport) return null;

  const parse = async file => {
    if (!file) return;
    setLoading(true);
    try { setPreview(await parseMaintenanceWorkbook(file)); }
    catch (error) { setToast({ type: 'error', message: handleError(error) }); }
    finally { setLoading(false); }
  };

  const confirm = async () => {
    setLoading(true);
    try {
      await importMaintenanceWorkbook(companyId, preview, user);
      setToast({ type: 'success', message: 'Importación completada correctamente.' });
      setOpen(false); setPreview(null);
    } catch (error) { setToast({ type: 'error', message: handleError(error) }); }
    finally { setLoading(false); }
  };

  return <><button onClick={() => setOpen(true)} className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm hover:bg-blue-50">Importar plan de mantenimiento</button>{open && <Modal title="Importar plan de mantenimiento" onClose={() => setOpen(false)} wide>
    <div className="space-y-4"><input type="file" accept=".xlsx,.xls" onChange={event => parse(event.target.files?.[0])} className="block w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
    {loading && <p className="text-sm text-slate-500">Procesando archivo...</p>}
    {preview && <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-4">{Object.entries(preview.counts).map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><p className="text-xs uppercase text-slate-500">{key}</p><p className="text-xl font-bold text-slate-900">{value}</p></div>)}</div>
      {!!preview.missingEquipment.length && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Equipos referenciados por planes pero no incluidos en hoja Equipos: {preview.missingEquipment.join(', ')}</div>}
      {!!preview.errors.length && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"><b>Errores críticos:</b><ul className="mt-1 list-disc pl-5">{preview.errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
      <div className="flex justify-end gap-2"><button onClick={() => setOpen(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold">Cancelar</button><button disabled={loading || preview.errors.length > 0} onClick={confirm} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">Confirmar importación</button></div>
    </div>}
    </div>
  </Modal>}<Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)}/></>;
}
