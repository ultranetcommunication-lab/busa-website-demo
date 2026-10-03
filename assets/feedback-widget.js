/*
 * BUSA feedback widget: side tab + slide-in panel.
 * Self-contained (injects its own styles). Configure before loading:
 *   window.BUSA_FEEDBACK = { endpoint: '/api/feedback' }   // real site: POST JSON here
 * With no endpoint it runs in demo mode and keeps submissions in this browser (localStorage).
 * Fires `busa-feedback:sent` on document with the submitted record as `detail`.
 */
(function () {
  'use strict';
  const cfg = Object.assign({
    endpoint: null,
    storageKey: 'busa-feedback',
    draftKey: 'busa-feedback-draft',
    email: 'info@budol.coop.np',
    officer: { en: 'Umesh Acharya', ne: 'उमेश आचार्य', phone: '9863192725' },
    lang: (document.documentElement.lang || 'en').startsWith('ne') ? 'ne' : 'en',
  }, window.BUSA_FEEDBACK || {});

  const reduce = document.documentElement.classList.contains('reduce-motion') ||
    (!/[?&]motion=on\b/.test(location.search) && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------------- strings ---------------- */
  const T = {
    en: {
      tab: 'Feedback', title: 'Share your feedback', sub: 'Suggestions, complaints and praise all reach our team.',
      rateQ: 'How was your experience with BUSA?', rateHint: 'Optional',
      rates: ['Very poor', 'Poor', 'Okay', 'Good', 'Excellent'],
      typeQ: 'What is it about?', types: { suggestion: 'Suggestion', complaint: 'Complaint', praise: 'Appreciation', website: 'Website issue' },
      centreQ: 'Service centre', centreHint: 'Optional',
      centres: ['Not specific', 'Head office, Budol', 'Tukucha Jagaran, Nala', 'Dhulikhel', 'Banepa, Char Dobato', 'Panchkhal, Tamaghat', 'This website'],
      msgQ: 'Your message', msgPh: 'Write in English or Nepali. Please do not share account passwords or PINs.',
      reply: "I'd like a reply", name: 'Full name', contact: 'Mobile number or email', member: 'Member number', memberHint: 'Optional',
      complaintNote: 'Complaints go to our grievance officer, who needs your name and contact details to respond.',
      privacy: 'We use your details only to respond to this message.',
      send: 'Send feedback', sending: 'Sending…',
      eType: 'Choose what your message is about.', eMsg: 'Write a message of at least 10 characters.',
      eName: 'Enter your name so we can reply.', eContact: 'Enter a 10-digit mobile number starting with 9, or a valid email.',
      eSend: `Your feedback could not be sent. Check your connection and try again, or email ${cfg.email}.`,
      doneTitle: 'Thank you. Your feedback was sent.', ref: 'Reference number', copy: 'Copy', copied: 'Copied',
      nextComplaint: (o, p) => `Our grievance officer, ${o}, will contact you about this complaint. You can also call ${p}.`,
      nextReply: c => `We will reply to ${c}.`, nextNone: 'We read every message and use it to improve our service.',
      again: 'Send another', emailCopy: 'Email a copy', close: 'Close',
      call: (o, p) => `Prefer to talk? Call our grievance officer, ${o}: ${p}`,
      draft: 'Your unsent draft was restored.', count: n => `${n}/1000`,
    },
    ne: {
      tab: 'सुझाव', title: 'सुझाव तथा गुनासो', sub: 'तपाईंको सुझाव, गुनासो र प्रशंसा हाम्रो टोलीसम्म पुग्छ।',
      rateQ: 'बुसासँगको तपाईंको अनुभव कस्तो रह्यो?', rateHint: 'ऐच्छिक',
      rates: ['धेरै नराम्रो', 'नराम्रो', 'ठीकै', 'राम्रो', 'उत्कृष्ट'],
      typeQ: 'विषय', types: { suggestion: 'सुझाव', complaint: 'गुनासो', praise: 'प्रशंसा', website: 'वेबसाइट समस्या' },
      centreQ: 'सेवा केन्द्र', centreHint: 'ऐच्छिक',
      centres: ['खास छैन', 'मुख्य कार्यालय, बुडोल', 'टुकुचा जागरण, नाला', 'धुलिखेल', 'बनेपा, चारदोबाटो', 'पाँचखाल, तामाघाट', 'यो वेबसाइट'],
      msgQ: 'तपाईंको सन्देश', msgPh: 'नेपाली वा अंग्रेजीमा लेख्नुहोस्। खाताको पासवर्ड वा पिन नलेख्नुहोस्।',
      reply: 'मलाई जवाफ चाहिन्छ', name: 'पूरा नाम', contact: 'मोबाइल नम्बर वा इमेल', member: 'सदस्य नम्बर', memberHint: 'ऐच्छिक',
      complaintNote: 'गुनासो सुनुवाइ अधिकारीले जवाफ दिन तपाईंको नाम र सम्पर्क विवरण चाहिन्छ।',
      privacy: 'तपाईंको विवरण यस सन्देशको जवाफ दिन मात्र प्रयोग गरिन्छ।',
      send: 'पठाउनुहोस्', sending: 'पठाउँदै…',
      eType: 'सन्देशको विषय छान्नुहोस्।', eMsg: 'कम्तीमा १० अक्षरको सन्देश लेख्नुहोस्।',
      eName: 'जवाफका लागि आफ्नो नाम लेख्नुहोस्।', eContact: '९ बाट सुरु हुने १० अङ्कको मोबाइल नम्बर वा सही इमेल लेख्नुहोस्।',
      eSend: `सन्देश पठाउन सकिएन। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्, वा ${cfg.email} मा इमेल गर्नुहोस्।`,
      doneTitle: 'धन्यवाद! तपाईंको सन्देश पठाइयो।', ref: 'सन्दर्भ नम्बर', copy: 'कपी', copied: 'कपी भयो',
      nextComplaint: (o, p) => `गुनासो सुनुवाइ अधिकारी ${o} ले तपाईंलाई सम्पर्क गर्नुहुनेछ। तपाईं ${p} मा फोन पनि गर्न सक्नुहुन्छ।`,
      nextReply: c => `हामी ${c} मा जवाफ दिनेछौं।`, nextNone: 'हामी हरेक सन्देश पढ्छौं र सेवा सुधारमा प्रयोग गर्छौं।',
      again: 'अर्को पठाउनुहोस्', emailCopy: 'इमेलमा प्रति पठाउनुहोस्', close: 'बन्द गर्नुहोस्',
      call: (o, p) => `कुरा गर्न चाहनुहुन्छ? गुनासो सुनुवाइ अधिकारी ${o}: ${p}`,
      draft: 'तपाईंको नपठाइएको मस्यौदा फर्काइयो।', count: n => `${toDev(n)}/१०००`,
    },
  };
  const DEV = '०१२३४५६७८९';
  function toDev(s) { return String(s).replace(/\d/g, d => DEV[d]); }
  let lang = cfg.lang;
  const t = k => T[lang][k];

  /* ---------------- styles ---------------- */
  const css = `
  .bfb-tab{position:fixed;right:0;top:50%;z-index:58;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;
    padding:14px 10px;border:0;border-radius:10px 0 0 10px;background:#D0122B;color:#fff;cursor:pointer;
    font:500 14px/1 Poppins,system-ui,sans-serif;box-shadow:0 8px 22px -8px rgba(208,18,43,.65);transition:padding .2s,background .2s}
  .bfb-tab:hover{background:#B00E24;padding-right:14px}
  .bfb-tab:focus-visible{outline:3px solid #E3A008;outline-offset:2px}
  .bfb-tab span{writing-mode:vertical-rl;transform:rotate(180deg);letter-spacing:.02em}
  .bfb-tab svg{width:20px;height:20px}
  .bfb-tab.nudge{animation:bfbNudge .9s ease 2}
  @keyframes bfbNudge{0%,100%{transform:translateY(-50%)}30%{transform:translate(-6px,-50%)}60%{transform:translate(0,-50%)}}
  dialog.bfb{position:fixed;inset:0 0 0 auto;margin:0;padding:0;border:0;width:min(440px,100vw);max-width:100vw;height:100dvh;max-height:100dvh;
    background:transparent;overflow:visible;color:#3D4956;font:16px/1.55 Mukta,system-ui,sans-serif}
  dialog.bfb::backdrop{background:rgba(3,40,22,.45);opacity:0;transition:opacity .3s}
  dialog.bfb.open::backdrop{opacity:1}
  .bfb-panel{height:100%;background:#fff;box-shadow:-20px 0 50px -20px rgba(0,0,0,.4);display:flex;flex-direction:column;transform:translateX(100%);transition:transform .38s cubic-bezier(.2,.7,.2,1)}
  dialog.bfb.open .bfb-panel{transform:none}
  .bfb-head{display:flex;align-items:flex-start;gap:12px;padding:20px 22px 16px;border-bottom:1px solid #E1E6EB;position:relative}
  .bfb-head::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:4px;background:linear-gradient(#0E8247 0 2px,#D0122B 2px 4px)}
  .bfb-head h2{margin:0;font:600 20px/1.25 Poppins,system-ui,sans-serif;color:#16202A}
  .bfb-head p{margin:4px 0 0;font-size:14.5px;color:#687482}
  .bfb-hbtns{margin-left:auto;display:flex;gap:8px;align-items:center}
  .bfb-lang{display:inline-flex;border:1px solid #E1E6EB;border-radius:7px;overflow:hidden}
  .bfb-lang button{border:0;background:#fff;padding:3px 9px;font:600 12.5px/1.4 Poppins,system-ui,sans-serif;color:#687482;cursor:pointer}
  .bfb-lang button[aria-pressed="true"]{background:#0A6B3B;color:#fff}
  .bfb-x{width:36px;height:36px;border-radius:8px;border:1px solid #E1E6EB;background:#fff;display:grid;place-items:center;cursor:pointer;color:#16202A}
  .bfb-x:hover{border-color:#0A6B3B;color:#0A6B3B}
  .bfb-body{flex:1;overflow:auto;padding:18px 22px 22px}
  .bfb fieldset{border:0;margin:0 0 18px;padding:0;min-width:0}
  .bfb legend,.bfb .bfb-lab{display:flex;justify-content:space-between;gap:10px;width:100%;padding:0;margin-bottom:8px;font:500 14.5px/1.4 Poppins,system-ui,sans-serif;color:#16202A}
  .bfb .hint{font:400 13px Mukta,system-ui,sans-serif;color:#687482}
  .bfb-faces{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
  .bfb-faces label{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px 6px;border:1px solid #E1E6EB;border-radius:10px;cursor:pointer;font-size:12px;color:#687482;text-align:center;line-height:1.2;transition:border-color .2s,background .2s,transform .2s}
  .bfb-faces label:hover{border-color:#0A6B3B;transform:translateY(-2px)}
  .bfb-faces svg{width:30px;height:30px;color:#687482;transition:color .2s,transform .25s}
  .bfb-faces input:checked + label{background:#EDF6F0;border-color:#0A6B3B;color:#064A29;font-weight:600}
  .bfb-faces input:checked + label svg{color:#0A6B3B;transform:scale(1.12)}
  .bfb-faces input:focus-visible + label,.bfb-chips input:focus-visible + label{outline:3px solid #E3A008;outline-offset:2px}
  .bfb-sr{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
  .bfb-chips{display:flex;flex-wrap:wrap;gap:8px}
  .bfb-chips label{border:1px solid #E1E6EB;border-radius:999px;padding:6px 14px;cursor:pointer;font-size:14.5px;color:#16202A;transition:border-color .2s,background .2s}
  .bfb-chips label:hover{border-color:#0A6B3B}
  .bfb-chips input:checked + label{background:#0A6B3B;border-color:#0A6B3B;color:#fff}
  .bfb-chips input[value="complaint"]:checked + label{background:#D0122B;border-color:#D0122B}
  .bfb select,.bfb input[type=text],.bfb input[type=tel],.bfb textarea{width:100%;border:1px solid #CBD3DA;border-radius:8px;padding:9px 12px;font:16px Mukta,system-ui,sans-serif;color:#16202A;background:#fff}
  .bfb textarea{min-height:120px;resize:vertical}
  .bfb select:focus,.bfb input:focus,.bfb textarea:focus{outline:none;border-color:#0A6B3B;box-shadow:0 0 0 3px #EDF6F0}
  .bfb [aria-invalid="true"]{border-color:#D0122B!important}
  .bfb-err{display:none;color:#B00E24;font-size:13.5px;margin-top:5px}
  .bfb-err.show{display:block}
  .bfb-count{text-align:right;font-size:12.5px;color:#687482;margin-top:3px}
  .bfb-count.over{color:#B00E24}
  .bfb-check{display:flex;gap:10px;align-items:center;font-size:15px;color:#16202A;cursor:pointer}
  .bfb-check input{width:18px;height:18px;accent-color:#0A6B3B}
  .bfb-contact{display:grid;gap:12px;margin-top:12px;padding:14px;border-radius:10px;background:#F4F6F8;overflow:hidden}
  .bfb-contact[hidden]{display:none}
  .bfb-note{font-size:13.5px;color:#064A29;background:#EDF6F0;border-radius:8px;padding:8px 10px;margin:10px 0 0}
  .bfb-note.warn{background:#FDECEE;color:#9E0D20}
  .bfb-privacy{font-size:13px;color:#687482;margin:6px 0 14px}
  .bfb-banner{display:none;background:#FDECEE;color:#9E0D20;border-radius:8px;padding:10px 12px;font-size:14px;margin-bottom:12px}
  .bfb-banner.show{display:block}
  .bfb-send{width:100%;display:flex;justify-content:center;align-items:center;gap:10px;border:0;border-radius:8px;background:#0A6B3B;color:#fff;padding:12px 18px;font:500 15px Poppins,system-ui,sans-serif;cursor:pointer;transition:background .2s}
  .bfb-send:hover{background:#064A29}
  .bfb-send[disabled]{opacity:.75;cursor:progress}
  .bfb-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;animation:bfbSpin .8s linear infinite;display:none}
  .bfb-send[disabled] .bfb-spin{display:inline-block}
  @keyframes bfbSpin{to{transform:rotate(360deg)}}
  .bfb-call{border-top:1px solid #E1E6EB;padding:12px 22px;font-size:13.5px;color:#3D4956;background:#FAFBFC}
  .bfb-call a{color:#0A6B3B;font-weight:600}
  .bfb-done{padding:34px 26px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:10px}
  .bfb-done[hidden]{display:none}
  .bfb-tick{width:68px;height:68px;border-radius:50%;background:#EDF6F0;display:grid;place-items:center}
  .bfb-tick svg{width:36px;height:36px;stroke:#0A6B3B;stroke-width:2.6;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:30;stroke-dashoffset:30}
  .bfb-done.show .bfb-tick svg{animation:bfbDraw .6s .15s ease-out forwards}
  @keyframes bfbDraw{to{stroke-dashoffset:0}}
  .bfb-done h3{margin:6px 0 0;font:600 19px/1.3 Poppins,system-ui,sans-serif;color:#16202A}
  .bfb-ref{display:flex;align-items:center;gap:10px;border:1px dashed #9CC9AE;border-radius:10px;padding:8px 12px;background:#F7FBF8}
  .bfb-ref small{display:block;font-size:12px;color:#687482;text-align:left}
  .bfb-ref b{font:600 16px Poppins,system-ui,sans-serif;color:#064A29;letter-spacing:.02em}
  .bfb-ref button{border:1px solid #CBD3DA;background:#fff;border-radius:6px;padding:3px 10px;font-size:13px;cursor:pointer}
  .bfb-done p{margin:0;max-width:34ch;font-size:15px}
  .bfb-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:8px}
  .bfb-actions button,.bfb-actions a{border:1px solid #CBD3DA;background:#fff;border-radius:8px;padding:8px 14px;font:500 14px Poppins,system-ui,sans-serif;color:#16202A;cursor:pointer;text-decoration:none}
  .bfb-actions .pri{background:#0A6B3B;border-color:#0A6B3B;color:#fff}
  @media (max-width:600px){.bfb-tab{padding:10px 7px;font-size:12.5px}.bfb-tab svg{width:17px;height:17px}.bfb-head{padding:16px}.bfb-body{padding:16px}.bfb-call{padding:12px 16px}}
  .bfb-rm .bfb-panel,.bfb-rm::backdrop,.bfb-tab.bfb-rm{transition:none!important;animation:none!important}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ---------------- markup ---------------- */
  const faces = [
    'M8 16.6c1.2-1.6 2.6-2.4 4-2.4s2.8.8 4 2.4', 'M8.6 16c1-.8 2.1-1.2 3.4-1.2s2.4.4 3.4 1.2', 'M8.6 15.4h6.8',
    'M8.6 14.4c1 .8 2.1 1.2 3.4 1.2s2.4-.4 3.4-1.2', 'M8 13.8c1.2 1.9 2.6 2.8 4 2.8s2.8-.9 4-2.8',
  ];
  const faceSvg = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9.2"/><circle cx="9" cy="10" r=".9" fill="currentColor"/><circle cx="15" cy="10" r=".9" fill="currentColor"/><path d="${d}"/></svg>`;
  const icMsg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>';

  const tab = document.createElement('button');
  tab.type = 'button'; tab.className = 'bfb-tab'; tab.setAttribute('aria-haspopup', 'dialog');
  const dlg = document.createElement('dialog');
  dlg.className = 'bfb'; dlg.setAttribute('aria-labelledby', 'bfb-title');
  if (reduce) { dlg.classList.add('bfb-rm'); tab.classList.add('bfb-rm'); }
  document.body.append(tab, dlg);

  function render() {
    tab.innerHTML = `${icMsg}<span>${t('tab')}</span>`;
    tab.setAttribute('aria-label', t('title'));
    const types = t('types');
    dlg.innerHTML = `
    <div class="bfb-panel">
      <div class="bfb-head">
        <div><h2 id="bfb-title">${t('title')}</h2><p>${t('sub')}</p></div>
        <div class="bfb-hbtns">
          <div class="bfb-lang" role="group" aria-label="Language"><button type="button" data-l="en" aria-pressed="${lang === 'en'}">EN</button><button type="button" data-l="ne" aria-pressed="${lang === 'ne'}">ने</button></div>
          <button type="button" class="bfb-x" aria-label="${t('close')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
      </div>
      <div class="bfb-body">
        <form class="bfb-form" novalidate>
          <div class="bfb-banner" role="alert"></div>
          <fieldset><legend>${t('rateQ')}<span class="hint">${t('rateHint')}</span></legend>
            <div class="bfb-faces">${t('rates').map((r, i) => `<input class="bfb-sr" type="radio" name="rating" id="bfb-r${i + 1}" value="${i + 1}"><label for="bfb-r${i + 1}">${faceSvg(faces[i])}<span>${r}</span></label>`).join('')}</div>
          </fieldset>
          <fieldset aria-describedby="bfb-e-type"><legend>${t('typeQ')}</legend>
            <div class="bfb-chips">${Object.entries(types).map(([v, l]) => `<input class="bfb-sr" type="radio" name="type" id="bfb-t-${v}" value="${v}"><label for="bfb-t-${v}">${l}</label>`).join('')}</div>
            <div class="bfb-err" id="bfb-e-type">${t('eType')}</div>
          </fieldset>
          <fieldset><label class="bfb-lab" for="bfb-centre">${t('centreQ')}<span class="hint">${t('centreHint')}</span></label>
            <select id="bfb-centre" name="centre">${t('centres').map((c, i) => `<option value="${i}">${c}</option>`).join('')}</select>
          </fieldset>
          <fieldset><label class="bfb-lab" for="bfb-msg">${t('msgQ')}</label>
            <textarea id="bfb-msg" name="message" maxlength="1000" placeholder="${t('msgPh')}" aria-describedby="bfb-e-msg bfb-count"></textarea>
            <div class="bfb-count" id="bfb-count"></div>
            <div class="bfb-err" id="bfb-e-msg">${t('eMsg')}</div>
            <div class="bfb-note" id="bfb-draft" hidden>${t('draft')}</div>
          </fieldset>
          <fieldset>
            <label class="bfb-check"><input type="checkbox" name="reply" id="bfb-reply">${t('reply')}</label>
            <div class="bfb-note warn" id="bfb-cnote" hidden>${t('complaintNote')}</div>
            <div class="bfb-contact" id="bfb-contact" hidden>
              <div><label class="bfb-lab" for="bfb-name">${t('name')}</label><input type="text" id="bfb-name" name="name" autocomplete="name" aria-describedby="bfb-e-name"><div class="bfb-err" id="bfb-e-name">${t('eName')}</div></div>
              <div><label class="bfb-lab" for="bfb-contactf">${t('contact')}</label><input type="text" id="bfb-contactf" name="contact" autocomplete="email" inputmode="email" aria-describedby="bfb-e-contact"><div class="bfb-err" id="bfb-e-contact">${t('eContact')}</div></div>
              <div><label class="bfb-lab" for="bfb-member">${t('member')}<span class="hint">${t('memberHint')}</span></label><input type="text" id="bfb-member" name="member"></div>
            </div>
          </fieldset>
          <p class="bfb-privacy">${t('privacy')}</p>
          <button class="bfb-send" type="submit"><span class="bfb-spin" aria-hidden="true"></span><span class="bfb-send-l">${t('send')}</span></button>
        </form>
        <div class="bfb-done" hidden role="status" aria-live="polite"></div>
      </div>
      <div class="bfb-call">${t('call')(cfg.officer[lang], `<a href="tel:${cfg.officer.phone}">${lang === 'ne' ? toDev(cfg.officer.phone) : cfg.officer.phone}</a>`)}</div>
    </div>`;
    wire();
  }

  /* ---------------- behaviour ---------------- */
  let state = {};
  const $ = s => dlg.querySelector(s);

  function wire() {
    const form = $('.bfb-form');
    $('.bfb-x').onclick = close;
    dlg.querySelectorAll('.bfb-lang button').forEach(b => b.onclick = () => { saveState(); lang = b.dataset.l; render(); restoreState(); });
    const msg = $('#bfb-msg'), reply = $('#bfb-reply');
    const count = () => { $('#bfb-count').textContent = t('count')(msg.value.length); };
    msg.addEventListener('input', () => { count(); clearErr('msg'); saveDraft(); });
    form.addEventListener('change', e => {
      if (e.target.name === 'type') { clearErr('type'); syncComplaint(); }
      saveDraft();
    });
    reply.addEventListener('change', syncReply);
    ['name', 'contactf'].forEach(id => $('#bfb-' + id).addEventListener('input', () => clearErr(id === 'contactf' ? 'contact' : id)));
    form.addEventListener('submit', submit);
    count();
  }
  function syncComplaint() {
    const isComplaint = typeVal() === 'complaint', reply = $('#bfb-reply');
    $('#bfb-cnote').hidden = !isComplaint;
    if (isComplaint) reply.checked = true;
    reply.disabled = isComplaint;
    syncReply();
  }
  function syncReply() { $('#bfb-contact').hidden = !$('#bfb-reply').checked; }
  const typeVal = () => (dlg.querySelector('input[name=type]:checked') || {}).value || '';
  function showErr(k, input) { $('#bfb-e-' + k).classList.add('show'); if (input) input.setAttribute('aria-invalid', 'true'); }
  function clearErr(k) {
    const e = $('#bfb-e-' + k); if (e) e.classList.remove('show');
    const map = { msg: '#bfb-msg', name: '#bfb-name', contact: '#bfb-contactf' };
    if (map[k]) $(map[k]).removeAttribute('aria-invalid');
  }

  function validate() {
    let first = null;
    const mark = (k, el) => { showErr(k, el); first = first || el; };
    if (!typeVal()) mark('type', dlg.querySelector('input[name=type]'));
    const msg = $('#bfb-msg');
    if (msg.value.trim().length < 10) mark('msg', msg);
    if ($('#bfb-reply').checked) {
      const name = $('#bfb-name'), c = $('#bfb-contactf'), v = c.value.trim().replace(/[\s-]/g, '');
      if (name.value.trim().length < 2) mark('name', name);
      const okPhone = /^9\d{9}$/.test(v.replace(/^\+?977/, '')), okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.value.trim());
      if (!okPhone && !okMail) mark('contact', c);
    }
    if (first) first.focus();
    return !first;
  }

  function makeRef() {
    const d = new Date(), p = n => String(n).padStart(2, '0');
    return `FB-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  async function submit(e) {
    e.preventDefault();
    $('.bfb-banner').classList.remove('show');
    if (!validate()) return;
    const btn = $('.bfb-send'), label = $('.bfb-send-l');
    btn.disabled = true; label.textContent = t('sending');
    const f = new FormData($('.bfb-form'));
    const record = {
      ref: makeRef(), createdAt: new Date().toISOString(), lang,
      rating: +f.get('rating') || null, type: typeVal(),
      centre: T.en.centres[+f.get('centre') || 0],
      message: (f.get('message') || '').trim(),
      reply: $('#bfb-reply').checked,
      name: $('#bfb-reply').checked ? (f.get('name') || '').trim() : '',
      contact: $('#bfb-reply').checked ? (f.get('contact') || '').trim() : '',
      member: $('#bfb-reply').checked ? (f.get('member') || '').trim() : '',
      page: location.href,
    };
    try {
      if (cfg.endpoint) {
        const res = await fetch(cfg.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(record) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } else {
        await new Promise(r => setTimeout(r, 900)); // demo: simulate the network
        const list = JSON.parse(localStorage.getItem(cfg.storageKey) || '[]');
        list.unshift(record); localStorage.setItem(cfg.storageKey, JSON.stringify(list));
      }
      try { localStorage.removeItem(cfg.draftKey); } catch (_) {}
      document.dispatchEvent(new CustomEvent('busa-feedback:sent', { detail: record }));
      showDone(record);
    } catch (err) {
      $('.bfb-banner').textContent = t('eSend');
      $('.bfb-banner').classList.add('show');
      btn.disabled = false; label.textContent = t('send');
    }
  }

  function showDone(r) {
    $('.bfb-form').hidden = true;
    const done = $('.bfb-done');
    const next = r.type === 'complaint' ? t('nextComplaint')(cfg.officer[lang], lang === 'ne' ? toDev(cfg.officer.phone) : cfg.officer.phone)
      : r.reply ? t('nextReply')(r.contact) : t('nextNone');
    const mail = `mailto:${cfg.email}?subject=${encodeURIComponent(`Feedback ${r.ref} (${T.en.types[r.type]})`)}&body=${encodeURIComponent(`${r.message}\n\nReference: ${r.ref}${r.name ? `\nName: ${r.name}` : ''}${r.contact ? `\nContact: ${r.contact}` : ''}`)}`;
    done.innerHTML = `
      <div class="bfb-tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
      <h3>${t('doneTitle')}</h3>
      <div class="bfb-ref"><span><small>${t('ref')}</small><b>${r.ref}</b></span><button type="button" class="bfb-copy">${t('copy')}</button></div>
      <p>${next}</p>
      <div class="bfb-actions"><button type="button" class="pri bfb-again">${t('again')}</button><a href="${mail}">${t('emailCopy')}</a><button type="button" class="bfb-close2">${t('close')}</button></div>`;
    done.hidden = false;
    requestAnimationFrame(() => done.classList.add('show'));
    done.querySelector('.bfb-copy').onclick = e => { navigator.clipboard?.writeText(r.ref); e.target.textContent = t('copied'); };
    done.querySelector('.bfb-again').onclick = () => { render(); focusFirst(); };
    done.querySelector('.bfb-close2').onclick = () => { close(); setTimeout(render, reduce ? 0 : 400); };
    done.querySelector('.bfb-again').focus();
  }

  /* draft + state (kept when switching language or closing) */
  function saveDraft() {
    try { localStorage.setItem(cfg.draftKey, JSON.stringify(collect())); } catch (_) {}
  }
  function collect() {
    const g = s => $(s);
    return {
      rating: (dlg.querySelector('input[name=rating]:checked') || {}).value || '', type: typeVal(),
      centre: g('#bfb-centre')?.value || '0', message: g('#bfb-msg')?.value || '',
      reply: g('#bfb-reply')?.checked || false, name: g('#bfb-name')?.value || '', contact: g('#bfb-contactf')?.value || '', member: g('#bfb-member')?.value || '',
    };
  }
  function saveState() { state = collect(); }
  function restoreState(s = state, showNote = false) {
    if (!s) return;
    if (s.rating) { const r = $('#bfb-r' + s.rating); if (r) r.checked = true; }
    if (s.type) { const r = $('#bfb-t-' + s.type); if (r) r.checked = true; }
    $('#bfb-centre').value = s.centre || '0';
    $('#bfb-msg').value = s.message || '';
    $('#bfb-reply').checked = !!s.reply;
    $('#bfb-name').value = s.name || ''; $('#bfb-contactf').value = s.contact || ''; $('#bfb-member').value = s.member || '';
    syncComplaint(); syncReply();
    $('#bfb-count').textContent = t('count')((s.message || '').length);
    if (showNote && s.message) $('#bfb-draft').hidden = false;
  }
  function loadDraft() {
    try { const d = JSON.parse(localStorage.getItem(cfg.draftKey) || 'null'); if (d && d.message && d.message.trim()) restoreState(d, true); } catch (_) {}
  }
  function focusFirst() { const f = $('input[name=rating]'); if (f) f.focus(); }

  /* open / close with slide animation; open({ type: 'complaint' }) preselects a subject */
  function open(opts = {}) {
    if (dlg.open) return;
    if (!$('.bfb-form') || $('.bfb-form').hidden) render();
    loadDraft();
    if (opts.type) { const r = $('#bfb-t-' + opts.type); if (r) { r.checked = true; syncComplaint(); } }
    dlg.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => dlg.classList.add('open')));
    tab.setAttribute('aria-expanded', 'true');
    setTimeout(focusFirst, 30);
  }
  function close() {
    if (!dlg.open) return;
    if ($('.bfb-form') && !$('.bfb-form').hidden) saveDraft();
    dlg.classList.remove('open');
    tab.setAttribute('aria-expanded', 'false');
    const finish = () => { dlg.close(); tab.focus({ preventScroll: true }); };
    if (reduce) finish(); else setTimeout(finish, 380);
  }
  tab.addEventListener('click', () => open());
  // Follow the page's language switch, keeping anything already typed.
  function setLang(l) {
    if (!T[l] || l === lang) return;
    const showingForm = $('.bfb-form') && !$('.bfb-form').hidden;
    if (showingForm) saveState();
    lang = l; render();
    if (showingForm) restoreState();
  }
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  dlg.addEventListener('click', e => { if (e.target === dlg) close(); });

  /* one gentle nudge of the tab after a short while, unless already used */
  if (!reduce) setTimeout(() => { if (!dlg.open) { tab.classList.add('nudge'); tab.addEventListener('animationend', () => tab.classList.remove('nudge'), { once: true }); } }, 6000);

  render();
  tab.setAttribute('aria-expanded', 'false');
  window.BUSAFeedback = { open, close, setLang };
  // Any element with data-feedback opens the panel; data-feedback="complaint" preselects the subject.
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-feedback]');
    if (!el) return;
    e.preventDefault();
    open({ type: el.dataset.feedback || undefined });
  });
})();
