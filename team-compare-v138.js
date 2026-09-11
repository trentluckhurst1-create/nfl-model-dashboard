(()=>{
'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let META={};
const qs=(s,r=document)=>r.querySelector(s),qsa=(s,r=document)=>[...r.querySelectorAll(s)];
function games(){try{return model?.games||[]}catch(_){return[]}}
function scores(){try{return live?.scores||[]}catch(_){return[]}}
function injuries(){try{return live?.injuries||[]}catch(_){return[]}}
function stories(){try{return news?.items||[]}catch(_){return[]}}
function hist(id){try{return marketHistory?.[id]||[]}catch(_){return[]}}
function gameFor(c){return games().find(g=>g.away===c||g.home===c)||null}
function scoreFor(id){return scores().find(x=>x.game_id===id)||null}
function rawHome(g){const m=String(g?.our_line||'').match(/^\s*([A-Z]{2,3})\s*([+-])\s*(\d+(?:\.\d+)?)\s*$/);if(!m)return null;const mag=Number(m[3]),fm=m[2]==='-'?mag:-mag;return m[1]===g.home?fm:-fm}
function marketPath(g){if(!g)return'AWAITING';const mm=rawHome(g),h=hist(g.game_id).map(x=>Number(x?.market_internal)).filter(Number.isFinite);if(mm===null||!h.length)return'AWAITING';if(h.length===1)return'BASELINE';const a=Math.abs(h[0]-mm),b=Math.abs(h[h.length-1]-mm),d=b-a;return Math.abs(d)<.05?'UNCHANGED':d<0?'CONVERGING':'DIVERGING'}
function latestMarket(g){const h=g?hist(g.game_id):[];return h.length?(h[h.length-1].display||g.market||'—'):(g?.market||'—')}
function alerts(c){return injuries().filter(x=>x.team===c&&/out|doubt|question/i.test(x.game_status||'')).length}
function newsCount(c){return stories().filter(x=>(x.teams||[]).includes(c)).length}
function record(c){try{return live?.records?.[c]||'0-0'}catch(_){return'0-0'}}
function logo(c){const m=META[c]||{};return m.logo?`<img src="${esc(m.logo)}" alt="" loading="lazy" decoding="async">`:''}
function audit(c){const rows=games().filter(g=>g.away===c||g.home===c).map(g=>{const s=scoreFor(g.game_id),hm=rawHome(g);if(s?.state!=='FINAL'||hm===null)return null;const actual=Number(s.home_score)-Number(s.away_score);return Math.abs(actual-hm)}).filter(x=>x!==null);return{n:rows.length,mae:rows.length?rows.reduce((a,b)=>a+b,0)/rows.length:null}}
function snapshot(c){const m=META[c]||{},g=gameFor(c),opp=g?(g.away===c?g.home:g.away):null,a=audit(c);return{c,m,g,opp,record:record(c),edge:g?.edge==null?null:Math.abs(Number(g.edge)),path:marketPath(g),market:latestMarket(g),alerts:alerts(c),news:newsCount(c),audit:a,state:g?scoreFor(g.game_id)?.state||'SCHEDULED':'—'}}
function option(c){const m=META[c]||{};return`<option value="${esc(c)}">${esc(m.name||c)}</option>`}
function metric(label,a,b,fmt=x=>x){return`<div class="team-compare-row"><span>${esc(label)}</span><b>${esc(fmt(a))}</b><b>${esc(fmt(b))}</b></div>`}
function card(x){return`<div class="team-compare-club"><button data-open-team="${esc(x.c)}">${logo(x.c)}<span><b>${esc(x.m.name||x.c)}</b><small>${esc(x.m.conference||'NFL')} · ${esc(x.m.division||'')}</small></span><strong>${esc(x.record)}</strong></button></div>`}
function renderTable(a,b){const A=snapshot(a),B=snapshot(b);const host=qs('#teamCompareBody');if(!host)return;host.innerHTML=`<div class="team-compare-heads"><div></div>${card(A)}${card(B)}</div>${metric('CURRENT OPPONENT',A.opp?META[A.opp]?.name||A.opp:'—',B.opp?META[B.opp]?.name||B.opp:'—')}${metric('008A FAIR',A.g?.our_line||'—',B.g?.our_line||'—')}${metric('LATEST MARKET',A.market,B.market)}${metric('MODEL EDGE',A.edge,B.edge,x=>x==null?'—':Number(x).toFixed(2))}${metric('MODEL SIDE',A.g?.model_side||'—',B.g?.model_side||'—')}${metric('MARKET PATH',A.path,B.path)}${metric('GAME STATE',A.state,B.state)}${metric('PERSONNEL FLAGS',A.alerts,B.alerts)}${metric('TEAM NEWS ITEMS',A.news,B.news)}${metric('COMPLETED AUDIT N',A.audit.n,B.audit.n)}${metric('008A MAE',A.audit.mae,B.audit.mae,x=>x==null?'—':Number(x).toFixed(1))}<p class="team-compare-note">Comparison uses published EDGEiQ, market, live, personnel and news data only. It is descriptive and does not create a new rating, confidence score or model input.</p>`}
function markup(){const codes=Object.keys(META).sort((a,b)=>(META[a].name||a).localeCompare(META[b].name||b)),ranked=codes.slice().sort((a,b)=>(Math.abs(Number(gameFor(b)?.edge)||0))-(Math.abs(Number(gameFor(a)?.edge)||0))),a=ranked[0]||codes[0],b=ranked.find(x=>x!==a)||codes[1]||a;return`<section class="team-compare" id="edgeTeamCompare"><div class="team-compare-title"><div><span>HEAD-TO-HEAD CLUB VIEW</span><h2>Team Compare</h2><p>Compare two clubs across the verified EDGEiQ operating layer.</p></div><div class="team-compare-selects"><label>TEAM A<select id="teamCompareA">${codes.map(option).join('')}</select></label><label>TEAM B<select id="teamCompareB">${codes.map(option).join('')}</select></label></div></div><div id="teamCompareBody"></div><div class="team-compare-policy">DESCRIPTIVE COMPARISON ONLY · 008A RIDGE REMAINS IMMUTABLE</div></section>`}
function render(){const dir=qs('#teamHub .team-directory');if(!dir||!Object.keys(META).length)return;qs('#edgeTeamCompare')?.remove();const radar=qs('#edgeTeamRadar',dir);if(radar)radar.insertAdjacentHTML('afterend',markup());else dir.insertAdjacentHTML('afterbegin',markup());const codes=Object.keys(META),ranked=codes.slice().sort((a,b)=>(Math.abs(Number(gameFor(b)?.edge)||0))-(Math.abs(Number(gameFor(a)?.edge)||0))),a=ranked[0]||codes[0],b=ranked.find(x=>x!==a)||codes[1]||a;qs('#teamCompareA').value=a;qs('#teamCompareB').value=b;renderTable(a,b)}
function rerender(){const a=qs('#teamCompareA')?.value,b=qs('#teamCompareB')?.value;if(a&&b)renderTable(a,b)}
document.addEventListener('change',e=>{if(e.target.id==='teamCompareA'||e.target.id==='teamCompareB')rerender()});
document.addEventListener('click',e=>{if(e.target.closest('[data-team-home],.side-nav [data-view="teams"]'))queueMicrotask(render)},true);
window.addEventListener('popstate',()=>queueMicrotask(render));document.addEventListener('edgeiq:core-ready',()=>queueMicrotask(render));document.addEventListener('nflops:information-refresh',()=>queueMicrotask(render));
async function boot(){META=window.EDGEiQTeams||{};if(!Object.keys(META).length)try{META=await fetch('data/team_meta.json?v=138',{cache:'no-store'}).then(r=>r.ok?r.json():{})}catch(_){}queueMicrotask(render);queueMicrotask(()=>{const v=qs('.version');if(v)v.textContent='EDGEiQ NFL · v13.8 STABLE'})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();