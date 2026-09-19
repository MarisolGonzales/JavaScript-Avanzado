/* ==========================================================================
   ADMIN.JS — Panel de administrador (solo visible para correos
   @nexusgaming.pe, ver usuario.js -> determinarRol).
   ========================================================================== */

function cargarPanelAdmin() {
    const statJuegos = document.getElementById("admin-stat-juegos");
    const statIngresos = document.getElementById("admin-stat-ingresos");
    const statTickets = document.getElementById("admin-stat-tickets");
    const listaTickets = document.getElementById("admin-tickets-list");

    const historial = JSON.parse(localStorage.getItem("nexus_historial")) || [];
    const tickets = JSON.parse(localStorage.getItem("nexus_tickets")) || [];

    const ingresosTotales = historial.reduce((suma, compra) => suma + (compra.total || 0), 0);

    if (statJuegos) statJuegos.textContent = typeof CATALOGO_JUEGOS !== "undefined" ? CATALOGO_JUEGOS.length : "—";
    if (statIngresos) statIngresos.textContent = `S/ ${ingresosTotales.toFixed(2)}`;
    if (statTickets) statTickets.textContent = tickets.length;

    if (!listaTickets) return;

    if (tickets.length === 0) {
        listaTickets.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <i class="fa-solid fa-inbox"></i>
                <h3>No hay tickets pendientes</h3>
                <p>Los mensajes que envíen los usuarios desde Soporte aparecerán aquí.</p>
            </div>
        `;
        return;
    }

    listaTickets.innerHTML = tickets.map(ticket => `
        <div class="admin-ticket-item" data-id="${ticket.id}">
            <div class="admin-ticket-info">
                <div class="admin-ticket-head">
                    <strong>${ticket.asunto}</strong>
                    <span class="admin-ticket-fecha">${ticket.fecha}</span>
                </div>
                <p>${ticket.mensaje}</p>
            </div>
            <button class="btn-secondary btn-resolver-ticket" data-id="${ticket.id}">
                <i class="fa-solid fa-check"></i> Marcar resuelto
            </button>
        </div>
    `).join("");

    listaTickets.querySelectorAll(".btn-resolver-ticket").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            let ticketsActuales = JSON.parse(localStorage.getItem("nexus_tickets")) || [];
            ticketsActuales = ticketsActuales.filter(t => t.id !== id);
            localStorage.setItem("nexus_tickets", JSON.stringify(ticketsActuales));
            cargarPanelAdmin();
        });
    });
}
