import { X } from "lucide-react";
import { NV } from "../../utils/constants";

export function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-h-[90vh] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-bold text-base">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ onSave, onCancel, label = "Guardar" }) {
  return (
    <div className="flex gap-2 mt-5">
      <button onClick={onSave} style={{ background: NV.blue }} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:opacity-90">{label}</button>
      <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button>
    </div>
  );
}
