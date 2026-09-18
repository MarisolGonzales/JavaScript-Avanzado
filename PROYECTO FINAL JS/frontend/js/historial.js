/* ==========================================================================
   HISTORIAL DE COMPRAS - NEXUS GAMING
   Cada compra finalizada en el carrito se registra aquí (ver carrito.js).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const contenedor = document.getElementById("contenedor-historial");
    if (!contenedor) return;

    const historial = JSON.parse(localStorage.getItem("nexus_historial")) || [];

    if (historial.length === 0) {
        contenedor.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <h3>Aún no tienes compras registradas</h3>
                <p>Cuando finalices una compra en el carrito, aparecerá aquí.</p>
                <a href="catalogo.html" class="btn-primary">Ir al catálogo</a>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = historial.map(compra => `
        <div class="history-entry">
            <div class="history-entry-head">
                <span><i class="fa-solid fa-calendar"></i> ${compra.fecha}</span>
                <span class="total-amount">S/ ${compra.total.toFixed(2)}</span>
            </div>
            <p class="history-items">${compra.items.join(", ")}</p>
        </div>
    `).join("");
});
