import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { mensajeError } from '../api/http';
import { CampoTexto } from '../components/CampoTexto';
import type { CampoHandle } from '../components/CampoTexto';
import { Logo, ThemeToggle } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTitulo } from '../hooks/useTitulo';
import { esEmail } from '../logic/validaciones-form';

/** Cuentas de demostración del proyecto (las crea el servidor la primera vez). */
const CUENTAS_DEMO: readonly { rol: string; icono: string; email: string; password: string }[] = [
  { rol: 'Cliente', icono: 'fa-user', email: 'vanessa@utp.edu.pe', password: 'Cliente2026!' },
  { rol: 'Soporte', icono: 'fa-headset', email: 'soporte@nexusgaming.pe', password: 'Soporte2026!' },
  { rol: 'Administrador', icono: 'fa-user-shield', email: 'admin@nexusgaming.pe', password: 'Admin2026!' },
];

/** Solo rutas internas: evita redirigir a otro sitio con ?volver=//sitio-malicioso. */
export const destinoSeguro = (v: string | null): string | null => (v && v.startsWith('/') && !v.startsWith('//') ? v : null);

/**
 * INICIAR SESIÓN. Si falla, el foco vuelve al correo usando la "manija" que expone
 * CampoTexto con useImperativeHandle (useRef<CampoHandle>).
 */
export function Login() {
  useTitulo('Ingresar · NEXUS GAMING');
  const auth = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const volver = params.get('volver');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tocados, setTocados] = useState({ email: false, password: false });
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const campoEmail = useRef<CampoHandle>(null);

  const invalido = { email: tocados.email && !esEmail(email), password: tocados.password && password === '' };

  function usarCuenta(c: { email: string; password: string }) {
    setEmail(c.email);
    setPassword(c.password);
    setError(null);
  }

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (!esEmail(email) || !password) { setTocados({ email: true, password: true }); return; }
    setEnviando(true);
    setError(null);
    try {
      const usuario = await auth.login(email.trim().toLowerCase(), password);
      toast.exito(`¡Bienvenido, ${usuario.nombre.split(' ')[0]}!`);
      // El personal va a su panel; el cliente vuelve a donde estaba (solo rutas internas).
      void navigate(usuario.rol === 'cliente' ? destinoSeguro(volver) ?? '/inicio' : '/admin', { replace: true });
    } catch (err) {
      setEnviando(false);
      setError(mensajeError(err));
      campoEmail.current?.enfocar();
    }
  }

  return (
    <div className="auth-pagina">
      <aside className="auth-marca" aria-hidden="false">
        <Link to="/inicio" className="auth-logo" aria-label="Ir a la tienda"><Logo tamano={44} /></Link>
        <div className="auth-marca-texto">
          <h1>Tus juegos, al instante.</h1>
          <p>Compra licencias digitales, instálalas en segundos y descarga tu comprobante en PDF.</p>
          <ul className="auth-puntos">
            <li><i className="fa-solid fa-bolt" aria-hidden="true" /> Entrega inmediata en tu biblioteca</li>
            <li><i className="fa-solid fa-gift" aria-hidden="true" /> Regala juegos a tus amigos</li>
            <li><i className="fa-solid fa-headset" aria-hidden="true" /> Asistente virtual y soporte humano</li>
          </ul>
        </div>
        <p className="auth-pie">Proyecto académico · JavaScript Avanzado (UTP)</p>
      </aside>

      <main className="auth-formulario" id="contenido">
        <div className="auth-tema"><ThemeToggle /></div>
        <div className="auth-caja">
          <h2>Iniciar sesión</h2>
          <p className="muted">¿No tienes cuenta? <Link to={volver ? `/registro?volver=${encodeURIComponent(volver)}` : '/registro'}>Crea una gratis</Link></p>

          <form onSubmit={entrar} noValidate>
            <CampoTexto ref={campoEmail} id="email" etiqueta="Correo electrónico" type="email" autoComplete="username" placeholder="tucorreo@ejemplo.com"
              value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => setTocados((t) => ({ ...t, email: true }))}
              error={invalido.email ? 'Escribe un correo válido.' : null} />
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="input-con-boton">
                <input id="password" type={verClave ? 'text' : 'password'} autoComplete="current-password" className={invalido.password ? 'invalido' : undefined}
                  value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => setTocados((t) => ({ ...t, password: true }))} />
                <button type="button" className="btn-icono" aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={verClave} onClick={() => setVerClave(!verClave)}>
                  <i className={`fa-solid ${verClave ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                </button>
              </div>
              {invalido.password && <p className="msg-error">Escribe tu contraseña.</p>}
            </div>

            {error && <div className="banner-error en-panel" role="alert"><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {error}</div>}

            <button type="submit" className="btn btn-primary w-100" disabled={enviando}>
              {enviando ? <><span className="spinner" aria-hidden="true" /> Ingresando…</> : 'Ingresar'}
            </button>
          </form>

          <section className="demo-cuentas" aria-labelledby="t-demo">
            <h3 id="t-demo" className="h6">Cuentas de demostración</h3>
            <p className="muted small">Toca una para rellenar el formulario y luego pulsa Ingresar.</p>
            <div className="demo-botones">
              {CUENTAS_DEMO.map((c) => (
                <button key={c.email} type="button" className="demo-boton" onClick={() => usarCuenta(c)}>
                  <i className={`fa-solid ${c.icono}`} aria-hidden="true" />
                  <span><strong>{c.rol}</strong><small>{c.email}</small></span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
