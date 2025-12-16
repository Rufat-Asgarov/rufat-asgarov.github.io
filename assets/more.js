(function(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Reveal on enter (sections + hero) ---
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  if(!reduceMotion && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      for(const e of entries){
        if(e.isIntersecting){
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  }else{
    revealEls.forEach(el => el.classList.add('in'));
  }

  // --- Animated <details> (sections + projects) ---
  function setupAnimatedDetails(detailsEl){
    const summary = detailsEl.querySelector(':scope > summary');
    const content = detailsEl.querySelector(':scope > .details-content');
    if(!summary || !content) return;

    // Let the browser handle it if reduced motion is requested.
    if(reduceMotion) return;

    let anim = null;
    let isClosing = false;
    let isOpening = false;

    summary.addEventListener('click', (e) => {
      e.preventDefault();
      if(isClosing || isOpening) return;

      if(detailsEl.hasAttribute('open')){
        // Closing
        isClosing = true;
        const startHeight = content.offsetHeight;
        content.style.overflow = 'hidden';
        content.style.height = startHeight + 'px';
        content.style.opacity = '1';

        anim?.cancel();
        anim = content.animate(
          [{ height: startHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }],
          { duration: 220, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );

        anim.onfinish = () => {
          detailsEl.removeAttribute('open');
          content.style.height = '';
          content.style.overflow = '';
          content.style.opacity = '';
          isClosing = false;
        };
        anim.oncancel = () => { isClosing = false; };
      }else{
        // Opening
        isOpening = true;
        detailsEl.setAttribute('open','');

        // Start from 0 -> full height
        content.style.overflow = 'hidden';
        content.style.height = '0px';
        content.style.opacity = '0';

        // Need a frame so the open state is applied and scrollHeight is correct.
        requestAnimationFrame(() => {
          const endHeight = content.scrollHeight;
          anim?.cancel();
          anim = content.animate(
            [{ height: '0px', opacity: 0 }, { height: endHeight + 'px', opacity: 1 }],
            { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }
          );

          anim.onfinish = () => {
            content.style.height = '';
            content.style.overflow = '';
            content.style.opacity = '';
            isOpening = false;
          };
          anim.oncancel = () => { isOpening = false; };
        });
      }
    });
  }

  document.querySelectorAll('details.section-details, details.proj').forEach(setupAnimatedDetails);

  // --- Projects expand/collapse all ---
  const expandAllBtn = document.getElementById('expandAll');
  const collapseAllBtn = document.getElementById('collapseAll');

  function setProjects(open){
    document.querySelectorAll('details.proj').forEach(d => {
      if(open) d.setAttribute('open','');
      else d.removeAttribute('open');
    });
  }

  if(expandAllBtn) expandAllBtn.addEventListener('click', () => setProjects(true));
  if(collapseAllBtn) collapseAllBtn.addEventListener('click', () => setProjects(false));

  // --- Sidebar nav: smooth scroll + scrollspy ---
  const navLinks = Array.from(document.querySelectorAll('.nav-link'));
  const targets = navLinks
    .map(a => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  navLinks.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      const target = document.querySelector(href);
      if(!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });

      // Pulse on arrival (small delay to align with scroll)
      window.setTimeout(() => {
        target.classList.remove('flash');
        // force reflow so animation re-triggers
        void target.offsetWidth;
        target.classList.add('flash');
        window.setTimeout(() => target.classList.remove('flash'), 650);
      }, reduceMotion ? 0 : 280);
    });
  });

  function onScroll(){
    const y = window.scrollY + 130;
    let active = targets[0] || null;
    for(const t of targets){
      if(t.offsetTop <= y) active = t;
    }
    if(!active) return;
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + active.id));
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();