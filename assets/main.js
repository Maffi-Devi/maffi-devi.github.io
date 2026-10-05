/* Maffi Bhall — portfolio interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Nav: scrolled state, progress bar, back to top, mobile menu, active link ── */
  const nav = $('#nav'), progress = $('#progress'), toTop = $('#toTop');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('scrolled', scrollY > 24);
    toTop.classList.toggle('show', scrollY > 700);
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  const menuBtn = $('#menuBtn');
  const setMenu = open => { nav.classList.toggle('open', open); menuBtn.setAttribute('aria-expanded', open); };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  const links = $$('#navLinks a');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('header[id], section[id]').forEach(s => sectionObs.observe(s));

  /* ── Hero text: letter reveal for the name, rotating role, word-by-word intro ── */
  if (!reduceMotion) {
    const h1 = $('.hero h1');
    if (h1) {
      let i = 0;
      const words = h1.textContent.trim().split(/\s+/);
      h1.setAttribute('aria-label', h1.textContent.trim());
      h1.innerHTML = words.map(w => `<span class="wd" aria-hidden="true">${[...w].map(c => `<span class="ch" style="--i:${i++}">${c}</span>`).join('')}</span>`).join(' ') + '<span class="dot" aria-hidden="true"></span>';
      h1.classList.add('split');
    }

    const lede = $('.hero .lede');
    if (lede) {
      let i = 0;
      const walk = node => [...node.childNodes].forEach(n => {
        if (n.nodeType === 1) return walk(n);
        if (n.nodeType !== 3 || !n.textContent.trim()) return;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part.trim()) return frag.appendChild(document.createTextNode(part ? ' ' : ''));
          const s = document.createElement('span');
          s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = part;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      });
      walk(lede);
      lede.classList.add('split');
    }

    const role = $('#role');
    if (role && role.dataset.roles) {
      const roles = role.dataset.roles.split('|');
      role.setAttribute('aria-label', role.textContent.replace(/\s+/g, ' ').trim());
      role.innerHTML = `<span class="rot-list" aria-hidden="true">${roles.map(r => `<span class="rot-item">${r}</span>`).join('')}</span>`;
      role.classList.add('rot');
      const items = $$('.rot-item', role);
      let cur = 0;
      setTimeout(() => items[0].classList.add('on'), 350);
      setInterval(() => {
        const prev = items[cur];
        cur = (cur + 1) % items.length;
        prev.classList.remove('on'); prev.classList.add('out');
        items[cur].classList.remove('out'); items[cur].classList.add('on');
        setTimeout(() => prev.classList.remove('out'), 800);
      }, 2600);
    }
  }

  /* ── Reveal on scroll, staggered within each row of siblings ── */
  const revealObs = new IntersectionObserver(entries => {
    const shown = entries.filter(e => e.isIntersecting);
    shown.forEach((e, i) => {
      const el = e.target;
      if (!el.style.getPropertyValue('--d')) el.style.setProperty('--d', Math.min(i, 5) * 0.08 + 's');
      el.classList.add('in');
      revealObs.unobserve(el);
      setTimeout(() => el.classList.add('done'), 1300);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ── Pointer spotlight on cards ── */
  if (matchMedia('(hover: hover)').matches) {
    $$('.card.hover').forEach(card => card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', e.clientX - r.left + 'px');
      card.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true }));
  }

  /* ── Marquee: duplicate the items once so the loop is seamless ── */
  const marquee = $('#marquee');
  if (marquee && !reduceMotion) {
    $$('li', marquee).forEach(li => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); marquee.appendChild(c); });
  }

  /* ── Count-up metrics ── */
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      countObs.unobserve(el);
      if (reduceMotion) return;
      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
        el.textContent = v.toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObs.observe(el));

  /* ── Photo gallery: category filters and "show all" ── */
  const gallery = $('#gallery'), filters = $('#filters'), moreBtn = $('#moreBtn');
  const FIRST = 13;
  let expanded = false, current = 'all';
  if (gallery) {
    const shots = $$('.shot', gallery);
    const CATS = [['all', 'All'], ['summit', 'AI Impact Summit'], ['workshops', 'Workshops'], ['students', 'Students'], ['awards', 'Awards']];
    const apply = animate => {
      let n = 0;
      shots.forEach(s => {
        const match = current === 'all' || s.dataset.cat === current;
        const show = match && (current !== 'all' || expanded || n < FIRST);
        if (match) n++;
        const was = !s.classList.contains('hide');
        s.classList.toggle('hide', !show);
        if (show) { s.classList.add('in', 'done'); }
        if (animate && show && !was) { s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
      });
      moreBtn.parentElement.style.display = current === 'all' && !expanded && shots.length > FIRST ? '' : 'none';
    };
    CATS.forEach(([key, label]) => {
      const count = key === 'all' ? shots.length : shots.filter(s => s.dataset.cat === key).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `${label}<span>${count}</span>`;
      b.setAttribute('aria-pressed', key === current);
      if (key === current) b.className = 'on';
      b.addEventListener('click', () => {
        current = key;
        $$('button', filters).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
        shots.forEach(s => s.classList.add('hide'));
        apply(true);
      });
      filters.appendChild(b);
    });
    moreBtn.addEventListener('click', () => { expanded = true; apply(true); });
    apply(false);
  }

  /* ── Lightbox with previous / next ── */
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  let lastFocus = null, group = [], index = 0;
  const show = i => {
    index = (i + group.length) % group.length;
    const el = group[index], img = $('img', el);
    lbImg.src = el.dataset.full; lbImg.alt = img ? img.alt : '';
    lbCap.textContent = el.dataset.cap || '';
  };
  const openLb = el => {
    const scope = el.closest('.gallery, .certs, .iot-strip') || document;
    group = $$('[data-full]', scope).filter(x => !x.classList.contains('hide'));
    lastFocus = el;
    show(group.indexOf(el));
    const many = group.length > 1;
    $('.lb-prev', lb).style.display = $('.lb-next', lb).style.display = many ? '' : 'none';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus({ preventScroll: true }); };
  $$('[data-full]').forEach(el => {
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.addEventListener('click', () => openLb(el));
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(el); } });
  });
  lb.addEventListener('click', e => {
    if (e.target.closest('.lb-prev')) return show(index - 1);
    if (e.target.closest('.lb-next')) return show(index + 1);
    if (e.target === lbImg) return;
    closeLb();
  });
  addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });

  /* ── Scam message checker: rule layer of the DigitalKawach engine ── */
  const RULES = [
    { re: /\b(kyc|pan ?card|aadha+r)\b/i, w: 22, why: 'Mentions KYC or identity documents, a common impersonation tactic' },
    { re: /\b(otp|pin|cvv|password|upi pin)\b/i, w: 30, why: 'Asks for an OTP, PIN or password. Banks never ask for these' },
    { re: /\b(block(ed)?|suspend(ed)?|deactivat\w*|expire[sd]?)\b/i, w: 16, why: 'Threatens to block or suspend an account' },
    { re: /\b(urgent|immediately|today|act now|within \d+ ?(hours?|hrs|minutes?))\b/i, w: 14, why: 'Creates a false sense of urgency' },
    { re: /\b(lottery|lucky draw|winner|prize|congratulations|selected)\b/i, w: 22, why: 'Uses prize or lottery language' },
    { re: /\b(processing fee|registration fee|pay .{0,20}(fee|charges)|advance payment)\b/i, w: 24, why: 'Asks you to pay a fee in order to receive money' },
    { re: /\b(guaranteed returns?|double (your )?money|earn \d+|daily income|work from home|investment plan)\b/i, w: 24, why: 'Promises unrealistic income or investment returns' },
    { re: /\b(bitcoin|crypto|forex|trading tips?)\b/i, w: 10, why: 'Promotes crypto or trading schemes' },
    { re: /\b(loan approved|instant loan|pre-?approved)\b/i, w: 16, why: 'Offers a loan you did not apply for' },
    { re: /\b(bit\.ly|tinyurl|goo\.gl|t\.co|cutt\.ly|is\.gd|rb\.gy|t\.me)\b/i, w: 18, why: 'Contains a shortened or Telegram link that hides the real destination' },
    { re: /https?:\/\/(\d{1,3}\.){3}\d{1,3}/i, w: 22, why: 'Link points to a raw IP address' },
    { re: /https?:\/\/[^\s]*(sbi|hdfc|icici|paytm|axis|kotak)[^\s]*\.(xyz|top|info|online|site|click|in\.net)/i, w: 26, why: 'Uses a bank name on a look-alike domain' },
    { re: /\b(dear customer|dear user|valued customer)\b/i, w: 8, why: 'Uses a generic greeting instead of your name' },
    { re: /(rs\.?|₹|inr)\s?[\d,]{5,}/i, w: 10, why: 'Mentions a large sum of money' },
    { re: /!{2,}|[A-Z]{6,}/, w: 6, why: 'Uses capital letters or repeated exclamation marks for pressure' },
  ];

  const scan = text => {
    const hits = RULES.filter(r => r.re.test(text));
    const hasUrl = /https?:\/\/|www\./i.test(text);
    const score = Math.min(100, hits.reduce((s, r) => s + r.w, 0) + (hasUrl && hits.length ? 6 : 0));
    return { score, hits };
  };

  const out = $('#scanOut'), input = $('#scanInput');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const render = () => {
    const text = input.value.trim();
    out.className = 'scan-out';
    if (!text) { out.textContent = 'Enter a message to check.'; return; }
    const { score, hits } = scan(text);
    const [label, level] = score >= 55 ? ['High risk', 'high'] : score >= 25 ? ['Suspicious', 'sus'] : ['No scam patterns found', 'safe'];
    const reasons = hits.length
      ? hits.map(h => `<li>${esc(h.why)}</li>`).join('')
      : '<li>No known scam patterns matched. If the request is unexpected, confirm it with the sender directly.</li>';
    out.classList.add(level);
    out.innerHTML = `
      <div class="verdict"><b>${label}</b><span>Risk score ${score}/100</span></div>
      <div class="meter"><i></i></div>
      <ul class="reasons">${reasons}</ul>`;
    requestAnimationFrame(() => { $('.meter i', out).style.width = Math.max(score, 4) + '%'; });
  };

  $('#scanBtn').addEventListener('click', render);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) render(); });
  $$('.samples button').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.s; render(); }));
})();
