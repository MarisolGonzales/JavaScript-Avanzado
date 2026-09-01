/* ==========================================
   LÓGICA DEL HISTORIAL DE COMPRAS
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const historialBody = document.getElementById('historial-body');
    if (!historialBody) return;

    // Puedes obtener las transacciones desde localStorage o usar un arreglo por defecto
    let transacciones = JSON.parse(localStorage.getItem('nexus_historial_compras')) || [
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

    // Limpiar contenedor y renderizar filas ordenadamente
    historialBody.innerHTML = '';

    transacciones.forEach(tx => {
        const fila = document.createElement('tr');
        
        fila.innerHTML = `
            <td>${tx.orden}</td>
            <td>${tx.fecha}</td>
            <td class="juego-nombre">${tx.juego}</td>
            <td>${tx.metodo}</td>
            <td>${tx.monto}</td>
            <td><span class="badge-estado">${tx.estado}</span></td>
        `;

        historialBody.appendChild(fila);
    });
});