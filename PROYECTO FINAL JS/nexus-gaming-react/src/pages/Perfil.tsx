import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import { mensajeError } from '../api/http';
import { authApi } from '../api/servicios';
import { ThemeToggle } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/TemaContext';
import { useToast } from '../context/ToastContext';
import { useDepartamentos, usePedidos } from '../hooks/consultas';
import { useTitulo } from '../hooks/useTitulo';
import { sumarSoles } from '../logic/dinero';
import { formatoSoles } from '../logic/formato';
import { passwordSegura, textoMinimo } from '../logic/validaciones-form';

/** MI PERFIL: dos formularios controlados que escriben en la API con useMutation (TanStack Query). */
export function Perfil() {
  useTitulo('Mi perfil · NEXUS GAMING');
  const auth = useAuth();
  const u = auth.usuario;
  const { tema } = useTema();
  const toast = useToast();
  const navigate = useNavigate();
  const departamentos = useDepartamentos();
  const pedidos = usePedidos(auth.esCliente);

  const [nombre, setNombre] = useState(u?.nombre ?? '');
  const [departamento, setDepartamento] = useState(u?.departamento ?? 'Lima');
  const [nombreTocado, setNombreTocado] = useState(false);
  const [clave, setClave] = useState({ actual: '', nueva: '', confirmar: '' });
  const [tocadas, setTocadas] = useState({ actual: false, nueva: false, confirmar: false });

  const stats = useMemo(() => {
    const lista = pedidos.data ?? [];
    return {
      pedidos: lista.length,
      juegos: lista.filter((p) => p.estado === 'ENTREGADO').reduce((n, p) => n + p.items.length, 0),
      gasto: sumarSoles(...lista.filter((p) => p.estado !== 'REEMBOLSADO').map((p) => p.total)),
    };
  }, [pedidos.data]);

  const nombreInvalido = !textoMinimo(nombre, 2) || nombre.length > 80;
  const err = {
    actual: tocadas.actual && clave.actual === '',
    nueva: tocadas.nueva && !passwordSegura(clave.nueva),
    noCoinciden: (tocadas.actual || tocadas.nueva || tocadas.confirmar) && clave.nueva !== clave.confirmar,
  };

  const guardar = useMutation({
    mutationFn: () => authApi.actualizarPerfil({ nombre: nombre.trim(), departamento }),
    onSuccess: (usuario) => { auth.actualizarUsuario(usuario); toast.exito('Perfil actualizado correctamente.'); },
    onError: (e) => toast.error(mensajeError(e)),
  });
  const cambiarClave = useMutation({
    mutationFn: () => authApi.cambiarPassword(clave.actual, clave.nueva),
    onSuccess: () => {
      setClave({ actual: '', nueva: '', confirmar: '' });
      setTocadas({ actual: false, nueva: false, confirmar: false });
      toast.exito('Contraseña actualizada.');
    },
    onError: (e) => toast.error(mensajeError(e)),
  });

  function enviarPerfil(e: FormEvent) {
    e.preventDefault();
    if (nombreInvalido) { setNombreTocado(true); return; }
    guardar.mutate();
  }

  function enviarClave(e: FormEvent) {
    e.preventDefault();
    if (!clave.actual || !passwordSegura(clave.nueva) || !clave.confirmar || clave.nueva !== clave.confirmar) {
      setTocadas({ actual: true, nueva: true, confirmar: true });
      return;
    }
    cambiarClave.mutate();
  }

  function cerrarSesion() {
    if (!window.confirm('¿Seguro que deseas cerrar sesión?')) return;
    auth.cerrarSesion();
    void navigate('/inicio');
  }

  const cambiar = (k: keyof typeof clave) => (e: { target: { value: string } }) => setClave((c) => ({ ...c, [k]: e.target.value }));
  const tocar = (k: keyof typeof tocadas) => () => setTocadas((t) => ({ ...t, [k]: true }));

  return (
    <>
      <section className="page-header">
        <h1>Mi perfil</h1>
        <p>Administra tus datos, tu contraseña y la apariencia de la tienda.</p>
      </section>

      <section className="page-body">
        {u && (
          <div className="profile-layout">
            <aside className="profile-card">
              <div className="profile-avatar" aria-hidden="true">{auth.inicial}</div>
              <h2 className="profile-name">{u.nombre}</h2>
              <p className="profile-email">{u.email}</p>
              <span className={`rol-badge ${auth.esStaff ? 'admin' : ''}`}>{auth.rolEtiqueta}</span>

              {auth.esCliente ? (
                <>
                  <dl className="profile-stats">
                    <div><dt>Pedidos</dt><dd>{stats.pedidos}</dd></div>
                    <div><dt>Juegos</dt><dd>{stats.juegos}</dd></div>
                    <div><dt>Gastado</dt><dd>{formatoSoles(stats.gasto)}</dd></div>
                  </dl>
                  <Link className="btn btn-secondary w-100" to="/pedidos"><i className="fa-solid fa-receipt" aria-hidden="true" /> Mis pedidos</Link>
                </>
              ) : (
                <Link className="btn btn-primary w-100" to="/admin"><i className="fa-solid fa-chart-line" aria-hidden="true" /> Ir al panel</Link>
              )}
              <button type="button" className="btn btn-link w-100" onClick={cerrarSesion}><i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Cerrar sesión</button>
            </aside>

            <div className="profile-forms">
              <form className="panel-nx" onSubmit={enviarPerfil} noValidate aria-labelledby="t-datos">
                <h2 id="t-datos">Datos personales</h2>
                <div className="form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input id="nombre" type="text" autoComplete="name" className={nombreTocado && nombreInvalido ? 'invalido' : undefined}
                    value={nombre} onChange={(e) => setNombre(e.target.value)} onBlur={() => setNombreTocado(true)} />
                  {nombreTocado && nombreInvalido && <p className="msg-error">Escribe tu nombre (2 a 80 caracteres).</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="email">Correo electrónico</label>
                  <input id="email" type="email" value={u.email} disabled aria-describedby="ayuda-email" />
                  <p id="ayuda-email" className="form-hint">El correo es tu usuario y no se puede cambiar.</p>
                </div>
                <div className="form-group">
                  <label htmlFor="departamento">Departamento</label>
                  <select id="departamento" value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
                    {departamentos.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" disabled={guardar.isPending}>{guardar.isPending ? 'Guardando…' : 'Guardar cambios'}</button>
              </form>

              <form className="panel-nx" onSubmit={enviarClave} noValidate aria-labelledby="t-clave">
                <h2 id="t-clave">Cambiar contraseña</h2>
                <div className="form-group">
                  <label htmlFor="clave-actual">Contraseña actual</label>
                  <input id="clave-actual" type="password" autoComplete="current-password" className={err.actual ? 'invalido' : undefined}
                    value={clave.actual} onChange={cambiar('actual')} onBlur={tocar('actual')} />
                  {err.actual && <p className="msg-error">Escribe tu contraseña actual.</p>}
                </div>
                <div className="form-fila">
                  <div className="form-group">
                    <label htmlFor="clave-nueva">Nueva contraseña</label>
                    <input id="clave-nueva" type="password" autoComplete="new-password" className={err.nueva ? 'invalido' : undefined}
                      value={clave.nueva} onChange={cambiar('nueva')} onBlur={tocar('nueva')} />
                    {err.nueva && <p className="msg-error">Mínimo 8 caracteres con letras y números.</p>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="clave-confirmar">Repite la nueva</label>
                    <input id="clave-confirmar" type="password" autoComplete="new-password" className={err.noCoinciden ? 'invalido' : undefined}
                      value={clave.confirmar} onChange={cambiar('confirmar')} onBlur={tocar('confirmar')} />
                    {err.noCoinciden && <p className="msg-error">Las contraseñas no coinciden.</p>}
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={cambiarClave.isPending}>{cambiarClave.isPending ? 'Actualizando…' : 'Actualizar contraseña'}</button>
              </form>

              <section className="panel-nx" aria-labelledby="t-apariencia">
                <h2 id="t-apariencia">Apariencia</h2>
                <div className="fila-apariencia">
                  <div><strong>Tema {tema === 'oscuro' ? 'oscuro' : 'claro'}</strong><p className="muted small">Se recuerda en este navegador, tanto en la tienda como en el panel.</p></div>
                  <ThemeToggle />
                </div>
              </section>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
