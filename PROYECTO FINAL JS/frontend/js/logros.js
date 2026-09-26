document.addEventListener("DOMContentLoaded", renderizarLogros);

function renderizarLogros() {
    const contenedor = document.getElementById("achievement-grid");
    const contador = document.getElementById("achievement-count");
    if (!contenedor || !contador) return;

    const logros = obtenerLogros();
    const desbloqueados = logros.filter(logro => logro.desbloqueado).length;
    contador.textContent = `${desbloqueados} / ${logros.length}`;
    contenedor.innerHTML = logros.map(logro => {
        const porcentaje = Math.round((logro.progresoVisible / logro.objetivo) * 100);
        const fecha = logro.fecha ? new Date(logro.fecha).toLocaleDateString() : "En progreso";
        return `
            <article class="achievement-card ${logro.desbloqueado ? "is-unlocked" : ""}">
                <div class="achievement-icon"><i class="fa-solid ${logro.icono}"></i></div>
                <div class="achievement-content">
                    <div class="achievement-heading"><h2>${logro.titulo}</h2><span>${logro.desbloqueado ? "Desbloqueado" : "En progreso"}</span></div>
                    <p>${logro.descripcion}</p>
                    <div class="achievement-progress" role="progressbar" aria-label="Progreso: ${logro.titulo}" aria-valuemin="0" aria-valuemax="${logro.objetivo}" aria-valuenow="${logro.progresoVisible}">
                        <span style="width: ${porcentaje}%"></span>
                    </div>
                    <div class="achievement-meta"><span>${logro.progresoVisible} / ${logro.objetivo}</span><span>${fecha}</span></div>
                </div>
            </article>
        `;
    }).join("");
}