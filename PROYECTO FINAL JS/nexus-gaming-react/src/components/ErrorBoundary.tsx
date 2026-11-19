import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { mensajeError } from '../api/http';

interface Props { children: ReactNode; fallback?: (error: unknown, reiniciar: () => void) => ReactNode }
interface Estado { error: unknown; fallo: boolean }

/**
 * LÍMITE DE ERRORES (Laboratorio 13). Es el único caso donde React todavía necesita un
 * COMPONENTE DE CLASE: getDerivedStateFromError captura errores de render de sus hijos
 * (incluidos los que lanza use(promesa) dentro de <Suspense>) y muestra un respaldo.
 */
export class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { error: null, fallo: false };

  static getDerivedStateFromError(error: unknown): Estado {
    return { error, fallo: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    if (import.meta.env.DEV) console.warn('ErrorBoundary capturó:', error, info.componentStack);
  }

  reiniciar = () => this.setState({ error: null, fallo: false });

  render() {
    if (!this.state.fallo) return this.props.children;
    if (this.props.fallback) return this.props.fallback(this.state.error, this.reiniciar);
    return (
      <section className="page-body">
        <div className="estado-vacio" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /><h2>Algo salió mal</h2><p>{mensajeError(this.state.error)}</p>
          <button type="button" className="btn btn-primary" onClick={this.reiniciar}>Reintentar</button>
        </div>
      </section>
    );
  }
}
