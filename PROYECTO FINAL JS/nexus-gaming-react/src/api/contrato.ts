import { z } from 'zod';
import { ApiError } from './http';

/**
 * CONTRATO DE LA API CON ZOD (Laboratorio 14).
 * La respuesta del servidor es `unknown` hasta que un esquema confirma su forma.
 * Si no cumple el contrato se lanza ApiError('format') en vez de pintar datos rotos.
 */
const rol = z.enum(['cliente', 'soporte', 'admin']);

export const usuarioSchema = z.object({
  email: z.string(),
  nombre: z.string(),
  rol,
  departamento: z.string(),
});
export const sesionSchema = z.object({ token: z.string().min(10), usuario: usuarioSchema });

export const juegoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  price: z.number().nonnegative(),
  category: z.string(),
  image: z.string(),
  banner: z.string().nullable(),
  description: z.string(),
  developer: z.string().nullable(),
  year: z.number().int().nullable(),
  platforms: z.string().nullable(),
  mode: z.string().nullable(),
  stock: z.number().int().nonnegative(),
  stockPorNodo: z.record(z.enum(['NORTE', 'SUR', 'CENTRO']), z.number()).optional(),
});
export const juegosSchema = z.array(juegoSchema);

/** Pedidos y reportes traen muchos campos: se valida lo esencial y se deja pasar el resto. */
export const pedidoSchema = z.looseObject({
  codigo: z.string(),
  estado: z.enum(['PENDIENTE', 'PAGADO', 'ENTREGADO', 'REEMBOLSADO']),
  total: z.number(),
  fecha: z.string(),
  items: z.array(z.looseObject({ idJuego: z.number(), titulo: z.string() })),
});

export function decodificar<T>(schema: z.ZodType<T>, valor: unknown): T {
  const r = schema.safeParse(valor);
  if (!r.success) throw new ApiError('format', 'La respuesta del servidor no cumple el contrato esperado.');
  return r.data;
}
