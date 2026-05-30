import { Clock, Wrench, TrendingUp, AlertTriangle, BarChart2 } from 'lucide-react';
import { NV, CRIT_CLS, card } from '../../utils/constants';

function StatCard({icon:Icon,label,value,sub,color="navy"}){
  const m={navy:"border-blue-200 bg-blue-50 text-blue-800",blue:"border-blue-200 bg-blue-50 text-blue-700",red:"border-red-200 bg-red-50 text-red-600",amber:"border-amber-200 bg-amber-50 text-amber-700",emerald:"border-emerald-200 bg-emerald-50 text-emerald-700",cyan:"border-cyan-200 bg-cyan-50 text-cyan-700"};
  return(
    <div className={`${card} p-5 flex items-center gap-4`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${m[color]||m.navy}`}><Icon size={20}/></div>
      <div><p className="text-gray-500 text-xs font-medium mb-0.5">{label}</p><p className="text-gray-900 font-bold text-2xl leading-none">{value}</p>{sub&&<p className="text-gray-400 text-xs mt-1">{sub}</p>}</div>
    </div>
  );
}

export default function LegacyIndicadores({data}){
  const {wos,equip}=data;
  const calc=eqId=>{const eq=equip.find(e=>e.id===eqId);const corr=wos.filter(w=>w.equipId===eqId&&w.type==="correctivo");const comp=corr.filter(w=>w.status==="completada"&&w.actualHours);const n=corr.length;const mttr=comp.length>0?(comp.reduce((s,w)=>s+(w.actualHours||0),0)/comp.length):null;const mtbf=n>0&&eq?(eq.hours/n):null;const disp=(mtbf!==null&&mttr!==null&&(mtbf+mttr)>0)?(mtbf/(mtbf+mttr)*100):null;return{n,mttr,mtbf,disp};};
  const gC=wos.filter(w=>w.type==="correctivo");const gCo=gC.filter(w=>w.status==="completada"&&w.actualHours);
  const gMTTR=gCo.length>0?(gCo.reduce((s,w)=>s+(w.actualHours||0),0)/gCo.length):null;
  const tH=equip.reduce((s,e)=>s+e.hours,0);const gMTBF=gC.length>0?(tH/gC.length):null;const gD=(gMTBF!==null&&gMTTR!==null&&(gMTBF+gMTTR)>0)?(gMTBF/(gMTBF+gMTTR)*100):null;
  const fH=v=>v===null?"N/D":`${v.toFixed(1)}h`;const fP=v=>v===null?"N/D":`${v.toFixed(1)}%`;const dC=v=>v===null?"text-gray-400":v>=90?"text-emerald-600":v>=70?"text-amber-600":"text-red-600";
  return(
    <div className="p-6 space-y-6">
      <div><h1 className="text-gray-900 font-bold text-xl">Indicadores de Mantenimiento</h1><p className="text-gray-500 text-sm">MTBF · MTTR · Disponibilidad</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="MTBF Global" value={fH(gMTBF)} sub="horas entre fallas" color="blue"/>
        <StatCard icon={Wrench} label="MTTR Global" value={fH(gMTTR)} sub="horas por reparación" color="amber"/>
        <StatCard icon={TrendingUp} label="Disponibilidad" value={fP(gD)} sub="de la flota" color="emerald"/>
        <StatCard icon={AlertTriangle} label="Total Fallas" value={gC.length} sub="OT correctivas registradas" color="red"/>
      </div>
      <div className={`${card} overflow-hidden`}>
        <div className="px-4 py-3 text-xs text-white font-semibold uppercase tracking-wider flex items-center gap-2" style={{background:NV.navyMid}}><BarChart2 size={14}/>KPIs por Equipo</div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-semibold uppercase tracking-wider"><th className="text-left px-4 py-3">Equipo</th><th className="text-left px-4 py-3">Crit.</th><th className="text-right px-4 py-3">Horas</th><th className="text-right px-4 py-3">Fallas</th><th className="text-right px-4 py-3">MTBF</th><th className="text-right px-4 py-3">MTTR</th><th className="text-center px-4 py-3">Disponib.</th></tr></thead>
          <tbody>{equip.map((e,i)=>{const m=calc(e.id);return(
            <tr key={e.id} className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition ${i%2===0?"bg-white":"bg-gray-50/40"}`}>
              <td className="px-4 py-2.5"><p className="text-gray-800 font-medium text-sm">{e.name}</p><p className="font-mono text-xs" style={{color:NV.blue}}>{e.code}</p></td>
              <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${CRIT_CLS[e.criticality]}`}>{e.criticality}</span></td>
              <td className="px-4 py-2.5 text-right text-gray-600 text-xs font-mono">{e.hours.toLocaleString()}h</td>
              <td className="px-4 py-2.5 text-right"><span className={`font-bold text-sm ${m.n>0?"text-red-600":"text-gray-400"}`}>{m.n}</span></td>
              <td className="px-4 py-2.5 text-right font-semibold text-sm" style={{color:NV.blue}}>{fH(m.mtbf)}</td>
              <td className="px-4 py-2.5 text-right text-amber-700 font-semibold text-sm">{fH(m.mttr)}</td>
              <td className="px-4 py-2.5 text-center">{m.disp!==null?(<div className="flex flex-col items-center gap-1"><span className={`font-bold text-sm ${dC(m.disp)}`}>{fP(m.disp)}</span><div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${m.disp>=90?"bg-emerald-500":m.disp>=70?"bg-amber-400":"bg-red-500"}`} style={{width:`${Math.min(100,m.disp)}%`}}/></div></div>):<span className="text-gray-400 text-xs">Sin datos</span>}</td>
            </tr>
          );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
