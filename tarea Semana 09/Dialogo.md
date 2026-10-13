ANGULAR: CENTRAL DE OPERACIONES

👥 PERSONAJES

- Suzan → Angular
- Katy → Service
- Edwin → HttpClient
- Nicolás → JSON Server
- Johan → Postman / pruebas
- Omar → Network / diagnóstico

---

🎬 ESCENA 1 — EL PROBLEMA

SUZAN (Angular):
¡Tenemos un problema! Necesitamos mostrar los productos, pero Angular no tiene esos datos.

KATY (Service):
Tranquila. Para eso existen los Services. Yo puedo servir como intermediaria y centralizar la comunicación con el backend.

SUZAN:
Entonces, ¿yo te pido los productos y tú te encargas?

KATY:
Exactamente.

---

🎬 ESCENA 2 — APARECE HTTPCLIENT

EDWIN (HttpClient):
¿Alguien dijo comunicación?

KATY:
Él es HttpClient. Se encarga de realizar las peticiones HTTP.

EDWIN:
Puedo hacer solicitudes como GET, POST, PUT y DELETE.

SUZAN:
¿Y cómo obtenemos los productos?

KATY:
Por ejemplo, mediante este método:

getProductos() {
  return this.http.get('http://localhost:3000/productos');
}

EDWIN:
¡Y yo me encargo de enviar esa petición!

---

🎬 ESCENA 3 — APARECE JSON SERVER

NICOLÁS (JSON Server):
¡Un momento! ¿Y a dónde van a enviar esa petición?

SUZAN:
¿Tú quién eres?

NICOLÁS:
Soy JSON Server. En este proyecto simulo un backend y creo una API REST a partir de un archivo JSON.

EDWIN:
Entonces, si hago un GET a "/productos"...

NICOLÁS:
Yo recibo la petición y devuelvo los productos.

KATY:
Perfecto. Ya tenemos nuestra comunicación con el backend.

---

🎬 ESCENA 4 — EL VIAJE DE LA PETICIÓN

SUZAN:
¡Necesito los productos!

KATY:
Yo organizo la petición.

EDWIN:
Yo la envío.

NICOLÁS:
Yo recibo el GET y devuelvo los datos.

EDWIN:
¡Respuesta recibida!

KATY:
¡Suzan, aquí tienes los productos!

SUZAN:
¡Perfecto! Ahora puedo mostrarlos en pantalla.

OMAR (Network):
Entonces el recorrido es:

ANGULAR → SERVICE → HTTPCLIENT → JSON SERVER → RESPUESTA

---

🎬 ESCENA 5 — ¿FUNCIONA?

SUZAN:
Pero... ¿cómo sabemos si la petición realmente funciona?

JOHAN (Postman):
¡Para eso estoy yo! Podemos probar directamente la API con Postman.

EDWIN:
Por ejemplo:

GET http://localhost:3000/productos

JOHAN:
Si recibimos 200 OK y aparecen los productos, sabemos que el backend está respondiendo correctamente.

NICOLÁS:
¡Entonces podemos comprobar mi API antes de culpar a Angular!

---

🎬 ESCENA 6 — EL ERROR

SUZAN:
¡Los productos no aparecen!

OMAR:
A ver... revisemos qué está pasando.

OMAR:
Desde Network podemos revisar las peticiones que realiza Angular.

JOHAN:
Y también podemos probar la URL directamente en Postman.

OMAR:
Aquí está el problema.

❌ "/producto"

NICOLÁS:
¡La ruta correcta es!

✅ "/productos"

SUZAN:
¿Todo este problema por una sola "S"?

OMAR:
Una sola letra puede hacer que una petición falle.

---

🎬 ESCENA 7 — CIERRE

SUZAN:
Entonces, ¿qué aprendimos?

KATY:
Los Services centralizan la lógica y la comunicación.

EDWIN:
HttpClient realiza las peticiones HTTP.

NICOLÁS:
JSON Server simula nuestro backend y proporciona la API.

JOHAN:
Postman permite probar directamente nuestros servicios.

OMAR:
Y Network nos ayuda a detectar errores y revisar las peticiones.

SUZAN:
Entonces todo queda así:

ANGULAR → SERVICE → HTTPCLIENT → JSON SERVER

TODOS:
¡Y así es como Angular se conecta con el backend!