import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NV, card, btnPrimary, iCls, sCls, COLL, ROLE_CFG } from '../../utils/constants';

const uid=()=>Math.random().toString(36).slice(2,10);
const saveData=async(key,arr)=>{try{await setDoc(doc(db,COLL,key),{data:arr});}catch(e){console.error("Save:",e);}};

function Modal({title,onClose,children}){
  return(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5"><h3 className="text-gray-900 font-bold text-base">{title}</h3><button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700"/></button></div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({onSave,onCancel,label="Guardar"}){
  return(<div className="flex gap-2 mt-5"><button onClick={onSave} style={{background:NV.blue}} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:opacity-90">{label}</button><button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button></div>);
}

export default function LegacyUsers({data,setData}){
  const {users}=data;const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",email:"",password:"",role:"mecanico"});
  const addUser=()=>{if(!form.name||!form.email||!form.password)return;const nu={id:uid(),...form,avatar:form.name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()};const updated=[...users,nu];setData(d=>({...d,users:updated}));saveData("users",updated);setShowForm(false);setForm({name:"",email:"",password:"",role:"mecanico"});};
  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Gestión de Usuarios</h1><p className="text-gray-500 text-sm">{users.length} usuarios</p></div>
        <button onClick={()=>setShowForm(true)} style={{background:NV.blue}} className={btnPrimary}><Plus size={15}/>Nuevo Usuario</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {users.map(u=>{const cfg=ROLE_CFG[u.role]||{label:u.role,color:"text-gray-400",icon:()=>null};const RoleIcon=cfg.icon;return(
          <div key={u.id} className={`${card} p-5 flex items-center gap-4 hover:shadow-md transition`}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{background:NV.navyMid}}>{u.avatar}</div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-800 font-semibold text-sm">{u.name}</p>
              <p className="text-gray-400 text-xs">{u.email}</p>
              <p className="flex items-center gap-1.5 mt-1 text-xs font-medium text-gray-600"><RoleIcon size={11}/>{cfg.label}</p>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-medium text-white" style={{background:NV.blue}}>{cfg.label}</span>
          </div>
        );})}
      </div>
      {showForm&&(
        <Modal title="Nuevo Usuario" onClose={()=>setShowForm(false)}>
          <div className="space-y-3">
            {[["name","NOMBRE COMPLETO","text"],["email","CORREO NAVIMAG","email"],["password","CONTRASEÑA","text"]].map(([k,l,t])=>(
              <div key={k}><label className="text-gray-500 text-xs font-medium mb-1 block">{l}</label><input type={t} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className={iCls}/></div>
            ))}
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">ROL</label>
              <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} className={sCls}>
                <option value="supervisor">Supervisor — Acceso completo</option>
                <option value="mecanico">Mecánico — Reportar trabajos</option>
                <option value="operaciones">Operaciones — Solicitudes y notificaciones</option>
                <option value="operador">Operador — Checklist pre-operacional</option>
              </select>
            </div>
          </div>
          <ModalActions onSave={addUser} onCancel={()=>setShowForm(false)} label="Crear Usuario"/>
        </Modal>
      )}
    </div>
  );
}
