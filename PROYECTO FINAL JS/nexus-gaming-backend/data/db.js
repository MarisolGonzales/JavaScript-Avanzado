/* ==========================================================================
   db.js — Acceso simple a la "base de datos" en archivo JSON (data/db.json).
   Cumple el mismo rol que json-server: persistencia en disco sin motor de
   base de datos, adecuada para un proyecto académico. Cada función lee y
   escribe el archivo completo (transacciones atómicas simples).
   ========================================================================== */

const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");

function leerDB() {
    const contenido = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(contenido);
}

function guardarDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

module.exports = { leerDB, guardarDB };
