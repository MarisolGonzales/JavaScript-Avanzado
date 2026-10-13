Teatro: “¿Qué pasa detrás de una página web?”
Duración: 5:30–6:00 min
Personajes:
Carla – chica: desarrolladora frontend
Andrea – chica: analista/desarrolladora
Diego – chico: desarrollador backend
Luis – chico: encargado de base de datos
Marco – chico: líder del proyecto
Pedro – chico: cliente
ESCENA 1 — El problema
Los cinco integrantes del equipo están reunidos. Pedro llega como cliente.
Pedro:
Hola, estoy intentando comprar unos audífonos en su página, pero no sé si todavía tienen stock.
Carla:
Justamente estamos revisando eso. La página funciona, pero necesitamos comprobar que la información que mostramos esté actualizada.
Marco:
Entonces hagamos una prueba completa. Así podemos ver qué sucede desde que el cliente hace clic hasta que recibe la respuesta.
Andrea:
Y de paso podemos explicar cómo estamos utilizando Angular y TypeScript para construir la aplicación.
Diego:
Y cómo Angular se comunica con nuestro backend.
Luis:
Porque finalmente los datos que necesita el cliente están almacenados en nuestra base de datos.
ESCENA 2 — Angular y TypeScript
Pedro:
Primero tengo una pregunta: ¿qué tiene que ver Angular con la página que estoy utilizando?
Carla:
Angular es un framework que nos permite desarrollar aplicaciones web. Nos ayuda a organizar la interfaz mediante componentes, servicios, rutas y otras herramientas.
Andrea:
Además, Angular utiliza principalmente TypeScript para desarrollar la lógica de la aplicación.
Pedro:
¿Y qué diferencia hay con JavaScript?
Andrea:
TypeScript está basado en JavaScript, pero agrega características como tipos, interfaces y clases. Por ejemplo:
interface Producto {
    nombre: string;
    precio: number;
    stock: number;
}
Carla:
Así podemos indicar qué tipo de información tiene nuestro producto y mantener el código más organizado.
Marco:
Entonces Angular utiliza TypeScript para desarrollar la lógica de sus componentes.
ESCENA 3 — La organización de la aplicación
Marco:
Pero tenemos muchos archivos y componentes. ¿Cómo organizamos todo?
Carla:
Podemos entenderlo mediante el concepto de MVC: Modelo, Vista y Control.
Luis:
El Modelo representa los datos. En nuestro caso, un producto con su nombre, precio y stock.
Carla:
La Vista es lo que Pedro está viendo: los productos, botones y formularios de la página.
Andrea:
Y el Control maneja las acciones y la lógica. En Angular podemos relacionarlo principalmente con los componentes y servicios.
Diego:
Aunque Angular no utiliza exactamente el MVC clásico. Su arquitectura está basada principalmente en componentes, pero esta comparación nos ayuda a entender cómo se separan las responsabilidades.
Pedro:
Entonces, cuando yo presione el botón, ¿ustedes empiezan a trabajar?
Marco:
Exactamente. Hagamos la prueba.
ESCENA 4 — El cliente hace clic
Pedro se acerca a la computadora.
Pedro:
Voy a consultar los audífonos.
Hace clic.
Carla:
La interfaz de Angular recibe la acción del usuario.
Andrea:
El componente procesa esa acción y utiliza un servicio para solicitar la información.
Diego:
Ese servicio realiza una petición HTTP al backend.
Muestra un cartel.
GET /api/productos/001
Pedro:
¿Y ahora qué pasa?
Diego:
La solicitud llegó al backend. Ahora tenemos que consultar la información que necesitamos.
Diego:
Luis, necesito el stock del producto 001.
ESCENA 5 — Backend y base de datos
Luis se acerca a una computadora o revisa una hoja.
Luis:
Un momento... buscando el producto.
Pausa breve.
Luis:
Encontrado. Tenemos 15 audífonos disponibles.
Diego:
Perfecto. El backend toma esa información y prepara una respuesta para enviarla nuevamente a Angular.
Muestra un cartel con JSON.
{
    "nombre": "Audífonos",
    "stock": 15
}
Andrea:
Este tipo de información puede enviarse en formato JSON, que se utiliza mucho para intercambiar datos entre aplicaciones.
Carla:
Angular recibe la respuesta mediante el servicio y el componente actualiza la información de la pantalla.
Pedro:
Entonces ahora puedo ver el resultado.
Pedro mira la pantalla.
Pedro:
¡Sí! Ahora aparece que tienen 15 unidades.
ESCENA 6 — Explicación final
Marco:
Y todo esto ocurrió aunque el cliente solamente presionó un botón.
Carla:
Primero tuvimos la interfaz desarrollada con Angular.
Andrea:
El componente y el servicio manejaron la solicitud utilizando TypeScript.
Diego:
Después se realizó una petición HTTP hacia el backend.
Luis:
El backend consultó la información almacenada en la base de datos.
Diego:
Y luego la respuesta regresó nuevamente hacia Angular.
Pueden mostrar un cartel grande:
             CLIENTE
                 ↓
              ANGULAR
                 ↓
            COMPONENTE
                 ↓
              SERVICIO
                 ↓
           PETICIÓN HTTP
                 ↓
              BACKEND
                 ↓
          BASE DE DATOS
                 ↓
              BACKEND
                 ↓
              ANGULAR
                 ↓
             CLIENTE
Pedro:
Ahora entiendo. Yo solo veo una página, pero detrás existe todo un proceso.
Marco:
Exactamente. Angular permite construir la aplicación web, TypeScript organiza la lógica...
Carla:
...los componentes y servicios permiten trabajar con la aplicación...
Diego:
...el backend procesa las solicitudes...
Luis:
...y la base de datos proporciona la información.
Los seis:
¡Y así se conectan Angular, TypeScript y el backend para crear una aplicación web!