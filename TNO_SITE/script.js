const langBtn=document.getElementById('lang');
const burger=document.getElementById('burger');
let lang=localStorage.getItem('tno-lang')||'fr';
function setLang(next){
  lang=next;localStorage.setItem('tno-lang',lang);
  document.documentElement.lang=lang;document.documentElement.dir=lang==='ar'?'rtl':'ltr';
  if(langBtn)langBtn.textContent=lang==='fr'?'AR':'FR';
  document.querySelectorAll('[data-fr][data-ar]').forEach(el=>{
    const v=el.dataset[lang]; if(v==null)return;
    if(el.matches('input,textarea,select')){el.setAttribute('placeholder',v);return;}
    if(el.matches('option')){el.textContent=v;return;}
    const child=el.querySelector(':scope > span[data-fr][data-ar]');
    if(child && el.children.length===1){child.textContent=v;return;}
    if(el.children.length===0)el.textContent=v;
  });
}
setLang(lang);
window.tnoSetLang=setLang; if(langBtn)langBtn.onclick=()=>setLang(lang==='fr'?'ar':'fr');
if(burger)burger.onclick=()=>document.querySelector('.nav nav')?.classList.toggle('open');
document.querySelectorAll('.nav nav a').forEach(a=>a.addEventListener('click',()=>document.querySelector('.nav nav')?.classList.remove('open')));
const nav=document.querySelector('.nav');
const progress=document.querySelector('.scroll-progress');
function scrollUI(){
  nav?.classList.toggle('scrolled',scrollY>40);
  if(progress){const h=document.documentElement.scrollHeight-innerHeight;progress.style.width=(h>0?(scrollY/h)*100:0)+'%';}
}
addEventListener('scroll',scrollUI,{passive:true});scrollUI();
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('show')}),{threshold:.08});
document.querySelectorAll('.reveal').forEach((e,i)=>{if(i%3===1)e.classList.add('delay-1');if(i%3===2)e.classList.add('delay-2');obs.observe(e)});
const audio=document.getElementById('player'),audioBtn=document.getElementById('audioBtn');
if(audioBtn&&audio)audioBtn.onclick=()=>{if(audio.paused){audio.play().then(()=>{audioBtn.classList.add('playing');audioBtn.innerHTML='Ⅱ &nbsp; <span>YA RAOUI</span>'}).catch(()=>{});}else{audio.pause();audioBtn.classList.remove('playing');audioBtn.innerHTML='▶ &nbsp; <span>YA RAOUI</span>'}};
const dot=document.querySelector('.cursor-dot');
addEventListener('mousemove',e=>{if(dot){dot.style.left=e.clientX+'px';dot.style.top=e.clientY+'px'}});
document.querySelectorAll('a,button,.work,.detail,.bio-points article').forEach(el=>{el.addEventListener('mouseenter',()=>{if(dot){dot.style.width='30px';dot.style.height='30px';dot.style.borderColor='#fff'}});el.addEventListener('mouseleave',()=>{if(dot){dot.style.width='12px';dot.style.height='12px';dot.style.borderColor='var(--red)'}})});
// subtle pointer parallax on hero
const hero=document.querySelector('.hero');
if(hero && matchMedia('(pointer:fine)').matches){hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;hero.querySelector('.hero-glow')?.style.setProperty('transform',`translate(${x*24}px,${y*18}px)`);hero.querySelector('.hero-scribble')?.style.setProperty('transform',`rotate(-11deg) translate(${x*12}px,${y*8}px)`)});}
window.addEventListener('load',()=>document.body.classList.add('loaded'));

