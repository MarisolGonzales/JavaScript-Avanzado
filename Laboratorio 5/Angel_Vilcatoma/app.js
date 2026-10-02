/* ==========================================================
   MODELO: Estudiante
   ========================================================== */
class Estudiante {
  constructor({ codigo, nombre, correo, programa, notas }) {
    this.codigo = String(codigo).trim().toUpperCase();
    this.nombre = String(nombre).trim();
    this.correo = String(correo).trim().toLocaleLowerCase("es-PE");
    this.programa = String(programa).trim();
    this.notas = notas.map(Number);
  }

  get promedio() {
    const suma = this.notas.reduce((total, nota) => total + nota, 0);
    return Math.round((suma / this.notas.length + Number.EPSILON) * 100) / 100;
  }

  get estado() {
    return this.promedio >= 12 ? "Aprobado" : "En riesgo";
  }

  get iniciales() {
    return this.nombre
      .split(/\s+/u)
      .slice(0, 2)
      .map(parte => parte.at(0)?.toLocaleUpperCase("es-PE") ?? "")
      .join("");
  }

  toJSON() {
    return {
      codigo: this.codigo,
      nombre: this.nombre,
      correo: this.correo,
      programa: this.programa,
      notas: [...this.notas]
    };
  }

  static desdeObjeto(datos) {
    return new Estudiante(datos);
  }
}

/* ==========================================================
   DATOS INICIALES
   ========================================================== */
const DATOS_INICIALES = [
  {
    codigo: "U20260001",
    nombre: "Ana María Pérez",
    correo: "ana.perez@utp.edu.pe",
    programa: "Ingeniería de Software",
    notas: [16, 15, 17]
  },
  {
    codigo: "U20260002",
    nombre: "Luis Alberto Rojas",
    correo: "luis.rojas@utp.edu.pe",
    programa: "Ingeniería de Sistemas",
    notas: [11, 10, 12]
  },
  {
    codigo: "U20260003",
    nombre: "María José Salas",
    correo: "maria.salas@utp.edu.pe",
    programa: "Ingeniería de Software",
    notas: [14, 13, 15]
  },
  {
    codigo: "U20260004",
    nombre: "Diego Núñez Torres",
    correo: "diego.nunez@utp.edu.pe",
    programa: "Ingeniería de Sistemas",
    notas: [8, 11, 9]
  }
];

/* ==========================================================
   VALIDADORES
   ========================================================== */
const PATRON_CODIGO = /^U\d{8}$/u;
const PATRON_NOMBRE = /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;
const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

function normalizarTexto(texto) {
  return String(texto).trim().replace(/\s+/gu, " ");
}

function normalizarDatos(datos) {
  return {
    codigo: normalizarTexto(datos.codigo).toUpperCase(),
    nombre: normalizarTexto(datos.nombre),
    correo: normalizarTexto(datos.correo).toLocaleLowerCase("es-PE"),
    programa: normalizarTexto(datos.programa),
    notas: datos.notas.map(Number)
  };
}

function validarDatosEstudiante(datos) {
  const errores = [];
  if (!PATRON_CODIGO.test(datos.codigo)) {
    errores.push("El código debe tener el formato U seguido de 8 dígitos.");
  }
  if (!PATRON_NOMBRE.test(datos.nombre)) {
    errores.push("El nombre solo puede contener letras, espacios, apóstrofes o guiones.");
  }
  if (!PATRON_CORREO.test(datos.correo)) {
    errores.push("El correo no tiene una estructura válida.");
  }
  if (datos.programa.length < 3) {
    errores.push("El programa debe tener al menos 3 caracteres.");
  }
  if (!Array.isArray(datos.notas) || datos.notas.length !== 3) {
    errores.push("Se requieren exactamente 3 notas.");
  } else if (datos.notas.some(nota => !Number.isFinite(nota) || nota < 0 || nota > 20)) {
    errores.push("Cada nota debe ser un número entre 0 y 20.");
  }
  return errores;
}

/* ==========================================================
   SERVICIO: EstudianteService
   ========================================================== */
