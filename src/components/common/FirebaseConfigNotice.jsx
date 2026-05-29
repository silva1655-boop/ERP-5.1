import { missingFirebaseEnvKeys } from '../../services/firebase';

export default function FirebaseConfigNotice({ compact = false }) {
  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50 text-amber-900 ${compact ? 'p-4 text-sm' : 'p-6 shadow-sm'}`}>
      <p className="text-sm font-semibold uppercase tracking-wide">Configuración Firebase pendiente</p>
      <h2 className="mt-2 text-2xl font-bold text-amber-950">La app compiló, pero faltan variables de entorno en el deploy.</h2>
      <p className="mt-2 text-sm leading-6">
        Para evitar una pantalla en blanco, la aplicación se mantiene cargada y muestra este aviso. Configura estas variables en Vercel
        en <strong>Project Settings → Environment Variables</strong> y vuelve a desplegar.
      </p>
      <pre className="mt-4 overflow-auto rounded-xl bg-amber-950 p-4 text-xs text-amber-50">{missingFirebaseEnvKeys.join('\n')}</pre>
    </div>
  );
}
