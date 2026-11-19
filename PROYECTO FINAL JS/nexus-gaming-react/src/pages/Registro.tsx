import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { mensajeError } from '../api/http';
import { CampoTexto } from '../components/CampoTexto';
import { Logo, ThemeToggle } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDepartamentos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { fuerzaPassword } from '../logic/password';
import { esEmail, passwordSegura, textoMinimo } from '../logic/validaciones-form';
import { destinoSeguro } from './Login';

type CampoReg = 'nombre' | 'email' | 'password' | 'confirmar';

/** CREAR CUENTA: formulario controlado con validación en vivo (las cuentas nuevas siempre son de cliente). */
export function Registro() {
  useTitulo('Crear cuenta · NEXUS GAMING');
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const departamentos = useDepartamentos();
  const [params] = useSearchParams();
  const volver = params.get('volver');
  const [datos, setDatos] = useState({ nombre: '', email: '', departamento: 'Lima', password: '', confirmar: '' });
  const [tocados, setTocados] = useState<Record<CampoReg, boolean>>({ nombre: false, email: false, password: false, confirmar: false });
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fuerza = fuerzaPassword(datos.password);

  const validos = {
    nombre: textoMinimo(datos.nombre, 2) && datos.nombre.length <= 80,
    email: esEmail(datos.email) && datos.email.length <= 80,
    password: passwordSegura(datos.password),
    confirmar: datos.confirmar !== '',
  };
  const noCoinciden = datos.password !== datos.confirmar;
  const invalido = (c: CampoReg) => tocados[c] && !validos[c];

  const cambiar = (k: keyof typeof datos) => (e: { target: { value: string } }) => setDatos((d) => ({ ...d, [k]: e.target.value }));
  const tocar = (c: CampoReg) => () => setTocados((t) => ({ ...t, [c]: true }));

  async function crear(e: FormEvent) {
    e.preventDefault();
    if (!validos.nombre || !validos.email || !validos.password || !validos.confirmar || noCoinciden) {
      setTocados({ nombre: true, email: true, password: true, confirmar: true });
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      const usuario = await auth.registrar({ nombre: datos.nombre.trim(), email: datos.email.trim().toLowerCase(), departamento: datos.departamento, password: datos.password });
      toast.exito(`¡Cuenta creada! Bienvenido, ${usuario.nombre.split(' ')[0]}.`);
      void navigate(destinoSeguro(volver) ?? '/inicio', { replace: true });
    } catch (err) {
      setEnviando(false);
      setError(mensajeError(err));
    }
  }

  return (
    <div className="auth-pagina">
      <aside className="auth-marca">
        <Link to="/inicio" className="auth-logo" aria-label="Ir a la tienda"><Logo tamano={44} /></Link>
        <div className="auth-marca-texto">
          <h1>Únete a NEXUS GAMING.</h1>
          <p>Crea tu cuenta en un minuto y empieza a armar tu biblioteca de juegos.</p>
          <ul className="auth-puntos">
            <li><i className="fa-solid fa-layer-group" aria-hidden="true" /> Todos tus juegos en un solo lugar</li>
            <li><i className="fa-solid fa-file-invoice" aria-hidden="true" /> Boleta o factura electrónica en PDF</li>
            <li><i className="fa-solid fa-rotate-left" aria-hidden="true" /> Reembolso dentro de 14 días</li>
          </ul>
        </div>
        <p className="auth-pie">Proyecto académico · JavaScript Avanzado (UTP)</p>
      </aside>

      <main className="auth-formulario" id="contenido">
        <div className="auth-tema"><ThemeToggle /></div>
        <div className="auth-caja">
          <h2>Crear cuenta</h2>
          <p className="muted">¿Ya tienes cuenta? <Link to={volver ? `/login?volver=${encodeURIComponent(volver)}` : '/login'}>Inicia sesión</Link></p>

          <form onSubmit={crear} noValidate>
            <CampoTexto id="nombre" etiqueta="Nombre completo" autoComplete="name" value={datos.nombre} onChange={cambiar('nombre')} onBlur={tocar('nombre')}
              error={invalido('nombre') ? 'Escribe tu nombre (2 a 80 caracteres).' : null} />
            <CampoTexto id="email" etiqueta="Correo electrónico" type="email" autoComplete="email" value={datos.email} onChange={cambiar('email')} onBlur={tocar('email')}
              error={invalido('email') ? 'Escribe un correo válido.' : null} />
            <div className="form-group">
              <label htmlFor="departamento">Departamento</label>
              <select id="departamento" value={datos.departamento} onChange={cambiar('departamento')}>
                {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-con-boton">
                <input id="password" type={verClave ? 'text' : 'password'} autoComplete="new-password" aria-describedby="ayuda-clave" className={invalido('password') ? 'invalido' : undefined}
                  value={datos.password} onChange={cambiar('password')} onBlur={tocar('password')} />
                <button type="button" className="btn-icono" aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verClave} onClick={() => setVerClave(!verClave)}><i className={`fa-solid ${verClave ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" /></button>
              </div>
              <div className="fuerza" data-nivel={fuerza.nivel} aria-live="polite"><span /><span /><span /><span /><small>{fuerza.etiqueta}</small></div>
              <p id="ayuda-clave" className="form-hint">Mínimo 8 caracteres con letras y números.</p>
              {invalido('password') && <p className="msg-error">La contraseña no cumple los requisitos.</p>}
            </div>
            <div className="form-group">
              <label htmlFor="confirmar">Repite la contraseña</label>
              <input id="confirmar" type={verClave ? 'text' : 'password'} autoComplete="new-password" className={tocados.confirmar && noCoinciden ? 'invalido' : undefined}
                value={datos.confirmar} onChange={cambiar('confirmar')} onBlur={tocar('confirmar')} />
              {tocados.confirmar && noCoinciden && <p className="msg-error">Las contraseñas no coinciden.</p>}
            </div>

            {error && <div className="banner-error en-panel" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {error}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? <><span className="spinner" aria-hidden="true" /> Creando cuenta…</> : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
