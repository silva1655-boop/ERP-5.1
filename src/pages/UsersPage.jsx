import { useState } from "react";
import { Search, Plus, Edit2, Trash2, Check, X, Users, Shield, Wrench, Activity, ClipboardList } from "lucide-react";
import { Modal, ModalActions } from "../components/common/Modal";
import { NV, iCls, sCls, card, btnPrimary } from "../utils/constants";
import { uid } from "../utils/helpers";
import toast from "react-hot-toast";

const ROLES = ["supervisor","mecanico","operaciones","operador"];
const ROLE_LABELS = { supervisor:"Supervisor", mecanico:"Mecánico", operaciones:"Operaciones", operador:"Operador" };
const ROLE_ICONS = { supervisor: Shield, mecanico: Wrench, operaciones: Activity, operador: ClipboardList };
const ROLE_COLORS = { supervisor:"text-cyan-600 bg-cyan-50 border-cyan-200", mecanico:"text-amber-600 bg-amber-50 border-amber-200", operaciones:"text-sky-600 bg-sky-50 border-sky-200", operador:"text-green-600 bg-green-50 border-green-200" };

const EMPTY_USER = { name: "", email: "", password: "", role: "operador", avatar: "", active: true };

function initials(name) {
  if (!name) return "??";
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

export function UsersPage({ user, data, setData, saveData }) {
  const users = data.users || [];
  const isSup = user.role === "supervisor";

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_USER);
  const [confirmDel, setConfirmDel] = useState(null);
  const [showPwd, setShowPwd] = useState(false);

  if (!isSup) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 text-sm">Acceso restringido a supervisores</p>
        </div>
      </div>
    );
  }

  const visible = users.filter(u => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openNew = () => { setForm({ ...EMPTY_USER }); setEditTarget(null); setShowPwd(false); setShowForm(true); };
  const openEdit = u => { setForm({ ...u }); setEditTarget(u); setShowPwd(false); setShowForm(true); };

  const saveUser = () => {
    if (!form.name || !form.email) { toast.error("Nombre y email son requeridos"); return; }
    if (!editTarget && !form.password) { toast.error("La contraseña es requerida para nuevos usuarios"); return; }
    const entry = {
      ...form,
      id: editTarget?.id || uid(),
      avatar: form.avatar || initials(form.name),
      active: form.active !== false,
      password: form.password || editTarget?.password || "Navimag2026",
    };
    const updated = editTarget
      ? users.map(u => u.id === editTarget.id ? entry : u)
      : [...users, entry];
    setData(d => ({ ...d, users: updated }));
    saveData("users", updated);
    setShowForm(false);
    toast.success(editTarget ? "Usuario actualizado" : "Usuario creado");
  };

  const deleteUser = id => {
    if (id === user.id) { toast.error("No puedes eliminar tu propio usuario"); return; }
    const updated = users.filter(u => u.id !== id);
    setData(d => ({ ...d, users: updated }));
    saveData("users", updated);
    setConfirmDel(null);
    toast.success("Usuario eliminado");
  };

  const toggleActive = u2 => {
    if (u2.id === user.id) { toast.error("No puedes desactivar tu propio usuario"); return; }
    const updated = users.map(u => u.id === u2.id ? { ...u, active: !u.active } : u);
    setData(d => ({ ...d, users: updated }));
    saveData("users", updated);
    toast.success(`Usuario ${!u2.active ? "activado" : "desactivado"}`);
  };

  const roleCountMap = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-gray-900 font-bold text-xl">Usuarios</h1>
          <p className="text-gray-500 text-sm">{users.length} usuarios registrados</p>
        </div>
        <button onClick={openNew} style={{ background: NV.blue }} className={btnPrimary}>
          <Plus size={15}/>Nuevo Usuario
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {ROLES.map(r => {
          const Icon = ROLE_ICONS[r];
          return (
            <div key={r} className={`${card} p-3 flex items-center gap-3 cursor-pointer ${roleFilter === r ? "ring-2 ring-blue-400" : ""}`}
              onClick={() => setRoleFilter(roleFilter === r ? "all" : r)}>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ROLE_COLORS[r]}`}>
                <Icon size={14}/>
              </span>
              <div>
                <p className="text-lg font-bold text-gray-800">{roleCountMap[r]}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[r]}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..." className={iCls + " pl-9"}/>
      </div>

      {/* Table */}
      <div className={`${card} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-white font-semibold uppercase tracking-wider" style={{ background: NV.navyMid }}>
              <th className="text-left px-4 py-2.5">Usuario</th>
              <th className="text-left px-4 py-2.5 hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-2.5">Rol</th>
              <th className="text-left px-4 py-2.5">Estado</th>
              <th className="px-4 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">No hay usuarios que coincidan</td></tr>
            )}
            {visible.map((u, i) => {
              const RIcon = ROLE_ICONS[u.role] || Users;
              return (
                <tr key={u.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: NV.navyMid }}>
                        {u.avatar || initials(u.name)}
                      </div>
                      <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                      {u.id === user.id && <span className="text-xs text-blue-500 font-medium">(tú)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 w-fit ${ROLE_COLORS[u.role] || ""}`}>
                      <RIcon size={10}/>{ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u)} className={`text-xs font-semibold px-2 py-0.5 rounded-full border transition ${u.active !== false ? "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100" : "text-red-700 bg-red-50 border-red-200 hover:bg-red-100"}`}>
                      {u.active !== false ? "Activo" : "Inactivo"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-blue-50 transition" style={{ color: NV.blue }}>
                        <Edit2 size={13}/>
                      </button>
                      {u.id !== user.id && (
                        <button onClick={() => setConfirmDel(u)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition">
                          <Trash2 size={13}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Modal title={editTarget ? "Editar Usuario" : "Nuevo Usuario"} onClose={() => setShowForm(false)}>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-gray-500 text-xs font-medium mb-1 block">NOMBRE COMPLETO</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, avatar: initials(e.target.value) }))} className={iCls}/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">EMAIL</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={iCls}/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">{editTarget ? "NUEVA CONTRASEÑA (vacío = mantener)" : "CONTRASEÑA"}</label>
              <input type={showPwd ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className={iCls}/>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">ROL</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className={sCls}>
                {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-gray-500 text-xs font-medium mb-1 block">AVATAR (iniciales)</label>
              <input value={form.avatar} onChange={e => setForm(f => ({ ...f, avatar: e.target.value.toUpperCase().slice(0, 2) }))} maxLength={2} className={iCls + " uppercase"} placeholder="Ej: CS"/>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active !== false} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 rounded"/>
              <label htmlFor="active" className="text-sm text-gray-700">Usuario activo</label>
            </div>
          </div>
          <ModalActions onSave={saveUser} onCancel={() => setShowForm(false)} label={editTarget ? "Guardar Cambios" : "Crear Usuario"}/>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0"><Trash2 size={18} className="text-red-600"/></div>
              <div><p className="text-gray-900 font-bold text-sm">Eliminar usuario</p><p className="text-gray-500 text-xs">{confirmDel.name}</p></div>
            </div>
            <p className="text-gray-600 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2">
              <button onClick={() => deleteUser(confirmDel.id)} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-lg text-sm transition">Eliminar</button>
              <button onClick={() => setConfirmDel(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
