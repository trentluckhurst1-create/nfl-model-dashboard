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
function decorateView(id){const v=$(`#view-${id}`);if(!v||v.dataset.v8==='1')return;v.dataset.v8='1';const [ey,title,sub]=VIEW_META[id]||[id.toUpperCase(),id,''];let h=v.querySelector('.view-head');if(!h){h=document.createElement('div');h.className='view-head';v.prepend(h)}h.innerHTML=`<div><span class="label">EDGEiQ NFL / ${ey}</span><h1>${title}</h1><div class="v8-subtitle">${sub}</div><div class="v8-topline"><span class="v8-pill live">● SYSTEM ONLINE</span><span class="v8-pill blue">008A RIDGE · FROZEN</span><span class="v8-pill">2026 · WEEK 1</span></div></div><div class="v8-actions"><button class="v8-action" data-v8-action="refresh">↻ Refresh</button><button class="v8-action" data-v8-action="command">⌕ Command</button></div>`}
function decorateAll(){Object.keys(VIEW_META).forEach(decorateView);$$('.stat').forEach(x=>x.classList.add('v8-kpi-accent'));const ver=$('.version');if(ver)ver.textContent='v8.1 · approved mockup system'}
function improveSidebar(){const nav=$('.side-nav');if(!nav)return;const icons={command:'⌂',games:'▣',market:'↕',injuries:'♙',news:'◎',performance:'✦',standings:'☷',model:'ƒ'};$$('.side-nav button').forEach(b=>{const key=b.dataset.view,s=b.querySelector('span');if(s&&icons[key])s.textContent=icons[key]})}
function gameText(g){const a=g.away||'',h=g.home||'';return `${a} @ ${h}`}
function renderTicker(){const bar=$('.v8-seasonbar');if(!bar)return;const games=window.NFLModel?.games||window.model?.games||[];const wrap=bar.querySelector('.v8-ticker');if(!wrap||!games.length)return;wrap.innerHTML=games.slice(0,16).map(g=>`<div class="v8-tick${new URLSearchParams(location.search).get('game')===g.game_id?' active':''}" data-game="${g.game_id}"><strong>${gameText(g)}</strong><small>${g.our_line||'—'} · ${g.market||'market pending'}</small><em>${g.locked?'LOCKED':'WEEK 1'}</em></div>`).join('')}
function ensureTicker(){if($('.v8-seasonbar')){renderTicker();return}const cmd=$('.command-bar');if(!cmd)return;const bar=document.createElement('div');bar.className='v8-seasonbar';bar.innerHTML='<div class="v8-weekbadge">WEEK 1</div><div class="v8-ticker"></div>';cmd.after(bar);renderTicker()}
function wire(){document.addEventListener('click',e=>{const a=e.target.closest('[data-v8-action]');if(a){if(a.dataset.v8Action==='refresh')location.reload();if(a.dataset.v8Action==='command')$('#globalSearch')?.focus();return}const t=e.target.closest('.v8-tick[data-game]');if(t)window.EDGEiQGameCentreLauncher?.open?.(t.dataset.game)});}
function watchViews(){const obs=new MutationObserver(()=>decorateAll());$$('.view').forEach(v=>obs.observe(v,{attributes:true,attributeFilter:['class']}))}
function boot(){document.documentElement.dataset.edgeiqUi='v81';decorateAll();improveSidebar();ensureTicker();wire();watchViews();setTimeout(renderTicker,1200);setInterval(()=>{decorateAll();renderTicker()},5000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();