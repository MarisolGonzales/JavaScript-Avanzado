/* ==========================================================================
   HISTORIAL DE COMPRAS - NEXUS GAMING
   Cada compra finalizada en el carrito se registra aquí como un recibo
   (ver finalizarCompra en carrito.js), con boleta, método de pago y el
   detalle de cada juego con su precio.
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
                <p>Cuando finalices una compra en el carrito, aparecerá aquí tu recibo.</p>
                <a href="catalogo.html" class="btn-primary">Ir al catálogo</a>
            </div>
        `;
        return;
    }

    contenedor.innerHTML = historial.map(compra => renderizarRecibo(compra)).join("");
});

function renderizarRecibo(compra) {
    // Compatibilidad con registros antiguos que solo guardaban un arreglo
    // de títulos (string[]) en vez de objetos { titulo, precio }.
    const items = (compra.items || []).map(item =>
        typeof item === "string" ? { titulo: item, precio: null } : item
    );

    const filasItems = items.map(item => `
        <div class="receipt-item">
            <span>${item.titulo}</span>
            <span>${item.precio !== null ? `S/ ${item.precio.toFixed(2)}` : "—"}</span>
        </div>
    `).join("");

    return `
        <div class="receipt">
            <div class="receipt-head">
                <div>
                    <span class="receipt-id">Boleta ${compra.boleta || "—"}</span>
                    <span class="receipt-date">
                        <i class="fa-solid fa-calendar"></i> ${compra.fecha}${compra.hora ? ` · ${compra.hora}` : ""}
                    </span>
                </div>
                <span class="tag">
                    <i class="fa-solid fa-credit-card"></i> ${compra.metodoPago || "Tarjeta"}
                </span>
            </div>

            <div class="receipt-items">
                ${filasItems}
            </div>

            <div class="receipt-totals">
                <div class="summary-row">
                    <span>Subtotal</span>
                    <span>S/ ${(compra.subtotal ?? compra.total).toFixed(2)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total pagado</span>
                    <span class="total-amount">S/ ${compra.total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
}
