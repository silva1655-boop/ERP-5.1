import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Error renderizando la aplicación', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="min-h-screen bg-slate-100 p-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wide">Error de visualización</p>
            <h1 className="mt-2 text-2xl font-bold">La aplicación cargó, pero ocurrió un error en pantalla.</h1>
            <p className="mt-2 text-sm leading-6">Revisa la consola del navegador y la configuración de variables de entorno del despliegue.</p>
            <pre className="mt-4 overflow-auto rounded-xl bg-red-950 p-4 text-xs text-red-50">{this.state.error?.message || String(this.state.error)}</pre>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