const CLAVE_ALMACENAMIENTO = "js-avanzado-semana5-estudiantes-v1";
const comparadorTexto = new Intl.Collator("es-PE", { sensitivity: "base" });

class EstudianteService {
  #estudiantes = [];
  #indicePorCodigo = new Map();
  #almacenamiento;

  constructor(datosIniciales = [], almacenamiento = globalThis.localStorage) {
    this.#almacenamiento = almacenamiento;
    this.reemplazarTodos(datosIniciales, { guardar: false });
  }

  listar() {
    return [...this.#estudiantes];
  }

  obtenerPorCodigo(codigo) {
    return this.#indicePorCodigo.get(codigo);
  }

  obtenerProgramas() {
    return [...new Set(this.#estudiantes.map(estudiante => estudiante.programa))]
      .toSorted(comparadorTexto.compare);
  }

  agregar(datos) {
    const normalizados = normalizarDatos(datos);
    const errores = validarDatosEstudiante(normalizados);
    if (this.#indicePorCodigo.has(normalizados.codigo)) {
      errores.push("El código ya se encuentra registrado.");
    }
    if (errores.length > 0) {
      throw new TypeError(errores.join(" "));
    }
    this.#estudiantes = [...this.#estudiantes, new Estudiante(normalizados)];
    this.#sincronizarIndice();
    this.guardarLocal();
  }

  eliminar(codigo) {
    if (!this.#indicePorCodigo.has(codigo)) return false;
    this.#estudiantes = this.#estudiantes.filter(estudiante => estudiante.codigo !== codigo);
    this.#sincronizarIndice();
    this.guardarLocal();
    return true;
  }

  buscar({ texto = "", programa = "", estado = "", orden = "nombre" } = {}) {
    const termino = String(texto).trim().toLocaleLowerCase("es-PE");
    const filtrados = this.#estudiantes.filter(estudiante => {
      const coincideTexto = termino === "" ||
        estudiante.codigo.toLocaleLowerCase("es-PE").includes(termino) ||
        estudiante.nombre.toLocaleLowerCase("es-PE").includes(termino) ||
        estudiante.correo.toLocaleLowerCase("es-PE").includes(termino);
      const coincidePrograma = programa === "" || estudiante.programa === programa;
      const coincideEstado = estado === "" || estudiante.estado === estado;
      return coincideTexto && coincidePrograma && coincideEstado;
    });

    const comparadores = {
      "promedio-desc": (a, b) => b.promedio - a.promedio,
      "promedio-asc": (a, b) => a.promedio - b.promedio,
      nombre: (a, b) => comparadorTexto.compare(a.nombre, b.nombre)
    };

    return filtrados.toSorted(comparadores[orden] ?? comparadores.nombre);
  }

  obtenerResumen() {
    const base = this.#estudiantes.reduce((resumen, estudiante) => ({
      total: resumen.total + 1,
      aprobados: resumen.aprobados + (estudiante.estado === "Aprobado" ? 1 : 0),
      riesgo: resumen.riesgo + (estudiante.estado === "En riesgo" ? 1 : 0),
      sumaPromedios: resumen.sumaPromedios + estudiante.promedio
    }), { total: 0, aprobados: 0, riesgo: 0, sumaPromedios: 0 });

