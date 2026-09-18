/* ==========================================================================
   HOME.JS — Carrusel del hero principal (página de inicio)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".hero-dot");
    const titulo = document.getElementById("hero-title");
    const desc = document.getElementById("hero-desc");
    const precio = document.getElementById("hero-price");

    if (slides.length === 0) return;

    let indiceActual = 0;
    let intervalo = null;

    function mostrarSlide(indice) {
        slides.forEach(s => s.classList.remove("active"));
        dots.forEach(d => d.classList.remove("active"));

        slides[indice].classList.add("active");
        dots[indice].classList.add("active");

        if (titulo) titulo.textContent = slides[indice].dataset.title;
        if (desc) desc.textContent = slides[indice].dataset.desc;
        if (precio) precio.textContent = slides[indice].dataset.price;

        indiceActual = indice;
    }

    function siguienteSlide() {
        const siguiente = (indiceActual + 1) % slides.length;
        mostrarSlide(siguiente);
    }

    function reiniciarAutoplay() {
        clearInterval(intervalo);
        intervalo = setInterval(siguienteSlide, 6000);
    }

    dots.forEach(dot => {
        dot.addEventListener("click", () => {
            mostrarSlide(parseInt(dot.dataset.index));
            reiniciarAutoplay();
        });
    });

    reiniciarAutoplay();
});
