// --- CONSTANTES DE CONFIGURACIÓN ---
const IGV_PORCENTAJE = 18; // 18%
const OPCION_CLIENTE_FRECUENTE = 1 << 0; // 0001 en binario (1 en decimal)
const OPCION_ENVIO_EXPRESS = 1 << 1; // 0010 en binario (2 en decimal)

// --- 1. PRECISIÓN NUMÉRICA: Conversión a Céntimos ---
function convertirImporteACentimos(monto) {
    // Evitamos fallos del tipo 0.1 + 0.2 multiplicando y redondeando antes de convertir a entero
    return Math.round(monto * 100);
}

function convertirCentimosAImporte(centimos) {
    return (centimos / 100).toFixed(2);
}

// --- 2. USO DE BIGINT: Generador de ID Único ---
let contadorCotizaciones = 1000000000000000n; // Sufijo 'n' indica BigInt
function generarIdCotizacion() {
    contadorCotizaciones += 1n;
    return contadorCotizaciones.toString();
}

// --- 3. SINTAXIS SPREAD Y REST ---
// Función Rest (...importesAdicionales)
function calcularAdicionales(...importesAdicionales) {
    return importesAdicionales.reduce((acc, val) => acc + val, 0);
}

// --- 4. LÓGICA DE CÁLCULO DE LA COTIZACIÓN ---
function calcularCotizacion(datos) {
    const { baseImponible, porcentajeDescuento, costoEnvio, banderasOpciones } = datos;

    // Conversión a céntimos
    let baseCentimos = convertirImporteACentimos(baseImponible);
    let descuentoPorcentaje = porcentajeDescuento;

    // EVALUACIÓN DE BANDERAS BITWISE (Operador &)
    const esClienteFrecuente = (banderasOpciones & OPCION_CLIENTE_FRECUENTE) !== 0;
    const esEnvioExpress = (banderasOpciones & OPCION_ENVIO_EXPRESS) !== 0;

    if (esClienteFrecuente) {
        descuentoPorcentaje += 5; // 5% adicional
    }

    // Descuento en céntimos
    let descuentoCentimos = Math.round(baseCentimos * (descuentoPorcentaje / 100));
    let subtotalConDescuentoCentimos = Math.max(0, baseCentimos - descuentoCentimos); // Uso de Math.max

    // Envío en céntimos + cargos adicionales
    let envioCentimos = convertirImporteACentimos(costoEnvio);
    let recargoExpressCentimos = esEnvioExpress ? convertirImporteACentimos(20.00) : 0;

    // Sintaxis Spread ([...]) para unir costos de envío
    const desgloseEnvio = [envioCentimos, recargoExpressCentimos];
    let envioFinalCentimos = calcularAdicionales(...desgloseEnvio);

    // IGV y Total
    let baseParaIgv = subtotalConDescuentoCentimos + envioFinalCentimos;
    let igvCentimos = Math.round(baseParaIgv * (IGV_PORCENTAJE / 100));
    let totalCentimos = baseParaIgv + igvCentimos;

    return {
        id: generarIdCotizacion(),
        subtotal: convertirCentimosAImporte(baseCentimos),
        descuento: convertirCentimosAImporte(descuentoCentimos),
        envio: convertirCentimosAImporte(envioFinalCentimos),
        igv: convertirCentimosAImporte(igvCentimos),
        total: convertirCentimosAImporte(totalCentimos)
    };
}

// --- 5. INTERACCIÓN CON EL DOM ---
document.getElementById('form-cotizador').addEventListener('submit', (e) => {
    e.preventDefault();

    const baseImponible = parseFloat(document.getElementById('base-imponible').value) || 0;
    const porcentajeDescuento = parseFloat(document.getElementById('porcentaje-descuento').value) || 0;
    const costoEnvio = parseFloat(document.getElementById('costo-envio').value) || 0;

    // CONFIGURACIÓN DE BANDERAS BITWISE (Operador |)
    let banderasOpciones = 0;
    if (document.getElementById('chk-frecuente').checked) {
        banderasOpciones |= OPCION_CLIENTE_FRECUENTE;
    }
    if (document.getElementById('chk-express').checked) {
        banderasOpciones |= OPCION_ENVIO_EXPRESS;
    }

    // Ejecutar Cálculo
    const resultado = calcularCotizacion({
        baseImponible,
        porcentajeDescuento,
        costoEnvio,
        banderasOpciones
    });

    // Renderizar en UI
    document.getElementById('out-id').textContent = resultado.id;
    document.getElementById('out-subtotal').textContent = resultado.subtotal;
    document.getElementById('out-descuento').textContent = resultado.descuento;
    document.getElementById('out-envio').textContent = resultado.envio;
    document.getElementById('out-igv').textContent = resultado.igv;
    document.getElementById('out-total').textContent = resultado.total;
});