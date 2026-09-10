(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>[...r.querySelectorAll(s)];
function age(ts){if(!ts)return '—';const m=Math.max(0,Math.floor((Date.now()-new Date(ts))/60000));return m<60?`${m}m`:`${Math.floor(m/60)}h ${m%60}m`}
function currentGame(){const id=new URLSearchParams(location.search).get('game');const g=(window.NFLModel?.games||[]).find(x=>x.game_id===id);return {id,g}}
function market(id){return window.NFLMarketHistory?.[id]||[]}
function newsCount(g){return (window.NFLNews?.items||[]).filter(x=>Array.isArray(x.teams)&&x.teams.some(t=>t===g.away||t===g.home)).length}
function injuryCount(g){return (window.NFLLive?.injuries||[]).filter(x=>x.team===g.away||x.team===g.home).length}
function sourceTile(label,value,state='ready'){return `<div class="v74-source ${state}"><span>${label}</span><b>${value}</b></div>`}
function enhance(){const host=$('#edgeiqV7');if(!host)return;const {id,g}=currentGame();if(!id||!g)return;const body=$('.v7-body',host);const strip=$('.v7-strip',host);if(!body||!strip)return;
  $('.v74-cockpit',host)?.remove();$('.v74-readiness',host)?.remove();
  const h=market(id),latest=h.at(-1),first=h[0],edge=Number(g.edge||0),dir=edge>=0?'MODEL MORE BULLISH':'MARKET MORE BULLISH',pct=Math.min(100,Math.max(0,Math.abs(edge)/8*100));
  const cockpit=document.createElement('section');cockpit.className='v74-cockpit';cockpit.innerHTML=`<div class="v74-command"><div><span class="v74-kicker">EDGEiQ DECISION DESK</span><strong>${g.model_side||'—'} <em>${g.our_line||'—'}</em></strong><small>${Math.abs(edge).toFixed(2)} point separation from current consensus</small></div><div class="v74-gap"><div class="v74-gap-head"><span>MODEL ↔ MARKET SEPARATION</span><b>${Math.abs(edge).toFixed(2)} PTS</b></div><div class="v74-track"><i style="width:${pct}%"></i></div><div class="v74-gap-foot"><span>${dir}</span><span>${g.signal_4plus?'4+ HISTORICAL BAND · NOT CERTIFIED':'BELOW HISTORICAL 4+ BAND'}</span></div></div><div class="v74-market-summary"><span>OPEN / FIRST CAPTURE</span><b>${first?.display||'—'}</b><span>LATEST CONSENSUS</span><b>${latest?.display||g.market||'—'}</b></div></div>`;
  strip.insertAdjacentElement('afterend',cockpit);
  const readiness=document.createElement('section');readiness.className='v74-readiness';readiness.innerHTML=`${sourceTile('FAIR LINE',g.locked?'IMMUTABLE':'CURRENT',g.locked?'ready':'warn')}${sourceTile('MARKET',`${h.length} SNAPSHOTS`,h.length?'ready':'warn')}${sourceTile('MARKET AGE',latest?age(latest.ts):'—',latest?'ready':'warn')}${sourceTile('INJURIES',`${injuryCount(g)} VERIFIED`,injuryCount(g)?'ready':'neutral')}${sourceTile('INTEL',`${newsCount(g)} STORIES`,newsCount(g)?'ready':'neutral')}${sourceTile('LIVE FEED',window.NFLLive?.updated_at_utc?age(window.NFLLive.updated_at_utc):'—',window.NFLLive?.updated_at_utc?'ready':'warn')}`;
  cockpit.insertAdjacentElement('afterend',readiness);
  const tabs=$$('.v7-tabs button',host);tabs.forEach(b=>{if(b.dataset.v74)return;b.dataset.v74='1';const t=b.dataset.tab;if(t==='market'&&h.length)b.textContent=`Market · ${h.length}`;if(t==='injuries'){const n=injuryCount(g);if(n)b.textContent=`Injuries · ${n}`}if(t==='intel'){const n=newsCount(g);if(n)b.textContent=`Intel · ${n}`}});
  const marketCard=$('[data-section="market"] .inside',host);if(marketCard&&!$('.v74-market-head',marketCard)){const head=document.createElement('div');head.className='v74-market-head';head.innerHTML=`<div><span>FIRST</span><b>${first?.display||'—'}</b></div><div><span>LATEST</span><b>${latest?.display||g.market||'—'}</b></div><div><span>BOOKS</span><b>${latest?.books??'—'}</b></div>`;marketCard.prepend(head)}
  const ver=document.querySelector('.version');if(ver)ver.textContent='v7.4 · decision desk';
}
const obs=new MutationObserver(()=>requestAnimationFrame(enhance));obs.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('nflops:information-refresh',()=>setTimeout(enhance,0));window.addEventListener('popstate',()=>setTimeout(enhance,0));setTimeout(enhance,0);
})();
