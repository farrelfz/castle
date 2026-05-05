/* ============================================================
   CASTLE 2026 Conference Website
   Interactions: navigation, language, reveal, guide print
   ============================================================ */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const navbar = document.getElementById('navbar');
  const navMenu = document.getElementById('navMenu');
  const navToggle = document.getElementById('navToggle');
  const langToggle = document.querySelector('[data-lang-toggle]');
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const navDropdowns = Array.from(document.querySelectorAll('[data-nav-dropdown]'));
  const navTriggers = Array.from(document.querySelectorAll('.nav-trigger'));
  const revealItems = Array.from(document.querySelectorAll('[data-reveal]'));
  const printGuideButtons = Array.from(document.querySelectorAll('[data-print-guide]'));

  const samePath = (a, b) => {
    const clean = (value) => value.replace(/\/index\.html$/, '/').replace(/\/+$/, '') || '/';
    return clean(a) === clean(b);
  };

  function setNavbarState() {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.scrollY > 8);
  }

  function closeDropdowns(exceptButton = null) {
    navDropdowns.forEach((button) => {
      if (button === exceptButton) return;

      button.closest('.nav-group')?.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    });
  }

  function closeNavMenu() {
    navMenu?.classList.remove('open');
    navToggle?.classList.remove('open');
    navToggle?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    closeDropdowns();
  }

  function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const currentHash = window.location.hash;
    const activeGroups = new Set();

    navLinks.forEach((link) => {
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        link.classList.remove('active');
        return;
      }

      const pathMatches = samePath(url.pathname, currentPath);
      const hashMatches = url.hash ? url.hash === currentHash : !currentHash;
      const isActive = pathMatches && hashMatches;
      link.classList.toggle('active', isActive);

      if (isActive) {
        const group = link.closest('.nav-group');
        if (group) activeGroups.add(group);
      }
    });

    navTriggers.forEach((trigger) => {
      trigger.classList.toggle('active', activeGroups.has(trigger.closest('.nav-group')));
    });
  }

  function setupDropdownNav() {
    navDropdowns.forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();

        const group = button.closest('.nav-group');
        if (!group) return;

        const shouldOpen = !group.classList.contains('open');
        closeDropdowns(button);
        group.classList.toggle('open', shouldOpen);
        button.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
      });
    });

    document.addEventListener('click', (event) => {
      if (event.target.closest('.nav-group')) return;
      closeDropdowns();
    });
  }

  function setupMobileNav() {
    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      document.body.classList.toggle('nav-open', isOpen);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeNavMenu();
    });
  }

  function setupSmoothAnchors() {
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      let url;
      try {
        url = new URL(link.getAttribute('href'), window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin !== window.location.origin) return;

      if (url.hash && samePath(url.pathname, window.location.pathname)) {
        const target = document.querySelector(url.hash);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
        window.history.pushState(null, '', url.hash);
        setActiveNavLink();
      }

      closeNavMenu();
    });
  }

  function setupSectionSpy() {
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    if (!sections.length || !navLinks.length) return;

    const linkMap = new Map();
    navLinks.forEach((link) => {
      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch (error) {
        return;
      }

      if (url.origin === window.location.origin && samePath(url.pathname, window.location.pathname) && url.hash) {
        linkMap.set(url.hash, link);
      }
    });

    if (!linkMap.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const hash = `#${entry.target.id}`;
          const activeLink = linkMap.get(hash);

          linkMap.forEach((link, key) => link.classList.toggle('active', key === hash));
          navTriggers.forEach((trigger) => trigger.classList.remove('active'));

          const activeGroup = activeLink?.closest('.nav-group');
          activeGroup?.querySelector('.nav-trigger')?.classList.add('active');
        });
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  const translatable = Array.from(document.querySelectorAll('[data-id][data-en]'));
  const attrTargets = Array.from(
    document.querySelectorAll(
      '[data-id-placeholder], [data-en-placeholder], [data-id-aria-label], [data-en-aria-label], [data-id-alt], [data-en-alt]'
    )
  );

  function applyLanguage(lang) {
    const safeLang = lang === 'id' ? 'id' : 'en';

    translatable.forEach((element) => {
      const text = element.dataset[safeLang];
      if (typeof text !== 'string') return;

      if (element.tagName === 'META') {
        element.setAttribute('content', text);
      } else if (element.tagName === 'TITLE') {
        document.title = text;
      } else {
        element.textContent = text;
      }
    });

    attrTargets.forEach((element) => {
      const placeholder = element.dataset[`${safeLang}Placeholder`];
      const ariaLabel = element.dataset[`${safeLang}AriaLabel`];
      const altText = element.dataset[`${safeLang}Alt`];

      if (placeholder) element.setAttribute('placeholder', placeholder);
      if (ariaLabel) element.setAttribute('aria-label', ariaLabel);
      if (altText) element.setAttribute('alt', altText);
    });

    document.documentElement.lang = safeLang;
    document.body.dataset.lang = safeLang;

    if (langToggle) {
      langToggle.textContent = safeLang === 'id' ? '\u{1F1EC}\u{1F1E7}' : '\u{1F1EE}\u{1F1E9}';
      langToggle.setAttribute(
        'aria-label',
        safeLang === 'id' ? 'Switch language to English' : 'Ganti bahasa ke Indonesia'
      );
    }

    try {
      localStorage.setItem('castleLang', safeLang);
    } catch (error) {
      // Storage can fail in private browsing or file contexts.
    }
  }

  function setupLanguage() {
    let currentLang = 'en';

    try {
      const storedLang = localStorage.getItem('castleLang') || localStorage.getItem('lang');
      if (storedLang === 'id' || storedLang === 'en') currentLang = storedLang;
    } catch (error) {
      currentLang = 'en';
    }

    applyLanguage(currentLang);

    langToggle?.addEventListener('click', () => {
      currentLang = currentLang === 'id' ? 'en' : 'id';
      applyLanguage(currentLang);
    });
  }

  function setupReveal() {
    if (!revealItems.length) return;

    if (prefersReducedMotion) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, revealObserver) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -48px 0px' }
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function setupPrintGuide() {
    printGuideButtons.forEach((button) => {
      button.addEventListener('click', () => window.print());
    });
  }

  setupDropdownNav();
  setupMobileNav();
  setupSmoothAnchors();
  setupSectionSpy();
  setupLanguage();
  setupReveal();
  setupPrintGuide();
  setActiveNavLink();
  setNavbarState();

  window.addEventListener('hashchange', setActiveNavLink);
  window.addEventListener('scroll', setNavbarState, { passive: true });
})();
