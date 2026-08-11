
(() => {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (button && menu) {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      menu.hidden = open;
    });
    menu.addEventListener('click', (event) => {
      if (event.target.closest('a')) {
        button.setAttribute('aria-expanded','false');
        menu.hidden = true;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !menu.hidden) {
        button.setAttribute('aria-expanded','false');
        menu.hidden = true;
        button.focus();
      }
    });
  }


  const spotlight = document.querySelector('[data-spotlight]');
  if (spotlight) {
    const slides = Array.from(spotlight.querySelectorAll('[data-spotlight-slide]'));
    const controls = spotlight.querySelector('[data-spotlight-controls]');
    const dotsWrap = spotlight.querySelector('[data-spotlight-dots]');
    const prev = spotlight.querySelector('[data-spotlight-prev]');
    const next = spotlight.querySelector('[data-spotlight-next]');
    let index = 0;
    let timer = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (newIndex, announce = false) => {
      index = (newIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.hidden = !active;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.setAttribute('aria-label', `${i + 1} of ${slides.length}`);
      });
      if (dotsWrap) {
        Array.from(dotsWrap.children).forEach((dot, i) => {
          dot.setAttribute('aria-current', String(i === index));
        });
      }
      if (announce && slides[index]) {
        slides[index].focus?.({preventScroll:true});
      }
    };

    const stop = () => {
      if (timer) window.clearInterval(timer);
      timer = null;
    };

    const start = () => {
      stop();
      if (slides.length > 1 && !reduceMotion) {
        timer = window.setInterval(() => render(index + 1), 8000);
      }
    };

    if (slides.length > 1 && controls && dotsWrap && prev && next) {
      controls.hidden = false;
      slides.forEach((slide, i) => {
        slide.setAttribute('tabindex', '-1');
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'spotlight-dot';
        dot.setAttribute('aria-label', `Show featured item ${i + 1}`);
        dot.addEventListener('click', () => {
          render(i);
          start();
        });
        dotsWrap.appendChild(dot);
      });

      prev.addEventListener('click', () => {
        render(index - 1);
        start();
      });
      next.addEventListener('click', () => {
        render(index + 1);
        start();
      });

      let touchStartX = null;
      spotlight.addEventListener('touchstart', (event) => {
        touchStartX = event.changedTouches[0]?.clientX ?? null;
      }, {passive:true});
      spotlight.addEventListener('touchend', (event) => {
        if (touchStartX === null) return;
        const endX = event.changedTouches[0]?.clientX ?? touchStartX;
        const delta = endX - touchStartX;
        if (Math.abs(delta) > 55) {
          render(index + (delta < 0 ? 1 : -1));
          start();
        }
        touchStartX = null;
      }, {passive:true});

      spotlight.addEventListener('mouseenter', stop);
      spotlight.addEventListener('mouseleave', start);
      spotlight.addEventListener('focusin', stop);
      spotlight.addEventListener('focusout', (event) => {
        if (!spotlight.contains(event.relatedTarget)) start();
      });

      render(0);
      start();
    } else {
      render(0);
    }
  }


  const panelDialog = document.querySelector('[data-panel-dialog]');
  if (panelDialog) {
    const panelProfiles = Array.from(panelDialog.querySelectorAll('[data-panel-profile]'));
    const closeButton = panelDialog.querySelector('[data-panel-close]');
    let lastPanelTrigger = null;

    document.querySelectorAll('[data-panel-open]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.getAttribute('data-panel-open');
        const target = panelProfiles.find((profile) => profile.getAttribute('data-panel-profile') === key);
        if (!target) return;

        panelProfiles.forEach((profile) => {
          profile.hidden = profile !== target;
        });

        lastPanelTrigger = button;
        if (typeof panelDialog.showModal === 'function') {
          panelDialog.showModal();
        } else {
          panelDialog.setAttribute('open', '');
        }
        closeButton?.focus();
      });
    });

    const closePanelDialog = () => {
      if (typeof panelDialog.close === 'function') panelDialog.close();
      else panelDialog.removeAttribute('open');
      lastPanelTrigger?.focus();
    };

    closeButton?.addEventListener('click', closePanelDialog);

    panelDialog.addEventListener('click', (event) => {
      if (event.target === panelDialog) closePanelDialog();
    });

    panelDialog.addEventListener('close', () => {
      panelProfiles.forEach((profile) => profile.hidden = true);
    });
  }



  const v09Dialog = document.querySelector('[data-v09-dialog]');
  if (v09Dialog) {
    const v09Profiles = Array.from(v09Dialog.querySelectorAll('[data-v09-profile]'));
    const v09Close = v09Dialog.querySelector('[data-v09-close]');
    let v09LastTrigger = null;

    document.querySelectorAll('[data-v09-open]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.getAttribute('data-v09-open');
        const target = v09Profiles.find((profile) => profile.getAttribute('data-v09-profile') === key);
        if (!target) return;

        v09Profiles.forEach((profile) => {
          profile.hidden = profile !== target;
        });

        v09LastTrigger = button;
        if (typeof v09Dialog.showModal === 'function') {
          v09Dialog.showModal();
        } else {
          v09Dialog.setAttribute('open', '');
        }
        v09Close?.focus();
      });
    });

    const closeV09Dialog = () => {
      if (typeof v09Dialog.close === 'function') v09Dialog.close();
      else v09Dialog.removeAttribute('open');
      v09LastTrigger?.focus();
    };

    v09Close?.addEventListener('click', closeV09Dialog);

    v09Dialog.addEventListener('click', (event) => {
      if (event.target === v09Dialog) closeV09Dialog();
    });

    v09Dialog.addEventListener('close', () => {
      v09Profiles.forEach((profile) => profile.hidden = true);
    });
  }

})();