import { useState, useRef } from 'react';
import { Bell, Filter, FileDown, Plus, X, Package, Users, Eye, Check, CheckCircle, ClipboardList, Printer } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NV, ST, PRI_CLS, card, btnPrimary, btnSecondary, iCls, sCls, COLL } from '../../utils/constants';

const uid=()=>Math.random().toString(36).slice(2,10);
const fmt=d=>d?new Date(d).toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";
const fmtDT=d=>d?new Date(d).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"—";
const nextOTCode=wos=>`OT-${new Date().getFullYear()}-${String(wos.length+1).padStart(3,"0")}`;
const saveData=async(key,arr)=>{try{await setDoc(doc(db,COLL,key),{data:arr});}catch(e){console.error("Save:",e);}};
const downloadCSV=(filename,rows)=>{if(!rows||rows.length===0)return;const cols=Object.keys(rows[0]);const escape=v=>{const s=String(v==null?"":v);return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s;};const csv=[cols.join(","),...rows.map(r=>cols.map(c=>escape(r[c])).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}));a.download=filename;a.click();URL.revokeObjectURL(a.href);};
const Badge=({s,label})=>{const c=ST[s]||{label:s,cls:"text-gray-600 bg-gray-100 border-gray-300"};return<span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${c.cls}`}>{label||c.label}</span>;};

function Modal({title,onClose,children,wide=false}){
  return(<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-h-[90vh] overflow-y-auto ${wide?"max-w-2xl":"max-w-lg"}`}><div className="flex items-center justify-between mb-5"><h3 className="text-gray-900 font-bold text-base">{title}</h3><button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700"/></button></div>{children}</div></div>);
}
function ModalActions({onSave,onCancel,label="Guardar"}){
  return(<div className="flex gap-2 mt-5"><button onClick={onSave} style={{background:NV.blue}} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:opacity-90">{label}</button><button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button></div>);
}
function PhotoPicker({photos=[],onChange,max=3}){
  const inputRef=useRef(null);
  const compress=(file,cb)=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const canvas=document.createElement("canvas");const MAX=800;let{width:w,height:h}=img;if(w>MAX){h=Math.round(h*(MAX/w));w=MAX;}canvas.width=w;canvas.height=h;canvas.getContext("2d").drawImage(img,0,0,w,h);cb(canvas.toDataURL("image/jpeg",0.6));URL.revokeObjectURL(url);};img.src=url;};
  const onFile=e=>{const files=Array.from(e.target.files||[]);if(!files.length)return;let done=0;const newPhotos=[...photos];files.slice(0,max-photos.length).forEach(f=>{compress(f,b64=>{newPhotos.push(b64);done++;if(done===Math.min(files.length,max-photos.length))onChange(newPhotos);});});e.target.value="";};
  return(<div><div className="flex flex-wrap gap-2 mb-2">{photos.map((p,i)=>(<div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200"><img src={p} className="w-full h-full object-cover" onClick={()=>{const w=window.open();w.document.write(`<img src="${p}" style="max-width:100%">`);}} style={{cursor:"zoom-in"}}/><button onClick={()=>onChange(photos.filter((_,j)=>j!==i))} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><X size={9} className="text-white"/></button></div>))}{photos.length<max&&(<button onClick={()=>inputRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition text-xs"><span className="text-lg leading-none">📷</span><span className="text-xs">Foto</span></button>)}</div><input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFile}/></div>);
}

