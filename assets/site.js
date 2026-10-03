/* BUSA website behaviour, shared by every page. Content comes from assets/data.js (window.BUSA_DATA).
   Each feature only runs when its elements are on the page. */
(() => {
  const DATA = window.BUSA_DATA || { products: [], notices: [], centres: [] };
  const ROOT = document.documentElement.dataset.root || '';
  const reduce = document.documentElement.classList.contains('reduce-motion');
  let lang = 'en';
  try { if (localStorage.getItem('busa-lang') === 'ne') lang = 'ne'; } catch (_) {}
  const $ = id => document.getElementById(id);
  const icon = (n, s) => `<svg class="i"${s ? ` style="width:${s}px;height:${s}px"` : ''}><use href="#i-${n}"/></svg>`;
  const href = path => ROOT + path;
  const asset = path => /^https?:/.test(path) ? path : ROOT + path;

  /* ---------- numbers ---------- */
  const fInt = new Intl.NumberFormat('en-IN', {maximumFractionDigits: 0});
  const f2 = new Intl.NumberFormat('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
  const DEV = '०१२३४५६७८९';
  const dev = s => lang === 'ne' ? String(s).replace(/\d/g, d => DEV[d]) : String(s);
  const num = n => dev(fInt.format(Math.round(n)));
  const rs = n => (lang === 'ne' ? 'रु. ' : 'Rs ') + num(n);
  function words(n) {
    for (const [v, en, ne] of [[1e9, 'arba', 'अर्ब'], [1e7, 'crore', 'करोड'], [1e5, 'lakh', 'लाख']]) if (n >= v) {
      const x = (n / v).toFixed(2).replace(/\.?0+$/, '');
      return (lang === 'ne' ? 'रु. ' : 'Rs ') + dev(x) + ' ' + (lang === 'ne' ? ne : en);
    }
    return rs(n);
  }

  /* ---------- products ---------- */
  const P = DATA.products;
  const bySlug = s => P.findIndex(p => p.slug === s);
  const nm = p => lang === 'ne' ? p.ne : p.en;
  const alt = p => lang === 'ne' ? p.en : p.ne;
  const T = {
    seeLeaflet:['See leaflet','पर्चा हेर्नुहोस्'], pa:['per year','वार्षिक'], details:['Details','विवरण'], open:['Membership form','सदस्यता फारम'],
    allSav:['All savings products','सबै बचत उत्पादन'], allLoan:['All loan products','सबै ऋण उत्पादन'], viewRates:['Compare rates','दर तुलना गर्नुहोस्'],
    allSavP:['Every saving product with its rate, from daily and child saving to fixed deposits.','दैनिक, बाल बचतदेखि आवधिक बचतसम्म सबै उत्पादन र दर।'],
    allLoanP:['Every loan product with its rate, from agriculture to housing.','कृषिदेखि आवाससम्म सबै ऋण उत्पादन र दर।'],
    saving:['Saving product','बचत उत्पादन'], loan:['Loan product','ऋण उत्पादन'], noFeat:['The full terms for this product are published on its leaflet. Ask at any service centre for details.','पूरा विवरण पर्चामा छ। थप जानकारीका लागि सेवा केन्द्रमा सोध्नुहोस्।'],
    calc:['Calculate EMI','EMI हिसाब गर्नुहोस्'], apply:['Visit a service centre','सेवा केन्द्रमा जानुहोस्'], page:['Full details','पूरा विवरण'],
    yr:['year','वर्ष'], yrs:['years','वर्ष'], none:['No matching product.','मिल्ने उत्पादन भेटिएन।'],
    pause:['Pause slideshow','स्लाइड रोक्नुहोस्'], play:['Play slideshow','स्लाइड चलाउनुहोस्'], savAcc:['Savings accounts','बचत खाता'], loanProd:['Loan products','ऋण उत्पादन'],
  };
  const t = k => T[k][lang === 'ne' ? 1 : 0];
  const rateTxt = p => p.rate ? dev(p.rate) : t('seeLeaflet');

  /* ---------- mega menu (savings / loans built from data) ---------- */
  function buildMenus() {
    document.querySelectorAll('[data-menu]').forEach(w => {
      const type = w.dataset.menu, list = P.filter(p => p.t === type), per = Math.ceil(list.length / 3);
      let html = '';
      for (let c = 0; c < 3; c++) {
        html += `<div>${c === 0 ? `<h4>${type === 'saving' ? t('savAcc') : t('loanProd')}</h4>` : '<h4>&nbsp;</h4>'}<ul>` +
          list.slice(c * per, (c + 1) * per).map(p => `<li><a href="${href(p.url)}">${nm(p)}<span>${p.rate ? dev(p.rate) : ''}</span></a></li>`).join('') + '</ul></div>';
      }
      const elders = P[bySlug('elders-saving')];
      html += type === 'saving'
        ? `<div class="m-promo"><span>${elders ? nm(elders) : 'Elders saving'}</span><strong>${dev(elders?.rate || '4%')}</strong><p>${lang === 'ne' ? '६० वर्षमाथिका सदस्यका लागि।' : 'For members after the age of 60 years.'}</p><a class="btn btn-primary btn-sm" href="${href('products/savings.html')}" style="align-self:flex-start">${t('viewRates')}</a></div>`
        : `<div class="m-promo"><span>${lang === 'ne' ? 'ऋण लिनुअघि' : 'Plan before you borrow'}</span><strong>EMI</strong><p>${lang === 'ne' ? 'कुनै पनि ऋणको मासिक किस्ता हिसाब गर्नुहोस्।' : 'Work out your monthly instalment for any loan.'}</p><a class="btn btn-primary btn-sm" href="${href('index.html#calc')}" style="align-self:flex-start">${t('calc')}</a></div>`;
      w.innerHTML = html;
    });
  }
  const mega = $('mega'), menuBtn = $('menuBtn');
  const navItems = [...document.querySelectorAll('nav.mega > ul > li')];
  const closeMenus = except => navItems.forEach(li => { if (li !== except) { li.classList.remove('open'); li.querySelector('button.top-link')?.setAttribute('aria-expanded', false); } });
  navItems.forEach(li => {
    const b = li.querySelector('button.top-link'); if (!b) return;
    b.addEventListener('click', () => { const o = !li.classList.contains('open'); closeMenus(li); li.classList.toggle('open', o); b.setAttribute('aria-expanded', o); });
    li.addEventListener('mouseenter', () => { if (matchMedia('(min-width:1181px)').matches) { closeMenus(li); li.classList.add('open'); b.setAttribute('aria-expanded', true); } });
    li.addEventListener('mouseleave', () => { if (matchMedia('(min-width:1181px)').matches) { li.classList.remove('open'); b.setAttribute('aria-expanded', false); } });
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenus(); });
  document.addEventListener('click', e => {
    if (!e.target.closest('nav.mega')) closeMenus();
    if (e.target.closest('.panel-m a') && mega) { closeMenus(); mega.classList.remove('open'); menuBtn?.setAttribute('aria-expanded', false); }
  });
  if (menuBtn && mega) menuBtn.onclick = () => { const o = mega.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', o); };

  /* ---------- search (products) ---------- */
  const searchBar = $('searchBar'), siteSearch = $('siteSearch'), searchResults = $('searchResults'), searchBtn = $('searchBtn');
  const toggleSearch = o => { if (!searchBar) return; searchBar.classList.toggle('open', o); searchBtn.setAttribute('aria-expanded', o); if (o) siteSearch.focus(); };
  if (searchBar) {
    searchBtn.onclick = () => toggleSearch(!searchBar.classList.contains('open'));
    $('searchClose').onclick = () => toggleSearch(false);
    siteSearch.addEventListener('input', () => {
      const q = siteSearch.value.trim().toLowerCase();
      const hits = q ? P.filter(p => (p.en + ' ' + p.ne).toLowerCase().includes(q)).slice(0, 8) : [];
      searchResults.innerHTML = q && !hits.length ? `<li style="padding:8px 0;color:var(--muted)">${t('none')}</li>` :
        hits.map(p => `<li><a href="${href(p.url)}"><span>${nm(p)} <span style="color:var(--muted)">${alt(p)}</span></span><b>${rateTxt(p)}</b></a></li>`).join('');
    });
  }

  /* ---------- notices: ticker + homepage list ---------- */
  const N = DATA.notices;
  const track = $('tickerTrack');
  if (track && N.length) {
    track.innerHTML = N.slice(0, 3).map((n, i) => `<div class="ticker-item${i ? '' : ' on'}"><a href="${href(n.url)}">${n.t}</a><time datetime="${n.d}">${n.label}</time></div>`).join('');
    const tItems = [...track.children]; let tk = 0, tkTimer;
    const tkShow = i => { tItems[tk].classList.remove('on'); tItems[tk].classList.add('out'); const prev = tItems[tk]; setTimeout(() => prev.classList.remove('out'), 520); tk = (i + tItems.length) % tItems.length; tItems[tk].classList.add('on'); };
    const tkPlay = () => { clearInterval(tkTimer); if (!reduce) tkTimer = setInterval(() => tkShow(tk + 1), 5000); };
    $('tkPrev').onclick = () => { tkShow(tk - 1); tkPlay(); }; $('tkNext').onclick = () => { tkShow(tk + 1); tkPlay(); };
    track.addEventListener('mouseenter', () => clearInterval(tkTimer)); track.addEventListener('mouseleave', tkPlay);
    tkPlay();
  }
  if ($('noticeList')) $('noticeList').innerHTML = N.map(n => `<li><a href="${href(n.url)}"><span class="date"><b>${n.mon}</b><span>${n.day}</span></span><span><span class="t">${n.t}</span><span class="m">${n.label}${n.isNew ? '<span class="badge-new">New</span>' : ''}</span></span></a></li>`).join('');

  /* ---------- hero carousel ---------- */
  const slides = [...document.querySelectorAll('.slide')], tabs = [...document.querySelectorAll('#heroTabs [role=tab]:not(.hero-pause)')];
  const hero = document.querySelector('.hero'), pauseBtn = $('heroPause');
  let cur = 0, timer, playing = !reduce; const DUR = 6500;
  function go(i) {
    slides[cur].classList.remove('on'); tabs[cur].setAttribute('aria-selected', false);
    cur = (i + slides.length) % slides.length;
    slides[cur].classList.add('on'); tabs[cur].setAttribute('aria-selected', true);
    const bar = tabs[cur].querySelector('.bar'); bar.style.animation = 'none'; bar.offsetWidth; bar.style.animation = '';
    schedule();
  }
  function schedule() { clearTimeout(timer); if (playing && slides.length) timer = setTimeout(() => go(cur + 1), DUR); }
  function paintPause() { if (!pauseBtn) return; hero.classList.toggle('paused', !playing); pauseBtn.innerHTML = icon(playing ? 'pause' : 'play'); pauseBtn.setAttribute('aria-label', playing ? t('pause') : t('play')); }
  if (hero && slides.length) {
    hero.style.setProperty('--dur', DUR + 'ms');
    tabs.forEach((b, i) => b.onclick = () => go(i));
    pauseBtn.onclick = () => { playing = !playing; paintPause(); schedule(); };
    paintPause(); schedule();
  }

  /* ---------- featured products (homepage) ---------- */
  let featType = 'saving';
  function renderFeatured() {
    const grid = $('featGrid'); if (!grid) return;
    const list = P.filter(p => p.t === featType && p.feat && p.photo).slice(0, 3);
    const total = P.filter(p => p.t === featType).length;
    grid.innerHTML = list.map(p => `
      <article class="pcard">
        <div class="ph"><img src="${asset(p.photo)}" alt="" loading="lazy"></div>
        <div class="bd">
          <h3>${nm(p)}</h3><div class="ne">${alt(p)}</div>
          <div class="rate"><strong>${rateTxt(p)}</strong><span>${p.rate ? t('pa') : ''}</span></div>
          <ul>${p.f.slice(0, 2).map(x => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>
          <div class="act"><a class="btn btn-outline btn-sm" href="${href(p.url)}">${t('details')}</a>
          ${p.r ? `<a class="btn btn-primary btn-sm" href="#calc" data-loan="${p.slug}">${t('calc')}</a>` : `<a class="btn btn-primary btn-sm" href="${href('downloads.html#forms')}">${t('open')}</a>`}</div>
        </div>
      </article>`).join('') + `
      <article class="pcard all">
        <div><h3>${featType === 'saving' ? t('allSav') : t('allLoan')}</h3><p>${featType === 'saving' ? t('allSavP') : t('allLoanP')}</p></div>
        <div class="count">${dev(total)}</div>
        <a class="btn btn-light" href="${href(featType === 'saving' ? 'products/savings.html' : 'products/loans.html')}">${t('viewRates')}</a>
      </article>`;
  }
  document.querySelectorAll('#featTabs button').forEach(b => b.onclick = () => {
    featType = b.dataset.t; document.querySelectorAll('#featTabs button').forEach(x => x.setAttribute('aria-selected', x === b)); renderFeatured(); swap($('featGrid'));
  });

  /* ---------- rate board (homepage + products pages) ---------- */
  let rateType = document.querySelector('[data-rate-default]')?.dataset.rateDefault || 'saving';
  if ($('nS')) { $('nS').textContent = '(' + dev(P.filter(p => p.t === 'saving').length) + ')'; $('nL').textContent = '(' + dev(P.filter(p => p.t === 'loan').length) + ')'; }
  function renderRates() {
    const body = $('rateBody'); if (!body) return;
    body.innerHTML = P.filter(p => p.t === rateType).map(p => `
      <tr><td><strong>${nm(p)}</strong><span>${alt(p)}${p.note ? ', ' + p.note : ''}</span></td>
      <td class="r${p.rate ? '' : ' na'}">${p.rate ? dev(p.rate) : t('seeLeaflet')}</td>
      <td class="d"><button class="linkbtn" type="button" data-open="${p.slug}">${t('details')}</button></td></tr>`).join('');
  }
  function setRateType(type) {
    if (!$('rateBody')) return;
    rateType = type; document.querySelectorAll('#rateTabs button').forEach(x => x.setAttribute('aria-selected', x.dataset.t === type)); renderRates(); swap($('rateBody'));
  }
  document.querySelectorAll('#rateTabs button').forEach(b => b.onclick = () => setRateType(b.dataset.t));

  /* ---------- EMI calculator ---------- */
  const cProduct = $('cProduct'), cAmount = $('cAmount'), cYears = $('cYears'), cAmountN = $('cAmountN'), cYearsN = $('cYearsN');
  const want = {amt: 1000000, yrs: 10};
  const presetLoan = new URLSearchParams(location.search).get('loan');
  function fillLoans() {
    if (!cProduct) return;
    const keep = cProduct.value; cProduct.innerHTML = '';
    P.forEach((p, i) => { if (p.r) cProduct.add(new Option(`${nm(p)}  (${dev(p.rate)})`, i)); });
    const preset = presetLoan && P[bySlug(presetLoan)]?.r ? String(bySlug(presetLoan)) : '';
    cProduct.value = keep || preset || String(bySlug('home-loan'));
  }
  function sync() {
    if (!cProduct) return;
    const p = P[+cProduct.value];
    cAmount.max = p.max; cAmount.min = 50000; cAmount.step = p.max > 5e6 ? 50000 : 10000;
    cAmount.value = Math.min(p.max, Math.max(50000, want.amt));
    cYears.max = p.yrs; cYears.value = Math.min(p.yrs, want.yrs);
    calc();
  }
  function calc() {
    const p = P[+cProduct.value], A = +cAmount.value, n = +cYears.value, r = p.r / 1200, m = n * 12;
    const emi = A * r * Math.pow(1 + r, m) / (Math.pow(1 + r, m) - 1), tot = emi * m;
    if (document.activeElement !== cAmountN) cAmountN.value = num(A);
    if (document.activeElement !== cYearsN) cYearsN.value = dev(n);
    $('aMin').textContent = rs(50000); $('aMax').textContent = words(p.max);
    $('yMin').textContent = dev(1) + ' ' + t('yr'); $('yMax').textContent = dev(p.yrs) + ' ' + t('yrs');
    tween($('oEmi'), emi, rs); tween($('oInt'), tot - A, rs); tween($('oTot'), tot, rs);
    $('oBarP').style.width = (A / tot * 100) + '%'; $('oBarI').style.width = ((tot - A) / tot * 100) + '%';
  }
  const parseNum = s => +String(s).replace(/[०-९]/g, d => DEV.indexOf(d)).replace(/[^\d]/g, '');
  if (cProduct) {
    cProduct.onchange = sync;
    cAmount.oninput = () => { want.amt = +cAmount.value; calc(); };
    cYears.oninput = () => { want.yrs = +cYears.value; calc(); };
    cAmountN.addEventListener('change', () => { want.amt = parseNum(cAmountN.value) || 50000; sync(); cAmountN.value = num(+cAmount.value); });
    cYearsN.addEventListener('change', () => { want.yrs = parseNum(cYearsN.value) || 1; sync(); cYearsN.value = dev(+cYears.value); });
  }

  /* ---------- product quick view (modal) ---------- */
  const pm = $('pm');
  function openProduct(slug) {
    const p = P[bySlug(slug)]; if (!p || !pm) return;
    $('pmBody').innerHTML = `
      <div class="k">${p.t === 'loan' ? t('loan') : t('saving')}</div>
      <h3 id="pmTitle">${nm(p)}</h3><div class="ne">${alt(p)}</div>
      <div class="pm-rate"><strong>${p.rate ? dev(p.rate) : '—'}</strong><span>${p.rate ? (p.note ? p.note + ', ' : '') + t('pa') : t('seeLeaflet')}</span></div>
      ${p.f.length ? `<ul>${p.f.map(x => `<li>${icon('check')}<span>${x}</span></li>`).join('')}</ul>` : `<p>${t('noFeat')}</p>`}
      <div class="acts"><a class="btn btn-primary" href="${href(p.url)}">${t('page')}</a>
      ${p.r ? `<a class="btn btn-outline" href="${$('calc') ? '#calc' : href('index.html?loan=' + p.slug + '#calc')}" data-loan="${p.slug}">${t('calc')}</a>` : ''}
      <a class="btn btn-outline" href="${href('contact.html')}">${t('apply')}</a></div>`;
    $('pmLeaf').innerHTML = p.img ? `<img src="${p.img}" alt="${p.en} leaflet" loading="lazy">` : '';
    pm.querySelector('.pm-in').style.gridTemplateColumns = p.img ? '' : '1fr';
    pm.showModal();
  }
  pm?.addEventListener('click', e => { if (e.target === pm) pm.close(); });

  /* ---------- photo viewer (galleries, reports, leaflets) ---------- */
  let lb = null;
  function openPhoto(src, cap) {
    if (!lb) {
      lb = document.createElement('dialog'); lb.className = 'lb';
      lb.innerHTML = `<button type="button" class="icon-btn lb-x" aria-label="Close">${icon('x')}</button><img alt=""><p></p>`;
      document.body.appendChild(lb);
      lb.querySelector('.lb-x').onclick = () => lb.close();
      lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
    }
    lb.querySelector('img').src = src; lb.querySelector('img').alt = cap || '';
    lb.querySelector('p').textContent = cap || '';
    lb.showModal();
  }

  /* delegated actions */
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); toggleSearch(false); closeMenus(); openProduct(o.dataset.open); return; }
    const g = e.target.closest('[data-full]');
    if (g && (g.tagName === 'BUTTON' || g.tagName === 'A')) { e.preventDefault(); openPhoto(g.dataset.full, g.dataset.cap); return; }
    const l = e.target.closest('[data-loan]');
    if (l && cProduct) { if (pm?.open) pm.close(); cProduct.value = String(bySlug(l.dataset.loan)); sync(); }
    const q = e.target.closest('[data-q="loan"]'); if (q) setRateType('loan');
  });

  /* ---------- financial ticker: count-up + cursor spotlight ---------- */
  function renderKpis(k = 1) {
    document.querySelectorAll('[data-amt]').forEach(el => el.textContent = words(+el.dataset.amt * k));
    document.querySelectorAll('[data-full]:not(button):not(a)').forEach(el => el.textContent = (lang === 'ne' ? 'रु. ' : 'Rs ') + dev(f2.format(+el.dataset.full)));
    document.querySelectorAll('[data-count]').forEach(el => el.textContent = num(+el.dataset.count * k));
  }
  if ($('financials')) {
    renderKpis(1);
    let counted = false;
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (!e.isIntersecting || counted) return; counted = true; ob.disconnect();
      if (reduce) return;
      const t0 = performance.now(), D = 1300;
      const step = now => { const k = Math.min(1, (now - t0) / D); renderKpis(1 - Math.pow(1 - k, 3)); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), {threshold: .3}).observe($('financials'));
  }
  const gBar = $('gBar');
  gBar?.addEventListener('mousemove', e => {
    const r = gBar.getBoundingClientRect();
    gBar.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    gBar.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  /* ---------- service centre locator ---------- */
  const C = DATA.centres;
  let cSel = 0;
  function renderLoc() {
    if (!$('locList')) return;
    $('locList').innerHTML = C.map((c, i) => `<li><button type="button" aria-current="${i === cSel}" data-c="${i}"><span class="pin">${icon('pin')}</span><strong>${lang === 'ne' ? c.ne : c.en}</strong><span>${c.a}</span><span class="tel">${c.tel.join(', ')}</span></button></li>`).join('');
    $('locList').querySelectorAll('button').forEach(b => b.onclick = () => { cSel = +b.dataset.c; renderLoc(); });
    const c = C[cSel], src = c.map || `https://maps.google.com/maps?q=${encodeURIComponent(c.q)}&z=15&output=embed`;
    if ($('locMap').src !== src) $('locMap').src = src;
    $('locInfo').innerHTML = `<div>${lang === 'ne' ? 'फोन' : 'Phone'}<b>${c.tel.map(x => `<a href="tel:${x.replace(/-/g, '')}">${x}</a>`).join(', ')}</b></div>` +
      (c.mail ? `<div>${lang === 'ne' ? 'इमेल' : 'Email'}<b><a href="mailto:${c.mail}">${c.mail}</a></b></div>` : '') +
      (c.head ? `<div>${lang === 'ne' ? 'प्रमुख' : 'In charge'}<b>${c.head}</b></div>` : '') +
      `<div>${lang === 'ne' ? 'दिशा' : 'Directions'}<b><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.q || 'Budol Samudayik SACCOS Banepa')}" target="_blank" rel="noopener">${lang === 'ne' ? 'नक्सामा खोल्नुहोस्' : 'Open in Google Maps'}</a></b></div>`;
  }

  /* ---------- language (remembered across pages) ---------- */
  document.querySelectorAll('[data-ne]').forEach(el => el.dataset.en = el.textContent);
  function setLang(l, save = true) {
    lang = l; document.documentElement.lang = l;
    if (save) { try { localStorage.setItem('busa-lang', l); } catch (_) {} }
    document.querySelectorAll('.lang button').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === l));
    document.querySelectorAll('[data-ne]').forEach(el => el.textContent = l === 'ne' ? el.dataset.ne : el.dataset.en);
    buildMenus(); renderFeatured(); renderRates(); fillLoans(); sync(); if ($('financials')) renderKpis(); renderLoc(); paintPause();
    window.BUSAFeedback?.setLang(l);
  }
  document.querySelectorAll('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));

  /* ---------- header shadow, scroll progress, back to top ---------- */
  const hdr = $('siteHeader'), toTop = $('toTop'), progress = $('progress');
  let ticking = false;
  function onScroll() {
    ticking = false;
    hdr?.classList.toggle('scrolled', scrollY > 10);
    toTop?.classList.toggle('show', scrollY > 900);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress?.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max) : 0);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, {passive: true});
  if (toTop) toTop.onclick = () => scrollTo({top: 0, behavior: reduce ? 'auto' : 'smooth'});

  /* ---------- motion helpers ---------- */
  // Replays the stagger-in animation on a container's children after a tab switch.
  function swap(el) {
    if (reduce || !el) return;
    [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
    el.classList.remove('swap'); void el.offsetWidth; el.classList.add('swap');
  }
  // Counts a figure from its previous value to the new one.
  function tween(el, to, fmt) {
    const from = el._v; el._v = to;
    cancelAnimationFrame(el._raf);
    if (reduce || from === undefined || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now(), D = 420;
    const step = now => {
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) el._raf = requestAnimationFrame(step);
    };
    el._raf = requestAnimationFrame(step);
  }

  /* ---------- scroll reveal ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('motion');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; el.classList.add('in'); io.unobserve(el);
      // drop the reveal styles once finished so hover transforms respond instantly
      setTimeout(() => { el.removeAttribute('data-reveal'); el.style.removeProperty('--d'); }, 1400);
    }), {threshold: .12, rootMargin: '0px 0px -40px 0px'});
    [['.quick li', 70], ['.sec-head', 0], ['.pgrid', 0], ['.re-grid > .card', 140], ['.g-bar', 0],
     ['.benefit', 80], ['.ucol', 120], ['.leader', 140], ['.loc-grid', 0], ['.officer', 120],
     ['.trust-grid > div:first-child', 0], ['.award', 90], ['.affil', 70], ['.f-top > div', 90],
     ['.person', 40], ['.page-main > .card', 100], ['.affil-row', 70], ['.vm', 120]]
      .forEach(([sel, step]) => document.querySelectorAll(sel).forEach(el => {
        const idx = Math.min([...el.parentElement.children].indexOf(el), 8);
        el.setAttribute('data-reveal', ''); el.style.setProperty('--d', (step * idx) + 'ms'); io.observe(el);
      }));
  }

  if (lang === 'ne') setLang('ne', false);
  else { buildMenus(); renderFeatured(); renderRates(); fillLoans(); sync(); renderLoc(); }
  onScroll();
  if (presetLoan && $('calc')) setTimeout(() => $('calc').scrollIntoView({behavior: 'auto', block: 'start'}), 50);
})();
