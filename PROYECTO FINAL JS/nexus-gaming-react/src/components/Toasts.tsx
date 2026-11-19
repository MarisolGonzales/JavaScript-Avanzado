import { createPortal } from 'react-dom';
import { useToast } from '../context/ToastContext';

/**
 * AVISOS FLOTANTES con createPortal: se dibujan directamente en <body>,
 * fuera del árbol visual de la página, para quedar siempre encima de todo.
 */
export function Toasts() {
  const { toasts, cerrar } = useToast();
  return createPortal(
    <div className="toast-zona" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-nx toast-${t.tipo}`} role={t.tipo === 'error' ? 'alert' : 'status'}>
          <i className={`fa-solid ${t.tipo === 'exito' ? 'fa-circle-check' : t.tipo === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info'}`} aria-hidden="true" />
          <span>{t.mensaje}</span>
          <button type="button" className="toast-cerrar" aria-label="Cerrar aviso" onClick={() => cerrar(t.id)}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
