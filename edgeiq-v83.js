(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
function customerSidebar(){const bottom=$('.side-bottom');if(!bottom)return;bottom.innerHTML='<div class="v83-brand-foot"><span class="live">● SYSTEM ONLINE</span><strong>EDGEiQ NFL</strong><span class="season">2026 · WEEK 1</span><small>Professional game intelligence</small><small>Data. Discipline. Edge.</small></div>'}
function cleanCommand(){const view=$('#view-command');if(!view)return;const rail=view.querySelector('.right-rail');if(rail)rail.remove();const stats=view.querySelector('#statStrip');if(stats)stats.remove();const head=view.querySelector(':scope > .view-head');if(head)head.remove();}
function customerCopy(){const title=$('#viewTitle');if(title&&$('.side-nav button.active')?.dataset.view==='command')title.textContent='NFL Command Centre';const crumb=$('#viewEyebrow');if(crumb&&$('.side-nav button.active')?.dataset.view==='command')crumb.textContent='EDGEiQ NFL / COMMAND';const ver=$('.version');if(ver)ver.textContent='v8.3 · customer experience'}
function stripInternalDecks(){['market','injuries','performance'].forEach(id=>{const deck=$(`#view-${id} .v82-lowerdeck`);if(!deck)return;[...deck.children].forEach(card=>{const t=card.innerText.toLowerCase();if(t.includes('governance')||t.includes('post-result')||t.includes('model boundary')||t.includes('protocol'))card.remove()})})}
function cleanGameCentre(){const host=$('#edgeiqV7');if(!host)return;const gov=host.querySelector('[data-section="model"]');if(gov){const h=gov.querySelector('h3 span');if(h)h.textContent='Model information';const em=gov.querySelector('h3 em');if(em)em.textContent='EDGEiQ';}
 const footer=host.querySelector('.v7-footer');if(footer)footer.textContent='EDGEiQ NFL · PROFESSIONAL GAME INTELLIGENCE · DATA. DISCIPLINE. EDGE.';}
function sync(){document.documentElement.dataset.edgeiqUi='v83';customerSidebar();cleanCommand();customerCopy();stripInternalDecks();cleanGameCentre()}
function wire(){document.addEventListener('click',e=>{const b=e.target.closest('.side-nav button');if(b)setTimeout(sync,0)});const obs=new MutationObserver(()=>sync());obs.observe(document.body,{childList:true,subtree:true})}
function boot(){sync();wire();setTimeout(sync,1000);setTimeout(sync,3000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();