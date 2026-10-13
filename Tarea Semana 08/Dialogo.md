🎤 “ENTREVISTA A ANGULAR”

Personajes:

- P: Presentador/a
- A: Angular — presumido y dramático
- T: Técnico/a — conoce del tema y hace preguntas más técnicas

---

🎬 APERTURA

P: ¡Bienvenidos al programa Código en Vivo! Hoy tenemos un invitado de lujo, creado por Google. ¡Con ustedes… Angular!

A: (entra con aires de estrella) Gracias, gracias. Sé que estaban esperando este momento.

T: ¿Así de presumido empezamos?

A: No soy presumido. Solo reconozco mi valor.

P: Bueno, Angular, cuéntanos. ¿Qué eres exactamente?

A: Soy un framework para crear aplicaciones web. Utilizo TypeScript y vengo con muchas herramientas incluidas.

T: ¿Muchas herramientas?

A: Rutas, formularios, validaciones, componentes… No necesito instalar diez librerías para cada cosa. Soy el paquete completo.

---

🧩 BLOQUE 1: COMPONENTES

P: Empecemos por lo básico. ¿De qué estás hecho?

A: De componentes. Son mis piezas de Lego.

T: ¿Y qué tiene cada componente?

A: Normalmente tenemos HTML, que define la estructura; CSS, que define los estilos; y TypeScript, que contiene la lógica.

P: ¿Entonces podemos reutilizarlos?

A: ¡Claro! Puedo crear una tarjeta de producto una vez y reutilizarla muchas veces.

T: ¿Y cómo se comunican los componentes?

A: Si tengo un componente padre y uno hijo, el padre puede enviar datos al hijo mediante @Input.

P: ¿Y si el hijo quiere avisarle algo al padre?

A: Para eso tenemos @Output.

T: ¿Y crear un componente es complicado?

A: (con una sonrisa) Para mí, no. Con:

"ng generate component producto"

A: …yo hago el resto.

---

🔗 BLOQUE 2: ROUTER

P: Ahora imaginemos que tenemos una aplicación con Inicio, Productos y Contacto. ¿Cómo nos movemos entre ellas?

A: Con mi Router.

T: ¿Qué hace exactamente?

A: Definimos rutas como "/inicio", "/productos" o "/contacto", y cada ruta muestra un componente diferente.

P: ¿Y cada vez que cambio de página se recarga toda la web?

A: (dramáticamente) ¡Jamás!

T: ¿Entonces?

A: Angular trabaja como una Single Page Application. Podemos cambiar el contenido necesario sin recargar toda la página.

P: ¿Y cómo hacemos los enlaces?

A: Usamos routerLink y colocamos un router-outlet donde queremos que aparezca el componente.

T: Incluso podemos tener algo como "/productos/5" para mostrar un producto específico.

A: Exactamente. ¿Ven? También soy organizado.

---

✨ BLOQUE 3: PIPES

P: Supongamos que nuestra API nos manda una fecha así:

"2026-09-28T00:00:00"

P: ¿Cómo hacemos para que se vea bonita?

A: Fácil. Para eso están mis pipes.

T: ¿Qué hacen?

A: Transforman la forma en que se muestra un dato sin modificar el dato original.

P: Dame un ejemplo.

A: Podemos usar:

"{{ fecha | date:'dd/MM/yyyy' }}"

A: Y mostraríamos:

28/09/2026

T: ¿También funcionan con texto y números?

A: Por supuesto. Tenemos "uppercase", "currency" y muchos más.

P: ¿Y podemos crear nuestros propios pipes?

A: (presumido) Por supuesto. ¿Acaso creían que eso era todo?

T: Ya empezó otra vez…

---

📝 BLOQUE 4: FORMULARIOS

P: Llegamos a los formularios. ¿Cómo controlas lo que escribe un usuario?

A: Tengo dos enfoques principales: Template-driven Forms y Reactive Forms.

T: ¿Cuál es la diferencia?

A: Los Template-driven son más sencillos y se controlan principalmente desde la plantilla.

A: Los Reactive Forms permiten tener mayor control desde TypeScript y son muy útiles cuando el formulario es más complejo.

P: ¿Y las validaciones?

A: También vienen incluidas: "required", "email", "minLength"…

T: Entonces vamos a probarte.

P: (escribe “hola” en un campo de correo)

P: Listo.

A: (dramático) ¡ERROR!

T: ¿Qué pasó?

A: ¡Eso no es un correo válido!

P: Entonces Angular detecta el problema.

A: Exactamente. Nadie pasa por mí con datos incorrectos.

---

🎬 CIERRE

P: Última pregunta, Angular. ¿Qué consejo le darías a alguien que recién empieza?

A: Que empiece con proyectos pequeños.

T: ¿Y después?

A: Primero componentes. Después rutas, formularios y pipes.

P: O sea, aprender poco a poco.

A: Exactamente.

T: Por fin dijiste algo humilde.

A: No confundamos humildad con grandeza.

P: (ríe) Bueno, Angular, gracias por acompañarnos en Código en Vivo.

A: Gracias a ustedes.

T: Y recuerden…

A: (interrumpe) Que en Angular…

P + T + A: ¡TODO TIENE SU LUGAR!

P: ¡Nos vemos en el próximo programa!