function printOT(ot,req,equipList,usersList){
  const eq=equipList.find(e=>e.id===ot.equipId)||equipList.find(e=>e.id===req?.equipId);
  const mec=usersList.find(u=>u.id===ot.assignedTo);
  const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const w=window.open("","_blank","width=900,height=700");
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>OT ${esc(ot.code)}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;}.header{background:#002060;color:#fff;padding:20px 32px;display:flex;align-items:center;gap:20px;}.header-title{font-size:22px;font-weight:bold;}.body{padding:24px 32px;}h2{font-size:14px;font-weight:bold;color:#002060;border-bottom:2px solid #002060;padding-bottom:4px;margin:18px 0 10px;}table{width:100%;border-collapse:collapse;margin-bottom:12px;}th{background:#e8f2fb;color:#002060;font-size:11px;text-align:left;padding:6px 10px;border:1px solid #c0d8ee;}td{padding:6px 10px;border:1px solid #dde6f0;}.label{font-weight:bold;color:#555;width:38%;}.section{background:#f8fafd;border:1px solid #dde6f0;border-radius:6px;padding:12px 16px;margin-bottom:12px;}.footer{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:60px;padding:0 20px;}.sig-line{border-top:1.5px solid #333;margin-top:48px;padding-top:6px;font-size:11px;text-align:center;color:#555;}@media print{body{margin:0;}button{display:none;}}</style></head><body><div class="header"><div><div class="header-title">NAVIMAG FERRIES</div><div style="font-size:13px;opacity:0.8;margin-top:4px;">Orden de Trabajo — Departamento de Mantenimiento</div></div><div style="margin-left:auto;text-align:right;"><div style="font-size:18px;font-weight:bold;">${esc(ot.code)}</div></div></div><div class="body"><h2>Detalles</h2><table><tr><td class="label">Equipo</td><td>${esc(eq?.code||"")} — ${esc(eq?.name||"")}</td><td class="label">Estado</td><td>${esc(ot.status)}</td></tr><tr><td class="label">Prioridad</td><td>${esc(ot.priority?.toUpperCase())}</td><td class="label">Horas Est.</td><td>${esc(ot.estimatedHours)}h</td></tr></table><h2>Mecánico</h2><div class="section">${esc(mec?.name||"Sin asignar")}</div>${ot.description?`<h2>Descripción</h2><div class="section" style="white-space:pre-line;">${esc(ot.description)}</div>`:""} ${ot.observations?`<h2>Observaciones</h2><div class="section">${esc(ot.observations)}</div>`:""}<div class="footer"><div>${ot.mechanicSignature?`<img src="${ot.mechanicSignature}" style="max-height:60px;margin-bottom:4px;"/>`:""}<div class="sig-line">Mecánico Responsable</div></div><div><div style="height:60px;"></div><div class="sig-line">Supervisor</div></div></div></div></body></html>`);
  w.document.close();w.focus();w.print();
}

const SUBSIST_MAP={electrico:"Eléctrico",hidraulico:"Hidráulico",mecanico:"Mecánico",neumatico:"Neumático"};
const DEV_TYPE_MAP={fuera_de_programa:"Fuera de Programa",anomalia:"Anomalía Detectada",desgaste:"Desgaste / Deterioro",otro:"Otro"};

