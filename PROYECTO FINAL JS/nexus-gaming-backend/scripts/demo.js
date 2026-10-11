/**
 * DATOS DE DEMOSTRACIÓN para que el panel de administración se vea con vida.
 *   npm run demo            (usa el driver de tu .env: json o postgres)
 *   npm run demo -- --forzar   (agrega más datos aunque ya existan pedidos)
 * Crea 8 clientes, ~40 pedidos repartidos en los últimos 14 días (algunos regalos, facturas y
 * reembolsos) y varios tickets de soporte. Usa un generador pseudoaleatorio con semilla fija,
 * así siempre produce los mismos datos.
 */
import { hashPassword } from '../src/domain/auth.js';
import { nodoDeDepartamento } from '../src/domain/regiones.js';
import { crearRepo } from '../src/repos/index.js';

const CLIENTES = [
  ['Ana Torres', 'ana.torres@utp.edu.pe', 'Arequipa'], ['Luis Ramírez', 'luis.ramirez@utp.edu.pe', 'Piura'],
  ['María Paredes', 'maria.paredes@utp.edu.pe', 'Cusco'], ['Carlos Vega', 'carlos.vega@utp.edu.pe', 'Lima'],
  ['Sofía Medina', 'sofia.medina@utp.edu.pe', 'La Libertad'], ['Diego Salas', 'diego.salas@utp.edu.pe', 'Lima'],
  ['Valeria Quispe', 'valeria.quispe@utp.edu.pe', 'Puno'], ['Jorge Rojas', 'jorge.rojas@utp.edu.pe', 'Junín']
];
const EMPRESAS = [
  { documento: '20601234565', nombre: 'Estudio Pixel S.A.C.', direccion: 'Jr. de la Unión 123, Cercado de Lima' },
  { documento: '20100070970', nombre: 'Cabinas Gamer Perú E.I.R.L.', direccion: 'Av. Arequipa 2450, Lince, Lima' }
];
const METODOS = ['TARJETA', 'YAPE', 'PLIN', 'TARJETA'];

let semilla = 20260401;                       // mulberry32: pseudoaleatorio reproducible
const azar = () => { semilla |= 0; semilla = (semilla + 0x6d2b79f5) | 0; let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const elegir = (l) => l[Math.floor(azar() * l.length)];

const repo = await crearRepo();
await repo.init();
try {
  const forzar = process.argv.includes('--forzar');
  if ((await repo.listarPedidos()).length >= 10 && !forzar) {
    console.log('Ya hay pedidos: no se agregó nada (usa  npm run demo -- --forzar  para agregar más).');
    process.exit(0);
  }

  const passwordHash = await hashPassword('Cliente2026!');
  for (const [nombre, email, departamento] of CLIENTES) {
    await repo.crearUsuario({ email, nombre, passwordHash, rol: 'cliente', departamento }).catch(() => undefined); // si ya existe, se omite
  }
  const clientes = await Promise.all(CLIENTES.map(async ([, email]) => repo.buscarUsuario(email)));
  const juegos = await repo.listarJuegos();
  const ids = juegos.map((j) => j.id);

  const creados = [];
  let sinStock = 0;
  for (let dia = 13; dia >= 0; dia--) {
    for (let k = 0, n = 2 + Math.floor(azar() * 4); k < n; k++) {
      const c = elegir(clientes);
      const cantidad = 1 + Math.floor(azar() * 3);
      const elegidos = [...new Set(Array.from({ length: cantidad }, () => elegir(ids)))];
      const esRegalo = azar() < 0.1;
      const amigo = elegir(clientes.filter((x) => x.email !== c.email));
      const items = elegidos.map((idJuego, i) => ({ idJuego, cantidad: 1, tipoEntrega: esRegalo && i === 0 ? 'REGALO' : 'DIGITAL' }));
      const factura = azar() < 0.2 ? elegir(EMPRESAS) : null;
      try {
        const p = await repo.crearPedido({
          usuario: c.email, nombreUsuario: c.nombre, departamento: c.departamento, nodo: nodoDeDepartamento(c.departamento),
          items, pago: { metodo: elegir(METODOS), referencia: '4242' },
          comprobante: factura ? { tipo: 'FACTURA', tipoDoc: 'RUC', ...factura } : { tipo: 'BOLETA', tipoDoc: 'SIN DOC', documento: null, nombre: null, direccion: null },
          regalo: esRegalo ? { destinatario: amigo.email, mensaje: '¡Para que lo disfrutes!' } : null
        });
        // Hora aleatoria dentro de ese día (en horario de tienda: 9:00 a 23:00 hora de Lima).
        const fecha = new Date(Date.now() - dia * 86_400_000);
        fecha.setUTCHours(14 + Math.floor(azar() * 14), Math.floor(azar() * 60), 0, 0);
        await repo.reprogramarFecha(p.codigo, (fecha > new Date() ? new Date(Date.now() - 600_000) : fecha).toISOString());
        creados.push({ ...p, dia });
      } catch (e) {
        if (e.status === 409) sinStock++; else throw e;     // juego agotado en ese servidor: se omite
      }
    }
  }

  // Algunos reembolsos aprobados (pedidos de hace más de un día).
  for (const p of creados.filter((x) => x.dia >= 2).slice(0, 3)) await repo.cambiarEstado(p.codigo, 'REEMBOLSADO', 'Reembolso aprobado (datos de demostración)');

  // Tickets: consultas abiertas, una resuelta y solicitudes de reembolso.
  const reciente = creados.filter((x) => x.estado === 'ENTREGADO' && x.dia <= 5);
  const t1 = await repo.crearTicket({ asunto: 'No puedo activar mi clave', mensaje: 'Copié la clave pero el juego dice que no es válida.', tipo: 'CONSULTA', pedido: null, usuario: 'ana.torres@utp.edu.pe' });
  await repo.responderTicket(t1.id, { respuesta: 'Hola Ana, revisamos tu pedido y la clave es correcta. Verifica que no tenga espacios al final y que elijas la región Latinoamérica.', por: 'Soporte NEXUS', resolver: true });
  await repo.crearTicket({ asunto: '¿Aceptan factura a nombre de mi empresa?', mensaje: 'Compré con boleta pero necesito factura de la compra de ayer.', tipo: 'CONSULTA', pedido: null, usuario: 'diego.salas@utp.edu.pe' });
  await repo.crearTicket({ asunto: 'Olvidé mi contraseña', mensaje: 'No puedo entrar a mi cuenta desde mi celular.', tipo: 'CONSULTA', pedido: null, usuario: 'jorge.rojas@utp.edu.pe' });
  for (const p of reciente.slice(0, 2)) {
    await repo.crearTicket({ asunto: `Reembolso del pedido ${p.codigo}`, mensaje: 'Compré el juego por error y quisiera el reembolso.', tipo: 'REEMBOLSO', pedido: p.codigo, usuario: p.usuario });
  }

  console.log(`Listo: ${creados.length} pedidos de demostración (${sinStock} omitidos por falta de claves), 8 clientes y 5 tickets.`);
  console.log('Clientes de demostración: contraseña Cliente2026!  (ej.: ana.torres@utp.edu.pe)');
} finally {
  await repo.close();
}
