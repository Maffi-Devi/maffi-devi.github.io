/* Maffi Bhall — portfolio interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Nav: scrolled state, mobile menu, active link ── */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const menuBtn = $('#menuBtn');
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', nav.classList.toggle('open')));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  const links = $$('#navLinks a');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('header[id], section[id]').forEach(s => sectionObs.observe(s));

  /* ── Reveal on scroll ── */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealObs.observe(el));

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

  /* ── Typed role ── */
  const typed = $('#typed');
  const words = ['AI agents', 'full-stack web apps', 'scam detectors', 'SEO engines', 'IoT systems', 'AI chatbots'];
  if (typed && !reduceMotion) {
    let w = 0, i = words[0].length, del = true;
    const step = () => {
      const word = words[w];
      i += del ? -1 : 1;
      typed.textContent = word.slice(0, i);
      let delay = del ? 40 : 75;
      if (!del && i === word.length) { del = true; delay = 1800; }
      else if (del && i === 0) { del = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(step, delay);
    };
    setTimeout(step, 2200);
  }

  /* ── Cursor-follow glow on cards ── */
  $$('.card.hover').forEach(card => card.appendChild(Object.assign(document.createElement('span'), { className: 'spot' })));
  $$('.card.hover').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  /* ── Project filters ── */
  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter').forEach(b => b.classList.toggle('on', b === btn));
    const f = btn.dataset.f;
    $$('#projects .project').forEach(p => {
      p.classList.toggle('hide', f !== 'all' && !p.dataset.cat.split(' ').includes(f));
    });
  }));

  /* ── Certificate lightbox ── */
  const lb = $('#lightbox'), lbImg = $('img', lb);
  $$('.award').forEach(a => a.addEventListener('click', () => {
    lbImg.src = a.dataset.full; lbImg.alt = $('img', a).alt; lb.classList.add('open');
  }));
  lb.addEventListener('click', () => lb.classList.remove('open'));
  addEventListener('keydown', e => { if (e.key === 'Escape') lb.classList.remove('open'); });

  /* ── Scam scanner: rule layer of the DigitalKawach engine ── */
  const RULES = [
    { re: /\b(kyc|pan ?card|aadha+r)\b/i, w: 22, why: 'Asks about KYC / identity documents — a top impersonation lure' },
    { re: /\b(otp|pin|cvv|password|upi pin)\b/i, w: 30, why: 'Requests OTP / PIN / password — no bank ever asks for these' },
    { re: /\b(block(ed)?|suspend(ed)?|deactivat\w*|expire[sd]?)\b/i, w: 16, why: 'Threatens account block or suspension' },
    { re: /\b(urgent|immediately|today|act now|within \d+ ?(hours?|hrs|minutes?))\b/i, w: 14, why: 'Creates artificial urgency' },
    { re: /\b(lottery|lucky draw|winner|prize|congratulations|selected)\b/i, w: 22, why: 'Prize / lottery language' },
    { re: /\b(processing fee|registration fee|pay .{0,20}(fee|charges)|advance payment)\b/i, w: 24, why: 'Asks you to pay a fee to receive money' },
    { re: /\b(guaranteed returns?|double (your )?money|earn \d+|daily income|work from home|investment plan)\b/i, w: 24, why: 'Too-good-to-be-true income or investment promise' },
    { re: /\b(bitcoin|crypto|forex|trading tips?)\b/i, w: 10, why: 'Crypto / trading pitch' },
    { re: /\b(loan approved|instant loan|pre-?approved)\b/i, w: 16, why: 'Unsolicited loan offer' },
    { re: /\b(bit\.ly|tinyurl|goo\.gl|t\.co|cutt\.ly|is\.gd|rb\.gy|t\.me)\b/i, w: 18, why: 'Shortened / Telegram link hides the real destination' },
    { re: /https?:\/\/(\d{1,3}\.){3}\d{1,3}/i, w: 22, why: 'Link points to a raw IP address' },
    { re: /https?:\/\/[^\s]*(sbi|hdfc|icici|paytm|axis|kotak)[^\s]*\.(xyz|top|info|online|site|click|in\.net)/i, w: 26, why: 'Bank name on a look-alike domain' },
    { re: /\b(dear customer|dear user|valued customer)\b/i, w: 8, why: 'Generic greeting instead of your name' },
    { re: /(rs\.?|₹|inr)\s?[\d,]{5,}/i, w: 10, why: 'Large sum of money mentioned' },
    { re: /!{2,}|[A-Z]{6,}/, w: 6, why: 'Shouting / excessive punctuation' },
  ];

  const scan = text => {
    const hits = RULES.filter(r => r.re.test(text));
    const hasUrl = /https?:\/\/|www\./i.test(text);
    let score = hits.reduce((s, r) => s + r.w, 0) + (hasUrl && hits.length ? 6 : 0);
    score = Math.min(100, score);
    return { score, hits };
  };

  const out = $('#scanOut'), input = $('#scanInput');
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const render = () => {
    const text = input.value.trim();
    if (!text) { out.innerHTML = '<span class="idle">› paste a message first…</span>'; return; }
    const { score, hits } = scan(text);
    const level = score >= 55 ? ['HIGH RISK', 'var(--accent)'] : score >= 25 ? ['SUSPICIOUS', 'var(--warn)'] : ['LOOKS SAFE', 'var(--ok)'];
    const reasons = hits.length
      ? hits.map(h => `<li>${esc(h.why)}</li>`).join('')
      : '<li>No known scam patterns matched. Still verify unexpected requests with the sender directly.</li>';
    out.innerHTML = `
      <div class="verdict"><b style="color:${level[1]}">${level[0]}</b><span style="color:var(--dim)">risk ${score}/100</span></div>
      <div class="meter"><i style="background:${level[1]}"></i></div>
      <ul class="reasons">${reasons}</ul>`;
    requestAnimationFrame(() => { $('.meter i', out).style.width = Math.max(score, 4) + '%'; });
  };

  $('#scanBtn').addEventListener('click', render);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) render(); });
  $$('.samples button').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.s; render(); }));
})();
