/**
 * validation.js — клієнтська валідація форми зворотного зв'язку MathStep.
 * Vanilla JS, без залежностей.
 *
 * Поля шукаються за id (підтримуються обидва варіанти назв) або за name:
 *   ім'я       — username | contact-name       (name="name")
 *   email      — email    | contact-email      (name="email")
 *   телефон    — phone    | contact-phone      (name="phone")
 *   повідомл.  — message  | contact-message    (name="message")
 *   згода      — agreement| contact-consent    (name="consent")
 * Форма: id="feedbackForm" або форма, у якій лежать ці поля.
 * Блок помилки шукається за id "<id поля>-error"; якщо його немає в HTML,
 * він створюється автоматично під полем.
 *
 * UX-логіка:
 *  - на старті форма нейтральна: жодних перевірок і помилок;
 *  - поле перевіряється, коли користувач його залишає (blur);
 *  - після першої перевірки поле оновлюється на льоту (input);
 *  - submit перевіряє всі поля одразу й веде до першого з помилкою.
 */

(() => {
  'use strict';
    /**
   * СТРАХОВКА: блокуємо стандартне надсилання форми зворотного зв'язку за будь-яких
   * умов (навіть якщо init() не відпрацював або сталася помилка далі в коді).
   * Capture-слухач на document спрацьовує першим і не заважає нашому обробнику.
   */
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (
      form instanceof HTMLFormElement &&
      (form.id === 'feedbackForm' || form.querySelector('#email, #contact-email, [name="email"]'))
    ) {
      event.preventDefault();
    }
  }, true);

  /* ------------------------------------------------------------------ *
   * 1. Правила перевірки
   * ------------------------------------------------------------------ */

  // Email: обов'язково «@» і доменна зона від 2 символів, без пробілів
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // Телефон (після очищення): строго +380 і рівно 9 цифр
  const PHONE_REGEX = /^\+380\d{9}$/;

  /**
   * Прибирає з телефону лише «косметичне» форматування: пробіли (зокрема
   * нерозривні), дужки, дефіси, тире та крапки. Літери й інші символи
   * лишаються, щоб значення на кшталт «+380abc123456» не пройшло перевірку.
   *   "+380 (50) 123-45-67" -> "+380501234567"
   */
  function cleanPhone(value) {
    return value.trim().replace(/[\s()\-–—.]/g, '');
  }

  /**
   * Кожен валідатор приймає поле і повертає:
   *   '' (порожній рядок) — значення коректне;
   *   текст помилки       — значення некоректне.
   */
 function validateUsername(field) {
    const value = field.value.trim();
    

    if (!value) return 'Вкажіть ім’я.';
    if (value.length < 2) return 'Ім’я має містити щонайменше 2 символи.';
    if (!nameRegex.test(value)) return 'Ім’я може містити лише літери, дефіси та апострофи.';
    return '';
  }

  function validateEmail(field) {
    const value = field.value.trim();
    if (!value) return 'Вкажіть електронну пошту.';
    if (!value.includes('@')) return 'В адресі бракує символу «@». Приклад: name@example.com.';
    if (!EMAIL_REGEX.test(value)) return 'Перевірте адресу: після «@» потрібен домен із зоною, наприклад name@example.com.';
    return '';
  }

  function validatePhone(field) {
    // Перевіряємо очищене значення, тому форматування користувача не заважає
    const value = cleanPhone(field.value);

    if (!value) return 'Вкажіть номер телефону.';
    if (PHONE_REGEX.test(value)) return '';

    // Локальний формат 0XXXXXXXXX (10 цифр) — пропонуємо готовий варіант
    if (/^0\d{9}$/.test(value)) {
      return `Схоже, номер введено без коду країни. Спробуйте так: +38${value}.`;
    }
    // Код країни є, але бракує плюса: 380XXXXXXXXX
    if (/^380\d{9}$/.test(value)) {
      return `Додайте «+» на початку номера: +${value}.`;
    }
    // Інший номер, що починається з 0
    if (value.startsWith('0')) {
      return 'Номер потрібно вводити з кодом країни: +380XXXXXXXXX (9 цифр після +380).';
    }
    // Літери та сторонні символи
    if (/[^\d+]/.test(value)) {
      return 'Номер має містити лише цифри, без літер і символів: +380XXXXXXXXX.';
    }
    // Правильний префікс, але неправильна кількість цифр
    if (/^\+380\d+$/.test(value)) {
      const count = value.length - 4;
      return count < 9
        ? `Замало цифр: після +380 потрібно рівно 9, а введено ${count}.`
        : `Забагато цифр: після +380 потрібно рівно 9, а введено ${count}.`;
    }
    return 'Введіть номер у форматі +380XXXXXXXXX (9 цифр після +380).';
  }

  function validateMessage(field) {
    const value = field.value.trim();
    if (!value) return 'Напишіть повідомлення.';
    if (value.length < 10) return `Повідомлення має містити щонайменше 10 символів (зараз ${value.length}).`;
    return '';
  }

  function validateAgreement(field) {
    if (!field.checked) return 'Підтвердіть згоду, щоб надіслати форму.';
    return '';
  }

  /**
   * Порядок у списку = порядок на сторінці. За ним визначається «перше поле
   * з помилкою». ids — можливі id, names — запасний пошук за атрибутом name.
   * normalize (необов'язково) — як очистити значення на blur і submit.
   */