    return {
      ...base,
      promedioGrupal: base.total === 0 ? 0 : base.sumaPromedios / base.total
    };
  }

  exportarJson() {
    return JSON.stringify(this.#estudiantes, null, 2);
  }

  importarJson(texto) {
    const datos = JSON.parse(texto);
    this.reemplazarTodos(datos, { guardar: true });
  }

  reemplazarTodos(datos, { guardar = true } = {}) {
    if (!Array.isArray(datos)) {
      throw new TypeError("Los datos deben contener un arreglo de estudiantes.");
    }
    const candidatos = datos.map((dato, indice) => {
      const normalizados = normalizarDatos(dato);
      const errores = validarDatosEstudiante(normalizados);
      if (errores.length > 0) {
        throw new TypeError(`Elemento ${indice + 1}: ${errores.join(" ")}`);
      }
      return new Estudiante(normalizados);
    });

    const codigos = candidatos.map(estudiante => estudiante.codigo);
    if (new Set(codigos).size !== codigos.length) {
      throw new TypeError("Los códigos no pueden repetirse.");
    }

    this.#estudiantes = candidatos;
    this.#sincronizarIndice();
    if (guardar) this.guardarLocal();
  }

  guardarLocal() {
    if (!this.#almacenamiento) return;
    this.#almacenamiento.setItem(CLAVE_ALMACENAMIENTO, this.exportarJson());
  }

  cargarLocal() {
    if (!this.#almacenamiento) return false;
    const texto = this.#almacenamiento.getItem(CLAVE_ALMACENAMIENTO);
    if (texto === null) return false;
    this.reemplazarTodos(JSON.parse(texto), { guardar: false });
    return true;
  }

  limpiarLocal() {
    this.#almacenamiento?.removeItem(CLAVE_ALMACENAMIENTO);
  }

  #sincronizarIndice() {
    this.#indicePorCodigo = new Map(
      this.#estudiantes.map(estudiante => [estudiante.codigo, estudiante])
    );
  }
}

/* ==========================================================
   CONTROLADOR Y VISTA (app.js original)
   ========================================================== */
const formulario = document.querySelector("#formEstudiante");
const cuerpoEstudiantes = document.querySelector("#cuerpoEstudiantes");
const mensajes = document.querySelector("#mensajes");
const busqueda = document.querySelector("#busqueda");
const filtroPrograma = document.querySelector("#filtroPrograma");
const filtroEstado = document.querySelector("#filtroEstado");
const selectorOrden = document.querySelector("#orden");
const estadoVacio = document.querySelector("#estadoVacio");
const areaJson = document.querySelector("#areaJson");

const servicio = new EstudianteService(DATOS_INICIALES);

const formateadorPromedio = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

function mostrarMensaje(texto, tipo = "error") {
  mensajes.textContent = texto;
  mensajes.classList.toggle("exito", tipo === "exito");
  mensajes.hidden = false;
}

function ocultarMensaje() {
  mensajes.hidden = true;
  mensajes.textContent = "";
}

function crearCelda() {
  return document.createElement("td");
}

function crearFila(estudiante) {
  const fila = document.createElement("tr");

  const celdaEstudiante = crearCelda();
  const nombre = document.createElement("strong");
  const datos = document.createElement("div");
  nombre.textContent = `${estudiante.iniciales} · ${estudiante.nombre}`;
  datos.className = "secundario-texto";
  datos.textContent = `${estudiante.codigo} · ${estudiante.correo}`;
  celdaEstudiante.append(nombre, datos);

  const celdaPrograma = crearCelda();
  celdaPrograma.textContent = estudiante.programa;

  const celdaNotas = crearCelda();
  celdaNotas.textContent = estudiante.notas.join(" · ");

  const celdaPromedio = crearCelda();
  celdaPromedio.className = "numero";
  celdaPromedio.textContent = formateadorPromedio.format(estudiante.promedio);

  const celdaEstado = crearCelda();
  const etiquetaEstado = document.createElement("span");
  etiquetaEstado.className = `estado ${estudiante.estado === "Aprobado" ? "aprobado" : "riesgo"}`;
  etiquetaEstado.textContent = estudiante.estado;
  celdaEstado.append(etiquetaEstado);

  const celdaAccion = crearCelda();
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "peligro";
  boton.dataset.codigo = estudiante.codigo;
  boton.textContent = "Eliminar";
  celdaAccion.append(boton);

  fila.append(
    celdaEstudiante,
    celdaPrograma,
    celdaNotas,
    celdaPromedio,
    celdaEstado,
    celdaAccion
  );

  return fila;
}

