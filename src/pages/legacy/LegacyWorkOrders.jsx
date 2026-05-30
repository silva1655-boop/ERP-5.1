import { useState, useRef, useEffect } from 'react';
import { X, Search, Users, Calendar, Package, Check, ChevronDown } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { NV, ST, CRIT_CLS, PRI_CLS, CRIT_LABEL, iCls, sCls, card, btnPrimary, btnSecondary, COLL } from '../../utils/constants';

const fmt   = d => d ? new Date(d).toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—";
const fmtDT = d => d ? new Date(d).toLocaleString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const uid = () => Math.random().toString(36).slice(2,10);

const Badge=({s,label})=>{const c=ST[s]||{label:s,cls:"text-gray-600 bg-gray-100 border-gray-300"};return<span className={`inline-flex px-2 py-0.5 rounded-full border text-xs font-semibold ${c.cls}`}>{label||c.label}</span>;};

function Modal({title,onClose,children,wide=false}){
  return(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white border border-gray-200 rounded-2xl shadow-xl p-6 w-full max-h-[90vh] overflow-y-auto ${wide?"max-w-2xl":"max-w-lg"}`}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900 font-bold text-base">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-gray-400 hover:text-gray-700"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({onSave,onCancel,label="Guardar"}){
  return(
    <div className="flex gap-2 mt-5">
      <button onClick={onSave}   style={{background:NV.blue}} className="flex-1 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:opacity-90">{label}</button>
      <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm transition">Cancelar</button>
    </div>
  );
}

function PhotoPicker({photos=[],onChange,max=3}){
  const inputRef=useRef(null);
  const compress=(file,cb)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      const canvas=document.createElement("canvas");
      const MAX=800;
      let {width:w,height:h}=img;
      if(w>MAX){h=Math.round(h*(MAX/w));w=MAX;}
      canvas.width=w;canvas.height=h;
      canvas.getContext("2d").drawImage(img,0,0,w,h);
      cb(canvas.toDataURL("image/jpeg",0.6));
      URL.revokeObjectURL(url);
    };
    img.src=url;
  };
  const onFile=e=>{
    const files=Array.from(e.target.files||[]);
    if(!files.length)return;
    let done=0;const newPhotos=[...photos];
    files.slice(0,max-photos.length).forEach(f=>{
      compress(f,b64=>{newPhotos.push(b64);done++;if(done===Math.min(files.length,max-photos.length))onChange(newPhotos);});
    });
    e.target.value="";
  };
  return(
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {photos.map((p,i)=>(
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
            <img src={p} className="w-full h-full object-cover" onClick={()=>{const w=window.open();w.document.write(`<img src="${p}" style="max-width:100%">`);}} style={{cursor:"zoom-in"}}/>
            <button onClick={()=>onChange(photos.filter((_,j)=>j!==i))} className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"><X size={9} className="text-white"/></button>
          </div>
        ))}
        {photos.length<max&&(
          <button onClick={()=>inputRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:border-blue-400 hover:text-blue-400 transition text-xs">
            <span className="text-lg leading-none">📷</span><span className="text-xs">Foto</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={onFile}/>
    </div>
  );
}

function SignaturePad({onSave,onCancel}){
  const canvasRef=useRef(null);
  const drawing=useRef(false);
  const getPos=(e,canvas)=>{
    const rect=canvas.getBoundingClientRect();
    const src=e.touches?e.touches[0]:e;
    return{x:src.clientX-rect.left,y:src.clientY-rect.top};
  };
  const start=e=>{
    e.preventDefault();
    const c=canvasRef.current;if(!c)return;
    drawing.current=true;
    const ctx=c.getContext("2d");
    const{x,y}=getPos(e,c);
    ctx.beginPath();ctx.moveTo(x,y);
  };
  const move=e=>{
    e.preventDefault();
    if(!drawing.current)return;
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    const{x,y}=getPos(e,c);
    ctx.lineTo(x,y);ctx.stroke();
  };
  const stop=()=>{drawing.current=false;};
  const clear=()=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    ctx.clearRect(0,0,c.width,c.height);
  };
  useEffect(()=>{
    const c=canvasRef.current;if(!c)return;
    const ctx=c.getContext("2d");
    ctx.strokeStyle="#1e3a5f";ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";
  },[]);
  return(
    <div className="space-y-3">
      <p className="text-gray-500 text-sm">Firma en el recuadro a continuación:</p>
      <canvas ref={canvasRef} width={460} height={180}
        className="w-full border-2 border-gray-300 rounded-xl bg-white touch-none"
        style={{cursor:"crosshair"}}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop}
      />
      <div className="flex gap-2">
        <button onClick={clear} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-500 text-sm hover:bg-gray-50 transition">Limpiar</button>
        <button onClick={()=>onSave(canvasRef.current?.toDataURL("image/png")||null)} className="flex-1 py-2 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition" style={{background:"#002060"}}>Guardar Firma</button>
        <button onClick={onCancel} className="py-2 px-4 rounded-lg border border-gray-200 text-gray-400 text-sm hover:bg-gray-50 transition">Saltar</button>
      </div>
    </div>
  );
}

function WorkOrders({user,data,setData,saveData}){
  const {wos,equip,users,requests,plans}=data;
  const [flt,setFlt]=useState({status:"",type:"",equipId:"",assignedTo:""});
  const [search,setSearch]=useState("");
  const [showWorkload,setShowWorkload]=useState(false);
  const [sel,setSel]=useState(null); const [showRep,setShowRep]=useState(false);
  const [rep,setRep]=useState({actualHours:"",observations:"",status:"completada"});
  const [showSig,setShowSig]=useState(false);
  const [sigData,setSigData]=useState(null);
  const role=user.role;
  const mechanics=users.filter(u=>u.role==="mecanico");
  const thisMonth=new Date().toISOString().slice(0,7);
  const visible=wos.filter(w=>{
    if(role==="mecanico"&&w.assignedTo!==user.id) return false;
    if(flt.status&&w.status!==flt.status) return false;
    if(flt.type&&w.type!==flt.type) return false;
    if(flt.equipId&&w.equipId!==flt.equipId) return false;
    if(flt.assignedTo&&w.assignedTo!==flt.assignedTo) return false;
    if(search&&!w.title.toLowerCase().includes(search.toLowerCase())&&!w.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const updWO=(id,patch)=>{const u=wos.map(w=>w.id===id?{...w,...patch}:w);setData(d=>({...d,wos:u}));saveData("workOrders",u);if(sel?.id===id)setSel(s=>({...s,...patch}));};
  const doSubmitRep=(signature)=>{
    if(!rep.actualHours)return;
    const patch={status:rep.status,actualHours:parseFloat(rep.actualHours),observations:rep.observations};
    if(signature)patch.mechanicSignature=signature;
    updWO(sel.id,patch);
    if(rep.status==="completada"&&sel.reqId){
      const updR=requests.map(r=>r.id===sel.reqId?{...r,status:"completada"}:r);
      setData(d=>({...d,requests:updR}));saveData("requests",updR);
    }
    if(rep.status==="completada"&&sel.planId){
      const eqH=equip.find(e=>e.id===sel.equipId)?.hours||0;
      const updP=plans.map(p=>p.id===sel.planId?{...p,lastHorometro:eqH,horometroTarget:eqH+(p.frequency||0)}:p);
      setData(d=>({...d,plans:updP}));saveData("plans",updP);
    }
    setShowRep(false);setShowSig(false);setSigData(null);setRep({actualHours:"",observations:"",status:"completada"});
  };
  const submitRep=()=>{if(!rep.actualHours)return;setShowSig(true);};
  const cur=sel?wos.find(w=>w.id===sel.id):null;
  const curEq=cur?equip.find(e=>e.id===cur.equipId):null;
  const curAs=cur?users.find(u=>u.id===cur.assignedTo):null;
  const anyFlt=flt.status||flt.type||flt.equipId||flt.assignedTo||search;
  return(
    <div className="p-6 flex gap-5 h-full">
      <div className="flex-1 min-w-0">
        <div className="mb-5"><h1 className="text-gray-900 font-bold text-xl">Órdenes de Trabajo</h1><p className="text-gray-500 text-sm">{visible.length} registros</p></div>

        {role==="supervisor"&&(
          <div className="mb-4">
            <button onClick={()=>setShowWorkload(v=>!v)} className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition mb-2">
              <Users size={13}/>{showWorkload?"Ocultar carga de mecánicos":"Ver carga de mecánicos"}<ChevronDown size={12} className={`transition-transform ${showWorkload?"rotate-180":""}`}/>
            </button>
            {showWorkload&&(
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                {mechanics.map(mec=>{
                  const openOTs=wos.filter(w=>w.assignedTo===mec.id&&(w.status==="asignada"||w.status==="en_proceso"));
                  const completedThisMonth=wos.filter(w=>w.assignedTo===mec.id&&w.status==="completada"&&w.createdAt?.startsWith(thisMonth));
                  const pendingHours=openOTs.reduce((s,w)=>s+(w.estimatedHours||0),0);
                  const barColor=openOTs.length>4?"bg-red-500":openOTs.length>=2?"bg-amber-400":"bg-emerald-500";
                  return(
                    <div key={mec.id} className={`${card} p-4 flex items-center gap-3`}>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-sm border border-gray-200 flex-shrink-0" style={{color:NV.navy}}>{mec.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 font-semibold text-sm truncate">{mec.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          <span className="font-bold" style={{color:openOTs.length>4?"#dc2626":openOTs.length>=2?"#d97706":"#16a34a"}}>{openOTs.length} abiertas</span>
                          <span>{completedThisMonth.length} comp./mes</span>
                          <span>{pendingHours.toFixed(1)}h pend.</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1.5">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{width:`${Math.min(100,(openOTs.length/8)*100)}%`}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <div className="relative flex-1 min-w-40">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar OT..." className={iCls+" pl-9"}/>
          </div>
          <select value={flt.status} onChange={e=>setFlt(f=>({...f,status:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
            <option value="">Estado: Todos</option>
            <option value="asignada">Asignada</option>
            <option value="en_proceso">En Progreso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select value={flt.type} onChange={e=>setFlt(f=>({...f,type:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
            <option value="">Tipo: Todos</option>
            <option value="preventivo">Preventivo</option>
            <option value="correctivo">Correctivo</option>
          </select>
          <select value={flt.equipId} onChange={e=>setFlt(f=>({...f,equipId:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
            <option value="">Equipo: Todos</option>
            {equip.map(e=><option key={e.id} value={e.id}>{e.code} — {e.name}</option>)}
          </select>
          {role==="supervisor"&&(
            <select value={flt.assignedTo} onChange={e=>setFlt(f=>({...f,assignedTo:e.target.value}))} className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 text-xs focus:outline-none focus:border-blue-400">
              <option value="">Mecánico: Todos</option>
              {mechanics.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
          {anyFlt&&<button onClick={()=>{setFlt({status:"",type:"",equipId:"",assignedTo:""});setSearch("");}} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg transition"><X size={11}/>Limpiar</button>}
        </div>

        <div className="space-y-2">
          {visible.map(w=>{
            const eq=equip.find(e=>e.id===w.equipId); const asn=users.find(u=>u.id===w.assignedTo);
            return(
              <div key={w.id} onClick={()=>setSel(w)}
                className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${sel?.id===w.id?"shadow-sm":"border-gray-200 hover:border-blue-300 hover:shadow-sm"}`}
                style={sel?.id===w.id?{borderColor:NV.blue,background:"#EBF4FF"}:{}}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono font-bold" style={{color:NV.blue}}>{w.code}</span>
                      <Badge s={w.type==="preventivo"?"asignada":"en_proceso"} label={w.type==="preventivo"?"Preventivo":"Correctivo"}/>
                      <Badge s={w.status}/>
                    </div>
                    <p className="text-gray-800 text-sm font-semibold truncate">{w.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-gray-400 text-xs flex items-center gap-1"><Package size={10}/>{eq?.code}</span>
                      <span className="text-gray-400 text-xs flex items-center gap-1"><Calendar size={10}/>{fmt(w.scheduledDate)}</span>
                      {asn&&<span className="text-gray-400 text-xs flex items-center gap-1"><Users size={10}/>{asn.name}</span>}
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full border text-xs font-bold flex-shrink-0 ${PRI_CLS[w.priority]}`}>{w.priority?.toUpperCase()}</span>
                </div>
              </div>
            );
          })}
          {visible.length===0&&<div className="text-center py-12 text-gray-400 text-sm">No se encontraron órdenes</div>}
        </div>
      </div>
      {cur&&(
        <div className={`w-80 flex-shrink-0 ${card} p-5 h-fit sticky top-6 overflow-y-auto max-h-[calc(100vh-6rem)]`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold" style={{color:NV.blue}}>{cur.code}</span>
            <button onClick={()=>setSel(null)}><X size={16} className="text-gray-400 hover:text-gray-700"/></button>
          </div>
          <h3 className="text-gray-900 font-semibold text-sm mb-3">{cur.title}</h3>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Badge s={cur.status}/>
            <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${PRI_CLS[cur.priority]}`}>{cur.priority?.toUpperCase()}</span>
          </div>
          <div className="space-y-2 mb-4 text-xs">
            {[["Equipo",curEq?.name||"—"],["Código",curEq?.code||"—"],["Tipo",cur.type],["Fuente",cur.source==="plan"?"Plan Preventivo":cur.source==="inspeccion"?"Inspección":"Solicitud"],["Programado",fmt(cur.scheduledDate)],["Horas Est.",`${cur.estimatedHours}h`],["Asignado a",curAs?.name||"—"]].map(([k,v])=>(
              <div key={k} className="flex justify-between gap-2"><span className="text-gray-400">{k}</span><span className="text-gray-700 text-right">{v}</span></div>
            ))}
            {cur.actualHours&&<div className="flex justify-between"><span className="text-gray-400">Horas Reales</span><span className="text-emerald-600 font-semibold">{cur.actualHours}h</span></div>}
          </div>
          {cur.description&&<div className="bg-gray-50 border border-gray-100 rounded-lg p-3 mb-3 text-gray-600 text-xs">{cur.description}</div>}
          {cur.observations&&<div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 mb-3 text-xs"><span className="text-emerald-700 font-semibold">Obs: </span>{cur.observations}</div>}
          {cur.mechanicSignature&&<div className="mb-3"><p className="text-gray-400 text-xs mb-1">Firma del mecánico:</p><img src={cur.mechanicSignature} alt="firma" className="border border-gray-200 rounded-lg w-full"/></div>}
          <div className="space-y-2 mt-4">
            {role==="mecanico"&&cur.assignedTo===user.id&&cur.status!=="completada"&&<>
              {cur.status==="asignada"&&<button onClick={()=>updWO(cur.id,{status:"en_proceso"})} className="w-full border text-sm py-2 rounded-lg hover:opacity-90 transition font-medium" style={{background:NV.light,borderColor:NV.blue,color:NV.blue}}>Iniciar Trabajo</button>}
              <button onClick={()=>setShowRep(true)} className="w-full text-white text-sm py-2 rounded-lg hover:opacity-90 transition font-medium" style={{background:NV.blue}}>Reportar Trabajo</button>
            </>}
            {role==="supervisor"&&cur.status!=="completada"&&cur.status!=="cancelada"&&(
              <select value={cur.status} onChange={e=>{
                const s=e.target.value;
                updWO(cur.id,{status:s});
                if(s==="completada"&&cur.reqId){
                  const updR=requests.map(r=>r.id===cur.reqId?{...r,status:"completada"}:r);
                  setData(d=>({...d,requests:updR}));saveData("requests",updR);
                }
              }} className={sCls}>
                <option value="pendiente">Pendiente</option><option value="asignada">Asignada</option>
                <option value="en_proceso">En Proceso</option><option value="completada">Completada</option><option value="cancelada">Cancelada</option>
              </select>
            )}
          </div>
        </div>
      )}
      {showRep&&!showSig&&(
        <Modal title={`Reportar — ${cur?.code}`} onClose={()=>setShowRep(false)}>
          <div className="space-y-4">
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">HORAS REALES *</label><input type="number" step="0.5" value={rep.actualHours} onChange={e=>setRep(r=>({...r,actualHours:e.target.value}))} className={iCls} placeholder="ej: 3.5"/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">OBSERVACIONES</label><textarea value={rep.observations} onChange={e=>setRep(r=>({...r,observations:e.target.value}))} rows={3} className={iCls+" resize-none"}/></div>
            <div><label className="text-gray-500 text-xs font-medium mb-1 block">ESTADO FINAL</label><select value={rep.status} onChange={e=>setRep(r=>({...r,status:e.target.value}))} className={sCls}><option value="completada">Completada</option><option value="en_proceso">En Proceso (parcial)</option></select></div>
          </div>
          <ModalActions onSave={submitRep} onCancel={()=>setShowRep(false)} label="Enviar Reporte"/>
        </Modal>
      )}
      {showSig&&(
        <Modal title="Firma del Mecánico" onClose={()=>setShowSig(false)}>
          <SignaturePad
            onSave={dataURL=>{doSubmitRep(dataURL);}}
            onCancel={()=>doSubmitRep(null)}
          />
        </Modal>
      )}
    </div>
  );
}

export default WorkOrders;
