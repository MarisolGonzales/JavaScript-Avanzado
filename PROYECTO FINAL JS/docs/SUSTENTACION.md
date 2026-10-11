# Guía para sustentar NEXUS GAMING

## Demo sugerida (7–9 min)

1. **Visitante:** inicio y catálogo. Busca `accion` (sin tilde) y `wit`: *índice hash con `Map` + RegEx*; ordena por precio (*burbuja*). Cambia el tema claro/oscuro.
2. **Login:** entra como cliente con el botón de la cuenta demo. Observa que el carrito del visitante se une al de la cuenta.
3. **Compra con factura:** pago vacío (validaciones), RUC `20601234566` (falla el dígito de control) y luego `20601234565`; tarjeta `4242 4242 4242 4241` (falla **Luhn**) y luego `…4242`.
4. **Pedido:** clave digital (ver/copiar), línea de tiempo, **Descargar PDF** (logo, receptor, IGV, monto en letras).
5. **Regalo:** compra otro juego como regalo con boleta; el comprador no ve la clave, el destinatario la recibe en su biblioteca.
6. **Soporte:** pregunta al asistente "¿dónde está mi pedido?" (responde con tu pedido real), pide un reembolso desde el botón y envía el ticket.
7. **Panel de soporte** (`soporte@nexusgaming.pe`): otra interfaz; abre el ticket, aprueba el reembolso (el pedido pasa a Reembolsado, la clave se anula y se repone el stock). Nota que soporte no ve "Catálogo y stock".
8. **Panel de administración** (`admin@nexusgaming.pe`): resumen con gráficos, pedidos (exportar CSV), clientes y **Catálogo y stock** por servidor.
9. **Base de datos** (opcional, con PostgreSQL): `SELECT * FROM v_ventas_por_nodo;` y `SELECT * FROM nodo_sur.pedido;` (consulta distribuida vía FDW).

## Preguntas que pueden hacerte

- **¿Por qué el dinero se calcula en céntimos?** `0.1 + 0.2 === 0.30000000000000004` por IEEE 754 (Semana 2). `dinero.ts` suma enteros; hay pruebas que lo demuestran.
- **¿Cómo guardan las contraseñas?** Con hash `scrypt` y sal aleatoria (`node:crypto`); nunca en texto plano. La sesión es un token firmado (HS256) que vence a las 8 horas, y hay límite de 5 intentos fallidos.
- **¿Qué evita que alguien se haga pasar por administrador?** El servidor verifica la firma del token y vuelve a leer el rol de la base en cada petición; una prueba intenta fabricar un token de admin y recibe 401.
- **¿`unknown` vs `any`?** `leerJson` conserva lo que viene de `localStorage` como `unknown` y una guardia de tipo decide si es confiable (Semana 6).
- **¿Cómo valida el RUC?** 11 dígitos con prefijo 10/15/17/20; el último es de control (módulo 11 con pesos 5,4,3,2,7,6,5,4,3,2).
- **¿Cómo evitan vender dos veces la última clave?** `sp_descontar_stock` usa `SELECT … FOR UPDATE`; el driver JSON serializa las transacciones. Hay una prueba con 8 compras simultáneas de 3 claves: se aprueban 3.
- **¿Por qué el servidor recalcula los precios?** Nunca se confía en el cliente: solo envía `idJuego` y el tipo de entrega.
- **¿Dónde se guardan los pedidos si no hay sedes?** El departamento de la cuenta decide el servidor regional (fragmentación por región); el cliente no lo ve.
- **¿Qué es una directiva de atributo?** `appStock` añade clases y `data-stock` al elemento según las claves disponibles (Semana 7).
- **¿El asistente usa IA?** Por defecto es un motor de intenciones con RegEx que consulta tus pedidos; con `ANTHROPIC_API_KEY` usa un modelo de lenguaje y, si falla, vuelve al motor local.