export default function LegacyRequests({user,data,setData}){
  const {requests,equip,users,wos}=data;
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({equipId:"",title:"",description:"",priority:"media",subsistema:"",componente:"",photos:[]});
  const [showCLProc,setShowCLProc]=useState(false);
  const [clProc,setClProc]=useState({req:null,priority:"media",subsistema:"",componente:"",description:""});
  const [selReq,setSelReq]=useState(null);
  const [flt,setFlt]=useState({userId:"",status:"",priority:""});
  const canCreate=user.role==="operaciones"||user.role==="supervisor";
  const visible=(user.role==="supervisor"||user.role==="operaciones")?requests:requests.filter(r=>r.requestedBy===user.id);
  const filtered=visible.filter(r=>{if(flt.userId&&r.requestedBy!==flt.userId)return false;if(flt.status&&r.status!==flt.status)return false;if(flt.priority&&r.priority!==flt.priority)return false;return true;});
  const uniqueRequesters=[...new Map(visible.map(r=>r.requestedBy).filter(Boolean).map(id=>[id,users.find(u=>u.id===id)])).values()].filter(Boolean);

  const createReq=()=>{if(!form.equipId||!form.title)return;const nr={id:uid(),...form,status:"pendiente",source:"solicitud",requestedBy:user.id,requestedAt:new Date().toISOString(),approvedBy:null,otId:null};const updated=[...requests,nr];setData(d=>({...d,requests:updated}));saveData("requests",updated);setShowForm(false);setForm({equipId:"",title:"",description:"",priority:"media",subsistema:"",componente:"",photos:[]});};
  const approve=req=>{const eq=equip.find(e=>e.id===req.equipId);const priority=req.priority==="alta"||eq?.criticality==="A"?"alta":req.priority;const mec=users.find(u=>u.role==="mecanico");const isInsp=req.source==="inspeccion";const newOT={id:uid(),code:nextOTCode(wos),type:"correctivo",equipId:req.equipId,planId:null,title:`${isInsp?"Inspección":"Reparación"} ${eq?.name||""} - ${req.title}`,priority,status:"asignada",assignedTo:mec?.id||"",createdAt:new Date().toISOString(),scheduledDate:new Date().toISOString().slice(0,10),estimatedHours:priority==="alta"?4:2,actualHours:null,description:req.description,observations:"",parts:[],source:req.source||"solicitud",reqId:req.id};const updW=[...wos,newOT];const updR=requests.map(r=>r.id===req.id?{...r,status:"aprobada",approvedBy:user.id,otId:newOT.id}:r);setData(d=>({...d,wos:updW,requests:updR}));saveData("workOrders",updW);saveData("requests",updR);alert(`✅ OT ${newOT.code} generada — Prioridad ${priority.toUpperCase()}`);};
  const reject=req=>{const updated=requests.map(r=>r.id===req.id?{...r,status:"rechazada",approvedBy:user.id}:r);setData(d=>({...d,requests:updated}));saveData("requests",updated);};
  const markRevised=req=>{const updated=requests.map(r=>r.id===req.id?{...r,status:"revisado",approvedBy:user.id}:r);setData(d=>({...d,requests:updated}));saveData("requests",updated);};
  const openCLProc=r=>{setClProc({req:r,priority:r.priority||"media",subsistema:r.subsistema||"",componente:r.componente||r.items?.[0]?.name||"",description:r.description||""});setShowCLProc(true);};
  const submitCLProc=()=>{const{req,priority,subsistema,componente,description}=clProc;if(!componente)return;const newSol={id:uid(),title:req.title,equipId:req.equipId,subsistema,componente,description,priority,status:"pendiente",source:"solicitud",requestedBy:user.id,requestedAt:new Date().toISOString(),approvedBy:null,otId:null,fromChecklistId:req.id};const updR=requests.map(r=>r.id===req.id?{...r,status:"aprobada",approvedBy:user.id}:r);const finalR=[...updR,newSol];setData(d=>({...d,requests:finalR}));saveData("requests",finalR);setShowCLProc(false);alert("✅ Solicitud enviada al Supervisor");};
  const exportReqs=()=>{const rows=filtered.map(r=>{const eq=equip.find(e=>e.id===r.equipId);const reqBy=users.find(u=>u.id===r.requestedBy);const linkedOT=wos.find(w=>w.id===r.otId);return{"ID":r.id.slice(-6),"Equipo":eq?.code||"—","Título":r.title,"Prioridad":r.priority,"Estado":r.status,"Fuente":r.source,"Solicitante":reqBy?.name||"—","Fecha":fmtDT(r.requestedAt),"OT":linkedOT?.code||"—"};});downloadCSV(`solicitudes_${new Date().toISOString().slice(0,10)}.csv`,rows);};

  return(
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div><h1 className="text-gray-900 font-bold text-xl">Solicitudes de Reparación</h1><p className="text-gray-500 text-sm">{filtered.length} de {visible.length} solicitudes</p></div>
        <div className="flex gap-2">
          {filtered.length>0&&<button onClick={exportReqs} className={btnSecondary} style={{borderColor:NV.blue,color:NV.blue,background:"white"}}><FileDown size={14}/>Exportar</button>}
          {canCreate&&<button onClick={()=>setShowForm(true)} style={{background:NV.blue}} className={btnPrimary}><Plus size={15}/>Nueva Solicitud</button>}
        </div>
      </div>
      <div className="flex gap-2 mb-5 flex-wrap items-center">
        <Filter size={14} className="text-gray-400 flex-shrink-0"/>
        <select value={flt.userId} onChange={e=>setFlt(f=>({...f,userId:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:outline-none focus:border-blue-400"><option value="">Solicitante: Todos</option>{uniqueRequesters.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select>
        <select value={flt.status} onChange={e=>setFlt(f=>({...f,status:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:outline-none focus:border-blue-400"><option value="">Estado: Todos</option><option value="pendiente">Pendiente</option><option value="aprobada">Aprobada</option><option value="rechazada">Rechazada</option><option value="revisado">Revisado</option><option value="completada">Completada</option></select>
        <select value={flt.priority} onChange={e=>setFlt(f=>({...f,priority:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:outline-none focus:border-blue-400"><option value="">Prioridad: Todas</option><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select>
        {(flt.userId||flt.status||flt.priority)&&<button onClick={()=>setFlt({userId:"",status:"",priority:""})} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg transition"><X size={11}/>Limpiar</button>}
      </div>
      {visible.length===0&&<div className="text-center py-16 text-gray-400"><Bell size={40} className="mx-auto mb-3 text-gray-300"/><p className="font-medium">Sin solicitudes</p></div>}
      {filtered.length===0&&visible.length>0&&<div className="text-center py-10 text-gray-400"><Filter size={32} className="mx-auto mb-2 text-gray-300"/><p className="text-sm">Sin resultados para los filtros seleccionados</p></div>}
      <div className="space-y-3">
        {filtered.map(r=>{
          const eq=equip.find(e=>e.id===r.equipId);const reqBy=users.find(u=>u.id===r.requestedBy);const linkedOT=wos.find(w=>w.id===r.otId);
          return(
            <div key={r.id} className={`bg-white border rounded-xl shadow-sm overflow-hidden ${r.status==="pendiente"?r.source==="inspeccion"?"border-amber-300":"border-blue-300":r.status==="completada"?"border-emerald-300":"border-gray-200"}`}>
              <div className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 flex-wrap ${r.status==="completada"?"bg-emerald-50/60 border-emerald-100":"bg-gray-50/60 border-gray-100"}`}>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge s={r.status}/>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[r.priority]}`}>{r.priority.toUpperCase()}</span>
                  {r.source==="inspeccion"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-amber-700 bg-amber-50 border-amber-200">Reporte Inspección</span>}
                  {r.source==="checklist"&&<span className="px-2 py-0.5 rounded-full border text-xs font-semibold text-green-700 bg-green-50 border-green-200">Checklist Pre-op</span>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button onClick={()=>setSelReq(r)} className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition"><Eye size={11}/>Ver Detalle</button>
                  {r.status==="pendiente"&&<>
                    {user.role==="operaciones"&&r.source==="checklist"&&<button onClick={()=>openCLProc(r)} className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium" style={{background:"#16a34a"}}><ClipboardList size={12}/>Procesar</button>}
                    {user.role==="supervisor"&&<>
                      <button onClick={()=>approve(r)} className="flex items-center gap-1.5 text-white text-xs px-3 py-1.5 rounded-lg hover:opacity-90 transition font-medium" style={{background:NV.blue}}><Check size={12}/>Aprobar + OT</button>
                      {r.source==="inspeccion"?<button onClick={()=>markRevised(r)} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"><Check size={12}/>Revisado</button>:<button onClick={()=>reject(r)} className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium"><X size={12}/>Rechazar</button>}
                    </>}
                  </>}
                </div>
              </div>
              <div className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-gray-500"><Package size={11} className="text-gray-400 flex-shrink-0"/><span className="font-mono font-bold" style={{color:NV.blue}}>{eq?.code||"—"}</span><span className="font-medium text-gray-700">{eq?.name||"—"}</span></div>
                <p className="text-gray-900 font-bold text-sm leading-tight">{r.title}</p>
                {(r.subsistema||r.componente)&&<div className="grid grid-cols-2 gap-2 text-xs"><span className="text-gray-400">Subsistema: <span className="text-gray-600 font-medium">{SUBSIST_MAP[r.subsistema]||"—"}</span></span><span className="text-gray-400">Componente: <span className="text-gray-600 font-medium">{r.componente||"—"}</span></span></div>}
                {r.description&&<p className="text-gray-500 text-xs leading-snug line-clamp-2">{r.description}</p>}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-1 border-t border-gray-100"><Users size={10}/><span className="font-medium text-gray-500">{reqBy?.name||"—"}</span><span>·</span><span>{fmtDT(r.requestedAt)}</span>{linkedOT&&<><span>·</span><span className="text-emerald-600 font-semibold">{linkedOT.code}</span></>}{r.photos&&r.photos.length>0&&<><span>·</span><span className="text-blue-500 font-medium">📷 {r.photos.length} foto{r.photos.length!==1?"s":""}</span></>}</div>
              </div>
            </div>
          );
        })}
      </div>

      {selReq&&(()=>{
        const r=selReq;const eq=equip.find(e=>e.id===r.equipId);const reqBy=users.find(u=>u.id===r.requestedBy);const approvedByUser=users.find(u=>u.id===r.approvedBy);const linkedOT=wos.find(w=>w.id===r.otId);const mechanic=linkedOT?users.find(u=>u.id===linkedOT.assignedTo):null;
        return(
          <Modal title={`Solicitud — ${r.title}`} onClose={()=>setSelReq(null)} wide={true}>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5"><Badge s={r.status}/><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[r.priority]}`}>{r.priority.toUpperCase()}</span></div>
              <div className="bg-gray-50 border border-gray-100 rounded-lg p-3"><p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Equipo</p><p className="text-gray-800 font-semibold text-sm">{eq?.code} — {eq?.name||"—"}</p></div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {r.subsistema&&<div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Subsistema</p><p className="text-gray-700 font-semibold">{SUBSIST_MAP[r.subsistema]||r.subsistema}</p></div>}
                {r.componente&&<div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Componente</p><p className="text-gray-700 font-semibold">{r.componente}</p></div>}
                <div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Solicitante</p><p className="text-gray-700 font-semibold">{reqBy?.name||"—"}</p></div>
                <div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Fecha</p><p className="text-gray-700 font-semibold">{fmtDT(r.requestedAt)}</p></div>
                {r.approvedBy&&<div><p className="text-gray-400 font-medium uppercase tracking-wide mb-0.5">Aprobado por</p><p className="text-gray-700 font-semibold">{approvedByUser?.name||"—"}</p></div>}
              </div>
              {r.description&&<div className="bg-gray-50 border border-gray-100 rounded-lg p-3"><p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-1">Descripción</p><p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{r.description}</p></div>}
              {r.photos&&r.photos.length>0&&<div><p className="text-gray-400 text-xs font-medium uppercase tracking-wide mb-2">Fotos</p><div className="flex flex-wrap gap-2">{r.photos.map((src,i)=>(<img key={i} src={src} alt={`foto ${i+1}`} className="w-24 h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition" onClick={()=>{const w2=window.open("","_blank");w2.document.write(`<img src="${src}" style="max-width:100%;"/>`);w2.document.close();}}/>))}</div></div>}
              {linkedOT&&<div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-1.5 text-emerald-700 text-sm font-bold"><CheckCircle size={14}/>OT Vinculada: {linkedOT.code}</div><button onClick={()=>{setSelReq(null);printOT(linkedOT,r,equip,users);}} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-white font-medium hover:opacity-90 transition" style={{background:NV.navy}}><Printer size={11}/>Imprimir OT</button></div><div className="grid grid-cols-2 gap-2 text-xs"><div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Estado</p><Badge s={linkedOT.status}/></div><div><p className="text-gray-400 uppercase tracking-wide mb-0.5">Mecánico</p><p className="text-gray-700 font-semibold">{mechanic?.name||"—"}</p></div></div></div>}
            </div>
            <div className="flex gap-2 mt-4">
              {linkedOT&&<button onClick={()=>{setSelReq(null);printOT(linkedOT,r,equip,users);}} className="flex items-center gap-2 text-white font-semibold px-4 py-2 rounded-lg text-sm transition hover:opacity-90" style={{background:NV.navy}}><Printer size={14}/>Imprimir OT</button>}
              <button onClick={()=>setSelReq(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cerrar</button>
            </div>
          </Modal>
        );
      })()}
      {showCLProc&&clProc.req&&(
        <Modal title={`Procesar Checklist — ${equip.find(e=>e.id===clProc.req.equipId)?.code||""}`} onClose={()=>setShowCLProc(false)}>
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3"><p className="text-green-700 text-xs font-medium uppercase tracking-wide mb-1">Observaciones del Checklist</p><p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{clProc.req.description}</p></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label><select value={clProc.priority} onChange={e=>setClProc(c=>({...c,priority:e.target.value}))} className={sCls}><option value="alta">Alta — Detiene operaciones</option><option value="media">Media — Afecta rendimiento</option><option value="baja">Baja — Sin impacto inmediato</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label><select value={clProc.subsistema} onChange={e=>setClProc(c=>({...c,subsistema:e.target.value}))} className={sCls}><option value="">Seleccionar...</option><option value="electrico">Eléctrico</option><option value="hidraulico">Hidráulico</option><option value="mecanico">Mecánico</option><option value="neumatico">Neumático</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE *</label><input value={clProc.componente} onChange={e=>setClProc(c=>({...c,componente:e.target.value}))} className={iCls} placeholder="ej: Motor, Válvula..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">OBSERVACIONES PARA EL SUPERVISOR</label><textarea value={clProc.description} onChange={e=>setClProc(c=>({...c,description:e.target.value}))} rows={3} className={iCls+" resize-none"}/></div>
          </div>
          <ModalActions onSave={submitCLProc} onCancel={()=>setShowCLProc(false)} label="Enviar Solicitud al Supervisor"/>
        </Modal>
      )}
      {showForm&&(
        <Modal title="Nueva Solicitud de Reparación" onClose={()=>setShowForm(false)}>
          <div className="space-y-3">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">EQUIPO</label><select value={form.equipId} onChange={e=>setForm(f=>({...f,equipId:e.target.value}))} className={sCls}><option value="">Seleccionar...</option>{equip.map(e=><option key={e.id} value={e.id}>{e.name} ({e.code})</option>)}</select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">SUBSISTEMA</label><select value={form.subsistema} onChange={e=>setForm(f=>({...f,subsistema:e.target.value}))} className={sCls}><option value="">Seleccionar...</option><option value="electrico">Eléctrico</option><option value="hidraulico">Hidráulico</option><option value="mecanico">Mecánico</option><option value="neumatico">Neumático</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">COMPONENTE EN FALLA</label><input value={form.componente} onChange={e=>setForm(f=>({...f,componente:e.target.value}))} className={iCls} placeholder="ej: Motor, Válvula, Sensor..."/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">FALLA DETECTADA *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} className={iCls} placeholder="Descripción breve de la falla"/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">DESCRIPCIÓN</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} className={iCls+" resize-none"}/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">PRIORIDAD</label><select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} className={sCls}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
            <div><label className="text-gray-500 text-xs font-medium mb-2 block">FOTOS (opcional)</label><PhotoPicker photos={form.photos||[]} onChange={p=>setForm(f=>({...f,photos:p}))} max={3}/></div>
          </div>
          <ModalActions onSave={createReq} onCancel={()=>setShowForm(false)} label="Enviar Solicitud"/>
        </Modal>
      )}
    </div>
  );
}
