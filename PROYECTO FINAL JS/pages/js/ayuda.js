/* ==========================================
   LÓGICA DE LA PÁGINA DE AYUDA / SOPORTE
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    const formAyuda = document.getElementById('form-ayuda');

    if (formAyuda) {
        formAyuda.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const nombre = document.getElementById('nombre-soporte').value.trim();
            
            if (nombre) {
                alert(`¡Gracias ${nombre}! Tu mensaje ha sido enviado con éxito. Te responderemos pronto.`);
                formAyuda.reset();
            }
        });
    }
});