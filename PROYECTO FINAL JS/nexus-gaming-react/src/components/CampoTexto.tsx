import { useId, useImperativeHandle, useRef } from 'react';
import type { InputHTMLAttributes, Ref } from 'react';

export type CampoHandle = { enfocar: () => void };

type Props = InputHTMLAttributes<HTMLInputElement> & {
  etiqueta: string;
  /** Mensaje de error; si viene, el campo se marca en rojo. */
  error?: string | null;
  ref?: Ref<CampoHandle>;
};

/**
 * CAMPO DE FORMULARIO con el mismo HTML que la versión Angular (.form-group, label, input, .msg-error).
 * - useId genera un id único si no se pasa uno.
 * - useImperativeHandle expone SOLO el método enfocar() al padre (en React 19 `ref` es una prop).
 */
export function CampoTexto({ etiqueta, error, ref, id, className, ...resto }: Props) {
  const idAuto = useId();
  const idCampo = id ?? idAuto;
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ enfocar: () => input.current?.focus() }), []);

  return (
    <div className="form-group">
      <label htmlFor={idCampo}>{etiqueta}</label>
      <input id={idCampo} ref={input} className={[className, error ? 'invalido' : ''].filter(Boolean).join(' ') || undefined} {...resto} />
      {error && <p className="msg-error">{error}</p>}
    </div>
  );
}
