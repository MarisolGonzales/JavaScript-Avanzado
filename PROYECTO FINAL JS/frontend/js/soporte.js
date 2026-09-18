/* ==========================================================================
   SOPORTE TÉCNICO - NEXUS GAMING
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const formSoporte = document.getElementById("form-soporte");
    if (!formSoporte) return;

    formSoporte.addEventListener("submit", (e) => {
        e.preventDefault();

        const inputAsunto = document.getElementById("input-asunto");
        const inputMensaje = document.getElementById("input-mensaje");

        const asunto = inputAsunto ? inputAsunto.value.trim() : "";
        const mensaje = inputMensaje ? inputMensaje.value.trim() : "";

        if (!asunto || !mensaje) {
            alert("Por favor, completa todos los campos del formulario de soporte.");
            return;
        }

        let tickets = JSON.parse(localStorage.getItem("nexus_tickets")) || [];
        tickets.push({
            id: Date.now(),
            asunto,
            mensaje,
            fecha: new Date().toLocaleDateString()
        });

        localStorage.setItem("nexus_tickets", JSON.stringify(tickets));

        alert("¡Ticket enviado con éxito! Te responderemos a la brevedad.");
        formSoporte.reset();
    });
});
