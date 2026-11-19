import { lazy } from 'react';
import type { ComponentType } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AdminLayout } from './components/AdminLayout';
import { RutaProtegida } from './components/RutaProtegida';
import { TiendaLayout } from './components/TiendaLayout';
import { Toasts } from './components/Toasts';

/**
 * RUTAS DE LA APLICACIÓN (React Router).
 * Cada página se carga con lazy(): su código se descarga solo al visitarla
 * (el <Suspense> de cada layout muestra "Cargando…" mientras tanto).
 * Hay DOS interfaces: la TIENDA (cliente) y el PANEL (administración y soporte).
 */
const pagina = <T extends string>(cargar: () => Promise<Record<T, ComponentType>>, nombre: T) =>
  lazy(async () => ({ default: (await cargar())[nombre] }));

const Inicio = pagina(() => import('./pages/Inicio'), 'Inicio');
const Catalogo = pagina(() => import('./pages/Catalogo'), 'Catalogo');
const JuegoDetalle = pagina(() => import('./pages/JuegoDetalle'), 'JuegoDetalle');
const Carrito = pagina(() => import('./pages/Carrito'), 'Carrito');
const Checkout = pagina(() => import('./pages/Checkout'), 'Checkout');
const Pedidos = pagina(() => import('./pages/Pedidos'), 'Pedidos');
const PedidoDetalle = pagina(() => import('./pages/PedidoDetalle'), 'PedidoDetalle');
const Biblioteca = pagina(() => import('./pages/Biblioteca'), 'Biblioteca');
const Favoritos = pagina(() => import('./pages/Favoritos'), 'Favoritos');
const Logros = pagina(() => import('./pages/Logros'), 'Logros');
const Perfil = pagina(() => import('./pages/Perfil'), 'Perfil');
const Soporte = pagina(() => import('./pages/Soporte'), 'Soporte');
const Login = pagina(() => import('./pages/Login'), 'Login');
const Registro = pagina(() => import('./pages/Registro'), 'Registro');
const NoEncontrada = pagina(() => import('./pages/NoEncontrada'), 'NoEncontrada');
const Dashboard = pagina(() => import('./pages/admin/Dashboard'), 'Dashboard');
const PedidosAdmin = pagina(() => import('./pages/admin/PedidosAdmin'), 'PedidosAdmin');
const Clientes = pagina(() => import('./pages/admin/Clientes'), 'Clientes');
const SoporteAdmin = pagina(() => import('./pages/admin/SoporteAdmin'), 'SoporteAdmin');
const CatalogoAdmin = pagina(() => import('./pages/admin/CatalogoAdmin'), 'CatalogoAdmin');

export function App() {
  return (
    <>
      <Routes>
        {/* ---------- Panel de administración / soporte ---------- */}
        <Route path="admin" element={<RutaProtegida requiere="staff"><AdminLayout /></RutaProtegida>}>
          <Route index element={<Dashboard />} />
          <Route path="pedidos" element={<PedidosAdmin />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="soporte" element={<SoporteAdmin />} />
          <Route path="catalogo" element={<RutaProtegida requiere="admin"><CatalogoAdmin /></RutaProtegida>} />
        </Route>

        {/* ---------- Acceso (pantallas completas, sin la barra de la tienda) ---------- */}
        <Route path="login" element={<RutaProtegida requiere="invitado"><Login /></RutaProtegida>} />
        <Route path="registro" element={<RutaProtegida requiere="invitado"><Registro /></RutaProtegida>} />

        {/* ---------- Tienda ---------- */}
        <Route element={<TiendaLayout />}>
          <Route index element={<Navigate to="/inicio" replace />} />
          <Route path="inicio" element={<Inicio />} />
          <Route path="catalogo" element={<Catalogo />} />
          <Route path="juego/:id" element={<JuegoDetalle />} />
          <Route path="carrito" element={<Carrito />} />
          <Route path="soporte" element={<Soporte />} />
          <Route path="checkout" element={<RutaProtegida requiere="cliente"><Checkout /></RutaProtegida>} />
          <Route path="favoritos" element={<RutaProtegida requiere="cliente"><Favoritos /></RutaProtegida>} />
          <Route path="logros" element={<RutaProtegida requiere="cliente"><Logros /></RutaProtegida>} />
          <Route path="biblioteca" element={<RutaProtegida requiere="sesion"><Biblioteca /></RutaProtegida>} />
          <Route path="pedidos" element={<RutaProtegida requiere="sesion"><Pedidos /></RutaProtegida>} />
          <Route path="pedidos/:codigo" element={<RutaProtegida requiere="sesion"><PedidoDetalle /></RutaProtegida>} />
          <Route path="perfil" element={<RutaProtegida requiere="sesion"><Perfil /></RutaProtegida>} />
          <Route path="*" element={<NoEncontrada />} />
        </Route>
      </Routes>
      <Toasts />
    </>
  );
}