function actualizarProgramas() {
  const seleccion = filtroPrograma.value;
  filtroPrograma.replaceChildren(new Option("Todos", ""));
  servicio.obtenerProgramas().forEach(programa => {
    filtroPrograma.add(new Option(programa, programa));
  });
  filtroPrograma.value = servicio.obtenerProgramas().includes(seleccion) ? seleccion : "";
}

function actualizarIndicadores() {
  const resumen = servicio.obtenerResumen();
  document.querySelector("#totalEstudiantes").textContent = resumen.total;
  document.querySelector("#totalAprobados").textContent = resumen.aprobados;
  document.querySelector("#totalRiesgo").textContent = resumen.riesgo;
  document.querySelector("#promedioGrupal").textContent =
    formateadorPromedio.format(resumen.promedioGrupal);
  document.querySelector("#mensajeRiesgo").textContent = resumen.riesgo > 0
    ? `${resumen.riesgo} estudiante${resumen.riesgo === 1 ? " requiere" : "s requieren"} acompañamiento.`
    : "No existen estudiantes en riesgo.";
}

function renderizar() {
  const visibles = servicio.buscar({
    texto: busqueda.value,
    programa: filtroPrograma.value,
    estado: filtroEstado.value,
    orden: selectorOrden.value
  });

  cuerpoEstudiantes.replaceChildren(...visibles.map(crearFila));
  estadoVacio.hidden = visibles.length > 0;
  document.querySelector("#resumenVisible").textContent =
    `${visibles.length} estudiante${visibles.length === 1 ? "" : "s"}`;
  actualizarIndicadores();
}

function sincronizarVista() {
  actualizarProgramas();
  renderizar();
}

function leerFormulario() {
  return {
    codigo: formulario.elements.codigo.value,
    nombre: formulario.elements.nombre.value,
    correo: formulario.elements.correo.value,
    programa: formulario.elements.programa.value,
    notas: [
      formulario.elements.nota1.value,
      formulario.elements.nota2.value,
      formulario.elements.nota3.value
    ]
  };
}

function manejarRegistro(evento) {
  evento.preventDefault();
  ocultarMensaje();
  try {
    servicio.agregar(leerFormulario());
    formulario.reset();
    sincronizarVista();
    mostrarMensaje("Estudiante registrado correctamente.", "exito");
  } catch (error) {
    mostrarMensaje(error.message);
  }
}

function manejarEliminacion(evento) {
  const boton = evento.target.closest("button[data-codigo]");
  if (!boton) return;
  const estudiante = servicio.obtenerPorCodigo(boton.dataset.codigo);
  if (!estudiante) return;
  servicio.eliminar(estudiante.codigo);
  sincronizarVista();
  mostrarMensaje(`${estudiante.nombre} fue eliminado.`, "exito");
}

function exportarJson() {
  areaJson.value = servicio.exportarJson();
  mostrarMensaje("Respaldo JSON generado.", "exito");
}

function importarJson() {
  try {
    servicio.importarJson(areaJson.value);
    sincronizarVista();
    mostrarMensaje("Datos importados correctamente.", "exito");
  } catch (error) {
    mostrarMensaje(`No se pudo importar: ${error.message}`);
  }
}

function restaurarEjemplo() {
  servicio.reemplazarTodos(DATOS_INICIALES);
  areaJson.value = "";
  ocultarMensaje();
  sincronizarVista();
}

formulario.addEventListener("submit", manejarRegistro);
cuerpoEstudiantes.addEventListener("click", manejarEliminacion);
busqueda.addEventListener("input", renderizar);
filtroPrograma.addEventListener("change", renderizar);
filtroEstado.addEventListener("change", renderizar);
selectorOrden.addEventListener("change", renderizar);
document.querySelector("#btnExportar").addEventListener("click", exportarJson);
document.querySelector("#btnImportar").addEventListener("click", importarJson);
document.querySelector("#btnRestaurar").addEventListener("click", restaurarEjemplo);

try {
  servicio.cargarLocal();
} catch (error) {
  servicio.limpiarLocal();
  mostrarMensaje(`El respaldo local estaba dañado y fue descartado: ${error.message}`);
}

sincronizarVista();
renderizar();