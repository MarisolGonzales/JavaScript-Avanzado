const NEXUS_FAVORITES_KEY = "nexus_favoritos";
const NEXUS_VIEWS_KEY = "nexus_detalles_vistos";
const NEXUS_ACHIEVEMENTS_KEY = "nexus_logros_desbloqueados";

function leerListaNexus(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function obtenerFavoritosIds() {
    return leerListaNexus(NEXUS_FAVORITES_KEY);
}

function esJuegoFavorito(id) {
    return obtenerFavoritosIds().includes(Number(id));
}

function alternarFavorito(juego) {
    if (!juego) return false;

    const favoritos = obtenerFavoritosIds();
    const id = Number(juego.id);
    const index = favoritos.indexOf(id);
    const agregado = index === -1;

    if (agregado) favoritos.push(id);
    else favoritos.splice(index, 1);

    localStorage.setItem(NEXUS_FAVORITES_KEY, JSON.stringify(favoritos));
    obtenerLogros();
    document.dispatchEvent(new CustomEvent("nexus:favoritos-actualizados", {
        detail: { id, agregado }
    }));
    return agregado;
}

function registrarDetalleVisto(id) {
    const vistos = leerListaNexus(NEXUS_VIEWS_KEY);
    const juegoId = Number(id);

    if (!vistos.includes(juegoId)) {
        vistos.push(juegoId);
        localStorage.setItem(NEXUS_VIEWS_KEY, JSON.stringify(vistos));
    }

    obtenerLogros();
}

function obtenerLogros() {
    const favoritos = obtenerFavoritosIds().length;
    const detalles = leerListaNexus(NEXUS_VIEWS_KEY).length;
    const biblioteca = leerListaNexus("nexus_biblioteca").length;
    const compras = leerListaNexus("nexus_historial").length;
    const definiciones = [
        { id: "primer-detalle", titulo: "Ojo curioso", descripcion: "Consulta la información de un juego.", progreso: detalles, objetivo: 1, icono: "fa-magnifying-glass" },
        { id: "primer-favorito", titulo: "Buen gusto", descripcion: "Guarda tu primer juego en favoritos.", progreso: favoritos, objetivo: 1, icono: "fa-heart" },
        { id: "coleccionista", titulo: "Coleccionista", descripcion: "Añade tres juegos a tu biblioteca.", progreso: biblioteca, objetivo: 3, icono: "fa-gamepad" },
        { id: "primera-compra", titulo: "Primera compra", descripcion: "Completa tu primera compra.", progreso: compras, objetivo: 1, icono: "fa-bag-shopping" },
        { id: "curador", titulo: "Curador de juegos", descripcion: "Guarda los cinco juegos del catálogo en favoritos.", progreso: favoritos, objetivo: Math.max(CATALOGO_JUEGOS.length, 1), icono: "fa-star" }
    ];
    const desbloqueados = leerListaNexus(NEXUS_ACHIEVEMENTS_KEY);
    let cambio = false;

    definiciones.forEach(logro => {
        if (logro.progreso >= logro.objetivo && !desbloqueados.some(item => item.id === logro.id)) {
            desbloqueados.push({ id: logro.id, fecha: new Date().toISOString() });
            cambio = true;
        }
    });

    if (cambio) {
        localStorage.setItem(NEXUS_ACHIEVEMENTS_KEY, JSON.stringify(desbloqueados));
    }

    return definiciones.map(logro => ({
        ...logro,
        progresoVisible: Math.min(logro.progreso, logro.objetivo),
        desbloqueado: desbloqueados.some(item => item.id === logro.id),
        fecha: desbloqueados.find(item => item.id === logro.id)?.fecha || null
    }));
}