/**
 * widget.js — калькулятор вартості навчання MathStep (ЛР №11).
 * Vanilla JS, без залежностей.
 *
 * Ізоляція коду:
 *  - увесь код усередині IIFE: жодних глобальних змінних і функцій;
 *  - кожен віджет — окремий екземпляр: елементи шукаються лише всередині
 *    свого кореня [data-calc-widget] через data-атрибути [data-calc="..."],
 *    тому на одній сторінці можуть працювати кілька калькуляторів;
 *  - позначка data-calc-ready не дає ініціалізувати віджет двічі.
 */
(() => {
  'use strict';

  /* ---------- 1. Налаштування (бізнес-правила) ---------- */
  const CONFIG = {
    tariffs: [1800, 3400, 4800, 2000],          // дозволені ціни тарифів, грн/міс
    extras: { nmt: 500, homework: 300 },        // додаткові послуги, грн/міс
    months: {
      min: 1, max: 12,
      empty: 'Вкажіть кількість місяців.',
      range: 'Кількість місяців — від 1 до 12.',
    },
    students: {
      min: 1, max: 5,
      empty: 'Вкажіть кількість учнів.',
      range: 'Кількість учнів — від 1 до 5.',
    },
    // знижка залежно від кількості місяців (від більшого порогу до меншого)
    discounts: [
      { from: 6, rate: 0.10 },
      { from: 3, rate: 0.05 },
      { from: 1, rate: 0 },
    ],
  };

  // Назви елементів, які має містити кожен віджет (значення data-calc)
  const PARTS = [
    'tariff', 'tariff-error', 'months', 'months-error', 'students', 'students-error',
    'nmt', 'homework', 'badge', 'monthly', 'period', 'subtotal', 'discount', 'total', 'status',
  ];

  // Класи Tailwind для стану помилки та нормального стану.
  // focus:* теж міняємо, інакше під час введення (поле у фокусі)
  // синя рамка фокусу перекриває червону рамку помилки.
  const ERROR_CLASSES = [
    'border-red-600', 'bg-red-50', 'ring-2', 'ring-red-200',
    'focus:border-red-600', 'focus:ring-red-500',
  ];
  const NORMAL_CLASSES = [
    'border-slate-300', 'bg-white',
    'focus:border-brand-navy', 'focus:ring-brand-navy',
  ];

  const money = new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 });
  const formatUAH = (value) => `${money.format(value)} грн`;

  /* ---------- 2. Чисті функції (без доступу до DOM) ---------- */

  /**
   * Перевіряє значення числового поля. Повертає { value, error }:
   * value — ціле число або null, error — зрозумілий текст помилки або ''.
   */
  function readInteger(input, rules) {
    const raw = input.value.trim();

    if (input.validity && input.validity.badInput) {
      return { value: null, error: 'Введіть число цифрами, без літер і знаків.' };
    }
    if (raw === '') {
      return { value: null, error: rules.empty };
    }
    // Лише ціле число з цифр (можливо, з мінусом). Відсікає "1e1", "3.0", "+3".
    if (!/^-?\d+$/.test(raw)) {
      return /^-?\d*[.,]\d+$/.test(raw)
        ? { value: null, error: 'Введіть ціле число, наприклад 3.' }
        : { value: null, error: 'Введіть число цифрами, без літер і знаків.' };
    }

    const number = Number(raw);

    if (!Number.isSafeInteger(number) || number < rules.min || number > rules.max) {
      return { value: null, error: rules.range };
    }
    return { value: number, error: '' };
  }

  function getDiscountRate(months) {
    const rule = CONFIG.discounts.find((d) => months >= d.from);
    return rule ? rule.rate : 0;
  }

  /* ---------- 3. Один екземпляр віджета ---------- */

  function initCalculator(root) {
    // Захист від повторної ініціалізації того самого віджета
    if (root.dataset.calcReady === '1') return;

    // Шукаємо елементи ЛИШЕ всередині цього віджета
    const el = {};
    PARTS.forEach((name) => {
      el[name] = root.querySelector(`[data-calc="${name}"]`);
    });

    const missing = PARTS.filter((name) => !el[name]);
    if (missing.length) {
      console.warn('[MathStep calc] Віджет пропущено, бракує елементів:', missing.join(', '));
      return;
    }
    root.dataset.calcReady = '1';

    function readTariff() {
      const price = Number(el.tariff.value);
      return CONFIG.tariffs.includes(price) ? price : null;
    }

    function setFieldError(input, errorEl, message) {
      // Текст пишемо у вкладений <span>, щоб не стерти іконку
      const textEl = errorEl.querySelector('[data-error-text]') || errorEl;

      if (message) {
        input.classList.remove(...NORMAL_CLASSES);
        input.classList.add(...ERROR_CLASSES);
        input.setAttribute('aria-invalid', 'true');
        textEl.textContent = message;
        errorEl.classList.remove('hidden');
        errorEl.classList.add('flex');
      } else {
        input.classList.remove(...ERROR_CLASSES);
        input.classList.add(...NORMAL_CLASSES);
        input.removeAttribute('aria-invalid');
        textEl.textContent = '';
        errorEl.classList.add('hidden');
        errorEl.classList.remove('flex');
      }
    }

    function updateBadge(months) {
      if (months === null) {
        el.badge.classList.add('hidden');
        return;
      }
      const rate = getDiscountRate(months);
      el.badge.classList.remove('hidden');
      el.badge.textContent = rate > 0 ? `Знижка ${Math.round(rate * 100)}%` : 'Без знижки';
      el.badge.classList.toggle('bg-emerald-100', rate > 0);
      el.badge.classList.toggle('text-emerald-700', rate > 0);
      el.badge.classList.toggle('bg-slate-200', rate === 0);
      el.badge.classList.toggle('text-slate-600', rate === 0);
    }

    function showEmptyResult(message) {
      el.monthly.textContent = '—';
      el.period.textContent = '—';
      el.subtotal.textContent = '—';
      el.discount.textContent = '—';
      el.total.textContent = '—';
      el.status.textContent = message;
      el.status.classList.remove('hidden');
    }

    function showResult({ monthly, months, students, subtotal, discount, rate, total }) {
      el.monthly.textContent = formatUAH(monthly);
      el.period.textContent = `${months} міс × ${students} уч.`;
      el.subtotal.textContent = formatUAH(subtotal);
      el.discount.textContent = rate > 0
        ? `−${formatUAH(discount)} (${Math.round(rate * 100)}%)`
        : 'немає (від 3 міс — 5%)';
      el.total.textContent = formatUAH(total);
      el.status.textContent = '';
      el.status.classList.add('hidden');
    }

    function calculate() {
      const months = readInteger(el.months, CONFIG.months);
      const students = readInteger(el.students, CONFIG.students);
      const tariff = readTariff();

      setFieldError(el.tariff, el['tariff-error'], tariff === null ? 'Оберіть тариф зі списку.' : '');
      setFieldError(el.months, el['months-error'], months.error);
      setFieldError(el.students, el['students-error'], students.error);
      updateBadge(months.value);

      if (tariff === null || months.error || students.error) {
        showEmptyResult('Виправте поля, позначені червоним, щоб побачити розрахунок.');
        return;
      }

      const extras = (el.nmt.checked ? CONFIG.extras.nmt : 0)
        + (el.homework.checked ? CONFIG.extras.homework : 0);
      const monthly = tariff + extras;
      const subtotal = monthly * months.value * students.value;
      const rate = getDiscountRate(months.value);
      const discount = Math.round(subtotal * rate);
      const total = subtotal - discount;

      // Остання лінія захисту: на екран не потрапляє NaN, Infinity чи від'ємне число
      if (!Number.isFinite(total) || total < 0) {
        showEmptyResult('Не вдалося розрахувати. Перевірте дані.');
        return;
      }

      showResult({ monthly, months: months.value, students: students.value, subtotal, discount, rate, total });
    }

    // Події: слухаємо лише свій віджет
    root.addEventListener('input', calculate);   // введення в числові поля
    root.addEventListener('change', calculate);  // select і checkbox
    root.addEventListener('submit', (event) => event.preventDefault()); // Enter не перезавантажує сторінку

    calculate(); // перший розрахунок при завантаженні
  }

  /* ---------- 4. Запуск: окремий екземпляр для кожного віджета ---------- */
  function initAll() {
    document.querySelectorAll('[data-calc-widget]').forEach(initCalculator);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
