(()=>{
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const VIEW_META={
 command:['COMMAND CENTRE','Live NFL decision workspace','Model first. Market second. Every verified information layer in one operating screen.'],
 games:['GAMES','Week 1 matchup board','Open any game into the complete EDGEiQ Game Control Centre.'],
 market:['MARKET','Model vs market monitor','Consensus, movement and discrepancy tracking without contaminating the frozen fair line.'],
 injuries:['PERSONNEL','Availability & depth intelligence','Official status, prior usage and verified personnel context.'],
 news:['INTELLIGENCE','NFL intelligence desk','Trusted-source game, injury and transaction context. Information only.'],
 performance:['PERFORMANCE','Prospective model ledger','Immutable Experiment 030 tracking. No post-result rewrites.'],
 standings:['STANDINGS','2026 league table','Conference and division state in the same professional operating system.'],
 model:['MODEL','Frozen production console','008A RIDGE governance, architecture and live-safety controls.']
};
function decorateView(id){const v=$(`#view-${id}`);if(!v||v.dataset.v8==='1')return;v.dataset.v8='1';const [ey,title,sub]=VIEW_META[id]||[id.toUpperCase(),id,''];let h=v.querySelector('.view-head');if(!h){h=document.createElement('div');h.className='view-head';v.prepend(h)}h.innerHTML=`<div><span class="label">EDGEiQ NFL / ${ey}</span><h1>${title}</h1><div class="v8-subtitle">${sub}</div><div class="v8-topline"><span class="v8-pill live">● SYSTEM ONLINE</span><span class="v8-pill blue">008A RIDGE · FROZEN</span><span class="v8-pill">2026 · WEEK 1</span></div></div><div class="v8-actions"><button class="v8-action" data-v8-action="refresh">↻ Refresh</button><button class="v8-action" data-v8-action="command">⌕ Command</button></div>`;
}
function decorateAll(){Object.keys(VIEW_META).forEach(decorateView);$$('.stat').forEach((x,i)=>x.classList.add('v8-kpi-accent'));const ver=$('.version');if(ver)ver.textContent='v8.0 · approved UI system';}
function improveSidebar(){const nav=$('.side-nav');if(!nav)return;const icons={command:'⌂',games:'▣',market:'↕',injuries:'♙',news:'◎',performance:'✦',standings:'☷',model:'ƒ'};$$('.side-nav button').forEach(b=>{const key=b.dataset.view,s=b.querySelector('span');if(s&&icons[key])s.textContent=icons[key]});}
function wire(){document.addEventListener('click',e=>{const a=e.target.closest('[data-v8-action]');if(!a)return;if(a.dataset.v8Action==='refresh')location.reload();if(a.dataset.v8Action==='command'){const i=$('#globalSearch');i?.focus()}});}
function watchViews(){const obs=new MutationObserver(()=>decorateAll());$$('.view').forEach(v=>obs.observe(v,{attributes:true,attributeFilter:['class']}));}
function boot(){document.documentElement.dataset.edgeiqUi='v8';decorateAll();improveSidebar();wire();watchViews();setInterval(decorateAll,1500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();