// V4 cinematic interactions
const cinematicHero=document.querySelector('.hero-cinematic');
if(cinematicHero && matchMedia('(pointer:fine)').matches){
  cinematicHero.addEventListener('pointermove',e=>{
    const r=cinematicHero.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    cinematicHero.querySelector('.hero-backdrop')?.style.setProperty('transform',`scale(1.1) translate3d(${x*-12}px,${y*-9}px,0)`);
    cinematicHero.querySelector('.hero-copy')?.style.setProperty('transform',`translate3d(${x*8}px,${y*5}px,0)`);
  });
}
// magnetic-feel buttons, kept subtle for touch-free pointers
if(matchMedia('(pointer:fine)').matches){
 document.querySelectorAll('.btn,.join').forEach(b=>{
  b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.transform=`translate(${(e.clientX-(r.left+r.width/2))*.06}px,${(e.clientY-(r.top+r.height/2))*.06}px)`});
  b.addEventListener('pointerleave',()=>b.style.transform='');
 });
}

// V5 stage depth: gentle scroll-based movement
const stageHero=document.querySelector('.hero-cinematic');
if(stageHero){
  addEventListener('scroll',()=>{
    const y=Math.min(scrollY,900);
    stageHero.querySelector('.stage-curtain-left')?.style.setProperty('transform',`skewY(-1deg) rotateY(5deg) translate3d(${-y*.006}px,${y*.018}px,0)`);
    stageHero.querySelector('.stage-curtain-right')?.style.setProperty('transform',`skewY(1deg) rotateY(-5deg) translate3d(${y*.006}px,${y*.018}px,0)`);
    stageHero.querySelector('.hero-orbit')?.style.setProperty('opacity',String(Math.max(.18,.75-y/1200)));
  },{passive:true});
}

// Book orders — send directly to the TNO administration server.
const bookModal=document.getElementById('bookOrderModal');
const bookSelected=document.getElementById('bookOrderSelected');
const bookForm=document.getElementById('bookOrderForm');
let selectedBook='';
function openBookOrder(book){
  if(!bookModal)return; selectedBook=book;
  if(bookSelected)bookSelected.textContent=book;
  bookModal.classList.add('open'); bookModal.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  bookForm?.querySelector('input[name="name"]')?.focus();
}
function closeBookOrder(){
  if(!bookModal)return; bookModal.classList.remove('open'); bookModal.setAttribute('aria-hidden','true'); document.body.style.overflow='';
}
document.querySelectorAll('.book-buy').forEach(b=>b.addEventListener('click',()=>openBookOrder(b.dataset.book||'')));
document.querySelectorAll('[data-close-book-order]').forEach(el=>el.addEventListener('click',closeBookOrder));
addEventListener('keydown',e=>{if(e.key==='Escape')closeBookOrder()});
bookForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const btn=bookForm.querySelector('button[type="submit"]'); const original=btn?.textContent;
  const fd=new FormData(bookForm);
  const payload={book:selectedBook,name:fd.get('name'),phone:fd.get('phone'),wilaya:fd.get('wilaya'),address:fd.get('address'),quantity:fd.get('quantity')};
  if(btn){btn.disabled=true;btn.textContent='جاري إرسال الطلب…';}
  try{
    const r=await fetch('/api/public/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(!r.ok)throw new Error('send');
    bookForm.reset();
    if(btn){btn.textContent='تم إرسال الطلب ✓';}
    setTimeout(()=>{closeBookOrder();if(btn) {btn.disabled=false;btn.textContent=original;}},1200);
  }catch(err){
    if(btn){btn.disabled=false;btn.textContent=original;}
    alert('تعذر إرسال الطلب. تأكد أن سيرفر الإدارة يعمل.');
  }
});


