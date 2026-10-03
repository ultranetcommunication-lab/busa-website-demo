/*
 * BUSA admin panel mockup: a clickable preview of the planned Laravel + Filament admin.
 * Reads the demo website's data (../../assets/data.js) plus admin-data.js.
 * Edits are kept in this browser (localStorage) and never change the demo website.
 * Feedback sent from the demo website in the same browser shows up in the inbox.
 */
(function () {
  'use strict';
  const D = window.BUSA_DATA || { products: [], notices: [], centres: [] };
  const A = window.BUSA_ADMIN || { team: [], docs: [], albums: [], pages: [], slides: [] };
  const SITE = '../../';
  const LOGO = 'https://budol.coop.np/wp-content/themes/busa/images/logo.jpg';
  const KEY = 'busa-admin-demo';
  const FB_KEY = 'busa-feedback';

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, c = '') => `<svg class="ic ${c}" aria-hidden="true"><use href="#h-${n}"/></svg>`;
  const fInt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const f2 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fDate = d => { const x = new Date(d); return `${x.getDate()} ${MON[x.getMonth()]} ${x.getFullYear()}`; };
  const fDT = d => { const x = new Date(d), h = x.getHours(); return `${fDate(x)}, ${h % 12 || 12}:${String(x.getMinutes()).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`; };
  const todayISO = () => new Date().toISOString().slice(0, 10);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : (many || one + 's')}`;
  const isNe = s => /[ऀ-ॿ]/.test(s || '');
  const abs = u => !u ? '' : /^(https?:|data:|blob:)/.test(u) ? u : SITE + u;
  const slugify = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const clip = (s, n) => (s = String(s || '')).length > n ? s.slice(0, n - 1) + '…' : s;
  function ago(d) {
    const s = (Date.now() - new Date(d)) / 1000;
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return plural(Math.floor(s / 3600), 'hour') + ' ago';
    const days = Math.floor(s / 86400);
    return days === 1 ? 'yesterday' : days + ' days ago';
  }
  function words(n) {
    for (const [v, w] of [[1e9, 'arba'], [1e7, 'crore'], [1e5, 'lakh']]) if (n >= v) return 'Rs ' + (n / v).toFixed(2).replace(/\.?0+$/, '') + ' ' + w;
    return 'Rs ' + fInt.format(Math.round(n));
  }
  const initials = n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  /* ---------------- state ---------------- */
  const fresh = () => ({ role: 'manager', signedIn: true, prod: {}, rec: {}, added: {}, fb: {}, log: [], hl: null });
  let S = fresh();
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (_) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (_) {} };

  const ROLES = {
    manager: { label: 'Manager', name: 'Website manager', can: '*', desc: 'Everything, including interest rates, financial highlights, staff logins and the activity log.' },
    editor: { label: 'Content editor', name: 'Content editor', can: ['dashboard', 'products', 'slides', 'pages', 'notices', 'albums', 'documents', 'team', 'centres', 'vacancies'], desc: 'Products (but not their rates), slides, pages, notices, photos, documents, team members, service centres and vacancies.' },
    grievance: { label: 'Grievance officer', name: 'Umesh Acharya', can: ['dashboard', 'feedback'], desc: 'The feedback inbox: assign, reply, add notes and resolve.' },
  };
  const me = () => ROLES[S.role] || ROLES.manager;
  const can = k => me().can === '*' || me().can.includes(k);
  const isMgr = () => S.role === 'manager';

  /* ---------------- data ---------------- */
  A.team.forEach((r, i) => { r._id = 'm' + (i + 1); });
  A.docs.forEach((r, i) => { r._id = 'd' + (i + 1); });
  A.albums.forEach(r => { r._id = r.slug; });
  A.pages.forEach((r, i) => { r._id = 'p' + (i + 1); });
  A.slides.forEach((r, i) => { r._id = 's' + (i + 1); r.order = i + 1; r.active = true; });
  D.notices.forEach(r => { r._id = r.id; r.ticker = true; });
  D.centres.forEach((r, i) => { r._id = 'c' + (i + 1); r.tels = (r.tel || []).join(', '); });

  const OLD_RATE = { 'home-loan': '10.5%', 'business-loan': '9.5%', 'necessity-loan': '11.5%' };
  const IMPORTED = '2026-10-03T08:40:00';
  const SEED_LOG = [
    ...Object.entries(OLD_RATE).map(([slug, old], i) => {
      const p = D.products.find(x => x.slug === slug) || { en: slug, rate: '' };
      return { at: '2026-10-03T08:4' + (3 - i) + ':00', who: 'System', icon: 'banknotes', what: `Set the ${p.en} rate to ${p.rate} (was ${old}) from the September 2026 leaflet` };
    }),
    { at: IMPORTED, who: 'System', icon: 'arrow-path', what: `Imported ${D.products.length} products, ${D.notices.length} notices, ${A.docs.length} documents, ${A.team.length} team members and ${A.albums.length} photo albums from budol.coop.np` },
  ];
  function log(what, icon = 'pencil-square') {
    S.log.unshift({ at: new Date().toISOString(), who: me().name, what, icon });
    S.log = S.log.slice(0, 100);
    save();
  }
  const allLog = () => [...S.log, ...SEED_LOG];

  /* products */
  function products() {
    const base = D.products.map(p => Object.assign({}, p, S.prod[p.slug] || {}));
    const added = Object.values(S.prod).filter(p => p._new);
    return [...added, ...base].filter(p => !p._deleted);
  }
  const product = slug => products().find(p => p.slug === slug);
  // Overrides are stored under the product's original web address, even after it is renamed.
  const pkey = slug => Object.keys(S.prod).find(k => S.prod[k] && S.prod[k].slug === slug && !S.prod[k]._deleted) || slug;
  const hasCalc = p => p.t === 'loan' && p.calc !== false && p.r != null;
  function rateRows(p) {
    const key = pkey(p.slug), base = D.products.find(x => x.slug === key);
    const hist = (S.prod[key] && S.prod[key]._hist) || [];
    const rows = hist.slice().reverse().map(h => ({ rate: h.rate, from: h.from, by: h.by, src: 'Changed in the admin panel', at: h.at }));
    if (base) {
      rows.push({ rate: base.rate, from: base.img ? 'Sep 2026' : 'Not stated', by: 'Imported', src: base.img ? 'Product leaflet, September 2026' : 'Product page on budol.coop.np' });
      if (OLD_RATE[base.slug]) rows.push({ rate: OLD_RATE[base.slug], from: 'Before Sep 2026', by: 'Imported', src: 'Earlier text on the budol.coop.np product page' });
    }
    return rows;
  }

  /* feedback */
  const TYPES = { suggestion: ['Suggestion', 'bd-i'], complaint: ['Complaint', 'bd-d'], praise: ['Appreciation', 'bd-p'], website: ['Website issue', 'bd-w'] };
  const ty = t => TYPES[t] || ['Feedback', ''];
  const tyBadge = t => `<span class="bd ${ty(t)[1]}">${ty(t)[0]}</span>`;
  const STATUS = { new: ['New', 'bd-w'], progress: ['In progress', 'bd-i'], resolved: ['Resolved', 'bd-p'] };
  const STAFF = [['', 'Unassigned'], ['Umesh Acharya', 'Umesh Acharya, grievance officer'], ['Ranjana Suwal', 'Ranjana Suwal, information officer']];
  const H = 36e5, NOW = Date.now();
  const stamp = d => { const x = new Date(d), p = n => String(n).padStart(2, '0'); return `${x.getFullYear()}${p(x.getMonth() + 1)}${p(x.getDate())}`; };
  const SAMPLE_FB = [
    { id: 'fb-s1', code: 6105, hrs: 2, type: 'suggestion', lang: 'ne', rating: 4, centre: 'Head office, Budol', reply: true, name: 'Ram Bahadur Karki', contact: '9800000061', member: '',
      message: 'बाल बचत खाताको मौज्दात मोबाइलबाटै हेर्न मिल्ने व्यवस्था गरिदिनुहोस्। अभिभावकलाई धेरै सजिलो हुन्छ।' },
    { id: 'fb-s2', code: 2290, hrs: 6, type: 'website', lang: 'en', rating: 3, centre: 'This website', reply: false,
      message: 'The monthly report images are hard to read on a phone. Could you also share them as PDF files?' },
    { id: 'fb-s3', code: 4821, hrs: 30, type: 'complaint', lang: 'ne', rating: 2, centre: 'Dhulikhel', reply: true, name: 'Sarita Shrestha', contact: '9800000012', member: '',
      message: 'धुलिखेल सेवा केन्द्रमा बिहान लामो लाइन थियो। ऋणको किस्ता तिर्न एक घण्टाभन्दा बढी कुर्नुपर्‍यो। टोकन प्रणाली राखिदिनुहोला।' },
    { id: 'fb-s4', code: 7364, hrs: 52, type: 'complaint', lang: 'en', rating: 2, centre: 'Banepa, Char Dobato', reply: true, name: 'Anita Gurung', contact: 'anita.gurung@example.com', member: '',
      message: 'I applied for a necessity loan two weeks ago and have not heard back. Who should I contact about it?',
      status: 'progress', assignee: 'Umesh Acharya',
      events: [{ type: 'assign', who: 'Website manager', to: 'Umesh Acharya', hrs: 50 },
        { type: 'reply', who: 'Umesh Acharya', channel: 'Email', hrs: 47, text: 'Hello Anita, thank you for your message. Your application is with the loan sub-committee and we will call you this week. Budol Samudayik SACCOS' }] },
    { id: 'fb-s5', code: 1937, hrs: 76, type: 'suggestion', lang: 'en', rating: 4, centre: 'This website', reply: true, name: 'Bikash Tamang', contact: '9800000034', member: '',
      message: 'Can members pay loan instalments by QR code or mobile banking? Please add this information to the website.',
      status: 'progress', assignee: 'Ranjana Suwal',
      events: [{ type: 'assign', who: 'Website manager', to: 'Ranjana Suwal', hrs: 72 },
        { type: 'note', who: 'Ranjana Suwal', hrs: 60, text: 'Checking with the IT sub-committee which payment options we can list on the contact page.' }] },
    { id: 'fb-s6', code: 5548, hrs: 120, type: 'praise', lang: 'ne', rating: 5, centre: 'Tukucha Jagaran, Nala', reply: false,
      message: 'टुकुचा जागरण सेवा केन्द्रका कर्मचारीले शिक्षा ऋणको कागजात मिलाउन धेरै सहयोग गर्नुभयो। धन्यवाद!',
      status: 'resolved', events: [{ type: 'note', who: 'Website manager', hrs: 111, text: 'Shared with the Tukucha Jagaran team.' }, { type: 'status', who: 'Website manager', to: 'resolved', hrs: 110 }] },
    { id: 'fb-s7', code: 3072, hrs: 220, type: 'praise', lang: 'en', rating: 5, centre: 'Head office, Budol', reply: false,
      message: 'The senior member honouring programme was very well organised. My father enjoyed it a lot.',
      status: 'resolved', events: [{ type: 'status', who: 'Website manager', to: 'resolved', hrs: 200 }] },
  ].map(f => {
    const createdAt = new Date(NOW - f.hrs * H).toISOString();
    return Object.assign({}, f, { createdAt, ref: `FB-${stamp(createdAt)}-${f.code}`, sample: true,
      events: (f.events || []).map(e => Object.assign({}, e, { at: new Date(NOW - e.hrs * H).toISOString() })) });
  });
  function siteFb() {
    try { return JSON.parse(localStorage.getItem(FB_KEY) || '[]').filter(r => r && r.ref).map(r => Object.assign({}, r, { id: r.ref, src: 'site', events: [] })); }
    catch (_) { return []; }
  }
  function feedback() {
    return [...siteFb(), ...SAMPLE_FB].map(f => {
      const o = S.fb[f.id] || {};
      return Object.assign({}, f, { status: o.status || f.status || 'new', assignee: o.assignee ?? f.assignee ?? '', events: [...(f.events || []), ...(o.events || [])] });
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  const replied = f => f.events.some(e => e.type === 'reply');
  const dueOf = f => (f.type === 'complaint' || f.reply) ? new Date(new Date(f.createdAt).getTime() + (f.type === 'complaint' ? 3 : 5) * 864e5) : null;
  const waiting = f => f.status !== 'resolved' && !replied(f) && !!dueOf(f);
  function fbState(id) { return (S.fb[id] = S.fb[id] || { events: [] }); }
  function pushEv(id, ev) { fbState(id).events.push(Object.assign({ at: new Date().toISOString(), who: me().name }, ev)); save(); }

  /* financial highlights (from the homepage ticker) */
  const HL = [
    { k: 'assets', en: 'Total assets', ne: 'कुल सम्पत्ति', v: 2358392923.58, kind: 'amt' },
    { k: 'savings', en: 'Total savings', ne: 'कुल बचत', v: 1905670500, kind: 'amt' },
    { k: 'capital', en: 'Institutional capital', ne: 'संस्थागत पूँजी', v: 198637082.70, kind: 'amt' },
    { k: 'share', en: 'Share capital', ne: 'सेयर पूँजी', v: 146275300, kind: 'amt' },
    { k: 'members', en: 'Members', ne: 'कुल सदस्य', v: 19908, kind: 'count', d: '11,056 women, 8,834 men', dn: 'महिला ११,०५६, पुरुष ८,८३४' },
    { k: 'child', en: 'Child savers', ne: 'बाल बचतकर्ता', v: 8261, kind: 'count', d: 'child saving accounts', dn: 'बाल बचत खाता' },
  ];

  /* ---------------- generic resources ---------------- */
  const GROUPS = ['Board of directors', 'Supervisory committee', 'Advisors', 'Sub-committees', 'Staff'];
  const COMMITTEES = [...new Set(A.team.map(m => m.sub).filter(Boolean))];
  const DOC_PAGES = [...new Set(A.docs.map(d => d.page))];
  const CENTRE_NAMES = D.centres.map(c => c.en);
  const thumb = (src, icon = 'photo', round = false) => src
    ? `<img class="thumb${round ? ' round' : ''}" src="${esc(abs(src))}" alt="" loading="lazy">`
    : `<span class="thumb ph${round ? ' round' : ''}">${ic(icon)}</span>`;
  const pub = '<span class="bd bd-p">Published</span>';

  const RES = {
    slides: {
      title: 'Homepage slides', single: 'slide', newLabel: 'New slide', base: () => A.slides, name: r => r.title, sort: (a, b) => (a.order || 99) - (b.order || 99),
      sub: 'The large rotating banner at the top of the homepage, shown in this order.',
      search: r => `${r.kicker} ${r.title} ${r.text}`,
      table: { per: 25, cols: [
        { h: 'Order', w: '64px', c: r => `<span class="num">${r.order || '—'}</span>` },
        { h: '', w: '64px', sr: 'Image', c: r => thumb(r.img) },
        { h: 'Headline', c: r => `<b>${esc(r.title)}</b><span class="t2">${esc(r.kicker)}</span>` },
        { h: 'Text', c: r => `<span class="clip2">${esc(r.text)}</span>` },
        { h: 'Status', c: r => r.active ? '<span class="bd bd-p">Showing</span>' : '<span class="bd">Hidden</span>' },
      ] },
      fields: () => [
        { k: 'kicker', label: 'Label', hint: 'The small label above the headline, usually the product name.' },
        { k: 'order', label: 'Position', type: 'number', min: 1, hint: '1 shows first.' },
        { k: 'title', label: 'Headline', req: true, span: 1 },
        { k: 'text', label: 'Text', type: 'textarea', rows: 3, span: 1 },
        { k: 'img', label: 'Image', type: 'file', span: 1, hint: 'Landscape photo, at least 1200 pixels wide.' },
        { k: 'active', label: 'Show this slide', type: 'toggle' },
      ],
      blank: () => ({ kicker: '', title: '', text: '', img: '', active: true, order: A.slides.length + 1 }),
    },
    pages: {
      title: 'Pages', single: 'page', newLabel: 'New page', base: () => A.pages, name: r => r.title, site: r => r.path,
      sub: 'Text pages such as About, the messages from the chairman and CEO, and the member services.',
      search: r => `${r.title} ${r.ne} ${r.path}`,
      table: {
        per: 25,
        tabs: [['all', 'All', () => true], ['about', 'About', r => r.section === 'About'], ['svc', 'Member services', r => r.section === 'Member services'], ['other', 'Other', r => r.section === 'Other']],
        cols: [
          { h: 'Title', c: r => `<b>${esc(r.title)}</b>${r.ne ? `<span class="t2 ne">${esc(r.ne)}</span>` : ''}` },
          { h: 'Section', c: r => `<span class="bd">${esc(r.section)}</span>` },
          { h: 'Web address', c: r => `<span class="t2" style="margin:0">/${esc(r.path)}</span>` },
          { h: 'Status', c: () => pub },
        ],
      },
      fields: r => [
        { k: 'title', label: 'Title (English)', req: true },
        { k: 'ne', label: 'Title (Nepali)', ne: true },
        { k: 'section', label: 'Section', type: 'select', opts: ['About', 'Member services', 'Other'] },
        { k: 'path', label: 'Web address', pre: 'budol.coop.np/', dis: !!r.path, hint: r.path ? 'Fixed after the page is published, so saved links keep working.' : '' },
        { k: 'body', label: 'Content', type: 'rich', span: 1, src: r.path },
      ],
      blank: () => ({ title: '', ne: '', section: 'About', path: '' }),
    },
    notices: {
      title: 'Notices', single: 'notice', newLabel: 'New notice', base: () => D.notices, name: r => r.t, site: r => r.url,
      sub: 'Shown in the notice ticker, on the homepage and on the News page.',
      search: r => `${r.t} ${r.en || ''}`,
      table: { cols: [
        { h: '', w: '64px', sr: 'Image', c: r => thumb(r.img, 'megaphone') },
        { h: 'Title', c: r => `<span class="ne clip2">${esc(r.t)}</span>${r.en ? `<span class="t2">${esc(r.en)}</span>` : ''}` },
        { h: 'Published', c: r => `<span class="num">${fDate(r.d)}</span>` },
        { h: 'Labels', c: r => [r.isNew ? '<span class="bd bd-w">New</span>' : '', r.ticker ? '<span class="bd">In ticker</span>' : ''].join(' ') || '—' },
        { h: 'Status', c: () => pub },
      ] },
      fields: () => [
        { k: 't', label: 'Title (Nepali)', type: 'textarea', rows: 2, req: true, ne: true, span: 1 },
        { k: 'en', label: 'Title (English)', hint: 'Optional. Shown when a visitor switches the site to English.', span: 1 },
        { k: 'd', label: 'Publish date', type: 'date', req: true },
        { k: 'img', label: 'Notice image or PDF', type: 'file', acc: 'pdf' },
        { k: 'isNew', label: 'Show the New label', type: 'toggle', hint: 'Draws attention to recent notices.' },
        { k: 'ticker', label: 'Show in the notice ticker', type: 'toggle', hint: 'The scrolling bar under the menu.' },
      ],
      blank: () => ({ t: '', en: '', d: todayISO(), img: '', isNew: true, ticker: true }),
    },
    albums: {
      title: 'Photo albums', single: 'album', newLabel: 'New album', base: () => A.albums, name: r => r.title, site: r => r.slug ? `media/gallery/${r.slug}.html` : '',
      search: r => r.title,
      table: { grid: r => `${r.cover ? `<img src="${esc(abs(r.cover))}" alt="" loading="lazy">` : `<span class="thumb ph" style="width:100%;height:auto;aspect-ratio:4/3;border-radius:0">${ic('photo', 'ic-lg')}</span>`}<div><b>${esc(r.title)}</b><small>${plural(r.count || 0, 'photo')}</small></div>` },
      fields: r => [
        { k: 'title', label: 'Album title', req: true, span: 1 },
        { k: 'photos', label: 'Photos', type: 'photos', span: 1, slug: r.slug },
      ],
      blank: () => ({ title: '', count: 0 }),
    },
    documents: {
      title: 'Reports and forms', single: 'document', newLabel: 'Upload document', base: () => A.docs, name: r => r.title,
      sub: 'Annual and monthly reports, BUSA Darpan, forms and general assembly decisions.',
      search: r => `${r.title} ${r.cat} ${r.page}`,
      table: {
        tabs: [['all', 'All', () => true], ...DOC_PAGES.map(p => [slugify(p), p.replace('General assembly decisions', 'Assembly decisions'), r => r.page === p])],
        cols: [
          { h: '', w: '64px', sr: 'File', c: r => r.kind === 'JPG' ? thumb(r.href) : `<span class="thumb ph">${ic('document-text')}</span>` },
          { h: 'Title', c: r => `<b class="${isNe(r.title) ? 'ne' : ''}">${esc(r.title)}</b><span class="t2">${esc(r.cat)}</span>` },
          { h: 'Type', c: r => `<span class="bd ${r.kind === 'PDF' ? 'bd-d' : 'bd-i'}">${esc(r.kind)}</span>` },
          { h: '', cls: 'r', sr: 'Open', c: r => `<a class="lnk" href="${esc(r.href)}" target="_blank" rel="noopener">${ic('arrow-top-right-on-square', 'ic-sm')}Open</a>` },
        ],
      },
      fields: () => [
        { k: 'title', label: 'Title', req: true },
        { k: 'page', label: 'Shown on', type: 'select', opts: DOC_PAGES },
        { k: 'cat', label: 'Group', hint: 'For example FY 083/084. Documents are grouped by this on the page.' },
        { k: 'href', label: 'File', type: 'file', acc: 'pdf', req: true },
      ],
      blank: () => ({ title: '', page: 'Monthly reports', cat: 'Monthly reports FY 083/084', href: '', kind: 'PDF' }),
    },
    team: {
      title: 'Team members', single: 'team member', newLabel: 'New team member', base: () => A.team, name: r => r.name,
      sub: 'The board, committees, advisors and staff shown on the Our team pages.',
      search: r => `${r.name} ${r.role} ${r.sub} ${r.addr} ${r.tel}`,
      table: {
        tabs: [['all', 'All', () => true], ...GROUPS.map(g => [slugify(g), g, r => r.group === g])],
        cols: [
          { h: '', w: '60px', sr: 'Photo', c: r => thumb(r.img, 'user', true) },
          { h: 'Name', c: r => `<b>${esc(r.name)}</b><span class="t2">${esc(r.role)}</span>` },
          { h: 'Committee', c: r => r.sub ? esc(r.sub.replace(/ Sub-Committee$/i, '')) : '<span style="color:var(--faint)">—</span>' },
          { h: 'Phone', c: r => `<span class="num">${esc(r.tel)}</span>` },
          { h: 'Address', c: r => esc(r.addr) },
        ],
      },
      fields: r => [
        { k: 'img', label: 'Photo', type: 'file', span: 1, hint: 'Square photo works best.' },
        { k: 'name', label: 'Full name', req: true },
        { k: 'role', label: 'Role', req: true, hint: 'For example President, Member or Branch head.' },
        { k: 'group', label: 'Group', type: 'select', opts: GROUPS },
        { k: 'sub', label: 'Committee', type: 'select', opts: [['', 'None'], ...COMMITTEES.map(c => [c, c])], hint: 'Only for sub-committee members.' },
        { k: 'tel', label: 'Phone', mode: 'tel' },
        { k: 'addr', label: 'Address' },
      ],
      blank: () => ({ name: '', role: '', group: 'Staff', sub: '', tel: '', addr: '', img: '' }),
    },
    centres: {
      title: 'Service centres', single: 'service centre', newLabel: 'New service centre', base: () => D.centres, name: r => r.en,
      sub: 'Addresses and contacts shown on the Contact page and the homepage locator.',
      search: r => `${r.en} ${r.ne} ${r.a} ${r.tels} ${r.head}`,
      table: { per: 25, cols: [
        { h: 'Name', c: r => `<b>${esc(r.en)}</b><span class="t2 ne">${esc(r.ne)}</span>` },
        { h: 'Address', c: r => esc(r.a) },
        { h: 'Phone', c: r => `<span class="num">${esc(r.tels)}</span>` },
        { h: 'Email', c: r => esc(r.mail) },
        { h: 'Head', c: r => esc(r.head) },
      ] },
      fields: () => [
        { k: 'en', label: 'Name (English)', req: true },
        { k: 'ne', label: 'Name (Nepali)', req: true, ne: true },
        { k: 'a', label: 'Address', span: 1 },
        { k: 'tels', label: 'Phone numbers', hint: 'Separate numbers with commas.' },
        { k: 'mail', label: 'Email', type: 'email' },
        { k: 'head', label: 'Centre head' },
        { k: 'map', label: 'Google Maps embed link', type: 'textarea', rows: 2, span: 1, hint: 'In Google Maps choose Share, then Embed a map, and copy the link.' },
      ],
      blank: () => ({ en: '', ne: '', a: '', tels: '', mail: '', head: '', map: '' }),
    },
    vacancies: {
      title: 'Vacancies', single: 'vacancy', newLabel: 'Post a vacancy', base: () => [], name: r => r.title,
      sub: 'Open positions appear on the Careers page until their deadline.',
      search: r => r.title,
      table: {
        empty: { icon: 'briefcase', title: 'No vacancies open', text: 'Posted vacancies appear on the Careers page and are removed after their deadline.', action: '<a class="btn btn-p" href="#/vacancies/new">Post a vacancy</a>' },
        cols: [
          { h: 'Position', c: r => `<b>${esc(r.title)}</b><span class="t2">${esc(r.centre)}</span>` },
          { h: 'Openings', c: r => `<span class="num">${esc(r.openings || 1)}</span>` },
          { h: 'Deadline', c: r => r.deadline ? fDate(r.deadline) : '—' },
          { h: 'Status', c: r => r.deadline && new Date(r.deadline) < new Date(todayISO()) ? '<span class="bd">Closed</span>' : '<span class="bd bd-p">Open</span>' },
        ],
      },
      fields: () => [
        { k: 'title', label: 'Position', req: true },
        { k: 'openings', label: 'Openings', type: 'number', min: 1 },
        { k: 'centre', label: 'Work location', type: 'select', opts: CENTRE_NAMES },
        { k: 'deadline', label: 'Application deadline', type: 'date', req: true },
        { k: 'desc', label: 'Description', type: 'textarea', rows: 6, span: 1, hint: 'Duties, qualifications and how to apply.' },
        { k: 'file', label: 'Vacancy notice', type: 'file', acc: 'pdf', span: 1 },
      ],
      blank: () => ({ title: '', openings: 1, centre: CENTRE_NAMES[0], deadline: '', desc: '', file: '' }),
    },
    users: {
      title: 'Users and roles', single: 'user', newLabel: 'Invite user', name: r => r.name,
      sub: 'Who can sign in to this admin panel, and what each person can change.',
      base: () => [
        { _id: 'u1', name: 'Website manager', email: 'webadmin@budol.coop.np', role: 'manager', last: 'Today', active: true },
        { _id: 'u2', name: 'Content editor', email: 'editor@budol.coop.np', role: 'editor', last: 'Yesterday', active: true },
        { _id: 'u3', name: 'Umesh Acharya', email: 'grievance@budol.coop.np', role: 'grievance', last: '2 days ago', active: true },
      ],
      search: r => `${r.name} ${r.email}`,
      table: {
        topRight: '<span class="bd">Sample accounts</span>',
        cols: [
          { h: 'Name', c: r => `<span style="display:flex;gap:12px;align-items:center"><span class="avatar gray">${initials(r.name)}</span><span><b>${esc(r.name)}</b><span class="t2">${esc(r.email)}</span></span></span>` },
          { h: 'Role', c: r => `<span class="bd ${r.role === 'manager' ? 'bd-p' : r.role === 'grievance' ? 'bd-w' : 'bd-i'}">${esc((ROLES[r.role] || {}).label || r.role)}</span>` },
          { h: 'Last signed in', c: r => esc(r.last || 'Not yet') },
          { h: 'Status', c: r => r.active ? '<span class="bd bd-p">Active</span>' : '<span class="bd">Disabled</span>' },
        ],
      },
      after: () => `<section class="sec" style="margin-top:24px"><div class="sec-h"><div><h2>What each role can do</h2><p>Use <b>View as</b> in the green bar above to try each role.</p></div></div><div class="sec-b flush"><ul class="checklist">${Object.values(ROLES).map(r => `<li><span class="st done">${ic('check')}</span><div><b>${esc(r.label)}</b><small>${esc(r.desc)}</small></div></li>`).join('')}</ul></div></section>`,
      fields: r => [
        { k: 'name', label: 'Full name', req: true },
        { k: 'email', label: 'Email address', type: 'email', req: true, hint: r._id ? '' : 'They get an email with a link to set their own password.' },
        { k: 'role', label: 'Role', type: 'select', opts: Object.entries(ROLES).map(([k, v]) => [k, v.label]) },
        { k: 'active', label: 'Can sign in', type: 'toggle', hint: 'Turn off when someone leaves BUSA.' },
      ],
      blank: () => ({ name: '', email: '', role: 'editor', active: true }),
    },
  };
  function rowsOf(k) {
    const R = RES[k], ov = S.rec[k] || {};
    const base = R.base().map(r => Object.assign({}, r, ov[r._id] || {}));
    const added = (S.added[k] || []).map(r => Object.assign({}, r, ov[r._id] || {}));
    return [...added, ...base].filter(r => !r._deleted);
  }

  /* ---------------- toasts + modal ---------------- */
  function toast(title, body = '', bad = false) {
    const t = document.createElement('div');
    t.className = 'toast' + (bad ? ' err' : '');
    t.setAttribute('role', 'status');
    t.innerHTML = `${ic(bad ? 'exclamation-triangle' : 'check-circle', 'ic-lg')}<div><b>${esc(title)}</b>${body ? `<span>${esc(body)}</span>` : ''}</div><button type="button" aria-label="Dismiss">${ic('x-mark')}</button>`;
    $('#toasts').prepend(t);
    const kill = () => t.remove();
    t.querySelector('button').onclick = kill;
    setTimeout(kill, 6000);
  }
  function modal(o) {
    const dlg = $('#modal');
    dlg.className = 'modal' + (o.wide ? ' wide' : '');
    dlg.innerHTML = o.html || `<div class="m-b center">${o.icon !== false ? `<div class="m-ic ${o.tone || 'w'}">${ic(o.icon || 'exclamation-triangle', 'ic-lg')}</div>` : ''}<h2>${esc(o.title)}</h2>${o.body || ''}</div>
      <div class="m-f"><button type="button" class="btn btn-g" data-close>${esc(o.cancel || 'Cancel')}</button><button type="button" class="btn ${o.okCls || 'btn-p'}" data-ok>${esc(o.ok || 'Confirm')}</button></div>`;
    dlg.showModal();
    const ok = $('[data-ok]', dlg);
    if (ok) ok.onclick = () => { if (o.onOk && o.onOk(dlg) === false) return; dlg.close(); };
    $$('[data-close]', dlg).forEach(b => { b.onclick = () => dlg.close(); });
    if (o.onOpen) o.onOpen(dlg);
  }

  /* ---------------- page pieces ---------------- */
  function head(title, o = {}) {
    const crumbs = o.crumbs ? `<nav class="crumbs" aria-label="Breadcrumb">${o.crumbs.map((c, i) => (i ? ic('chevron-right') : '') + (c[1] ? `<a href="${c[1]}">${esc(c[0])}</a>` : `<span>${esc(c[0])}</span>`)).join('')}</nav>` : '';
    return `${crumbs}<div class="ph"><div><h1 class="${isNe(title) ? 'ne' : ''}">${esc(title)}</h1>${o.sub ? `<p class="sub">${o.sub}</p>` : ''}</div>${o.acts ? `<div class="acts">${o.acts}</div>` : ''}</div>`;
  }
  const sec = (title, body, o = {}) => `<section class="sec" ${o.id ? `id="${o.id}"` : ''} ${o.hidden ? 'hidden' : ''}><div class="sec-h"><div><h2>${esc(title)}</h2>${o.sub ? `<p>${o.sub}</p>` : ''}</div>${o.right || ''}</div><div class="sec-b${o.flush ? ' flush' : ''}">${body}</div></section>`;
  const emptyBox = (icon, title, text, action = '') => `<div class="empty"><div class="ring">${ic(icon, 'ic-lg')}</div><h3>${esc(title)}</h3><p>${text}</p>${action}</div>`;
  function spark(vals) {
    const w = 100, h = 30, max = Math.max(...vals, 1);
    const pts = vals.map((v, i) => `${(i * w / (vals.length - 1)).toFixed(1)},${(h - 3 - v / max * (h - 8)).toFixed(1)}`).join(' ');
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polygon points="0,${h} ${pts} ${w},${h}" fill="currentColor" opacity=".09"/><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>`;
  }
  const stars = n => `<span class="stars" aria-label="Rated ${n} out of 5">${[1, 2, 3, 4, 5].map(i => `<svg class="ic ${i > n ? 'off' : ''}" aria-hidden="true"><use href="#h-star"/></svg>`).join('')}</span>`;

  /* ---------------- tables ---------------- */
  const TBL = {}, TS = {};
  function table(o) {
    TBL[o.id] = o;
    const st = TS[o.id] || (TS[o.id] = { q: '', tab: o.tabs ? o.tabs[0][0] : '', page: 1, per: o.per || 10, f: '' });
    const tabs = o.tabs ? `<div class="tabs-row"><div class="tabs" role="tablist">${o.tabs.map(([k, l, fn]) => `<button type="button" class="tab ${st.tab === k ? 'on' : ''}" role="tab" aria-selected="${st.tab === k}" data-tab="${o.id}|${k}">${esc(l)}<span class="cnt g">${o.rows.filter(fn).length}</span></button>`).join('')}</div></div>` : '';
    const filt = o.filter ? `<div class="inp"><select data-filt="${o.id}" aria-label="Filter">${[['', o.filter.label], ...o.filter.opts].map(([v, l]) => `<option value="${v}" ${st.f === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : '';
    return `${tabs}<div class="tbl" id="tbl-${o.id}"><div class="tbl-top"><div class="l"><div class="gsearch">${ic('magnifying-glass')}<input type="search" data-q="${o.id}" value="${esc(st.q)}" placeholder="Search" aria-label="Search ${esc(o.label || 'records')}"></div>${filt}</div>${o.topRight ? `<div class="r">${o.topRight}</div>` : ''}</div><div class="tbl-body">${tblBody(o.id)}</div></div>`;
  }
  function tblBody(id) {
    const o = TBL[id], st = TS[id];
    let rows = o.rows;
    if (o.tabs) { const t = o.tabs.find(x => x[0] === st.tab) || o.tabs[0]; rows = rows.filter(t[2]); }
    if (o.filter && st.f) { const fo = o.filter.opts.find(x => x[0] === st.f); if (fo) rows = rows.filter(fo[2]); }
    if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter(r => o.search(r).toLowerCase().includes(q)); }
    const n = rows.length, all = st.per >= 1000, pages = all ? 1 : Math.max(1, Math.ceil(n / st.per));
    if (st.page > pages) st.page = pages;
    if (!n) {
      if (!st.q && !st.f && o.empty) return emptyBox(o.empty.icon, o.empty.title, o.empty.text, o.empty.action);
      return emptyBox('magnifying-glass', 'No matching records', 'Try a different search or filter.');
    }
    const slice = all ? rows : rows.slice((st.page - 1) * st.per, st.page * st.per);
    const body = o.grid
      ? `<div class="gridcards">${slice.map(r => `<a class="gcard" href="${o.href(r)}">${o.grid(r)}</a>`).join('')}</div>`
      : `<div class="tbl-scroll"><table><thead><tr>${o.cols.map(c => `<th class="${c.cls || ''}" ${c.w ? `style="width:${c.w}"` : ''}>${c.h ? esc(c.h) : `<span class="sr">${esc(c.sr || 'Actions')}</span>`}</th>`).join('')}</tr></thead><tbody>${slice.map(r => `<tr${o.href ? ` class="rowlink" data-href="${o.href(r)}"` : ''}>${o.cols.map(c => `<td class="${c.cls || ''}">${c.c(r)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    const from = all ? 1 : (st.page - 1) * st.per + 1, to = all ? n : Math.min(n, st.page * st.per);
    return `${body}<div class="tbl-foot"><span>Showing ${from} to ${to} of ${n} ${n === 1 ? 'result' : 'results'}</span><div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center"><label style="display:flex;gap:8px;align-items:center">Per page <span class="inp"><select data-per="${id}">${[10, 25, 50, 1000].map(v => `<option value="${v}" ${st.per === v ? 'selected' : ''}>${v === 1000 ? 'All' : v}</option>`).join('')}</select></span></label>${pages > 1 ? pager(id, st.page, pages) : ''}</div></div>`;
  }
  function pager(id, p, pages) {
    const nums = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - p) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
    return `<div class="pager" role="navigation" aria-label="Pages"><button type="button" data-page="${id}|${p - 1}" ${p === 1 ? 'disabled' : ''} aria-label="Previous page">${ic('chevron-left', 'ic-sm')}</button>${nums.map(i => i === '…' ? '<button type="button" disabled>…</button>' : `<button type="button" class="${i === p ? 'on' : ''}" data-page="${id}|${i}" ${i === p ? 'aria-current="page"' : ''}>${i}</button>`).join('')}<button type="button" data-page="${id}|${p + 1}" ${p === pages ? 'disabled' : ''} aria-label="Next page">${ic('chevron-right', 'ic-sm')}</button></div>`;
  }
  const refreshTbl = id => { const el = $(`#tbl-${id} .tbl-body`); if (el) el.innerHTML = tblBody(id); };

  /* ---------------- form fields ---------------- */
  function fld(f, v) {
    const id = 'f-' + f.k, span = f.span ? ' span2' : '', dis = !!f.dis;
    const hint = f.hint ? `<div class="hint" id="${id}-h">${f.hint}</div>` : '';
    const lock = f.lock ? ` <span class="lock">${ic('lock-closed', 'ic-sm')}${esc(f.lock)}</span>` : '';
    const err = `<div class="ferr">${esc(f.err || 'This field is required.')}</div>`;
    if (f.type === 'toggle') return `<div class="f${span}" data-f="${f.k}"><label class="tog"><input type="checkbox" id="${id}" data-k="${f.k}" ${v ? 'checked' : ''} ${dis ? 'disabled' : ''}><span class="sw"></span><span><b>${esc(f.label)}</b>${f.hint ? `<small>${f.hint}</small>` : ''}</span></label></div>`;
    if (f.type === 'file') return `<div class="f${span}" data-f="${f.k}"><span class="lab${f.req ? ' req' : ''}">${esc(f.label)}</span>${fileCtl(f.k, f.acc, v)}${hint}${err}</div>`;
    if (f.type === 'rich') return `<div class="f${span}" data-f="${f.k}"><span class="lab">${esc(f.label)}</span>${richCtl(f)}${hint}</div>`;
    if (f.type === 'photos') return `<div class="f${span}" data-f="${f.k}"><span class="lab">${esc(f.label)}</span><div class="photos" data-k="${f.k}" data-album="${esc(f.slug || '')}">${f.slug ? '<p class="hint" style="margin:0">Loading photos…</p>' : ''}</div><div class="drop-zone" data-addphotos role="button" tabindex="0" style="margin-top:12px">${ic('cloud-arrow-up', 'ic-lg')}<span><b>Add photos</b> or drag them here</span><small>JPG or PNG. Thumbnails are made automatically.</small></div><input type="file" hidden multiple accept="image/*" data-photos-in></div>`;
    let ctl;
    if (f.type === 'textarea') ctl = `<textarea id="${id}" data-k="${f.k}" rows="${f.rows || 3}" class="${f.ne ? 'ne' : ''}" ${dis ? 'disabled' : ''} placeholder="${esc(f.ph || '')}" ${f.hint ? `aria-describedby="${id}-h"` : ''}>${esc(v)}</textarea>`;
    else if (f.type === 'select') ctl = `<select id="${id}" data-k="${f.k}" ${dis ? 'disabled' : ''}>${f.opts.map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}" ${String(v ?? '') === String(ov) ? 'selected' : ''}>${esc(ol)}</option>`; }).join('')}</select>`;
    else ctl = `<input id="${id}" data-k="${f.k}" type="${f.type || 'text'}" value="${esc(v)}" class="${f.ne ? 'ne' : ''}" ${f.step ? `step="${f.step}"` : ''} ${f.min != null ? `min="${f.min}"` : ''} ${f.mode ? `inputmode="${f.mode}"` : ''} ${dis ? 'disabled' : ''} placeholder="${esc(f.ph || '')}" ${f.hint ? `aria-describedby="${id}-h"` : ''}>`;
    return `<div class="f${span}" data-f="${f.k}"><label for="${id}" class="${f.req ? 'req' : ''}">${esc(f.label)}${lock}</label><div class="inp${dis ? ' dis' : ''}">${f.pre ? `<span class="pre">${f.pre}</span>` : ''}${ctl}${f.suf ? `<span class="suf">${f.suf}</span>` : ''}</div>${hint}${err}</div>`;
  }
  function fileCtl(k, acc, v, name) {
    const isImg = v && (/\.(jpe?g|png|gif|webp)(\?|$)/i.test(v) || /^blob:/.test(v)) && !/\.pdf$/i.test(name || '');
    const nm = name || (v ? decodeURIComponent(String(v).split('/').pop()) : '');
    const kinds = acc === 'pdf' ? 'PDF, JPG or PNG, up to 20 MB' : 'JPG or PNG, up to 5 MB';
    return `<div class="filef" data-k="${k}" data-acc="${acc || ''}" data-src="${esc(v || '')}">${v
      ? `<div class="upl">${isImg ? `<img src="${esc(abs(v))}" alt="">` : `<span class="thumb ph" style="width:72px;height:72px">${ic('document-text', 'ic-lg')}</span>`}<div class="meta"><b>${esc(nm)}</b><small>${name ? 'New file, uploads when you save' : 'Current file'}</small></div><span class="upl-acts"><button type="button" class="btn btn-g btn-sm" data-pick>Replace</button><button type="button" class="btn btn-do btn-sm" data-clear aria-label="Remove file">Remove</button></span></div>`
      : `<div class="drop-zone" data-pick role="button" tabindex="0">${ic('cloud-arrow-up', 'ic-lg')}<span><b>Choose a file</b> or drag it here</span><small>${kinds}</small></div>`}<input type="file" hidden accept="${acc === 'pdf' ? '.pdf,image/*' : 'image/*'}"></div>`;
  }
  function setFile(filef, url, name) {
    const t = document.createElement('div');
    t.innerHTML = fileCtl(filef.dataset.k, filef.dataset.acc, url, name);
    const el = t.firstElementChild;
    filef.replaceWith(el);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function richCtl(f) {
    return `<div class="rich inp"><div class="bar" role="toolbar" aria-label="Formatting">
      <button type="button" data-cmd="bold" aria-label="Bold"><b>B</b></button><button type="button" data-cmd="italic" aria-label="Italic"><i>I</i></button>
      <button type="button" data-cmd="formatBlock|h3" aria-label="Heading">H</button><button type="button" data-cmd="insertUnorderedList" aria-label="Bulleted list">${ic('list-bullet', 'ic-sm')}</button>
      <button type="button" data-cmd="createLink" aria-label="Link">${ic('link', 'ic-sm')}</button>
      <span style="flex:1"></span><span class="mini-tabs" hidden><button type="button" class="on" data-rl="en">English</button><button type="button" data-rl="ne">नेपाली</button></span></div>
      <div class="area" contenteditable="true" data-k="body" data-src="${esc(f.src || '')}" aria-label="Content">${f.src ? '<p class="hint">Loading the page content…</p>' : ''}</div>
      <div class="area ne" contenteditable="true" data-k="body_ne" hidden aria-label="Content in Nepali"></div></div>`;
  }
  function collect(form) {
    const o = {};
    $$('[data-k]', form).forEach(el => {
      const k = el.dataset.k;
      if (el.classList.contains('filef')) o[k] = el.dataset.src || '';
      else if (el.classList.contains('area')) o[k] = el.innerHTML;
      else if (el.classList.contains('photos')) o[k] = $$('img', el).map(i => i.getAttribute('src'));
      else if (el.type === 'checkbox') o[k] = el.checked;
      else if (el.type === 'number') o[k] = el.value === '' ? null : +el.value;
      else o[k] = el.value;
    });
    return o;
  }
  function markErr(form, k, msg) {
    const f = $(`[data-f="${k}"]`, form);
    if (!f) return;
    f.classList.add('has-err');
    const e = $('.ferr', f); if (e && msg) e.textContent = msg;
    const inp = $('.inp', f); if (inp) inp.classList.add('bad');
  }
  function clearErrs(form) {
    $$('.has-err', form).forEach(f => f.classList.remove('has-err'));
    $$('.inp.bad', form).forEach(i => i.classList.remove('bad'));
  }
  function failed(form) {
    toast('Check the highlighted fields', 'Some required details are missing or not valid.', true);
    const first = $('.has-err', form);
    if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); const c = $('input,textarea,select,[data-pick]', first); if (c) c.focus({ preventScroll: true }); }
  }
  let DIRTY = false;
  function bindDirty(form) {
    const flag = () => { DIRTY = true; const d = $('.dirty', form); if (d) d.classList.add('show'); };
    form.addEventListener('input', flag);
    form.addEventListener('change', flag);
  }
  async function loadRich(area) {
    const src = area.dataset.src; if (!src) return;
    try {
      const html = await (await fetch(SITE + src)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const main = doc.querySelector('.page-main');
      if (!main) throw new Error('no content');
      main.querySelectorAll('svg,script,.side-nav').forEach(x => x.remove());
      const en = main.querySelector('.only-en'), ne = main.querySelector('.only-ne');
      if (en && ne) {
        area.innerHTML = en.innerHTML;
        const neArea = area.parentElement.querySelector('[data-k="body_ne"]');
        neArea.innerHTML = ne.innerHTML;
        area.parentElement.querySelector('.mini-tabs').hidden = false;
      } else area.innerHTML = main.innerHTML;
    } catch (_) {
      area.innerHTML = '<p>The page content could not be loaded in this preview. Open the mockup through the local preview server or the live demo link.</p>';
    }
  }
  async function loadAlbum(box) {
    const slug = box.dataset.album; if (!slug) return;
    try {
      const html = await (await fetch(`${SITE}media/gallery/${slug}.html`)).text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const srcs = [...doc.querySelectorAll('.g-cell img')].map(i => i.getAttribute('src'));
      box.innerHTML = srcs.map(photoTile).join('') || '<p class="hint" style="margin:0">No photos yet.</p>';
    } catch (_) { box.innerHTML = '<p class="hint" style="margin:0">Photos could not be loaded in this preview.</p>'; }
  }
  const photoTile = s => `<figure class="ph-tile"><img src="${esc(s)}" alt="" loading="lazy"><button type="button" data-rmphoto aria-label="Remove photo">${ic('x-mark', 'ic-sm')}</button></figure>`;

  /* ---------------- shell ---------------- */
  const NAV = [
    { items: [['dashboard', 'Dashboard', 'home']] },
    { g: 'Products', items: [['products', 'Savings and loans', 'banknotes']] },
    { g: 'Website', items: [['slides', 'Homepage slides', 'rectangle-stack'], ['highlights', 'Financial highlights', 'presentation-chart-bar'], ['pages', 'Pages', 'document-text']] },
    { g: 'News and media', items: [['notices', 'Notices', 'megaphone'], ['albums', 'Photo albums', 'photo']] },
    { g: 'Documents', items: [['documents', 'Reports and forms', 'document-arrow-down']] },
    { g: 'Organisation', items: [['team', 'Team members', 'user-group'], ['centres', 'Service centres', 'building-office'], ['vacancies', 'Vacancies', 'briefcase']] },
    { g: 'Members', items: [['feedback', 'Feedback', 'chat-bubble']] },
    { g: 'Settings', items: [['users', 'Users and roles', 'users'], ['activity', 'Activity log', 'clipboard']] },
  ];
  const LABEL = Object.fromEntries(NAV.flatMap(g => g.items.map(i => [i[0], i[1]])));
  const closedGroups = new Set();
  let CUR = 'dashboard';

  function shell() {
    const app = $('#app');
    if (!S.signedIn) { app.innerHTML = loginHtml(); bindLogin(); return; }
    app.innerHTML = `<div class="shell">
      <aside class="side" id="side" aria-label="Admin navigation">
        <div class="side-head"><a href="#/dashboard"><img src="${LOGO}" alt="Budol Samudayik SACCOS admin"></a></div>
        <nav class="nav" id="nav"></nav>
        <div class="side-foot">Mockup of the planned Laravel and Filament admin panel</div>
      </aside>
      <div class="scrim" id="scrim"></div>
      <div class="col">
        <header class="top">
          <button type="button" class="iconbtn burger" id="burger" aria-label="Open navigation" aria-controls="side" aria-expanded="false">${ic('bars-3', 'ic-lg')}</button>
          <div class="gsearch top-s">${ic('magnifying-glass')}<input id="gs" type="search" placeholder="Search products, people and documents" autocomplete="off" aria-label="Search the admin panel"><div class="gresults" id="gres"></div></div>
          <div class="sp"></div>
          <div class="umenu" id="bellwrap"><button type="button" class="iconbtn" id="bell" aria-label="Notifications" aria-expanded="false">${ic('bell', 'ic-lg')}<span class="dot" id="belld" hidden></span></button><div class="drop notif-list" id="notif"></div></div>
          <div class="umenu"><button type="button" id="ubtn" aria-label="Account menu" aria-expanded="false"><span class="avatar" id="uav"></span></button><div class="drop" id="udrop"></div></div>
        </header>
        <main class="main" id="main" tabindex="-1"></main>
      </div></div>`;
  }
  function navRender() {
    const nav = $('#nav'); if (!nav) return;
    const newFb = can('feedback') ? feedback().filter(f => f.status === 'new').length : 0;
    nav.innerHTML = NAV.map(g => {
      const items = g.items.filter(i => can(i[0]));
      if (!items.length) return '';
      const links = items.map(([k, l, icon]) => `<a class="ni ${CUR === k ? 'on' : ''}" href="#/${k}" ${CUR === k ? 'aria-current="page"' : ''}>${ic(icon)}<span>${esc(l)}</span>${k === 'feedback' && newFb ? `<span class="cnt d">${newFb}</span>` : ''}</a>`).join('');
      return `<div class="ng ${g.g && closedGroups.has(g.g) ? 'closed' : ''}">${g.g ? `<button type="button" class="ng-h" data-group="${esc(g.g)}" aria-expanded="${!closedGroups.has(g.g)}">${esc(g.g)}${ic('chevron-down')}</button>` : ''}${links}</div>`;
    }).join('');
  }
  function topRender() {
    const r = me();
    $('#uav').textContent = initials(r.name);
    $('#udrop').innerHTML = `<div class="who"><b>${esc(r.name)}</b><span>${esc(r.label)}</span></div><a href="${SITE}index.html" target="_blank" rel="noopener">${ic('arrow-top-right-on-square')}Open the website</a><button type="button" data-act="signout">${ic('arrow-right-start')}Sign out</button>`;
    const wrap = $('#bellwrap');
    wrap.hidden = !can('feedback');
    if (!can('feedback')) return;
    const newOnes = feedback().filter(f => f.status === 'new');
    const dot = $('#belld');
    dot.hidden = !newOnes.length; dot.textContent = newOnes.length;
    $('#notif').innerHTML = `<div class="who"><b>Notifications</b><span>${newOnes.length ? plural(newOnes.length, 'new feedback message') : 'Nothing new'}</span></div>${newOnes.slice(0, 5).map(f => `<a class="n" href="#/feedback/${esc(f.id)}">${tyBadge(f.type)} <span class="${isNe(f.message) ? 'ne' : ''}">${esc(clip(f.message, 70))}</span><small>${ago(f.createdAt)}</small></a>`).join('')}<a href="#/feedback">${ic('inbox')}View all feedback</a>`;
  }
  const openSide = on => {
    const s = $('#side'); if (!s) return;
    s.classList.toggle('open', on); $('#scrim').classList.toggle('show', on);
    $('#burger').setAttribute('aria-expanded', on);
  };
  function closeDrops(except) { $$('.drop.show,.gresults.show').forEach(d => { if (d !== except) { d.classList.remove('show'); const b = d.previousElementSibling; if (b && b.getAttribute) b.setAttribute('aria-expanded', 'false'); } }); }

  /* global search */
  function gsearch(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) return '';
    const out = [];
    const grp = (k, title, rows, txt, href, sub) => {
      if (!can(k)) return;
      const m = rows.filter(r => txt(r).toLowerCase().includes(q)).slice(0, 4);
      if (m.length) out.push(`<h4>${title}</h4>` + m.map(r => `<a href="${href(r)}"><span class="${isNe(txt(r)) && !r.en ? 'ne' : ''}">${esc(clip(r.en || r.name || r.title || r.t, 60))}</span><small>${esc(sub(r))}</small></a>`).join(''));
    };
    grp('products', 'Products', products(), r => `${r.en} ${r.ne}`, r => `#/products/${r.slug}`, r => `${r.ne}, ${r.rate}`);
    grp('team', 'Team members', rowsOf('team'), r => `${r.name} ${r.role}`, r => `#/team/${r._id}`, r => `${r.role}, ${r.group}`);
    grp('documents', 'Reports and forms', rowsOf('documents'), r => r.title, r => `#/documents/${r._id}`, r => r.cat);
    grp('notices', 'Notices', rowsOf('notices'), r => r.t, r => `#/notices/${r._id}`, r => fDate(r.d));
    grp('pages', 'Pages', rowsOf('pages'), r => `${r.title} ${r.ne}`, r => `#/pages/${r._id}`, r => r.section);
    grp('feedback', 'Feedback', feedback(), r => `${r.ref} ${r.name || ''} ${r.message}`, r => `#/feedback/${r.id}`, r => r.ref);
    return out.join('') || '<p class="hint" style="margin:8px">No results.</p>';
  }

  /* ---------------- login ---------------- */
  function loginHtml() {
    return `<div class="login"><div class="card"><img src="${LOGO}" alt="Budol Samudayik SACCOS"><h1>Sign in to the admin panel</h1>
      <form id="lf" novalidate><div class="f"><label for="le">Email address</label><div class="inp"><input id="le" type="email" autocomplete="off" placeholder="name@budol.coop.np"></div></div>
      <div class="f"><label for="lp">Password</label><div class="inp"><input id="lp" type="password" autocomplete="off"></div></div>
      <label class="tog"><input type="checkbox" checked><span class="sw"></span><span><b>Remember me</b></span></label>
      <button class="btn btn-p" type="submit" style="width:100%;height:40px">Sign in</button>
      <p class="note">Mockup: no password needed. Leave both fields empty and select Sign in.</p></form></div></div>`;
  }
  function bindLogin() {
    $('#lf').addEventListener('submit', e => {
      e.preventDefault();
      $('#le').value = ''; $('#lp').value = '';
      S.signedIn = true; save();
      location.hash = '#/dashboard';
      shell(); route();
    });
  }

  /* ---------------- dashboard ---------------- */
  function vDashboard() {
    const fb = feedback(), open = fb.filter(f => f.status !== 'resolved'), wait = fb.filter(f => f.type === 'complaint' && waiting(f));
    const ps = products(), sav = ps.filter(p => p.t === 'saving').length;
    const notices = rowsOf('notices'), docs = rowsOf('documents');
    const latestNotice = notices.reduce((a, n) => (!a || n.d > a.d ? n : a), null);
    const monthly = docs.filter(d => d.page === 'Monthly reports'), topCat = monthly.map(d => d.cat).sort().pop();
    const cand = monthly.filter(d => d.cat === topCat), latestDoc = cand.find(d => d._added) || cand[cand.length - 1] || docs[0];
    const stat = o => `<a class="card stat" href="${o.href}"><span class="l">${ic(o.icon)}${esc(o.label)}</span><div class="v num">${o.value}</div><div class="d ${o.tone || ''}">${o.tone === 'red' ? ic('exclamation-triangle') : o.tone === 'grn' ? ic('check-circle') : ''}${esc(o.desc)}</div>${o.spark ? `<span style="color:${o.tone === 'red' ? 'var(--danger)' : 'var(--p600)'}">${spark(o.spark)}</span>` : ''}</a>`;
    const stats = [];
    if (can('feedback')) stats.push(stat({ href: '#/feedback', icon: 'chat-bubble', label: 'Open feedback', value: open.length, desc: wait.length ? `${plural(wait.length, 'complaint')} waiting for a first reply` : 'No complaints waiting', tone: wait.length ? 'red' : 'grn', spark: [1, 2, 1, 3, 2, 4, open.length] }));
    if (can('products')) stats.push(stat({ href: '#/products', icon: 'banknotes', label: 'Products on the website', value: ps.filter(p => !p.hidden).length, desc: `${sav} savings, ${ps.length - sav} loans` }));
    if (can('notices')) stats.push(stat({ href: '#/notices', icon: 'megaphone', label: 'Notices', value: notices.length, desc: latestNotice ? `Latest on ${fDate(latestNotice.d)}` : 'None yet' }));
    if (can('documents')) stats.push(stat({ href: '#/documents', icon: 'document-arrow-down', label: 'Reports and forms', value: docs.length, desc: latestDoc ? `Latest: ${latestDoc.title.replace('Monthly Report ', 'monthly report ')}` : '' }));

    const has = re => docs.some(d => re.test(d.title));
    const bhadra = has(/083\/084 Bhadra/i), asoj = has(/083\/084 (Ashwin|Asoj|Aswin)/i);
    const newNotices = notices.filter(n => n.isNew).length;
    const items = [
      { k: 'documents', done: bhadra, title: 'Upload the Bhadra 2083 monthly report', sub: bhadra ? 'Uploaded, with the notice of 21 Sep 2026.' : 'Due now.', href: '#/documents' },
      { k: 'documents', done: asoj, due: !asoj, title: 'Upload the Asoj 2083 monthly report', sub: asoj ? 'Uploaded.' : 'Due once Asoj ends in mid-October.', href: '#/documents/new', act: 'Upload' },
      { k: 'highlights', done: !!(S.hl && S.hl.savedAt), title: 'Update the financial highlights', sub: S.hl && S.hl.savedAt ? `Updated on ${fDate(S.hl.savedAt)}.` : 'Match the homepage figures to the latest monthly report.', href: '#/highlights', act: 'Update' },
      { k: 'feedback', done: !wait.length, title: 'Reply to open complaints', sub: wait.length ? `${plural(wait.length, 'complaint')} without a first reply.` : 'Every complaint has a reply.', href: '#/feedback', act: 'Open inbox' },
      { k: 'notices', done: !newNotices, title: 'Review notices labelled New', sub: newNotices ? `${plural(newNotices, 'notice')} still show the New label.` : 'No notices are labelled New.', href: '#/notices', act: 'Review' },
    ].filter(i => can(i.k));
    const checklist = `<ul class="checklist">${items.map(i => `<li><span class="st ${i.done ? 'done' : i.due ? 'due' : 'todo'}">${i.done ? ic('check') : ''}</span><div><b>${esc(i.title)}</b><small>${esc(i.sub)}</small></div>${!i.done && i.act ? `<a class="btn btn-g btn-sm go" href="${i.href}">${esc(i.act)}</a>` : ''}</li>`).join('')}</ul>`;

    const latest = fb.slice(0, 5);
    const fbW = `<div class="tbl-scroll"><table><tbody>${latest.map(f => `<tr class="rowlink" data-href="#/feedback/${esc(f.id)}"><td style="width:120px">${tyBadge(f.type)}</td><td><span class="clip2 ${isNe(f.message) ? 'ne' : ''}">${esc(f.message)}</span><span class="t2">${esc(f.name || 'Anonymous')}, ${ago(f.createdAt)}</span></td><td class="r"><span class="bd ${STATUS[f.status][1]}">${STATUS[f.status][0]}</span></td></tr>`).join('')}</tbody></table></div>`;

    const changes = [];
    products().forEach(p => {
      const key = pkey(p.slug), o = S.prod[key];
      (o && o._hist || []).forEach(h => changes.push({ p, from: h.prev, to: h.rate, when: fDate(h.at), at: h.at }));
      if (OLD_RATE[key]) changes.push({ p, from: OLD_RATE[key], to: (D.products.find(x => x.slug === key) || {}).rate, when: 'Sep 2026 leaflet', at: '2026-09-01' });
    });
    changes.sort((a, b) => new Date(b.at) - new Date(a.at));
    const ratesW = `<div class="tbl-scroll"><table class="rates-mini"><tbody>${changes.slice(0, 6).map(c => `<tr class="rowlink" data-href="#/products/${c.p.slug}"><td><b>${esc(c.p.en)}</b><span class="t2 ne">${esc(c.p.ne)}</span></td><td><span class="chg num"><s>${esc(c.from)}</s>${ic('arrow-right', 'ic-sm')}${esc(c.to)}</span></td><td class="r" style="color:var(--muted)">${esc(c.when)}</td></tr>`).join('')}</tbody></table></div>`;
    const actW = `<ul class="feed">${allLog().slice(0, 6).map(l => `<li><span class="avatar sm gray">${l.who === 'System' ? ic(l.icon || 'arrow-path', 'ic-sm') : initials(l.who)}</span><div>${esc(l.what)}<small>${esc(l.who)}, ${ago(l.at)}</small></div></li>`).join('')}</ul>`;

    const w = [];
    if (items.length) w.push(sec('This month', checklist, { sub: 'Regular jobs that keep the website up to date.', flush: true }));
    if (can('feedback')) w.push(sec('Latest feedback', fbW, { flush: true, right: '<a class="lnk" href="#/feedback">View all</a>' }));
    if (can('products')) w.push(sec('Recent rate changes', ratesW, { flush: true, right: '<a class="lnk" href="#/products">All products</a>' }));
    if (can('activity')) w.push(sec('Recent activity', actW, { flush: true, right: '<a class="lnk" href="#/activity">Activity log</a>' }));
    return head('Dashboard') + `<div class="stats n${stats.length}">${stats.join('')}</div><div class="dash">${w.map(x => `<div>${x}</div>`).join('')}</div>`;
  }

  /* ---------------- products ---------------- */
  function vProducts() {
    const acts = `<a class="btn btn-p" href="#/products/new">${ic('plus')}New product</a>`;
    return head('Savings and loans', { crumbs: [['Products', '#/products'], ['List']], sub: 'Every savings and loan product on the website, with the rate members see.', acts }) + table({
      id: 'products', label: 'products', rows: products(), href: r => '#/products/' + r.slug,
      search: r => [r.en, r.ne, r.slug, r.rate].join(' '),
      tabs: [['all', 'All', () => true], ['saving', 'Savings', r => r.t === 'saving'], ['loan', 'Loans', r => r.t === 'loan']],
      filter: { label: 'All products', opts: [['home', 'On the homepage', r => r.feat], ['calc', 'In the EMI calculator', hasCalc], ['hidden', 'Hidden from the website', r => r.hidden]] },
      cols: [
        { h: '', w: '64px', sr: 'Image', c: r => thumb(r.photo || r.img, 'banknotes') },
        { h: 'Name', c: r => `<b>${esc(r.en)}</b><span class="t2 ne">${esc(r.ne)}</span>` },
        { h: 'Type', c: r => r.t === 'loan' ? '<span class="bd bd-i">Loan</span>' : '<span class="bd bd-p">Saving</span>' },
        { h: 'Interest rate', cls: 'r', c: r => `<b class="num">${esc(r.rate || '—')}</b>${r.note ? `<span class="t2 ne">${esc(r.note)}</span>` : ''}` },
        { h: 'On homepage', c: r => `<label class="tog" title="Feature on the homepage"><input type="checkbox" data-feat="${esc(r.slug)}" ${r.feat ? 'checked' : ''}><span class="sw"></span><span class="sr">Feature ${esc(r.en)} on the homepage</span></label>` },
        { h: 'EMI calculator', c: r => hasCalc(r) ? `<span style="color:var(--p600)" title="Included">${ic('check-circle')}<span class="sr">Included</span></span>` : '<span style="color:var(--faint)">—</span>' },
        { h: 'Status', c: r => r.hidden ? '<span class="bd">Hidden</span>' : pub },
        { h: '', cls: 'r', sr: 'Actions', c: r => `<a class="lnk" href="#/products/${esc(r.slug)}">${ic('pencil-square', 'ic-sm')}Edit</a>` },
      ],
    });
  }

  function pvHtml(v) {
    const feats = (v.f || []).map(s => s.trim()).filter(Boolean);
    let emi = '';
    if (v.t === 'loan' && v.calc && v.r > 0 && v.max > 0 && v.yrs > 0) {
      const P = Math.min(1e6, v.max), yrs = Math.min(10, v.yrs), n = yrs * 12, i = v.r / 1200;
      const e = P * i * Math.pow(1 + i, n) / (Math.pow(1 + i, n) - 1);
      emi = `<div class="pv-emi">Calculator example: ${words(P)} over ${plural(yrs, 'year')}<br><b class="num">Rs ${fInt.format(Math.round(e))}</b> a month at ${v.r}%</div>`;
    }
    return `<div class="preview-card"><div class="pv-img">${v.img ? `<img src="${esc(abs(v.img))}" alt="">` : '<div class="none">No leaflet image</div>'}${v.rate ? `<span class="pv-rate" id="pvr">${esc(v.rate)}<small>${v.t === 'loan' ? 'interest' : 'a year'}</small></span>` : ''}</div>
      <div class="pv-b"><h3 class="pv-t">${esc(v.en || 'Product name')}<span class="pv-ne">${esc(v.ne || '')}</span></h3>${v.slogan ? `<p class="pv-sl">${esc(v.slogan)}</p>` : ''}${v.note ? `<p class="pv-sl" style="border-color:var(--p500)">${esc(v.note)}</p>` : ''}
      ${feats.length ? `<ul>${feats.slice(0, 4).map(x => `<li>${esc(x)}</li>`).join('')}</ul>${feats.length > 4 ? `<div class="more">and ${feats.length - 4} more on the product page</div>` : ''}` : ''}${emi}</div></div>`;
  }
  const repHtml = list => list.length ? list.map((t, i) => `<div class="rep-item"><span class="n">${i + 1}</span><div class="inp"><textarea class="ne" rows="2" data-rep="${i}" aria-label="Feature ${i + 1}">${esc(t)}</textarea></div><div class="rep-tools"><button type="button" data-up="${i}" ${i === 0 ? 'disabled' : ''} aria-label="Move feature ${i + 1} up">${ic('chevron-up', 'ic-sm')}</button><button type="button" data-down="${i}" ${i === list.length - 1 ? 'disabled' : ''} aria-label="Move feature ${i + 1} down">${ic('chevron-down', 'ic-sm')}</button><button type="button" data-del="${i}" aria-label="Remove feature ${i + 1}">${ic('trash', 'ic-sm')}</button></div></div>`).join('') : '<p class="hint" style="margin:0">No features yet. Add the first one.</p>';

  function vProductEdit(slug) {
    const isNew = !slug;
    const p = isNew ? { slug: '', t: 'saving', en: '', ne: '', rate: '', note: '', slogan: '', f: [], feat: false, img: '', photo: '' } : product(slug);
    if (!p) return notFound();
    const mgr = isMgr(), loan = p.t === 'loan', lock = mgr ? '' : 'Managers only';
    const calcOn = isNew ? false : hasCalc(p);
    const acts = isNew ? '' : `<a class="btn btn-g" href="${SITE}products/${esc(p.slug)}.html" target="_blank" rel="noopener">${ic('arrow-top-right-on-square')}View on website</a>${mgr ? `<button type="button" class="btn btn-do" data-act="delprod">${ic('trash')}Delete</button>` : ''}`;
    const details = `<div class="grid2">
      ${fld({ k: 'en', label: 'Name in English', req: true }, p.en)}
      ${fld({ k: 'ne', label: 'Name in Nepali', req: true, ne: true }, p.ne)}
      ${fld({ k: 'slug', label: 'Web address', pre: 'budol.coop.np/products/', req: true, hint: isNew ? 'Filled in from the English name. Use lowercase letters, numbers and hyphens.' : 'Changing it breaks links that people have saved or shared.', err: 'Use lowercase letters, numbers and hyphens only.' }, p.slug)}
      ${fld({ k: 't', label: 'Type', type: 'select', opts: [['saving', 'Saving'], ['loan', 'Loan']] }, p.t)}
      ${fld({ k: 'slogan', label: 'Slogan in Nepali', type: 'textarea', rows: 2, ne: true, span: 1, hint: 'Optional. Shown under the name, as on the leaflet.' }, p.slogan)}
      ${fld({ k: 'show', label: 'Show on the website', type: 'toggle', hint: 'Hidden products disappear from menus, search and the rate board.' }, !p.hidden)}
    </div>`;
    const rate = `${mgr ? '' : `<div class="callout w" style="margin-bottom:20px">${ic('lock-closed')}<div>Only managers can change interest rates. Ask a manager when a new leaflet changes a rate.</div></div>`}<div class="grid3">
      ${fld({ k: 'rate', label: 'Rate shown on the website', req: true, dis: !mgr, lock, hint: 'For example 9.5%, 2.5%–4% or +2%.', err: 'Enter a rate, for example 9.5%.' }, p.rate)}
      ${fld({ k: 'note', label: 'Rate note', ne: true, dis: !mgr, hint: 'Optional, for example थप २ प्रतिशत.' }, p.note)}
      ${fld({ k: 'eff', label: 'Effective from', type: 'date', dis: !mgr, hint: 'Recorded in the rate history.' }, todayISO())}
    </div>`;
    const calc = `<div class="grid2">
      ${fld({ k: 'calc', label: 'Include in the EMI calculator', type: 'toggle', dis: !mgr, hint: 'Members can work out the monthly instalment on the homepage and the product page.' }, calcOn)}<div></div>
      ${fld({ k: 'r', label: 'Calculator rate', type: 'number', step: '0.01', min: 0, suf: '% a year', dis: !mgr, lock, hint: 'Usually the same as the rate above.', err: 'Enter a rate between 1 and 30.' }, p.r ?? '')}
      ${fld({ k: 'max', label: 'Largest loan', type: 'number', min: 0, pre: 'Rs', hint: p.max ? words(p.max) : 'For example 3000000 for Rs 30 lakh.', err: 'Enter the largest loan amount.' }, p.max ?? '')}
      ${fld({ k: 'yrs', label: 'Longest repayment period', type: 'number', min: 1, suf: 'years', err: 'Enter between 1 and 30 years.' }, p.yrs ?? '')}
    </div>`;
    const feats = `<div class="rep" id="rep">${repHtml(p.f || [])}</div><button type="button" class="btn btn-g" data-act="addfeat" style="margin-top:12px">${ic('plus')}Add feature</button>`;
    const images = `<div class="grid2">
      ${fld({ k: 'img', label: 'Leaflet image', type: 'file', hint: 'The leaflet members see on the product page.' }, p.img)}
      ${fld({ k: 'photo', label: 'Homepage photo', type: 'file', hint: 'Used when the product is featured on the homepage.' }, p.photo)}
      ${fld({ k: 'feat', label: 'Feature on the homepage', type: 'toggle', hint: 'Adds the product to the featured cards and the hero carousel options.' }, p.feat)}
    </div>`;
    const hist = isNew ? '' : `<div style="margin-top:24px">${sec('Rate history', `<div class="tbl-scroll"><table><thead><tr><th>Rate</th><th>Effective from</th><th>Source</th><th>Changed by</th></tr></thead><tbody>${rateRows(p).map((r, i) => `<tr><td><b class="num">${esc(r.rate)}</b> ${i === 0 ? '<span class="bd bd-p">Current</span>' : ''}</td><td>${esc(r.from)}</td><td>${esc(r.src)}</td><td>${esc(r.by)}${r.at ? `<span class="t2">${fDT(r.at)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>`, { sub: 'Every rate this product has had, newest first. Entries cannot be edited or deleted.', flush: true })}</div>`;
    AFTER.push(() => bindProduct(p, isNew));
    return head(isNew ? 'New product' : `Edit ${p.en}`, { crumbs: [['Products', '#/products'], [isNew ? 'Create' : p.en, isNew ? '' : '#/products/' + p.slug], ...(isNew ? [] : [['Edit']])], acts })
      + `<div class="cols"><form id="pf" novalidate>
        ${sec('Product details', details, { sub: 'Names and text shown on the product page.' })}
        ${sec('Interest rate', rate, { sub: 'Shown on the product page, the rate board and the homepage.' })}
        ${sec('EMI calculator', calc, { id: 'sec-calc', hidden: !loan, sub: 'Limits used by the loan calculator.' })}
        ${sec('Features', feats, { sub: 'Shown as a list on the product page, in this order.' })}
        ${sec('Images', images)}
        <div class="form-acts"><button class="btn btn-p" type="submit">${isNew ? 'Create product' : 'Save changes'}</button><a class="btn btn-g" href="#/products">Cancel</a><span class="dirty">${ic('exclamation-triangle', 'ic-sm')}Unsaved changes</span></div>
      </form>
      <aside class="sticky">${sec('Website preview', `<div id="pv">${pvHtml(Object.assign({}, p, { calc: calcOn }))}</div><div class="pv-note">${ic('information-circle')}<span>Updates as you type. A shortened version of the product page${isNew ? '' : `; <a href="${SITE}products/${esc(p.slug)}.html" target="_blank" rel="noopener">open the live page</a>`}.</span></div>`)}</aside></div>${hist}`;
  }

  function bindProduct(p, isNew) {
    const form = $('#pf'); if (!form) return;
    bindDirty(form);
    let slugTouched = !isNew;
    const feats = () => $$('[data-rep]', form).map(t => t.value);
    const vals = () => Object.assign(collect(form), { f: feats() });
    let lastRate = p.rate;
    const refresh = () => {
      const v = vals();
      $('#pv').innerHTML = pvHtml(v);
      if (v.rate !== lastRate) { const r = $('#pvr'); if (r) { r.classList.remove('flash'); void r.offsetWidth; r.classList.add('flash'); } lastRate = v.rate; }
    };
    const setRep = list => { $('#rep').innerHTML = repHtml(list); refresh(); DIRTY = true; $('.dirty', form).classList.add('show'); };
    form.addEventListener('input', e => {
      const k = e.target.dataset.k;
      if (k === 'slug') slugTouched = true;
      if (k === 'en' && !slugTouched) $('#f-slug').value = slugify(e.target.value);
      if (k === 'max') { const h = $('#f-max-h'); if (h) h.textContent = +e.target.value > 0 ? words(+e.target.value) : 'For example 3000000 for Rs 30 lakh.'; }
      refresh();
    });
    form.addEventListener('change', e => {
      if (e.target.dataset.k === 't') $('#sec-calc').hidden = e.target.value !== 'loan';
      refresh();
    });
    form.addEventListener('click', e => {
      const b = e.target.closest('[data-up],[data-down],[data-del]');
      if (!b) return;
      const list = feats();
      if (b.dataset.up) { const i = +b.dataset.up; [list[i - 1], list[i]] = [list[i], list[i - 1]]; }
      else if (b.dataset.down) { const i = +b.dataset.down; [list[i + 1], list[i]] = [list[i], list[i + 1]]; }
      else list.splice(+b.dataset.del, 1);
      setRep(list);
    });
    $('[data-act="addfeat"]', form).addEventListener('click', () => {
      setRep([...feats(), '']);
      const t = $$('[data-rep]', form).pop(); if (t) t.focus();
    });
    const del = $('[data-act="delprod"]');
    if (del) del.addEventListener('click', () => modal({
      tone: 'd', icon: 'trash', title: `Delete ${p.en}?`, ok: 'Delete', okCls: 'btn-d',
      body: '<p>It disappears from the website, the rate board and the EMI calculator. Its rate history is kept in the activity log.</p>',
      onOk: () => {
        const key = pkey(p.slug);
        S.prod[key] = Object.assign({}, S.prod[key] || {}, { _deleted: true }); save();
        log(`Deleted the product ${p.en}`, 'trash'); toast('Deleted', `${p.en} was removed.`);
        DIRTY = false; location.hash = '#/products';
      },
    }));
    form.addEventListener('submit', e => {
      e.preventDefault();
      clearErrs(form);
      const v = vals();
      let ok = true;
      const bad = (k, m) => { markErr(form, k, m); ok = false; };
      if (!v.en.trim()) bad('en');
      if (!v.ne.trim()) bad('ne');
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug)) bad('slug');
      else if (v.slug !== p.slug && products().some(x => x.slug === v.slug)) bad('slug', 'Another product already uses this web address.');
      if (!/\d/.test(v.rate || '')) bad('rate');
      if (v.t === 'loan' && v.calc) {
        if (!(v.r >= 1 && v.r <= 30)) bad('r');
        if (!(v.max > 0)) bad('max');
        if (!(v.yrs >= 1 && v.yrs <= 30)) bad('yrs');
      }
      if (!ok) return failed(form);
      const calcChanged = v.t === 'loan' && v.calc && hasCalc(p) && v.r !== p.r;
      const rateChanged = !isNew && (v.rate !== p.rate || calcChanged);
      if (!rateChanged) return commitProduct(p, v, isNew, false);
      const slides = rowsOf('slides').filter(s => s.kicker && s.kicker.toLowerCase() === v.en.toLowerCase());
      const impact = ['The product page and the rate board'];
      if (v.t === 'loan' && v.calc) impact.push(`The EMI calculator, at ${v.r}%`);
      slides.forEach(s => impact.push(`The homepage slide “${s.title}” states the rate in its text. Update that slide too.`));
      impact.push('The current rate moves to the rate history');
      const when = v.eff ? fDate(v.eff) : 'today';
      modal({
        tone: 'w', icon: 'banknotes', title: `Change the ${v.en} rate?`, ok: 'Change rate',
        body: `${v.rate !== p.rate ? `<div class="cmp num"><s>${esc(p.rate)}</s>${ic('arrow-right')}<span>${esc(v.rate)}</span></div>` : ''}<p>From ${esc(when)}, members see the new rate on:</p><ul class="impact">${impact.map(x => `<li>${ic('check-circle')}<span>${esc(x)}</span></li>`).join('')}</ul>`,
        onOk: () => commitProduct(p, v, isNew, true),
      });
    });
  }
  function commitProduct(p, v, isNew, rateChanged) {
    const key = isNew ? v.slug : pkey(p.slug);
    const o = Object.assign({}, S.prod[key] || {}, {
      slug: v.slug, en: v.en.trim(), ne: v.ne.trim(), t: v.t, slogan: v.slogan, hidden: !v.show, rate: v.rate.trim(), note: v.note,
      img: v.img, photo: v.photo, feat: v.feat, f: v.f.map(s => s.trim()).filter(Boolean), calc: v.t === 'loan' && !!v.calc,
    });
    if (v.t === 'loan' && v.calc) Object.assign(o, { r: v.r, max: v.max, yrs: v.yrs });
    if (rateChanged) o._hist = [...(o._hist || []), { rate: o.rate, prev: p.rate, from: fDate(v.eff || todayISO()), by: me().name, at: new Date().toISOString() }];
    if (isNew) o._new = true;
    S.prod[key] = o; save();
    if (isNew) log(`Created the product ${o.en}`, 'plus');
    else if (rateChanged) log(`Changed the ${o.en} rate from ${p.rate} to ${o.rate}`, 'banknotes');
    else log(`Updated the product ${o.en}`);
    toast(isNew ? 'Product created' : rateChanged ? 'Rate changed' : 'Changes saved', `${o.en} is up to date. In this mockup the demo website stays as it is.`);
    DIRTY = false;
    const target = '#/products/' + o.slug;
    if (location.hash !== target) location.hash = target; else route();
  }

  /* ---------------- feedback ---------------- */
  const pageName = u => { try { const p = new URL(u).pathname.split('/').filter(Boolean).pop() || ''; return !p || p === 'index.html' || p === 'busa-website-demo' ? 'Homepage' : p.replace('.html', '').replace(/-/g, ' '); } catch (_) { return u; } };
  function vFeedback() {
    const rows = feedback(), site = rows.filter(f => f.src === 'site').length;
    const callout = `<div class="callout i">${ic('information-circle')}<div>${site ? `<b>${plural(site, 'message')} from the demo website</b> in this browser ${site === 1 ? 'is' : 'are'} included below. ` : ''}Send feedback from the <a href="${SITE}index.html" target="_blank" rel="noopener">demo website</a> in this browser and it appears here, marked <span class="bd bd-i">This browser</span>. The other messages are samples.</div></div>`;
    return head('Feedback', { crumbs: [['Feedback', '#/feedback'], ['List']], sub: 'Suggestions, complaints and appreciation sent with the Feedback button on the website.' }) + callout + table({
      id: 'feedback', label: 'feedback', rows, href: r => '#/feedback/' + r.id,
      search: r => `${r.ref} ${r.name || ''} ${r.contact || ''} ${r.message} ${r.centre || ''}`,
      tabs: [['all', 'All', () => true], ['new', 'New', r => r.status === 'new'], ['progress', 'In progress', r => r.status === 'progress'], ['resolved', 'Resolved', r => r.status === 'resolved']],
      filter: { label: 'All types', opts: Object.entries(TYPES).map(([k, [l]]) => [k, l, r => r.type === k]) },
      cols: [
        { h: 'Reference', c: r => `<b class="num">${esc(r.ref)}</b>${r.src === 'site' ? '<span class="t2"><span class="bd bd-i">This browser</span></span>' : ''}` },
        { h: 'Type', c: r => `${tyBadge(r.type)}` },
        { h: 'Message', c: r => `<span class="clip2 ${isNe(r.message) ? 'ne' : ''}">${esc(r.message)}</span><span class="t2">${esc(r.name || 'Anonymous')}${r.centre && r.centre !== 'Not specific' ? `, ${esc(r.centre)}` : ''}</span>` },
        { h: 'Received', c: r => `${ago(r.createdAt)}<span class="t2">${fDate(r.createdAt)}</span>` },
        { h: 'Reply due', c: r => { if (!waiting(r)) return replied(r) ? '<span style="color:var(--muted)">Replied</span>' : '<span style="color:var(--faint)">—</span>'; const d = dueOf(r); return d < new Date() ? `<span class="overdue">Overdue</span><span class="t2">${fDate(d)}</span>` : `<span class="num">${fDate(d)}</span>`; } },
        { h: 'Status', c: r => `<span class="bd ${STATUS[r.status][1]}">${STATUS[r.status][0]}</span>` },
        { h: 'Assigned to', c: r => r.assignee ? `<span style="display:inline-flex;gap:8px;align-items:center;white-space:nowrap"><span class="avatar sm">${initials(r.assignee)}</span>${esc(r.assignee)}</span>` : '<span style="color:var(--faint)">Unassigned</span>' },
      ],
    });
  }
  function evHtml(e, f) {
    const T = {
      received: [ic('inbox'), '', `Received through the website${f.src === 'site' ? ' (sent from this browser)' : ''}`],
      assign: [ic('user'), 'i', e.to ? `${esc(e.who)} assigned this to ${esc(e.to)}` : `${esc(e.who)} removed the assignment`],
      status: [ic('check-circle'), 'p', `${esc(e.who)} changed the status to ${esc((STATUS[e.to] || [e.to])[0])}`],
      note: [ic('pencil-square'), 'w', `${esc(e.who)} added a note`],
      reply: [ic('paper-airplane'), 'p', `${esc(e.who)} replied by ${esc(e.channel || 'SMS')}`],
    }[e.type] || [ic('clock'), '', esc(e.type)];
    return `<li><span class="dotc ${T[1]}">${T[0]}</span><div style="flex:1;min-width:0"><b>${T[2]}</b><small>${fDT(e.at)}</small>${e.text ? `<div class="note ${isNe(e.text) ? 'ne' : ''}">${esc(e.text)}</div>` : ''}</div></li>`;
  }
  function vFeedbackItem(id) {
    const f = feedback().find(x => x.id === id);
    if (!f) return notFound();
    const due = dueOf(f), wait = waiting(f), canReply = !!(f.contact && f.reply);
    const acts = `${canReply ? `<button type="button" class="btn btn-p" data-act="reply">${ic('paper-airplane')}Reply</button>` : ''}${f.status !== 'resolved' ? `<button type="button" class="btn btn-s" data-act="resolve">${ic('check-circle')}Mark as resolved</button>` : `<button type="button" class="btn btn-g" data-act="reopen">${ic('arrow-path')}Reopen</button>`}`;
    let callout = '';
    if (f.type === 'complaint' && wait) {
      const late = due < new Date();
      callout = `<div class="callout w">${ic('exclamation-triangle')}<div><b>Complaint.</b> A first reply ${late ? `was due on ${fDate(due)} and is overdue` : `is due by ${fDate(due)}`}. ${canReply ? 'Use Reply to send an SMS or email.' : 'The sender left no contact details.'}</div></div>`;
    }
    const timeline = [{ type: 'received', at: f.createdAt }, ...f.events].sort((a, b) => new Date(a.at) - new Date(b.at));
    const msg = sec('Message', `<p class="msg ${isNe(f.message) ? 'ne' : ''}">${esc(f.message)}</p><div class="meta-row"><span>${ic('map-pin')}${esc(f.centre || 'Not specific')}</span><span>${ic('clock')}${fDT(f.createdAt)}</span><span>${ic('globe')}${f.lang === 'ne' ? 'Sent with the site in Nepali' : 'Sent with the site in English'}</span>${f.page ? `<span>${ic('link')}Sent from: ${esc(pageName(f.page))}</span>` : ''}</div>`,
      { right: `<span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end">${tyBadge(f.type)}${f.rating ? stars(f.rating) : ''}</span>` });
    const act = sec('Activity', `<ol class="timeline">${timeline.map(e => evHtml(e, f)).join('')}</ol>
      <div class="f" style="margin-top:4px"><label for="note">Add a note for the team</label><div class="inp"><textarea id="note" rows="3" placeholder="Only staff can see notes."></textarea></div><div style="margin-top:12px"><button type="button" class="btn btn-g" data-act="note">${ic('pencil-square')}Add note</button></div></div>`, { sub: 'Everything that happened to this message. Members never see notes.' });
    const handling = sec('Handling', `<div style="display:grid;gap:20px">
      ${fld({ k: 'status', label: 'Status', type: 'select', opts: Object.entries(STATUS).map(([k, [l]]) => [k, l]) }, f.status)}
      ${fld({ k: 'assignee', label: 'Assigned to', type: 'select', opts: STAFF }, f.assignee)}
      <dl class="dl"><div><dt>Reply due</dt><dd>${wait ? (due < new Date() ? `<span class="overdue">Overdue since ${fDate(due)}</span>` : fDate(due)) : replied(f) ? 'Replied' : 'No reply needed'}</dd></div></dl></div>`);
    const contact = f.contact ? (/@/.test(f.contact) ? `<a href="mailto:${esc(f.contact)}">${esc(f.contact)}</a>` : `<a href="tel:${esc(f.contact)}">${esc(f.contact)}</a>`) : 'Not given';
    const sender = sec('Sender', `<dl class="dl"><div><dt>Name</dt><dd>${esc(f.name || 'Anonymous')}</dd></div><div><dt>Mobile or email</dt><dd>${contact}</dd></div><div><dt>Member number</dt><dd>${esc(f.member || 'Not given')}</dd></div><div><dt>Wants a reply</dt><dd>${f.reply ? 'Yes' : 'No'}</dd></div><div><dt>Rating</dt><dd>${f.rating ? `${stars(f.rating)} ${f.rating} of 5` : 'Not given'}</dd></div></dl>`);
    AFTER.push(() => bindFeedbackItem(f));
    return head(f.ref, { crumbs: [['Feedback', '#/feedback'], [f.ref]], acts }) + callout
      + `<div class="cols"><div>${msg}<div style="margin-top:24px">${act}</div></div><div>${handling}<div style="margin-top:24px">${sender}</div></div></div>`;
  }
  function smsCount(t) {
    const uni = /[^\x00-\x7F]/.test(t), n = [...t].length;
    const parts = uni ? (n <= 70 ? 1 : Math.ceil(n / 67)) : (n <= 160 ? 1 : Math.ceil(n / 153));
    return `${n} characters, ${plural(parts, 'SMS', 'SMS messages')}${uni ? '. Nepali text fits 70 characters in one SMS.' : '.'}`;
  }
  function bindFeedbackItem(f) {
    const main = $('#main');
    const setStatus = to => {
      fbState(f.id).status = to; pushEv(f.id, { type: 'status', to });
      log(`Marked ${f.ref} as ${STATUS[to][0].toLowerCase()}`, 'check-circle');
      toast('Status updated', `${f.ref} is now ${STATUS[to][0].toLowerCase()}.`);
      route();
    };
    $('#f-status', main).addEventListener('change', e => setStatus(e.target.value));
    $('#f-assignee', main).addEventListener('change', e => {
      const to = e.target.value;
      fbState(f.id).assignee = to; pushEv(f.id, { type: 'assign', to });
      if (to && f.status === 'new') fbState(f.id).status = 'progress';
      save();
      log(to ? `Assigned ${f.ref} to ${to}` : `Unassigned ${f.ref}`, 'user');
      toast(to ? 'Assigned' : 'Unassigned', to ? `${to} is now handling ${f.ref}.` : `${f.ref} has no one assigned.`);
      route();
    });
    const r = $('[data-act="resolve"]'); if (r) r.onclick = () => setStatus('resolved');
    const o = $('[data-act="reopen"]'); if (o) o.onclick = () => setStatus('progress');
    $('[data-act="note"]', main).onclick = () => {
      const t = $('#note').value.trim();
      if (!t) { $('#note').focus(); return; }
      pushEv(f.id, { type: 'note', text: t });
      log(`Added a note to ${f.ref}`);
      toast('Note added', 'Only staff can see it.');
      route();
    };
    const rep = $('[data-act="reply"]');
    if (rep) rep.onclick = () => {
      const ch = /@/.test(f.contact) ? 'email' : 'SMS';
      const first = String(f.name || '').split(/\s+/)[0];
      const text = f.lang === 'ne'
        ? `नमस्ते ${f.name} जी, तपाईंको सन्देश (${f.ref}) प्राप्त भयो। हामी यसबारे बुझेर चाँडै सम्पर्क गर्नेछौं। बुदोल सामुदायिक बचत तथा ऋण सहकारी संस्था`
        : `Hello ${first}, thank you for your message (${f.ref}). We are looking into it and will contact you soon. Budol Samudayik SACCOS`;
      modal({
        wide: true,
        html: `<div class="m-b"><h2>Reply to ${esc(f.name || 'the sender')}</h2><p>Sent by ${ch} to ${esc(f.contact)}. The reply is saved in this message's activity.</p>
          <div class="f" style="margin-top:20px"><label for="rt">Message</label><div class="inp"><textarea id="rt" rows="5" class="${f.lang === 'ne' ? 'ne' : ''}">${esc(text)}</textarea></div><div class="hint" id="rc"></div></div></div>
          <div class="m-f end"><button type="button" class="btn btn-g" data-close>Cancel</button><button type="button" class="btn btn-p" data-ok>${ic('paper-airplane')}Send reply</button></div>`,
        onOpen: dlg => {
          const ta = $('#rt', dlg), rc = $('#rc', dlg);
          const upd = () => { rc.textContent = ch === 'SMS' ? smsCount(ta.value) : `${[...ta.value].length} characters.`; };
          ta.addEventListener('input', upd); upd(); ta.focus();
        },
        onOk: dlg => {
          const t = $('#rt', dlg).value.trim();
          if (!t) { $('#rt', dlg).focus(); return false; }
          pushEv(f.id, { type: 'reply', channel: ch === 'SMS' ? 'SMS' : 'email', text: t });
          if (f.status === 'new') { fbState(f.id).status = 'progress'; pushEv(f.id, { type: 'status', to: 'progress' }); }
          log(`Replied to ${f.ref} by ${ch}`, 'paper-airplane');
          toast('Reply sent', `Mockup only: no ${ch} was actually sent.`);
          setTimeout(route);
        },
      });
    };
  }

  /* ---------------- financial highlights ---------------- */
  function vHighlights() {
    const items = (S.hl && S.hl.items) || HL;
    const row = (h, i) => `<div class="hl-row">
      ${fld({ k: `en${i}`, label: 'Label in English', req: true }, h.en)}
      ${fld({ k: `ne${i}`, label: 'Label in Nepali', req: true, ne: true }, h.ne)}
      ${fld({ k: `v${i}`, label: h.kind === 'amt' ? 'Amount' : 'Number', type: 'number', step: h.kind === 'amt' ? '0.01' : '1', min: 0, pre: h.kind === 'amt' ? 'Rs' : '', req: true, hint: h.kind === 'amt' ? `Shown as ${words(h.v)}; the exact amount appears on hover.` : `Shown as ${fInt.format(h.v)}.`, err: 'Enter a number.' }, h.v)}
      ${h.kind === 'count' ? fld({ k: `d${i}`, label: 'Shown on hover', hint: h.dn ? `Nepali: ${h.dn}` : '' }, h.d) : '<div></div>'}
    </div>`;
    const preview = `<div class="tick-pv" id="tick">${items.map(h => `<span><small>${esc(h.en)}</small><b class="num">${h.kind === 'amt' ? words(h.v) : fInt.format(h.v)}</b></span>`).join('')}</div>`;
    AFTER.push(bindHighlights);
    return head('Financial highlights', { crumbs: [['Website'], ['Financial highlights']], sub: 'The six figures in the green bar on the homepage. Update them each month from the monthly report.' })
      + `<form id="hf" novalidate>${sec('Preview', preview, { sub: S.hl && S.hl.savedAt ? `Last updated ${fDT(S.hl.savedAt)} by ${esc(S.hl.by)}.` : 'Figures imported from budol.coop.np.' })}
      <div style="margin-top:24px">${sec('Figures', items.map(row).join(''), { flush: true })}</div>
      <div class="form-acts"><button class="btn btn-p" type="submit">Publish figures</button><a class="btn btn-g" href="#/dashboard">Cancel</a><span class="dirty">${ic('exclamation-triangle', 'ic-sm')}Unsaved changes</span></div></form>`;
  }
  function bindHighlights() {
    const form = $('#hf'); bindDirty(form);
    const base = (S.hl && S.hl.items) || HL;
    const read = () => { const v = collect(form); return base.map((h, i) => Object.assign({}, h, { en: v['en' + i], ne: v['ne' + i], v: v['v' + i], d: h.kind === 'count' ? v['d' + i] : h.d })); };
    form.addEventListener('input', e => {
      const items = read();
      $('#tick').innerHTML = items.map(h => `<span><small>${esc(h.en)}</small><b class="num">${h.v == null ? '—' : h.kind === 'amt' ? words(h.v) : fInt.format(h.v)}</b></span>`).join('');
      const k = e.target.dataset.k || '';
      if (k[0] === 'v') { const i = +k.slice(1), h = items[i], hint = $(`#f-${k}-h`); if (hint && h.v != null) hint.textContent = h.kind === 'amt' ? `Shown as ${words(h.v)}; the exact amount appears on hover.` : `Shown as ${fInt.format(h.v)}.`; }
    });
    form.addEventListener('submit', e => {
      e.preventDefault(); clearErrs(form);
      const items = read(); let ok = true;
      items.forEach((h, i) => { if (!h.en) { markErr(form, 'en' + i); ok = false; } if (!h.ne) { markErr(form, 'ne' + i); ok = false; } if (h.v == null || h.v < 0) { markErr(form, 'v' + i); ok = false; } });
      if (!ok) return failed(form);
      modal({
        tone: 'p', icon: 'presentation-chart-bar', title: 'Publish the new figures?', ok: 'Publish',
        body: '<p>The homepage ticker shows them straight away. Check them against the signed monthly report first.</p>',
        onOk: () => {
          S.hl = { items, savedAt: new Date().toISOString(), by: me().name }; save();
          log('Updated the financial highlights', 'presentation-chart-bar');
          toast('Figures published', 'In this mockup the demo website stays as it is.');
          DIRTY = false; route();
        },
      });
    });
  }

  /* ---------------- generic list + record ---------------- */
  function vList(k) {
    const R = RES[k];
    const acts = `<a class="btn btn-p" href="#/${k}/new">${ic(k === 'documents' ? 'cloud-arrow-up' : 'plus')}${esc(R.newLabel)}</a>`;
    return head(R.title, { crumbs: [[R.title, '#/' + k], ['List']], sub: R.sub, acts })
      + table(Object.assign({ id: k, label: R.title.toLowerCase(), rows: R.sort ? rowsOf(k).sort(R.sort) : rowsOf(k), href: r => `#/${k}/${r._id}`, search: R.search }, R.table))
      + (R.after ? R.after() : '');
  }
  function vRecord(k, id) {
    const R = RES[k], isNew = id === 'new';
    const rec = isNew ? R.blank() : rowsOf(k).find(r => r._id === id);
    if (!rec) return notFound();
    const name = isNew ? '' : R.name(rec);
    const site = !isNew && R.site && R.site(rec);
    const acts = isNew ? '' : `${site ? `<a class="btn btn-g" href="${esc(abs(site))}" target="_blank" rel="noopener">${ic('arrow-top-right-on-square')}View on website</a>` : ''}<button type="button" class="btn btn-do" data-act="delrec">${ic('trash')}Delete</button>`;
    const fields = R.fields(rec);
    AFTER.push(() => bindRecord(k, id, isNew, rec, fields));
    return head(isNew ? (k === 'documents' ? 'Upload document' : `New ${R.single}`) : `Edit ${R.single}`, { crumbs: [[R.title, '#/' + k], ...(isNew ? [['Create']] : [[clip(name, 48)], ['Edit']])], acts })
      + `<form id="rf" novalidate>${sec(isNew ? 'Details' : clip(name, 80), `<div class="grid2">${fields.map(f => fld(f, rec[f.k] ?? '')).join('')}</div>`)}
      <div class="form-acts"><button class="btn btn-p" type="submit">${isNew ? (k === 'vacancies' ? 'Post vacancy' : k === 'users' ? 'Send invitation' : 'Create') : 'Save changes'}</button><a class="btn btn-g" href="#/${k}">Cancel</a><span class="dirty">${ic('exclamation-triangle', 'ic-sm')}Unsaved changes</span></div></form>`;
  }
  function bindRecord(k, id, isNew, rec, fields) {
    const R = RES[k], form = $('#rf');
    bindDirty(form);
    $$('.area[data-src]', form).forEach(loadRich);
    $$('.photos[data-album]', form).forEach(loadAlbum);
    const del = $('[data-act="delrec"]');
    if (del) del.onclick = () => modal({
      tone: 'd', icon: 'trash', title: `Delete this ${R.single}?`, ok: 'Delete', okCls: 'btn-d',
      body: `<p>“${esc(clip(R.name(rec), 80))}” disappears from the website. This can't be undone.</p>`,
      onOk: () => {
        (S.rec[k] = S.rec[k] || {})[id] = Object.assign({}, (S.rec[k] || {})[id] || {}, { _deleted: true }); save();
        log(`Deleted the ${R.single} “${clip(R.name(rec), 60)}”`, 'trash'); toast('Deleted', `The ${R.single} was removed.`);
        DIRTY = false; location.hash = '#/' + k;
      },
    });
    form.addEventListener('submit', e => {
      e.preventDefault(); clearErrs(form);
      const v = collect(form); let ok = true;
      fields.forEach(f => { if (f.req && (v[f.k] == null || String(v[f.k]).trim() === '')) { markErr(form, f.k); ok = false; } });
      if (!ok) return failed(form);
      if (v.photos) v.count = v.photos.length;
      if (k === 'documents' && v.href) v.kind = /\.pdf$/i.test(v.href) || /^blob:/.test(v.href) ? 'PDF' : 'JPG';
      if (isNew) {
        const nid = k[0] + Date.now().toString(36);
        (S.added[k] = S.added[k] || []).unshift(Object.assign({}, v, { _id: nid, _added: true }));
      } else (S.rec[k] = S.rec[k] || {})[id] = Object.assign({}, (S.rec[k] || {})[id] || {}, v);
      save();
      const nm = R.name(Object.assign({}, rec, v));
      log(`${isNew ? 'Created' : 'Updated'} the ${R.single} “${clip(nm, 60)}”`, isNew ? 'plus' : 'pencil-square');
      toast(isNew ? (k === 'users' ? 'Invitation sent' : 'Created') : 'Changes saved', k === 'users' && isNew ? 'Mockup only: no email was sent.' : 'In this mockup the demo website stays as it is.');
      DIRTY = false; location.hash = '#/' + k;
    });
  }

  /* ---------------- activity ---------------- */
  function vActivity() {
    return head('Activity log', { crumbs: [['Settings'], ['Activity log']], sub: 'Every change made in the admin panel, with who made it. Entries cannot be edited or deleted.' }) + table({
      id: 'activity', label: 'activity', rows: allLog(), search: r => `${r.who} ${r.what}`, per: 25,
      cols: [
        { h: 'When', w: '200px', c: r => `${fDT(r.at)}<span class="t2">${ago(r.at)}</span>` },
        { h: 'Who', w: '200px', c: r => `<span style="display:inline-flex;gap:8px;align-items:center;white-space:nowrap"><span class="avatar sm gray">${r.who === 'System' ? ic(r.icon || 'arrow-path', 'ic-sm') : initials(r.who)}</span>${esc(r.who)}</span>` },
        { h: 'What changed', c: r => esc(r.what) },
      ],
    });
  }

  /* ---------------- errors ---------------- */
  const notFound = () => emptyBox('magnifying-glass', 'Page not found', 'This record may have been deleted, or the link is wrong.', '<a class="btn btn-g" href="#/dashboard">Go to the dashboard</a>');
  const forbidden = k => emptyBox('lock-closed', "You don't have access to this page", `The ${esc(me().label.toLowerCase())} role can't open ${esc(LABEL[k] || 'this page')}. Ask a manager if you need it.`, '<a class="btn btn-g" href="#/dashboard">Go to the dashboard</a>');

  /* ---------------- router ---------------- */
  const ROUTES = [
    [/^#\/(dashboard)?$/, vDashboard],
    [/^#\/products$/, vProducts],
    [/^#\/products\/new$/, () => vProductEdit(null)],
    [/^#\/products\/([\w-]+)$/, m => vProductEdit(m[1])],
    [/^#\/feedback$/, vFeedback],
    [/^#\/feedback\/([\w-]+)$/, m => vFeedbackItem(m[1])],
    [/^#\/highlights$/, vHighlights],
    [/^#\/activity$/, vActivity],
    [/^#\/(slides|pages|notices|albums|documents|team|centres|vacancies|users)$/, m => vList(m[1])],
    [/^#\/(slides|pages|notices|albums|documents|team|centres|vacancies|users)\/([\w.-]+)$/, m => vRecord(m[1], m[2])],
  ];
  let AFTER = [], SHOWN = '';
  function route() {
    if (!S.signedIn) { if (!$('.login')) shell(); return; }
    if (!$('.shell')) shell();
    const h = location.hash && location.hash !== '#' ? location.hash : '#/dashboard';
    CUR = (h.match(/^#\/([\w-]+)/) || [, 'dashboard'])[1];
    navRender(); topRender(); openSide(false); closeDrops();
    const main = $('#main');
    AFTER = []; DIRTY = false;
    let html = null;
    if (!can(CUR)) html = forbidden(CUR);
    else for (const [re, fn] of ROUTES) { const m = h.match(re); if (m) { html = fn(m); break; } }
    main.innerHTML = html == null ? notFound() : html;
    AFTER.forEach(f => f());
    document.title = `${(($('h1', main) || {}).textContent || 'Admin')} – BUSA admin mockup`;
    if (SHOWN !== h) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    SHOWN = h;
  }

  /* ---------------- global events ---------------- */
  let LAST = location.hash;
  window.addEventListener('hashchange', () => {
    if (DIRTY) {
      const target = location.hash;
      history.replaceState(null, '', LAST || '#/dashboard');
      modal({ tone: 'w', title: 'Leave without saving?', body: '<p>Your changes on this page will be lost.</p>', ok: 'Leave page', okCls: 'btn-d', cancel: 'Keep editing', onOk: () => { DIRTY = false; location.hash = target; } });
      return;
    }
    LAST = location.hash;
    route();
  });
  window.addEventListener('beforeunload', e => { if (DIRTY) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('storage', e => { if (e.key === FB_KEY && !DIRTY && /^#\/(dashboard|feedback)/.test(location.hash || '#/dashboard')) route(); });

  document.addEventListener('click', e => {
    const t = e.target;
    // table rows
    const tr = t.closest('tr[data-href]');
    if (tr && !t.closest('a,button,label,input,select,textarea')) { location.hash = tr.dataset.href; return; }
    // tabs + pager
    const tab = t.closest('[data-tab]');
    if (tab) {
      const [id, k] = tab.dataset.tab.split('|');
      TS[id].tab = k; TS[id].page = 1;
      $$(`[data-tab^="${id}|"]`).forEach(b => { const on = b === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      refreshTbl(id); return;
    }
    const pg = t.closest('[data-page]');
    if (pg && !pg.disabled) { const [id, n] = pg.dataset.page.split('|'); TS[id].page = +n; refreshTbl(id); $(`#tbl-${id}`).scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    // nav groups, burger, menus
    const grp = t.closest('[data-group]');
    if (grp) { const g = grp.dataset.group; closedGroups.has(g) ? closedGroups.delete(g) : closedGroups.add(g); navRender(); return; }
    if (t.closest('#burger')) { openSide(!$('#side').classList.contains('open')); return; }
    if (t.closest('#scrim')) { openSide(false); return; }
    for (const [btn, drop] of [['#bell', '#notif'], ['#ubtn', '#udrop']]) {
      if (t.closest(btn)) { const d = $(drop), on = !d.classList.contains('show'); closeDrops(d); d.classList.toggle('show', on); $(btn).setAttribute('aria-expanded', on); return; }
    }
    if (!t.closest('.drop,.gsearch')) closeDrops();
    if (t.closest('.drop a')) closeDrops();
    if (t.closest('[data-act="signout"]')) { S.signedIn = false; save(); history.replaceState(null, '', '#/login'); shell(); return; }
    // demo strip
    if (t.closest('#reset')) {
      modal({ tone: 'w', icon: 'arrow-path', title: 'Reset the mockup?', ok: 'Reset', body: '<p>All changes you made in this admin mockup are undone. Feedback sent from the demo website stays.</p>',
        onOk: () => { try { localStorage.removeItem(KEY); } catch (_) {} S = fresh(); for (const k in TS) delete TS[k]; $('#role').value = 'manager'; DIRTY = false; toast('Mockup reset', 'Everything is back to the imported content.'); shell(); route(); } });
      return;
    }
    // files
    const pick = t.closest('[data-pick]');
    if (pick) { pick.closest('.filef').querySelector('input[type=file]').click(); return; }
    const clr = t.closest('[data-clear]');
    if (clr) { setFile(clr.closest('.filef'), '', ''); return; }
    if (t.closest('[data-addphotos]')) { t.closest('.f').querySelector('[data-photos-in]').click(); return; }
    const rm = t.closest('[data-rmphoto]');
    if (rm) { const box = rm.closest('.photos'); rm.closest('.ph-tile').remove(); box.dispatchEvent(new Event('change', { bubbles: true })); return; }
    // rich text
    const cmd = t.closest('[data-cmd]');
    if (cmd) {
      e.preventDefault();
      const [c, arg] = cmd.dataset.cmd.split('|');
      const area = cmd.closest('.rich').querySelector('.area:not([hidden])');
      area.focus();
      if (c === 'createLink') { const u = prompt('Link address'); if (u) document.execCommand('createLink', false, u); }
      else document.execCommand(c, false, arg ? `<${arg}>` : null);
      area.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const rl = t.closest('[data-rl]');
    if (rl) {
      const rich = rl.closest('.rich');
      $$('[data-rl]', rich).forEach(b => b.classList.toggle('on', b === rl));
      $('[data-k="body"]', rich).hidden = rl.dataset.rl !== 'en';
      $('[data-k="body_ne"]', rich).hidden = rl.dataset.rl !== 'ne';
    }
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.drop-zone')) { e.preventDefault(); e.target.click(); }
    if (e.key === 'Escape') { closeDrops(); openSide(false); }
    if (e.key === 'Enter' && e.target.id === 'gs') { const a = $('#gres a'); if (a) { location.hash = a.getAttribute('href'); e.target.value = ''; closeDrops(); } }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.q) { const id = t.dataset.q; TS[id].q = t.value; TS[id].page = 1; refreshTbl(id); return; }
    if (t.id === 'gs') { const r = $('#gres'); r.innerHTML = gsearch(t.value); r.classList.toggle('show', !!r.innerHTML); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.filt) { TS[t.dataset.filt].f = t.value; TS[t.dataset.filt].page = 1; refreshTbl(t.dataset.filt); return; }
    if (t.dataset.per) { TS[t.dataset.per].per = +t.value; TS[t.dataset.per].page = 1; refreshTbl(t.dataset.per); return; }
    if (t.dataset.feat) {
      const slug = t.dataset.feat, p = product(slug), key = pkey(slug);
      S.prod[key] = Object.assign({}, S.prod[key] || {}, { feat: t.checked }); save();
      log(`${t.checked ? 'Featured' : 'Removed'} ${p.en} ${t.checked ? 'on' : 'from'} the homepage`, 'home');
      toast(t.checked ? 'Featured on the homepage' : 'Removed from the homepage', p.en);
      TBL.products.rows = products();
      return;
    }
    if (t.id === 'role') {
      S.role = t.value; save();
      for (const k in TS) delete TS[k];
      toast(`Viewing as ${me().label.toLowerCase()}`, me().desc);
      route(); return;
    }
    if (t.type === 'file' && t.closest('.filef')) {
      const file = t.files && t.files[0]; if (!file) return;
      setFile(t.closest('.filef'), URL.createObjectURL(file), file.name); return;
    }
    if (t.matches('[data-photos-in]')) {
      const box = t.closest('.f').querySelector('.photos');
      if (box.querySelector('.hint')) box.innerHTML = '';
      [...t.files].forEach(f => box.insertAdjacentHTML('beforeend', photoTile(URL.createObjectURL(f))));
      t.value = '';
    }
  });
  // drag and drop onto upload areas
  document.addEventListener('dragover', e => { if (e.target.closest('.drop-zone')) e.preventDefault(); });
  document.addEventListener('drop', e => {
    const z = e.target.closest('.drop-zone'); if (!z) return;
    e.preventDefault();
    const files = [...(e.dataTransfer && e.dataTransfer.files || [])]; if (!files.length) return;
    if (z.hasAttribute('data-addphotos')) {
      const box = z.closest('.f').querySelector('.photos');
      if (box.querySelector('.hint')) box.innerHTML = '';
      files.forEach(f => box.insertAdjacentHTML('beforeend', photoTile(URL.createObjectURL(f))));
      box.dispatchEvent(new Event('change', { bubbles: true }));
    } else setFile(z.closest('.filef'), URL.createObjectURL(files[0]), files[0].name);
  });

  /* ---------------- start ---------------- */
  $('#role').value = S.role;
  if (!location.hash || location.hash === '#') history.replaceState(null, '', S.signedIn ? '#/dashboard' : '#/login');
  LAST = location.hash;
  shell();
  route();
})();