const FIELDS = [
    { ids: ['username', 'contact-name'], names: ['username', 'name'], validate: validateUsername },
    { ids: ['email', 'contact-email'], names: ['email'], validate: validateEmail },
    { ids: ['phone', 'contact-phone'], names: ['phone'], validate: validatePhone, normalize: cleanPhone },
    { ids: ['contact-topic'], names: ['topic'], validate: (field) => field.value ? '' : 'Оберіть тему звернення.' }, // <-- ДОДАЙ ЦЕЙ РЯДОК
    { ids: ['message', 'contact-message'], names: ['message'], validate: validateMessage },
    { ids: ['agreement', 'contact-consent'], names: ['agreement', 'consent'], validate: validateAgreement },
  ];

  /* ------------------------------------------------------------------ *
   * 2. Керування станами UI
   * ------------------------------------------------------------------ */

  /**
   * Повертає елемент для тексту помилки. Якщо його немає — створює
   * і вставляє під полем (для чекбокса — під обгорткою-label).
   */
  function getErrorElement(field) {
    const errorId = `${field.id}-error`;
    let el = document.getElementById(errorId);

    if (!el) {
      el = document.createElement('p');
      el.id = errorId;
      el.setAttribute('role', 'alert');
      el.className = 'mt-1.5 hidden text-sm text-red-700';

      const anchor = field.type === 'checkbox' ? field.closest('label') || field : field;
      anchor.insertAdjacentElement('afterend', el);
    }
    return el;
  }

  /** Додає id помилки до aria-describedby, не затираючи наявні (підказки) */
  function linkErrorToField(field, errorId) {
    const ids = (field.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    if (!ids.includes(errorId)) {
      ids.push(errorId);
      field.setAttribute('aria-describedby', ids.join(' '));
    }
  }

  /** Стан «помилка»: aria-invalid, червона рамка (через Tailwind-варіант), текст під полем */
  function showError(field, message) {
    const errorEl = getErrorElement(field);

    field.setAttribute('aria-invalid', 'true');
    field.removeAttribute('data-valid');

    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    errorEl.classList.add('block');

    linkErrorToField(field, errorEl.id);
  }

  /** Стан «успіх»: зелена рамка (data-valid="true"), помилку прибираємо */
  function showSuccess(field) {
    clearError(field);
    field.setAttribute('data-valid', 'true');
  }

  /** Прибирає помилку: атрибути, текст і видимість блоку */
  function clearError(field) {
    const errorEl = getErrorElement(field);

    field.removeAttribute('aria-invalid');
    field.removeAttribute('data-valid');

    errorEl.textContent = '';
    errorEl.classList.add('hidden');
    errorEl.classList.remove('block');
  }

  /** Повертає поле до нейтрального стану (як на початку) */
  function resetState(field) {
    clearError(field);
  }

  /**
   * Перевіряє одне поле і виставляє відповідний стан UI.
   * @returns {boolean} true — поле коректне
   */
  function validateField({ field, validate }) {
    const message = validate(field);
    if (message) {
      showError(field, message);
      return false;
    }
    showSuccess(field);
    return true;
  }

  /* ------------------------------------------------------------------ *
   * 3. Допоміжні функції
   * ------------------------------------------------------------------ */

  /** Шукає поле за списком id, а потім за атрибутом name */
  function findField({ ids, names }, scope) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    for (const name of names) {
      const el = scope.querySelector(`[name="${name}"]`);
      if (el) return el;
    }
    return null;
  }

  /** Поле вже перевірялося: має помилку або позначене як коректне */
  function wasValidated(field) {
    return field.getAttribute('aria-invalid') === 'true' || field.getAttribute('data-valid') === 'true';
  }

  /**
   * Приводить значення до чистого вигляду, щоб у форму (і на сервер)
   * потрапляло те саме, що перевіряється: для телефону прибирає форматування,
   * для решти текстових полів обрізає пробіли по краях.
   * Викликається лише на blur та submit, а не під час набору.
   */
  function normalizeField({ field, normalize }) {
    if (field.type === 'checkbox') return;
    field.value = normalize ? normalize(field.value) : field.value.trim();
  }

  /** Плавно прокручує до поля й ставить на нього фокус */
  function focusField(field) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    field.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    field.focus({ preventScroll: true });
  }

  /** Перевіряє всі поля; повертає перше поле з помилкою або null */
  function validateAll(entries) {
    let firstInvalid = null;
    entries.forEach((entry) => {
      normalizeField(entry);
      const isValid = validateField(entry);
      if (!isValid && !firstInvalid) firstInvalid = entry.field;
    });
    return firstInvalid;
  }
  /**
   * Імітація надсилання (бекенд не підключено): блокуємо кнопку, чекаємо
   * ~0,8 с, очищаємо форму й показуємо модальне вікно.
   * Замініть тіло setTimeout на реальний fetch(...), коли з'явиться бекенд.
   */
    /**
   * Показує вікно успіху. Спершу через MathStepModal; якщо його немає,
   * напряму знімає hidden і блокує скрол, щоб користувач у будь-якому
   * разі побачив підтвердження, а не порожню сторінку.
   */
  function showSuccessModal(opener) {
    const api = window.MathStepModal;
    if (api && typeof api.open === 'function' && api.open(opener)) return;

    // Запасний варіант: працюємо з DOM напряму
    const modal = document.getElementById('successModal');
    if (!modal) {
      // Вікна немає в розмітці взагалі: останній рубіж
      window.alert('Дякуємо! Ваше повідомлення успішно надіслано. Ми відповімо вам найближчим часом.');
      return;
    }

    modal.hidden = false;
    document.body.classList.add('overflow-hidden');

    const closeBtn = document.getElementById('successModalClose');
    const hide = () => {
      modal.hidden = true;
      document.body.classList.remove('overflow-hidden');
      document.removeEventListener('keydown', onEsc);
    };
    const onEsc = (e) => { if (e.key === 'Escape') hide(); };

    document.addEventListener('keydown', onEsc);
    if (closeBtn) {
      closeBtn.addEventListener('click', hide, { once: true });
      closeBtn.focus();
    }
  }

  /**
   * Імітація надсилання (бекенд не підключено): блокуємо кнопку, чекаємо
   * ~0,8 с, очищаємо форму й показуємо вікно успіху.
   * Замініть тіло setTimeout на реальний fetch(...), коли з'явиться бекенд.
   */
  function simulateSend(form) {
    const submitBtn = form.querySelector('[type="submit"]');
    const label = submitBtn ? submitBtn.textContent : '';

    if (submitBtn) { // захист від подвійного надсилання
      submitBtn.disabled = true;
      submitBtn.textContent = 'Надсилаємо…';
    }

    setTimeout(() => {
      try {
        form.reset(); // обробник reset повертає поля до нейтрального вигляду
      } finally {
        // Кнопку повертаємо й вікно показуємо навіть якщо reset() зламався
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = label;
        }
        showSuccessModal(submitBtn);
      }
    }, 800);
  }
  /* ------------------------------------------------------------------ *
   * 4. Ініціалізація
   * ------------------------------------------------------------------ */

  function init() {
    console.log('Скрипт валідації запущено!');
    // Спочатку шукаємо форму за id, інакше беремо форму, у якій лежить поле
    let form = document.getElementById('feedbackForm');
    const scope = form || document;

    const entries = FIELDS
      .map((cfg) => ({ field: findField(cfg, scope), validate: cfg.validate, normalize: cfg.normalize }))
      .filter((entry) => entry.field);

    if (!entries.length) return; // жодного поля не знайдено — нічого робити
    if (!form) form = entries[0].field.form;
    if (!form) return;

    // Вимикаємо вбудовану валідацію браузера: інакше при required/type="email"
    // він перехоплює submit раніше за наш код і показує свої підказки
    form.noValidate = true;

    // maxlength="13" обрізав би вставлений номер із пробілами ще до очищення
    // ("+380 (50) 123-45-67" має 19 символів). Реальну довжину перевіряє PHONE_REGEX.
    const phoneEntry = entries.find((e) => e.validate === validatePhone);
    if (phoneEntry && phoneEntry.field.maxLength > 0 && phoneEntry.field.maxLength < 25) {
      phoneEntry.field.maxLength = 25;
    }

    /**
     * Події полів:
     *  - blur   — фінальна перевірка, коли користувач залишив поле;
     *  - input  — оновлення на льоту для вже перевіреного поля;
     *  - change — для чекбокса.
     * На старті нічого не спрацьовує, тож форма спочатку нейтральна.
     */
    entries.forEach((entry) => {
      const { field } = entry;

      if (field.type === 'checkbox') {
        field.addEventListener('change', () => validateField(entry));
        return;
      }

      field.addEventListener('blur', () => {
        normalizeField(entry);
        validateField(entry);
      });

      field.addEventListener('input', () => {
        if (wasValidated(field)) validateField(entry);
      });
    });

    // Скидання форми повертає всі поля до нейтрального стану
    form.addEventListener('reset', () => entries.forEach(({ field }) => resetState(field)));

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      // Перевіряємо ВСІ поля одразу, щоб користувач побачив усі помилки разом
      const firstInvalid = validateAll(entries);

      if (firstInvalid) {
        focusField(firstInvalid); // фокус і плавна прокрутка до першого з помилкою
        return;
      }

      // Усі поля коректні: імітуємо надсилання й показуємо вікно успіху.
      simulateSend(form);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