/* TNO ADMIN CONNECTED SITE DATA */
(async function(){
  const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const siteData=async()=>{try{const r=await fetch('/api/public/site-data',{cache:'no-store'});if(!r.ok)throw new Error('site_data');return await r.json()}catch(e){return null}};
function renderTeam(d){
  const pg=document.querySelector('#president-grid'), mg=document.querySelector('#members-grid');
  const president=(d.president||[]).filter(x=>x.visible!==false);
  const members=(d.members||[]).filter(x=>x.visible!==false);
  if(pg){pg.innerHTML=president.length?president.slice(0,1).map(x=>`<article class="president-card"><img src="${esc(x.image||'assets/ben-hamou-zino.jpg')}" alt="${esc(x.name||'Président TNO')}" loading="lazy"><div class="president-info"><div class="eyebrow">PRÉSIDENT · رئيس الفرقة</div><h3>${esc(x.name||'')}</h3><div class="eyebrow">${esc(x.role||'')}</div><p>${esc(x.bio||'')}</p></div></article>`).join(''):'<div class="team-empty">Les informations du président seront publiées prochainement.</div>'}
  if(mg){mg.innerHTML=members.length?members.map(x=>`<article class="member-card"><img src="${esc(x.image||'assets/logo-light.png')}" alt="${esc(x.name||'Membre TNO')}" loading="lazy"><div class="member-info"><div class="eyebrow">MEMBRE · عضو الفرقة</div><h3>${esc(x.name||'')}</h3><div class="eyebrow">${esc(x.role||'')}</div><p>${esc(x.bio||'')}</p></div></article>`).join(''):'<div class="team-empty">Les membres de la troupe seront ajoutés depuis l’administration.</div>'}
}

  const d=await siteData(); if(!d)return;
  renderTeam(d);
  // Books
  const bookGrid=document.querySelector('.book-grid');
  if(bookGrid && Array.isArray(d.books) && d.books.length){
    bookGrid.innerHTML=d.books.filter(x=>x.visible!==false).map(x=>`<article class=\"book-card\"><img src=\"${esc(x.cover||x.image||'assets/tejalat-al-wahrani.jpeg')}\" alt=\"${esc(x.title||'')} — ${esc(x.author||'يحي بن حمو')}\"><div><span>${esc(x.type||'')}</span><h4>${esc(x.title||'')}</h4><p>${esc(x.author||'يحي بن حمو')}</p><button class=\"book-buy\" type=\"button\" data-book=\"${esc(x.title||'')}\" data-fr=\"COMMANDER CE LIVRE\" data-ar=\"اطلب هذا الكتاب\">COMMANDER CE LIVRE</button></div></article>`).join('');
    document.querySelectorAll('.book-buy').forEach(b=>b.addEventListener('click',()=>openBookOrder(b.dataset.book||'')));
  }
  // Creations / shows
  const creations=document.querySelector('#creations');
  if(creations && Array.isArray(d.shows) && d.shows.length){
    const head=creations.querySelector('.section-head');
    creations.innerHTML=''; if(head)creations.appendChild(head);
    d.shows.filter(x=>x.visible!==false).forEach((x,i)=>{
      const a=document.createElement('article'); a.className='work '+(i%2?'reverse ':'')+'reveal';
      a.innerHTML=`<div class="work-no">${esc(x.no||String(i+1).padStart(2,'0'))}</div><img alt="${esc(x.title)}" src="${esc(x.image||'')}"/><div class="work-info"><span>${esc(x.label||'TNO')}</span><h3>${esc(x.title)}</h3>${x.performances?`<small class="show-count" data-fr="${esc(x.performances)} représentations" data-ar="${esc(x.performances)} عرض">${esc(x.performances)} représentations</small>`:''}<p data-fr="${esc(x.fr||x.title)}" data-ar="${esc(x.ar||x.title)}">${esc(x.fr||x.title)}</p><a class="arrow" href="${esc(x.page||'#')}" data-fr="VOIR L'ŒUVRE ↗" data-ar="اكتشف العمل ↗">VOIR L'ŒUVRE ↗</a></div>`;
      creations.appendChild(a);
    });
  }
  // Press
  const press=document.querySelector('#press .press-list');
  if(press && Array.isArray(d.press)){
    press.innerHTML=''; d.press.filter(x=>x.visible!==false).forEach((x,i)=>{const a=document.createElement('article');a.className='press-card reveal';a.innerHTML=`<div class="press-no">${String(i+1).padStart(2,'0')}</div><div class="press-copy"><span>${esc(x.meta||'TNO')}</span><h3>${esc(x.title)}</h3><p>${esc(x.summary||'')}</p>${x.url?`<a class="press-link" href="${esc(x.url)}" rel="noopener" target="_blank">LIRE LA SOURCE ↗</a>`:''}</div>`;press.appendChild(a)});
  }
  // Ticketing
  const tg=document.querySelector('#ticket-grid');
  if(tg && Array.isArray(d.tickets)){const seen=new Set();const tickets=d.tickets.filter(x=>x&&x.visible!==false&&x.status!=='closed').filter(x=>{if(seen.has(x.id))return false;seen.add(x.id);return true});tg.innerHTML=tickets.length?tickets.map(x=>`<article class="ticket-card reveal">${x.image?`<div class="ticket-image"><img src="/${esc(x.image)}" alt="" loading="lazy"></div>`:''}<div class="ticket-meta"><span>${esc(x.date||'')}</span><span>${esc(x.time||'')}</span><span>${esc(x.city||'')}</span></div><h3>${esc(x.title||'')}</h3><p>${esc(x.place||'')}</p>${x.description?`<p>${esc(x.description)}</p>`:''}<button class="btn dark ticket-book" type="button" data-ticket-id="${esc(x.id)}" data-ticket-title="${esc(x.title||'')}">RÉSERVER UNE PLACE ↗</button></article>`).join(''):'<div class="empty-agenda"><strong>À VENIR</strong><p>Les prochaines réservations seront annoncées ici.</p></div>';bindTickets();}
  // Agenda
  const agenda=document.querySelector('#agenda');
  if(agenda && Array.isArray(d.agenda)){
    const old=agenda.querySelector('.empty-agenda'); if(old)old.remove();
    let list=agenda.querySelector('.tno-agenda-list'); if(!list){list=document.createElement('div');list.className='tno-agenda-list';agenda.appendChild(list)}
    list.innerHTML=d.agenda.filter(x=>x.visible!==false).map(x=>`<article class="agenda-item reveal"><div><b>${esc(x.date||'')}</b><span>${esc(x.time||'')}</span></div><section><small>${esc(x.place||'')}</small><h3>${esc(x.title||'')}</h3><p>${esc(x.city||'')}</p></section></article>`).join('') || '<div class="empty-agenda reveal"><strong>À VENIR</strong><p>Les prochaines représentations seront annoncées ici.</p></div>';
  }
  // Galleries: preserve existing section structure but replace photos from server data
  const pg=document.querySelector('#photo-troupe .photo-troupe-gallery');
  const jg=document.querySelector('#tno-junior .junior-gallery');
  if(Array.isArray(d.gallery)){
    if(pg){pg.innerHTML=d.gallery.filter(x=>x.group==='PHOTO TROUPE'&&x.visible!==false).map((x,i)=>`<figure class="troupe-photo ${i===0?'troupe-photo-feature':''}"><img alt="${esc(x.title||'PHOTO TROUPE')}" loading="lazy" src="${esc(x.src)}"><figcaption>${String(i+1).padStart(2,'0')} / PHOTO TROUPE</figcaption></figure>`).join('')}
    if(jg){jg.innerHTML=d.gallery.filter(x=>x.group==='TNO JUNIOR'&&x.visible!==false).map((x,i)=>`<figure class="junior-photo ${i===0?'junior-photo-feature':''}"><img alt="${esc(x.title||'TNO JUNIOR')}" loading="lazy" src="${esc(x.src)}"><figcaption>${String(i+1).padStart(2,'0')} / TNO JUNIOR</figcaption></figure>`).join('')}
  }
  if(window.tnoSetLang) window.tnoSetLang(lang); document.querySelectorAll('.reveal:not(.show)').forEach((e,i)=>{if(i%3===1)e.classList.add('delay-1');if(i%3===2)e.classList.add('delay-2');obs.observe(e)});
})();


