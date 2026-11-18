(() => {
  const TEXT = {
    ja: { settings:'設定', review:'復習', history:'履歴', menu:'メニュー', close:'閉じる', backup:'全データ保存', restore:'復元', reset:'進捗初期化', unsolved:'未正解', weak:'苦手', favorites:'お気に入り', saved:'保存しました', save:'保存', theme:'テーマ', font:'文字サイズ', goal:'1日の目標', system:'端末設定', light:'ライト', dark:'ダーク', invalid:'バックアップ形式が不正です', resetConfirm:'進捗をすべて初期化しますか？', mismatch:'不正解の詳細' },
    en: { settings:'Settings', review:'Review', history:'History', menu:'Menu', close:'Close', backup:'Back up all data', restore:'Restore', reset:'Reset progress', unsolved:'Unsolved', weak:'Weak', favorites:'Favorites', saved:'Saved', save:'Save', theme:'Theme', font:'Font size', goal:'Daily goal', system:'System', light:'Light', dark:'Dark', invalid:'Invalid backup file', resetConfirm:'Reset all progress?', mismatch:'Mismatch details' }
  };
  let config = { lang:'auto', theme:'system', font:16, goal:5 };
  const language = () => config.lang === 'auto' ? (navigator.language.startsWith('ja') ? 'ja' : 'en') : config.lang;
  const tr = key => TEXT[language()][key] || key;

  async function loadConfig() {
    config = { ...config, ...(await get('settings', {})) };
    const theme = config.theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : config.theme;
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
    const navElement = document.querySelector('.nav');
    if (!head || !navElement) return;

    if (!navElement.querySelector('[data-extra="review"]')) {
      [[ 'review', tr('review'), showReview ], [ 'history', tr('history'), showHistory ], [ 'settings', tr('settings'), showSettings ]]
        .forEach(([id, label, handler]) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.dataset.extra = id;
          button.textContent = label;
          button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            handler();
          });
          navElement.appendChild(button);
        });
    }
    navElement.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', closeMenu));

    if (!head.querySelector('.menu-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'menu-toggle';
      toggle.setAttribute('aria-label', tr('menu'));
      toggle.setAttribute('aria-expanded', 'false');
      toggle.innerHTML = '<span></span><span></span><span></span>';
      toggle.addEventListener('click', event => {
        event.stopPropagation();
        const shouldOpen = !navElement.classList.contains('open');
        navElement.classList.toggle('open', shouldOpen);
        document.querySelector('.menu-backdrop')?.classList.toggle('open', shouldOpen);
        toggle.setAttribute('aria-expanded', String(shouldOpen));
        document.body.classList.toggle('menu-open', shouldOpen);
      });
      head.insertBefore(toggle, navElement);
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
  function showCustomPage(name, html) {
    closeMenu();
    page = name;
    app.innerHTML = nav() + '<main id="main"></main>';
    document.querySelectorAll('[data-page]').forEach(button => {
      button.onclick = () => { page = button.dataset.page; closeMenu(); render(); };
    });
    installMenu();
    document.querySelector('#main').innerHTML = html;
  }
  async function allData() {
    return { schema_version:2, exported_at:new Date().toISOString(), settings:await get('settings',{}), progress:await get('progress',{}), custom:await get('custom',[]), labDb:await get('labDb',null), drafts:await get('drafts',{}), favorites:await get('favorites',[]), history:await get('history',[]), activity:await get('activity',{}) };
  }
  function downloadJson(name, value) {
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type:'application/json' }));
    anchor.download = name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  }
  async function showSettings() {
    showCustomPage('settings', `<section class="card settings-card"><h2>${tr('settings')}</h2>
      <label>Language<select id="settingLang"><option value="auto">Auto</option><option value="ja">日本語</option><option value="en">English</option></select></label>
      <label>${tr('theme')}<select id="settingTheme"><option value="system">${tr('system')}</option><option value="light">${tr('light')}</option><option value="dark">${tr('dark')}</option></select></label>
      <label>${tr('font')}<input id="settingFont" type="range" min="14" max="22"><output id="fontValue"></output></label>
      <label>${tr('goal')}<input id="settingGoal" type="number" min="1" max="100"></label>
      <div class="toolbar"><button class="btn" id="saveSettings">${tr('save')}</button><button class="btn secondary" id="backupAll">${tr('backup')}</button><label class="btn ghost">${tr('restore')}<input class="hidden" type="file" id="restoreAll" accept="application/json"></label><button class="btn danger" id="resetProgress">${tr('reset')}</button></div></section>`);
    const lang=document.querySelector('#settingLang'), theme=document.querySelector('#settingTheme'), font=document.querySelector('#settingFont'), goal=document.querySelector('#settingGoal'), output=document.querySelector('#fontValue');
    lang.value=config.lang; theme.value=config.theme; font.value=config.font; goal.value=config.goal; output.value=`${config.font}px`;
    font.addEventListener('input', () => output.value=`${font.value}px`);
    document.querySelector('#saveSettings').addEventListener('click', async () => { config={lang:lang.value,theme:theme.value,font:+font.value,goal:Math.max(1,+goal.value||5)}; await set('settings',config); location.reload(); });
    document.querySelector('#backupAll').addEventListener('click', async () => downloadJson('practice-sql-backup-v2.json', await allData()));
    document.querySelector('#restoreAll').addEventListener('change', async event => { try { const data=JSON.parse(await event.target.files[0].text()); if(data.schema_version!==2) throw Error(tr('invalid')); for(const key of ['settings','progress','custom','labDb','drafts','favorites','history','activity']) if(key in data) await set(key,data[key]); location.reload(); } catch(error) { alert(error.message); } });
    document.querySelector('#resetProgress').addEventListener('click', async () => { if(confirm(tr('resetConfirm'))) { await set('progress',{}); await set('activity',{}); location.reload(); } });
  }
  async function showReview() {
    const savedProgress=await progress(), favorites=new Set(await get('favorites',[]));
    showCustomPage('review', `<section class="card"><h2>${tr('review')}</h2><div class="toolbar"><button class="btn review-mode" data-mode="unsolved">${tr('unsolved')}</button><button class="btn review-mode" data-mode="weak">${tr('weak')}</button><button class="btn review-mode" data-mode="favorites">${tr('favorites')}</button></div></section><div id="reviewList" class="grid"></div>`);
    const draw=mode=>{let items=problems;if(mode==='unsolved')items=items.filter(x=>!savedProgress[x.problem_uid]?.correct);if(mode==='weak')items=items.filter(x=>(savedProgress[x.problem_uid]?.attempts||0)>=3&&!savedProgress[x.problem_uid]?.correct);if(mode==='favorites')items=items.filter(x=>favorites.has(x.problem_uid));document.querySelector('#reviewList').innerHTML=items.map(x=>`<section class="card"><h3>${esc(x.title)}</h3><button class="btn open-review" data-id="${x.problem_uid}">Start</button></section>`).join('')||'<section class="card">0</section>';};
    document.querySelectorAll('.review-mode').forEach(button=>button.addEventListener('click',()=>draw(button.dataset.mode)));
    document.querySelector('#reviewList').addEventListener('click',event=>{const button=event.target.closest('.open-review');if(button)open(problems.find(x=>x.problem_uid===button.dataset.id));});
    draw('unsolved');
  }
  async function showHistory() {
    const items=await get('history',[]);
    showCustomPage('history', `<section class="card"><h2>${tr('history')}</h2>${items.map(x=>`<div class="history-item"><small>${esc(x.at)} ${x.ok?'OK':'NG'}</small><pre>${esc(x.sql)}</pre></div>`).join('')||'<p>0</p>'}</section>`);
  }
  async function enhancePractice() {
    if(page!=='practice'||!current)return;
    const area=document.querySelector('#sql');
    if(!area||area.dataset.enhanced)return;
    area.dataset.enhanced='1';
    const drafts=await get('drafts',{});
    if(drafts[current.problem_uid])area.value=drafts[current.problem_uid];
    area.addEventListener('input',()=>{clearTimeout(area._save);area._save=setTimeout(async()=>{drafts[current.problem_uid]=area.value;await set('drafts',drafts);},400);});
    let favorites=await get('favorites',[]);
    const favoriteButton=document.createElement('button');favoriteButton.type='button';favoriteButton.className='btn secondary';favoriteButton.textContent=tr('favorites');favoriteButton.addEventListener('click',async()=>{favorites=favorites.includes(current.problem_uid)?favorites.filter(x=>x!==current.problem_uid):[...favorites,current.problem_uid];await set('favorites',favorites);alert(tr('saved'));});document.querySelector('#judge')?.parentElement.appendChild(favoriteButton);
    const judge=document.querySelector('#judge');
    if(judge&&!judge.dataset.history){judge.dataset.history='1';judge.addEventListener('click',()=>setTimeout(async()=>{const ok=!!document.querySelector('#out .ok'),history=await get('history',[]);history.unshift({at:new Date().toISOString(),problem:current.problem_uid,sql:area.value,ok});await set('history',history.slice(0,100));if(!ok)try{const user=result(area.value,current),expected=result(current.expected_sql,current),messages=[];if(JSON.stringify(user.columns)!==JSON.stringify(expected.columns))messages.push('Columns differ');if(user.values.length!==expected.values.length)messages.push(`Rows ${user.values.length}/${expected.values.length}`);if(JSON.stringify(user.values)!==JSON.stringify(expected.values))messages.push('Values or row order differ');document.querySelector('#out')?.insertAdjacentHTML('beforeend',`<div class="diffbox"><h3>${tr('mismatch')}</h3>${messages.map(value=>`<p>${esc(value)}</p>`).join('')}</div>`);}catch{}},120));}
  }
  const originalRender=render;
  window.render=function(){originalRender();setTimeout(()=>{installMenu();enhancePractice();},0);};
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMenu();});
  loadConfig().then(()=>{installMenu();enhancePractice();});
})();
