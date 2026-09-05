/* ==========================================================================
   MÓDULO DE HISTORIAL DE COMPRAS
   ========================================================================== */

class TransaccionManager {
    constructor(transacciones) {
        this.transacciones = transacciones;
    }

    // Método funcional avanzado con `.reduce()` para acumular totales
    calcularTotalGastado() {
        return this.transacciones.reduce((acumulador, tx) => {
            const numeroMonto = parseFloat(tx?.monto?.replace('PEN ', '')) || 0;
            return acumulador + numeroMonto;
        }, 0);
    }

    // Uso de la estructura de datos avanzada `Set` para filtrar elementos únicos 
    obtenerMetodosUnicos() {
        return [...new Set(this.transacciones.map(tx => tx?.metodo))];
    }

    // Método funcional `.map()` para generar filas tabulares 
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

    // Recuperación de transacciones desde LocalStorage - Semana 2
    const transaccionesCrudas = JSON.parse(localStorage.getItem('nexus_historial_compras')) || [
        { orden: "#NX-8921", fecha: "12/08/2026", juego: "The Witcher 3", metodo: "VISA", monto: "PEN 29.75", estado: "Completado" },
        { orden: "#NX-5542", fecha: "02/07/2026", juego: "GTA V", metodo: "PayPal", monto: "PEN 60.00", estado: "Completado" }
    ];

    // Instanciación de la clase gestora
    const manager = new TransaccionManager(transaccionesCrudas);

    // Renderizar datos en la tabla del DOM 
    historialBody.innerHTML = manager.renderizarFilas();

    // Verificación en consola de los métodos avanzados solicitados en el laboratorio
    console.log("Monto Total Gastado (reduce):", manager.calcularTotalGastado());
    console.log("Métodos de pago únicos (Set):", manager.obtenerMetodosUnicos());
});