(function enforceSingleTicketArea(){
  const sections=[...document.querySelectorAll('section#billetterie')];
  sections.slice(1).forEach(x=>x.remove());
  const seen=new Set();
  document.querySelectorAll('a[href="#billetterie"]').forEach(a=>{
    if(seen.has('billetterie')) a.remove(); else seen.add('billetterie');
  });
})();

let selectedTicketId='';
function ensureTicketBookingPanel(){
  const sections=document.querySelectorAll('section#billetterie');
  if(!sections.length)return null;
  // Keep exactly ONE ticket section on the official site.
  sections.forEach((el,i)=>{if(i>0)el.remove()});
  const section=sections[0];
  let panel=document.getElementById('ticketBookingPanel');
  if(panel)return panel;
  panel=document.createElement('div');
  panel.id='ticketBookingPanel';
  panel.className='ticket-booking-panel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.innerHTML=`<div class="ticket-booking-backdrop" id="ticketBookingBackdrop"></div><div class="ticket-booking-dialog"><button class="ticket-booking-close" type="button" id="ticketBookingClose">× Fermer</button><span>TNO / BILLETTERIE</span><h3 id="ticketSelected"></h3><form id="ticketForm"><label>Nom & prénom<input required name="name" autocomplete="name"></label><label>Téléphone<input required name="phone" type="tel" autocomplete="tel"></label><label>Email<input name="email" type="email" autocomplete="email"></label><label>Quantité<input required name="quantity" type="number" min="1" value="1"></label><label class="full">Note<textarea name="note" rows="3"></textarea></label><button class="ticket-submit" type="submit">ENVOYER LA RÉSERVATION ↗</button></form></div>`;
  document.body.appendChild(panel);
  document.getElementById('ticketBookingClose')?.addEventListener('click',closeTicketPanel);
  document.getElementById('ticketBookingBackdrop')?.addEventListener('click',closeTicketPanel);
  document.getElementById('ticketForm')?.addEventListener('submit',submitTicket);
  return panel;
}
function bindTickets(){
  ensureTicketBookingPanel();
  document.querySelectorAll('.ticket-book').forEach(b=>b.addEventListener('click',()=>openTicket(b.dataset.ticketId,b.dataset.ticketTitle)));
}
function closeTicketPanel(){
  const panel=document.getElementById('ticketBookingPanel');
  if(panel)panel.classList.remove('open');
  selectedTicketId='';
}
function openTicket(id,title){
  selectedTicketId=id;
  const panel=ensureTicketBookingPanel();
  if(!panel)return;
  const selected=document.getElementById('ticketSelected');
  if(selected)selected.textContent=title||'';
  panel.classList.add('open');
  document.body.classList.add('ticket-modal-open');
}
async function submitTicket(e){
  e.preventDefault();
  if(!selectedTicketId)return alert('اختر عرضاً أولاً.');
  const fd=new FormData(e.target);
  const payload={ticketId:selectedTicketId,name:fd.get('name'),phone:fd.get('phone'),email:fd.get('email'),quantity:fd.get('quantity'),note:fd.get('note')};
  const btn=e.target.querySelector('button[type=submit]');
  try{
    btn.disabled=true;
    const r=await fetch('/api/public/tickets',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
    const out=await r.json().catch(()=>({}));
    if(!r.ok||!out.ok)throw new Error(out.message||('HTTP '+r.status));
    btn.textContent='RÉSERVATION ENVOYÉE ✓';
    e.target.reset();
    selectedTicketId='';
    setTimeout(()=>{closeTicketPanel();document.body.classList.remove('ticket-modal-open');btn.disabled=false;btn.textContent='ENVOYER LA RÉSERVATION ↗'},900);
  }catch(err){alert('الحجز لم يتم إرساله: '+err.message);btn.disabled=false}
}
ensureTicketBookingPanel();
const ticketGrid=document.getElementById('ticket-grid');
if(ticketGrid&&ticketGrid.children.length)bindTickets();
