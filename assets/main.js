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

  addEventListener('keydown', e => { if (e.key === 'Escape' && header.classList.contains('open')) setMenu(false); });

  /* ── What I do: accordion cards ── */
  $$('.wid').forEach(card => {
    const btn = $('.wid-head', card);
    btn.addEventListener('click', () => {
      const open = !card.classList.contains('open');
      $$('.wid').forEach(c => { c.classList.remove('open'); $('.wid-head', c).setAttribute('aria-expanded', 'false'); });
      card.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
    });
  });

  /* ── Cursor dot: trails the pointer, grows over anything clickable ── */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
    const dot = document.createElement('div');
    dot.className = 'cursor';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('pointermove', e => {
      mx = e.clientX; my = e.clientY;
      dot.classList.add('on');
      dot.classList.toggle('big', !!e.target.closest('a, button, .tiles li, textarea, .w-card'));
    }, { passive: true });
    document.addEventListener('pointerleave', () => dot.classList.remove('on'));
    const follow = () => {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      dot.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(follow);
    };
    requestAnimationFrame(follow);
  }

  /* ── Tech stack: tiles pop in one by one ── */
  const tiles = $('#tiles');
  if (tiles) {
    $$('li', tiles).forEach((li, n) => li.style.setProperty('--n', n));
    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { tiles.classList.add('in'); obs.disconnect(); }
    }, { threshold: 0.15 }).observe(tiles);
  }

  /* ── Tech stack: rotating wireframe globe with drifting particles ── */
  const bg = $('#stackBg');
  if (bg) {
    const g = bg.getContext('2d');
    const pts = [];
    const N = 260;
    for (let i = 0; i < N; i++) {                       // Fibonacci sphere
      const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    const dust = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), s: 0.4 + Math.random() * 1.4, v: 0.02 + Math.random() * 0.05 }));
    let size = 0, running = false, rot = 0, lastT = 0;
    const fitBg = () => {
      const r = bg.getBoundingClientRect(), dpr = Math.min(devicePixelRatio, 2);
      size = r.width; bg.width = r.width * dpr; bg.height = r.height * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const draw = now => {
      if (!running) return;
      const dt = Math.min((now - lastT) / 1000, 0.05) || 0; lastT = now;
      rot += dt * 0.12;
      const R = size * 0.36, c = size / 2;
      g.clearRect(0, 0, size, size);
      const cs = Math.cos(rot), sn = Math.sin(rot), tilt = 0.35, ct = Math.cos(tilt), st = Math.sin(tilt);
      const proj = pts.map(([x, y, z]) => {
        const x1 = x * cs - z * sn, z1 = x * sn + z * cs;
        const y2 = y * ct - z1 * st, z2 = y * st + z1 * ct;
        return [c + x1 * R, c + y2 * R, z2];
      });
      // links between near neighbours
      g.lineWidth = 0.6;
      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < Math.min(i + 22, proj.length); j++) {
          const a = proj[i], b = proj[j];
          const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (d > R * 0.24) continue;
          const depth = (a[2] + b[2]) / 2;
          g.strokeStyle = `rgba(178,140,255,${(0.05 + (depth + 1) * 0.11).toFixed(3)})`;
          g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        }
      }
      proj.forEach(([x, y, z]) => {
        g.fillStyle = `rgba(214,196,255,${(0.15 + (z + 1) * 0.35).toFixed(3)})`;
        g.beginPath(); g.arc(x, y, 0.8 + (z + 1) * 0.8, 0, Math.PI * 2); g.fill();
      });
      dust.forEach(p => {
        p.y -= p.v * dt; if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        g.fillStyle = 'rgba(230,215,255,.55)';
        g.beginPath(); g.arc(p.x * size, p.y * size, p.s, 0, Math.PI * 2); g.fill();
      });
      requestAnimationFrame(draw);
    };
    fitBg();
    addEventListener('resize', fitBg);
    new IntersectionObserver(([e]) => {
      const was = running;
      running = e.isIntersecting && !reduceMotion;
      if (running && !was) { lastT = performance.now(); requestAnimationFrame(draw); }
      if (reduceMotion && e.isIntersecting) { running = true; draw(performance.now()); running = false; }
    }).observe(bg);
  }

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
