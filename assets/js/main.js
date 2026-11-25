/**
 * main.js — ініціалізація JS-плагінів MathStep (ЛР №10).
 * Бібліотеки Swiper, Fancybox і Typed.js підключені через CDN в index.html.
 */
document.addEventListener("DOMContentLoaded", function () {
  // ===== Swiper — слайдер відгуків =====
  if (typeof Swiper !== "undefined" && document.querySelector(".reviews-swiper")) {
    new Swiper(".reviews-swiper", {
      slidesPerView: 1,
      spaceBetween: 24,
      loop: true,
      grabCursor: true,
      keyboard: { enabled: true },
      autoplay: {
        delay: 3500,
        disableOnInteraction: false,
        pauseOnMouseEnter: true, // зупинка при наведенні миші
      },
      pagination: {
        el: ".reviews-pagination",
        clickable: true,
      },
      navigation: {
        nextEl: ".reviews-nav-next",
        prevEl: ".reviews-nav-prev",
      },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 20 },  // планшети
        1024: { slidesPerView: 3, spaceBetween: 24 }, // десктопи
      },
    });
  }

  // ===== Fancybox — галерея =====
  if (typeof Fancybox !== "undefined") {
    Fancybox.bind('[data-fancybox="mathstep-gallery"]', {
      showClass: "f-fadeIn",
      hideClass: "f-fadeOut",
      Carousel: {
        transition: "fade", // плавний перехід між фото
      },
      Images: {
        zoom: true,
      },
      Toolbar: {
        display: {
          left: [],
          middle: [],
          right: ["slideshow", "fullscreen", "thumbs", "close"],
        },
      },
      Thumbs: {
        type: "classic",
      },
    });
  }

  // ===== Typed.js — ефект друкування тексту в Hero =====
  if (typeof Typed !== "undefined" && document.querySelector("#typed-text")) {
    new Typed("#typed-text", {
      strings: [
        "Індивідуальні заняття онлайн.",
        "Підготовка до контрольних і НМТ.",
        "Перше заняття — безкоштовно!",
      ],
      typeSpeed: 50,   // швидкість друкування (мс на символ)
      backSpeed: 30,   // швидкість стирання
      backDelay: 1500, // пауза перед стиранням
      loop: true,      // зациклення
    });
  }
});
