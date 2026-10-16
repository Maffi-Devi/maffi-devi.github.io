/* Maffi Bhall — portfolio interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  requestAnimationFrame(() => document.documentElement.classList.add('loaded'));

  /* ── Header: scrolled state, mobile menu, active link ── */
  const header = $('#header'), menuBtn = $('#menuBtn');
  const setMenu = open => {
    header.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('open')));
  $$('#nav a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  const links = $$('#nav a');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'career', 'work', 'contact'].forEach(id => sectionObs.observe(document.getElementById(id)));

  /* ── Rotating roles: the current line is bright, the next one dim ── */
  const roles = $('#roles');
  if (roles) {
    const list = $('ul', roles);
    const items = $$('li', list);
    items.forEach(li => list.appendChild(li.cloneNode(true)));   // second copy for a seamless loop
    const all = $$('li', list);
    let i = 0;
    all[0].classList.add('on');
    if (!reduceMotion) {
      setInterval(() => {
        all[i].classList.remove('on');
        i++;
        list.style.transition = '';
        list.style.transform = `translateY(-${i * 1.15}em)`;
        all[i].classList.add('on');
        if (i === items.length) {
          setTimeout(() => {
            list.style.transition = 'none';
            list.style.transform = 'translateY(0)';
            all[i].classList.remove('on');
            i = 0;
            all[0].classList.add('on');
          }, 950);
        }
      }, 2600);
    }
  }

  /* ── Reveal on scroll ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, n) => {
      if (!e.target.style.getPropertyValue('--d')) e.target.style.setProperty('--d', Math.min(n, 4) * 0.08 + 's');
      e.target.classList.add('in');
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revealObs.observe(el));

  /* ── Count-up numbers ── */
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = +el.dataset.count, suffix = el.dataset.suffix || '';
      countObs.unobserve(el);
      if (reduceMotion) return;
      const t0 = performance.now(), dur = 1500;
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))).toLocaleString('en-IN') + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => countObs.observe(el));

  /* ── Scroll-driven: header state, timeline progress, pinned horizontal work ── */
  const timeline = $('#timeline'), tlFill = $('.tl-line i', timeline), tlItems = $$('.tl-item', timeline);
  const work = $('#work'), track = $('#workTrack'), contact = $('#contact');
  const wide = matchMedia('(min-width: 900px)');
  let travel = 0;

  const layoutWork = () => {
    const pin = !reduceMotion && wide.matches;
    work.classList.toggle('pinned', pin);
    track.style.transform = '';
    if (!pin) { work.style.height = ''; travel = 0; return; }
    travel = Math.max(0, track.scrollWidth - innerWidth);
    work.style.height = innerHeight + travel + 'px';
  };

  const onScroll = () => {
    header.classList.toggle('scrolled', scrollY > 30);
    document.body.classList.toggle('at-end', contact.getBoundingClientRect().top < innerHeight * 0.75);

    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.55 - r.top) / r.height));
    tlFill.style.setProperty('--p', p);
    tlItems.forEach(it => it.classList.toggle('on', it.getBoundingClientRect().top < innerHeight * 0.62));

    if (travel) {
      const w = work.getBoundingClientRect();
      document.body.classList.toggle('in-work', w.top < innerHeight * 0.3 && w.bottom > innerHeight * 0.7);
      const q = Math.min(1, Math.max(0, -w.top / (w.height - innerHeight)));
      track.style.transform = `translate3d(${-q * travel}px,0,0)`;
    }
  };
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', () => { layoutWork(); onScroll(); });
  addEventListener('load', () => { layoutWork(); onScroll(); });
  layoutWork(); onScroll();

  /* ── Photo rows: duplicate once so the marquee loops seamlessly ── */
  if (!reduceMotion) {
    $$('.photo-row').forEach(row => $$('figure', row).forEach(f => {
      const c = f.cloneNode(true); c.setAttribute('aria-hidden', 'true'); c.dataset.clone = '1'; row.appendChild(c);
    }));
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
    const scope = el.closest('.photo-rows, .cert-strip') || document;
    group = $$('[data-full]', scope).filter(x => !x.dataset.clone);
    const src = el.dataset.clone ? group.find(g => g.dataset.full === el.dataset.full) : el;
    lastFocus = el;
    show(group.indexOf(src));
    $('.lb-prev', lb).style.display = $('.lb-next', lb).style.display = group.length > 1 ? '' : 'none';
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    $('.lb-close', lb).focus();
  };
  const closeLb = () => { lb.classList.remove('open'); document.body.style.overflow = ''; if (lastFocus) lastFocus.focus({ preventScroll: true }); };
  $$('[data-full]').forEach(el => {
    if (!el.dataset.clone) { el.tabIndex = 0; el.setAttribute('role', 'button'); }
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
    if (e.key === 'Escape' && header.classList.contains('open')) setMenu(false);
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
    return { score: Math.min(100, hits.reduce((s, r) => s + r.w, 0) + (hasUrl && hits.length ? 6 : 0)), hits };
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
    out.innerHTML = `<div class="verdict"><b>${label}</b><span>Risk score ${score}/100</span></div><div class="meter"><i></i></div><ul class="reasons">${reasons}</ul>`;
    requestAnimationFrame(() => { $('.meter i', out).style.width = Math.max(score, 4) + '%'; });
  };
  $('#scanBtn').addEventListener('click', render);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) render(); });
  $$('.samples button').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.s; render(); }));
})();
