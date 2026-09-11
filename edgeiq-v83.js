(()=>{
'use strict';
const $=s=>document.querySelector(s);
function customerSidebar(){const bottom=$('.side-bottom');if(!bottom||bottom.dataset.customer==='1')return;bottom.dataset.customer='1';bottom.innerHTML='<div class="v83-brand-foot"><span class="live">● SYSTEM ONLINE</span><strong>EDGEiQ NFL</strong><span class="season">2026 · WEEK 1</span><small>Professional game intelligence</small><small>Data. Discipline. Edge.</small></div>'}
function cleanCommand(){const view=$('#view-command');if(!view)return;const rail=view.querySelector('.right-rail');if(rail)rail.style.display='none';const stats=view.querySelector('#statStrip');if(stats)stats.style.display='none';const head=view.querySelector(':scope > .view-head');if(head)head.style.display='none'}
function customerCopy(){const active=$('.side-nav button.active')?.dataset.view;if(active==='command'){const title=$('#viewTitle');if(title)title.textContent='NFL Command Centre';const crumb=$('#viewEyebrow');if(crumb)crumb.textContent='EDGEiQ NFL / COMMAND'}const ver=$('.version');if(ver)ver.textContent='v8.4 · customer-first UI'}
function cleanGameCentre(){const host=$('#edgeiqV7');if(!host)return;const footer=host.querySelector('.v7-footer');if(footer)footer.textContent='EDGEiQ NFL · PROFESSIONAL GAME INTELLIGENCE · DATA. DISCIPLINE. EDGE.'}
function sync(){document.documentElement.dataset.edgeiqUi='v84';customerSidebar();cleanCommand();customerCopy();cleanGameCentre()}
function boot(){sync();document.addEventListener('click',e=>{if(e.target.closest('.side-nav button'))setTimeout(sync,0)});const obs=new MutationObserver(()=>{cleanCommand();cleanGameCentre()});obs.observe(document.body,{childList:true,subtree:true});setInterval(sync,5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();