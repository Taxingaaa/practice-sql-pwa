(() => {
  const I18N = {
    ja: {settings:'設定',review:'復習',history:'履歴',backup:'全データ保存',restore:'復元',reset:'進捗初期化',unsolved:'未正解',weak:'苦手',favorites:'お気に入り',saved:'保存しました',menu:'メニュー',close:'閉じる',save:'保存',language:'Language',theme:'テーマ',font:'文字サイズ',goal:'1日の目標',system:'端末設定',light:'ライト',dark:'ダーク',invalid:'バックアップ形式が不正です',resetConfirm:'進捗をすべて初期化しますか？',mismatch:'不正解の詳細'},
    en: {settings:'Settings',review:'Review',history:'History',backup:'Back up all data',restore:'Restore',reset:'Reset progress',unsolved:'Unsolved',weak:'Weak',favorites:'Favorites',saved:'Saved',menu:'Menu',close:'Close',save:'Save',language:'Language',theme:'Theme',font:'Font size',goal:'Daily goal',system:'System',light:'Light',dark:'Dark',invalid:'Invalid backup file',resetConfirm:'Reset all progress?',mismatch:'Mismatch details'}
  };
  let config = {lang:'auto', theme:'system', font:16, goal:5};
  const language = () => config.lang === 'auto' ? (navigator.language.startsWith('ja') ? 'ja' : 'en') : config.lang;
  const tr = key => I18N[language()][key] || key;

  async function loadConfig() {
    config = {...config, ...(await get('settings', {}))};
    applyConfig();
  }
  function applyConfig() {
    const theme = config.theme === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.fontSize = `${config.font}px`;
    document.documentElement.lang = language();
  }
  function closeMenu() {
    document.querySelector('.nav')?.classList.remove('open');
    document.querySelector('.menu-backdrop')?.classList.remove('open');
    document.querySelector('.menu-toggle')?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
  function installMenu() {
    const head = document.querySelector('.head');
    const navEl = document.querySelector('.nav');
    if (!head || !navEl) return;

    if (!navEl.querySelector('[data-extra="review"]')) {
      const extras = [
        ['review', tr('review'), showReview],
        ['history', tr('history'), showHistory],
        ['settings', tr('settings'), showSettings]
      ];
      extras.forEach(([id, label, handler]) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.extra = id;
        button.textContent = label;
        button.addEventListener('click', () => { closeMenu(); handler(); });
        navEl.appendChild(button);
      });
    }
    navEl.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', closeMenu));

    if (!head.querySelector('.menu-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'menu-toggle';
      toggle.setAttribute('aria-label', tr('menu'));
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      toggle.addEventListener('click', () => {
        const open = !navEl.classList.contains('open');
        navEl.classList.toggle('open', open);
        document.querySelector('.menu-backdrop')?.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('menu-open', open);
      });
      head.insertBefore(toggle, navEl);
    }
    if (!document.querySelector('.menu-backdrop')) {
      const backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'menu-backdrop';
      backdrop.setAttribute('aria-label', tr('close'));
      backdrop.addEventListener('click', closeMenu);
      document.body.appendChild(backdrop);
    }
  }
  function customPage(name, html) {
    page = name;
    app.innerHTML = nav() + '<main id="main"></main>';
    document.querySelectorAll('[data-page]').forEach(button => {
      button.onclick = () => { page = button.dataset.page; closeMenu(); render(); };
    });
    installMenu();
    document.querySelector('#main').innerHTML = html;
  }
  async function allData() {
    return {
      schema_version: 2,
      exported_at: new Date().toISOString(),
      settings: await get('settings', {}), progress: await get('progress', {}),
      custom: await get('custom', []), labDb: await get('labDb', null),
      drafts: await get('drafts', {}), favorites: await get('favorites', []),
      history: await get('history', []), activity: await get('activity', {})
    };
  }
  function downloadJson(name, value) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], {type:'application/json'}));
    a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  async function showSettings() {
    customPage('settings', `<section class="card settings-card"><h2>${tr('settings')}</h2>
      <label>${tr('language')}<select id="settingLang"><option value="auto">Auto</option><option value="ja">日本語</option><option value="en">English</option></select></label>
      <label>${tr('theme')}<select id="settingTheme"><option value="system">${tr('system')}</option><option value="light">${tr('light')}</option><option value="dark">${tr('dark')}</option></select></label>
      <label>${tr('font')}<input id="settingFont" type="range" min="14" max="22"><output id="fontValue"></output></label>
      <label>${tr('goal')}<input id="settingGoal" type="number" min="1" max="100"></label>
      <div class="toolbar"><button class="btn" id="saveSettings">${tr('save')}</button><button class="btn secondary" id="backupAll">${tr('backup')}</button><label class="btn ghost">${tr('restore')}<input class="hidden" type="file" id="restoreAll" accept="application/json"></label><button class="btn danger" id="resetProgress">${tr('reset')}</button></div></section>`);
    settingLang.value = config.lang; settingTheme.value = config.theme; settingFont.value = config.font; settingGoal.value = config.goal; fontValue.value = `${config.font}px`;
    settingFont.oninput = () => fontValue.value = `${settingFont.value}px`;
    saveSettings.onclick = async () => { config = {lang:settingLang.value, theme:settingTheme.value, font:+settingFont.value, goal:Math.max(1,+settingGoal.value||5)}; await set('settings', config); applyConfig(); location.reload(); };
    backupAll.onclick = async () => downloadJson('practice-sql-backup-v2.json', await allData());
    restoreAll.onchange = async e => { try { const d=JSON.parse(await e.target.files[0].text()); if(d.schema_version!==2) throw Error(tr('invalid')); for(const k of ['settings','progress','custom','labDb','drafts','favorites','history','activity']) if(k in d) await set(k,d[k]); location.reload(); } catch(err) { alert(err.message); } };
    resetProgress.onclick = async () => { if(confirm(tr('resetConfirm'))) { await set('progress',{}); await set('activity',{}); location.reload(); } };
  }
  async function showReview() {
    const p=await progress(), fav=new Set(await get('favorites',[]));
    customPage('review', `<section class="card"><h2>${tr('review')}</h2><div class="toolbar"><button class="btn reviewMode" data-mode="unsolved">${tr('unsolved')}</button><button class="btn reviewMode" data-mode="weak">${tr('weak')}</button><button class="btn reviewMode" data-mode="favorites">${tr('favorites')}</button></div></section><div id="reviewList" class="grid"></div>`);
    const draw=mode=>{let a=problems;if(mode==='unsolved')a=a.filter(x=>!p[x.problem_uid]?.correct);if(mode==='weak')a=a.filter(x=>(p[x.problem_uid]?.attempts||0)>=3&&!p[x.problem_uid]?.correct);if(mode==='favorites')a=a.filter(x=>fav.has(x.problem_uid));reviewList.innerHTML=a.map(x=>`<section class="card"><h3>${esc(x.title)}</h3><button class="btn openReview" data-id="${x.problem_uid}">Start</button></section>`).join('')||'<section class="card">0</section>';};
    document.querySelectorAll('.reviewMode').forEach(b=>b.onclick=()=>draw(b.dataset.mode));reviewList.onclick=e=>{const b=e.target.closest('.openReview');if(b)open(problems.find(x=>x.problem_uid===b.dataset.id));};draw('unsolved');
  }
  async function showHistory() {
    const h=await get('history',[]);
    customPage('history', `<section class="card"><h2>${tr('history')}</h2>${h.map(x=>`<div class="history-item"><small>${esc(x.at)} ${x.ok?'OK':'NG'}</small><pre>${esc(x.sql)}</pre></div>`).join('')||'<p>0</p>'}</section>`);
  }
  async function hookPractice() {
    if(page!=='practice'||!current)return;const area=document.querySelector('#sql');if(!area||area.dataset.enhanced)return;area.dataset.enhanced='1';
    const drafts=await get('drafts',{});if(drafts[current.problem_uid])area.value=drafts[current.problem_uid];area.addEventListener('input',()=>{clearTimeout(area._save);area._save=setTimeout(async()=>{drafts[current.problem_uid]=area.value;await set('drafts',drafts);},400);});
    let favorites=await get('favorites',[]);const fav=document.createElement('button');fav.type='button';fav.className='btn secondary';fav.textContent=tr('favorites');fav.onclick=async()=>{favorites=favorites.includes(current.problem_uid)?favorites.filter(x=>x!==current.problem_uid):[...favorites,current.problem_uid];await set('favorites',favorites);alert(tr('saved'));};document.querySelector('#judge')?.parentElement.appendChild(fav);
    const judge=document.querySelector('#judge');if(judge&&!judge.dataset.history){judge.dataset.history='1';judge.addEventListener('click',()=>setTimeout(async()=>{const ok=!!document.querySelector('#out .ok'),history=await get('history',[]);history.unshift({at:new Date().toISOString(),problem:current.problem_uid,sql:area.value,ok});await set('history',history.slice(0,100));if(!ok)try{const u=result(area.value,current),x=result(current.expected_sql,current),msg=[];if(JSON.stringify(u.columns)!==JSON.stringify(x.columns))msg.push('Columns differ');if(u.values.length!==x.values.length)msg.push(`Rows ${u.values.length}/${x.values.length}`);if(JSON.stringify(u.values)!==JSON.stringify(x.values))msg.push('Values or row order differ');document.querySelector('#out')?.insertAdjacentHTML('beforeend',`<div class="diffbox"><h3>${tr('mismatch')}</h3>${msg.map(v=>`<p>${esc(v)}</p>`).join('')}</div>`);}catch{}},120));}
  }
  const baseRender=render;
  window.render=function(){baseRender();setTimeout(()=>{installMenu();hookPractice();},0);};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
  loadConfig().then(()=>{installMenu();hookPractice();});
})();
