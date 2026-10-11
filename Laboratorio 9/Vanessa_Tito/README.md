# Laboratorio 09 – Servicios REST y operaciones CRUD en Angular

**Autora:** Vanessa Tito · UTP · JavaScript Avanzado (Semana 9)

## Puesta en marcha

```bash
npm install            # genera package-lock.json (consérvalo y entrégalo)
npm run api:reset      # crea api/db.json con los 6 registros iniciales (opcional, ya incluido)
npm run api            # Terminal A: API en http://127.0.0.1:3000
npm start              # Terminal B: Angular en http://localhost:4200
npm run verify         # compilación estricta + 19 pruebas (3 archivos)
```

## Estructura
- `api/` datos (`seed.json` y `db.json`) · `scripts/reset-api.mjs`
- `src/app/modelos`, `servicios` (EstudiantesApi, mensajeHttp), `componentes`, `pipes`, `paginas`
- Pruebas: `app.spec.ts` (2), `estudiantes-api.spec.ts` (8), `portal-http.spec.ts` (9)

Pruebas manuales M1–M12 y sección 14 de la guía: ejecútalas y guarda capturas como evidencia.
