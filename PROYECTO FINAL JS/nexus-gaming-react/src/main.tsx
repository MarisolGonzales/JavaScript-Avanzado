import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router';
import 'bootstrap/dist/css/bootstrap.min.css';
import { App } from './App';
import { ApiError } from './api/http';
import { AsistenteProvider } from './context/AsistenteContext';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { FavoritosProvider } from './context/FavoritosContext';
import { InstalacionesProvider } from './context/InstalacionesContext';
import { TemaProvider } from './context/TemaContext';
import { ToastProvider } from './context/ToastContext';
// Mismo sistema de diseño (SCSS) que la versión Angular, sin cambios.
import './styles.scss';
import './react-ajustes.css';

/**
 * PUNTO DE ENTRADA. Aquí se arma el árbol de "proveedores" (Providers):
 * cada uno comparte un estado global con todos los componentes de abajo.
 *
 * StrictMode → QueryClientProvider (caché HTTP) → BrowserRouter (rutas)
 *   → Tema → Toasts → Auth → Favoritos → Carrito → Instalaciones → Asistente → <App/>
 */
const cache = new QueryClient({
  defaultOptions: {
    queries: {
      // No se reintenta un error del cliente (400-499): repetirlo daría lo mismo.
      retry: (fallos, error) => !(error instanceof ApiError && error.status && error.status < 500) && fallos < 2,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('Falta el contenedor #root.');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={cache}>
      <BrowserRouter>
        <TemaProvider>
          <ToastProvider>
            <AuthProvider>
              <FavoritosProvider>
                <CarritoProvider>
                  <InstalacionesProvider>
                    <AsistenteProvider>
                      <App />
                    </AsistenteProvider>
                  </InstalacionesProvider>
                </CarritoProvider>
              </FavoritosProvider>
            </AuthProvider>
          </ToastProvider>
        </TemaProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
