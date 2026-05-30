import { CheckCircle, Wrench, AlertTriangle, Clock, FileDown, Printer } from 'lucide-react';
import { NV, ST, CRIT_CLS, card, btnSecondary } from '../../utils/constants';

const fmt=d=>d?new Date(d).toLocaleDateString("es-CL",{day:"2-digit",month:"2-digit",year:"numeric"}):"—";
const downloadCSV=(filename,rows)=>{if(!rows||rows.length===0)return;const cols=Object.keys(rows[0]);const escape=v=>{const s=String(v==null?"":v);return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s;};const csv=[cols.join(","),...rows.map(r=>cols.map(c=>escape(r[c])).join(","))].join("\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["﻿"+csv],{type:"text/csv;charset=utf-8"}));a.download=filename;a.click();URL.revokeObjectURL(a.href);};

function StatCard({icon:Icon,label,value,sub,color="navy"}){
  const m={navy:"border-blue-200 bg-blue-50 text-blue-800",blue:"border-blue-200 bg-blue-50 text-blue-700",red:"border-red-200 bg-red-50 text-red-600",amber:"border-amber-200 bg-amber-50 text-amber-700",emerald:"border-emerald-200 bg-emerald-50 text-emerald-700"};
  return(<div className={`${card} p-5 flex items-center gap-4`}><div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${m[color]||m.navy}`}><Icon size={20}/></div><div><p className="text-gray-500 text-xs font-medium mb-0.5">{label}</p><p className="text-gray-900 font-bold text-2xl leading-none">{value}</p>{sub&&<p className="text-gray-400 text-xs mt-1">{sub}</p>}</div></div>);
}

function printOT(ot,req,equipList,usersList){
  const eq=equipList.find(e=>e.id===ot.equipId)||equipList.find(e=>e.id===req?.equipId);
  const mec=usersList.find(u=>u.id===ot.assignedTo);
  const reqBy=usersList.find(u=>u.id===req?.requestedBy);
  const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const w=window.open("","_blank","width=900,height=700");
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>OT ${esc(ot.code)}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;}.header{background:#002060;color:#fff;padding:20px 32px;display:flex;align-items:center;gap:20px;}.header-title{font-size:22px;font-weight:bold;letter-spacing:1px;}.header-sub{font-size:13px;opacity:0.8;margin-top:4px;}.body{padding:24px 32px;}h2{font-size:14px;font-weight:bold;color:#002060;border-bottom:2px solid #002060;padding-bottom:4px;margin:18px 0 10px;}table{width:100%;border-collapse:collapse;margin-bottom:12px;}th{background:#e8f2fb;color:#002060;font-size:11px;text-align:left;padding:6px 10px;border:1px solid #c0d8ee;}td{padding:6px 10px;border:1px solid #dde6f0;vertical-align:top;}.label{font-weight:bold;color:#555;width:38%;}.section{background:#f8fafd;border:1px solid #dde6f0;border-radius:6px;padding:12px 16px;margin-bottom:12px;}.footer{margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:60px;padding:0 20px;}.sig-line{border-top:1.5px solid #333;margin-top:48px;padding-top:6px;font-size:11px;text-align:center;color:#555;}@media print{body{margin:0;}button{display:none;}}</style></head><body><div class="header"><div><div class="header-title">NAVIMAG FERRIES</div><div class="header-sub">Orden de Trabajo — Departamento de Mantenimiento</div></div><div style="margin-left:auto;text-align:right;"><div style="font-size:18px;font-weight:bold;">${esc(ot.code)}</div><div style="font-size:11px;opacity:0.7;">${new Date(ot.createdAt).toLocaleDateString("es-CL")}</div></div></div><div class="body"><h2>Detalles de la Orden de Trabajo</h2><table><tr><td class="label">Código OT</td><td><strong>${esc(ot.code)}</strong></td><td class="label">Tipo</td><td>${esc(ot.type)}</td></tr><tr><td class="label">Equipo</td><td>${esc(eq?.code||"")} — ${esc(eq?.name||"")}</td><td class="label">Ubicación</td><td>${esc(eq?.location||"")}</td></tr><tr><td class="label">Prioridad</td><td>${esc(ot.priority?.toUpperCase())}</td><td class="label">Estado</td><td>${esc(ot.status)}</td></tr><tr><td class="label">Fecha Creación</td><td>${new Date(ot.createdAt).toLocaleDateString("es-CL")}</td><td class="label">Horas Estimadas</td><td>${esc(ot.estimatedHours)}h</td></tr></table><h2>Mecánico Responsable</h2><div class="section">${esc(mec?.name||"Sin asignar")}</div>${ot.description?`<h2>Descripción</h2><div class="section" style="white-space:pre-line;">${esc(ot.description)}</div>`:""} ${ot.observations?`<h2>Observaciones</h2><div class="section" style="white-space:pre-line;">${esc(ot.observations)}</div>`:""}<div class="footer"><div>${ot.mechanicSignature?`<img src="${ot.mechanicSignature}" style="max-height:60px;margin-bottom:4px;"/>`:`<div style="height:60px;"></div>`}<div class="sig-line">Mecánico Responsable — ${esc(mec?.name||"")}<br/><span style="font-size:10px;color:#999;">Nombre y Firma</span></div></div><div><div style="height:60px;"></div><div class="sig-line">Supervisor<br/><span style="font-size:10px;color:#999;">Nombre y Firma</span></div></div></div></div></body></html>`);
  w.document.close();w.focus();w.print();
}

function printMonthlyReport(data,equipList,usersList,month){
  const {wos,requests,checklists}=data;
  const allCL=checklists||[];
  const monthWOs=wos.filter(w=>w.createdAt?.startsWith(month));
  const monthCompleted=monthWOs.filter(w=>w.status==="completada");
  const monthPrev=monthWOs.filter(w=>w.type==="preventivo");
  const monthCorr=monthWOs.filter(w=>w.type==="correctivo");
  const monthHrs=monthCompleted.reduce((s,w)=>s+(w.actualHours||0),0);
  const compRate=monthWOs.length>0?((monthCompleted.length/monthWOs.length)*100).toFixed(1):"N/D";
  const monthReqs=requests.filter(r=>r.requestedAt?.startsWith(month));
  const monthCL=allCL.filter(c=>c.createdAt?.startsWith(month));
  const monthLabel=new Date(month+"-01").toLocaleDateString("es-CL",{month:"long",year:"numeric"});
  const esc=s=>String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const byEquip=equipList.map(e=>{const ots=monthWOs.filter(w=>w.equipId===e.id);const comp=ots.filter(w=>w.status==="completada");const hrs=comp.reduce((s,w)=>s+(w.actualHours||0),0);const cls=monthCL.filter(c=>c.equipId===e.id);return{...e,ots:ots.length,comp:comp.length,hrs,cls:cls.length};}).filter(e=>e.ots>0||e.cls>0);
  const w=window.open("","_blank","width=900,height=700");
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Informe ${monthLabel}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;background:#fff;}.header{background:#002060;color:#fff;padding:20px 32px;}.header-title{font-size:22px;font-weight:bold;}.header-sub{font-size:13px;opacity:0.8;margin-top:4px;}.body{padding:24px 32px;}h2{font-size:14px;font-weight:bold;color:#002060;border-bottom:2px solid #002060;padding-bottom:4px;margin:18px 0 10px;}.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px;}.kpi{background:#e8f2fb;border:1px solid #c0d8ee;border-radius:8px;padding:12px;text-align:center;}.kpi-val{font-size:22px;font-weight:bold;color:#002060;}.kpi-lbl{font-size:10px;color:#555;margin-top:3px;}table{width:100%;border-collapse:collapse;margin-bottom:12px;}th{background:#e8f2fb;color:#002060;font-size:11px;text-align:left;padding:6px 10px;border:1px solid #c0d8ee;}td{padding:6px 10px;border:1px solid #dde6f0;font-size:11px;}@media print{body{margin:0;}button{display:none;}}</style></head><body><div class="header"><div class="header-title">NAVIMAG FERRIES</div><div class="header-sub">Informe Mensual de Mantenimiento — ${esc(monthLabel)}</div></div><div class="body"><h2>Resumen del Mes</h2><div class="kpi-grid"><div class="kpi"><div class="kpi-val">${monthWOs.length}</div><div class="kpi-lbl">Total OT</div></div><div class="kpi"><div class="kpi-val">${monthPrev.length}</div><div class="kpi-lbl">Preventivas</div></div><div class="kpi"><div class="kpi-val">${monthCorr.length}</div><div class="kpi-lbl">Correctivas</div></div><div class="kpi"><div class="kpi-val">${monthHrs.toFixed(1)}h</div><div class="kpi-lbl">Horas Totales</div></div><div class="kpi"><div class="kpi-val">${compRate}%</div><div class="kpi-lbl">Tasa Completación</div></div></div><h2>OT por Equipo</h2><table><tr><th>Código</th><th>Equipo</th><th>Total OT</th><th>Completadas</th><th>Horas</th></tr>${byEquip.filter(e=>e.ots>0).map(e=>`<tr><td><strong>${esc(e.code)}</strong></td><td>${esc(e.name)}</td><td>${e.ots}</td><td>${e.comp}</td><td>${e.hrs.toFixed(1)}h</td></tr>`).join("")}${byEquip.filter(e=>e.ots>0).length===0?`<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Sin OT este mes</td></tr>`:""}</table><h2>Solicitudes</h2><table><tr><th>Estado</th><th>Cantidad</th></tr>${["pendiente","aprobada","rechazada","completada"].map(s=>`<tr><td>${ST[s]?.label||s}</td><td>${monthReqs.filter(r=>r.status===s).length}</td></tr>`).join("")}<tr><td><strong>Total</strong></td><td><strong>${monthReqs.length}</strong></td></tr></table></div></body></html>`);
  w.document.close();w.focus();w.print();
}

export default function LegacyReports({data}){
  const {wos,equip,users}=data;
  const completed=wos.filter(w=>w.status==="completada");const prev=wos.filter(w=>w.type==="preventivo");const corr=wos.filter(w=>w.type==="correctivo");
  const totalHrs=completed.reduce((s,w)=>s+(w.actualHours||0),0);
  const byEquip=equip.map(e=>({...e,totalWOs:wos.filter(w=>w.equipId===e.id).length,completedWOs:completed.filter(w=>w.equipId===e.id).length,hrs:completed.filter(w=>w.equipId===e.id).reduce((s,w)=>s+(w.actualHours||0),0)})).sort((a,b)=>b.totalWOs-a.totalWOs);
  const thisMonth=new Date().toISOString().slice(0,7);
  const exportOTs=()=>{
    const rows=completed.map(w=>{const eq=equip.find(e=>e.id===w.equipId);const mec=users.find(u=>u.id===w.assignedTo);return{"Código":w.code,"Tipo":w.type,"Equipo":eq?.code||"—","Mecánico":mec?.name||"—","Prioridad":w.priority,"Estado":w.status,"Fecha Creación":fmt(w.createdAt),"Horas Estimadas":w.estimatedHours||0,"Horas Reales":w.actualHours||0};});
    downloadCSV(`ot_completadas_${new Date().toISOString().slice(0,10)}.csv`,rows);
  };
  return(
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900 font-bold text-xl">Informes y Análisis</h1>
        <div className="flex gap-2">
          {completed.length>0&&<button onClick={exportOTs} className={btnSecondary} style={{borderColor:NV.blue,color:NV.blue,background:"white"}}><FileDown size={14}/>Exportar OT</button>}
          <button onClick={()=>printMonthlyReport(data,equip,users,thisMonth)} className={btnSecondary} style={{borderColor:NV.navy,color:NV.navy,background:"white"}}><Printer size={14}/>Informe Mensual</button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="OT Completadas" value={completed.length} color="emerald"/>
        <StatCard icon={Wrench} label="Preventivas" value={prev.length} color="blue"/>
        <StatCard icon={AlertTriangle} label="Correctivas" value={corr.length} color="red"/>
        <StatCard icon={Clock} label="Horas Totales" value={`${totalHrs.toFixed(1)}h`} color="amber"/>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 text-xs text-white font-semibold uppercase tracking-wider" style={{background:NV.navyMid}}>OT por Equipo</div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 text-xs text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-200"><th className="text-left px-4 py-3">Equipo</th><th className="text-left px-4 py-3">Crit.</th><th className="text-right px-4 py-3">Total OT</th><th className="text-right px-4 py-3">Completadas</th><th className="text-right px-4 py-3">Horas</th></tr></thead>
          <tbody>{byEquip.filter(e=>e.totalWOs>0).map((e,i)=>(
            <tr key={e.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
              <td className="px-4 py-2.5"><p className="text-gray-800 font-medium text-sm">{e.name}</p><p className="font-mono text-xs" style={{color:NV.blue}}>{e.code}</p></td>
              <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[e.criticality]}`}>{e.criticality}</span></td>
              <td className="px-4 py-2.5 text-right text-gray-700 font-medium">{e.totalWOs}</td>
              <td className="px-4 py-2.5 text-right text-emerald-600 font-semibold">{e.completedWOs}</td>
              <td className="px-4 py-2.5 text-right text-gray-600">{e.hrs.toFixed(1)}h</td>
            </tr>
          ))}
          {byEquip.filter(e=>e.totalWOs>0).length===0&&<tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Sin OT registradas aún</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
