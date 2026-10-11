import { forbidden, unauthorized } from '../errors.js';
import { verificarToken } from '../domain/auth.js';

/**
 * Lee "Authorization: Bearer <token>", comprueba la firma y carga la cuenta
 * actual desde la base (así un cambio de rol o de departamento se nota al instante).
 * Si no hay token válido, req.cuenta = null y las rutas públicas siguen funcionando.
 */
export function autenticar(repo, secreto) {
  return async (req, _res, next) => {
    req.cuenta = null;
    const cabecera = req.get('authorization') ?? '';
    const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
    const datos = token ? verificarToken(token, secreto) : null;
    if (datos?.sub) {
      try {
        const u = await repo.buscarUsuario(datos.sub);
        if (u) req.cuenta = { email: u.email, nombre: u.nombre, rol: u.rol, departamento: u.departamento };
      } catch (e) { return next(e); }
    }
    next();
  };
}

export const esStaff = (cuenta) => cuenta?.rol === 'admin' || cuenta?.rol === 'soporte';

export function requiereLogin(req, _res, next) {
  next(req.cuenta ? undefined : unauthorized());
}
/** Admin y soporte: ven ventas, pedidos, clientes y tickets. */
export function soloStaff(req, _res, next) {
  if (!req.cuenta) return next(unauthorized());
  next(esStaff(req.cuenta) ? undefined : forbidden('Esta sección es solo para el personal de NEXUS GAMING.'));
}
/** Solo administración: catálogo, stock y borrado de tickets. */
export function soloAdmin(req, _res, next) {
  if (!req.cuenta) return next(unauthorized());
  next(req.cuenta.rol === 'admin' ? undefined : forbidden('Esta operación es exclusiva de administración.'));
}
