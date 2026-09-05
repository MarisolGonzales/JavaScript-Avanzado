/* ==========================================
   LÓGICA DEL HISTORIAL DE COMPRAS (Refactorizada)
   ========================================== */

class TransaccionManager {
    constructor(transacciones) {
        this.transacciones = transacciones;
    }

    // Método funcional reduce() para calcular el monto total gastado[cite: 9, 10]
    calcularTotalGastado() {
        return this.transacciones.reduce((acumulador, tx) => {
            const numeroMonto = parseFloat(tx?.monto?.replace('PEN ', '')) || 0;
            return acumulador + numeroMonto;
        }, 0);
    }

    // Uso de Set para extraer los métodos de pago únicos sin duplicados[cite: 9, 10]
    obtenerMetodosUnicos() {
        return [...new Set(this.transacciones.map(tx => tx?.metodo))];
    }

    // Método map() para renderizar las filas de la tabla de forma declarativa[cite: 9, 10]
    renderizarFilas() {
        return this.transacciones.map(tx => `
            <tr>
                <td>${tx?.orden ?? 'N/D'}</td>
                <td>${tx?.fecha ?? 'N/D'}</td>
                <td class="juego-nombre">${tx?.juego ?? 'Desconocido'}</td>
                <td>${tx?.metodo ?? 'N/D'}</td>
                <td>${tx?.monto ?? 'PEN 0.00'}</td>
                <td><span class="badge-estado">${tx?.estado ?? 'Completado'}</span></td>
            </tr>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const historialBody = document.getElementById('historial-body');
    if (!historialBody) return;

    const transaccionesCrudas = JSON.parse(localStorage.getItem('nexus_historial_compras')) || [
        {
            orden: "#NX-8921",
            fecha: "12/08/2026",
            juego: "The Witcher 3: Wild Hunt",
            metodo: "Tarjeta VISA (•••• 4589)",
            monto: "PEN 29.75",
            estado: "Completado"
        },
        {
            orden: "#NX-5542",
            fecha: "02/07/2026",
            juego: "Grand Theft Auto V",
            metodo: "PayPal",
            monto: "PEN 60.00",
            estado: "Completado"
        },
        {
            orden: "#NX-1029",
            fecha: "15/01/2026",
            juego: "Minecraft Ultra Edition",
            metodo: "Tarjeta Mastercard",
            monto: "PEN 89.00",
            estado: "Completado"
        }
    ];

    // Instanciar la clase gestora
    const manager = new TransaccionManager(transaccionesCrudas);

    // Inyectar filas con el método avanzado
    historialBody.innerHTML = manager.renderizarFilas();

    // Demostración en consola de los métodos avanzados solicitados en clase
    console.log("Monto Total Gastado:", manager.calcularTotalGastado());
    console.log("Métodos de pago únicos (Set):", manager.obtenerMetodosUnicos());
});