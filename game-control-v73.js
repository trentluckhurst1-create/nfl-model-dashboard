(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const getGameId=()=>new URLSearchParams(location.search).get('game');
const game=id=>(window.NFLModel?.games||[]).find(g=>g.game_id===id);
const hist=id=>window.NFLMarketHistory?.[id]||[];
const live=()=>window.NFLLive||{};
const news=()=>window.NFLNews||{items:[]};
const fmtAge=ts=>{if(!ts)return'PENDING';const d=Date.now()-new Date(ts).getTime();if(!Number.isFinite(d))return'PENDING';const m=Math.max(0,Math.floor(d/60000));return m<1?'NOW':m<60?`${m}M`:`${Math.floor(m/60)}H ${m%60}M`};
function contextCounts(g){const l=live();const inj=(l.injuries||[]).filter(x=>x.team===g.away||x.team===g.home);const stories=(news().items||[]).filter(x=>Array.isArray(x.teams)&&x.teams.some(t=>t===g.away||t===g.home));return{inj,stories}}
function chip(label,value,cls=''){return`<div class="v73-chip ${cls}"><span>${esc(label)}</span><b>${esc(value)}</b></div>`}
function enhance(){const host=document.querySelector('#edgeiqV7');if(!host)return;const id=getGameId();const g=game(id);if(!g)return;
 const {inj,stories}=contextCounts(g),h=hist(id),edge=Number(g.edge||0);
 let decision=host.querySelector('.v73-decision');
 if(!decision){decision=document.createElement('section');decision.className='v73-decision';const hero=host.querySelector('.v7-hero');hero?.insertAdjacentElement('afterend',decision)}
 const band=edge>=4?'HISTORICAL 4+ BAND · POST-HOC / NOT CERTIFIED':'BELOW HISTORICAL 4+ BAND';
 decision.innerHTML=`<div class="v73-decision-main"><span>EDGEiQ MODEL DIFFERENCE</span><strong>${esc(Number.isFinite(edge)?edge.toFixed(2):'—')} <small>PTS</small></strong><b>${esc(g.model_side||'—')}</b></div><div class="v73-decision-copy"><span>MODEL FIRST · MARKET SECOND</span><p>Frozen fair line remains isolated from market, news, weather and live-game information.</p><em class="${edge>=4?'warn':''}">${esc(band)}</em></div>`;
 let rail=host.querySelector('.v73-status');
 if(!rail){rail=document.createElement('section');rail.className='v73-status';const body=host.querySelector('.v7-body');body?.prepend(rail)}
 const marketTs=h.at(-1)?.ts||null, liveTs=live().updated_at_utc||null, newsTs=news().updated_at_utc||null;
 rail.innerHTML=`${chip('FAIR LINE',g.locked?'IMMUTABLE':'CURRENT',g.locked?'ok':'')}${chip('MARKET',`${h.length} SNAPSHOTS`)}${chip('MARKET AGE',fmtAge(marketTs))}${chip('INJURIES',`${inj.length} VERIFIED`)}${chip('INTEL',`${stories.length} STORIES`)}${chip('LIVE FEED AGE',fmtAge(liveTs))}${chip('NEWS AGE',fmtAge(newsTs))}`;
 const tabs=[...host.querySelectorAll('.v7-tabs button')];
 const counts={market:h.length,injuries:inj.length,intel:stories.length};
 tabs.forEach(b=>{if(b.querySelector('.v73-count'))return;const n=counts[b.dataset.tab];if(n!=null)b.insertAdjacentHTML('beforeend',`<i class="v73-count">${n}</i>`)});
 const market=host.querySelector('[data-section="market"] .inside');
 if(market&&!market.querySelector('.v73-market-summary')){const first=h[0],last=h.at(-1);market.insertAdjacentHTML('afterbegin',`<div class="v73-market-summary"><div><span>FIRST CAPTURE</span><b>${esc(first?.display||'—')}</b></div><div><span>LATEST CONSENSUS</span><b>${esc(last?.display||g.market||'—')}</b></div><div><span>BOOKS</span><b>${esc(last?.books??'—')}</b></div></div>`)}
 const version=document.querySelector('.version');if(version)version.textContent='v7.3 · pro research terminal';
}
function keys(){if(window.__v73keys)return;window.__v73keys=true;document.addEventListener('keydown',e=>{const host=document.querySelector('#edgeiqV7');if(!host||!['ArrowLeft','ArrowRight'].includes(e.key))return;const tabs=[...host.querySelectorAll('.v7-tabs button')];const i=tabs.findIndex(x=>x.classList.contains('active'));if(i<0)return;e.preventDefault();tabs[(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length]?.click()})}
const obs=new MutationObserver(()=>requestAnimationFrame(enhance));function boot(){obs.observe(document.body,{childList:true,subtree:true});document.addEventListener('nflops:information-refresh',()=>setTimeout(enhance,0));keys();enhance()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();