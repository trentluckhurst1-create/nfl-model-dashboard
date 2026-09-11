(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ALIAS={LAR:'LA',WSH:'WAS',JAC:'JAX'};
let model={season:2026,week:1,games:[]};
let dash={scores:[],injuries:[],game_meta:{},live_stats:{}};
let selected=null;
let refreshing=false;
const json=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);return r.json()};
const code=t=>{const a=t?.abbreviation||t?.shortDisplayName||'';return ALIAS[a]||a||null};
const getGame=id=>(model.games||[]).find(g=>g.game_id===id)||null;
const getScore=id=>(dash.scores||[]).find(s=>s.game_id===id)||null;
function mergeScore(s){dash.scores=dash.scores||[];const i=dash.scores.findIndex(x=>x.game_id===s.game_id);if(i>=0)dash.scores[i]={...dash.scores[i],...s};else dash.scores.push(s)}
async function loadBase(){
  const results=await Promise.allSettled([
    json('data/model_snapshot.json?v=97&t='+Date.now()),
    json('data/dashboard.json?v=97&t='+Date.now())
  ]);
  if(results[0].status==='fulfilled')model=results[0].value||model;
  if(results[1].status==='fulfilled')dash=results[1].value||dash;
}
function parseTeamStats(sm){const out={};for(const b of sm?.boxscore?.teams||[]){const c=code(b.team);if(!c)continue;out[c]={};for(const s of b.statistics||[]){const k=s.name||s.label;if(k)out[c][k]={display:s.displayValue??s.value??'—'}}}return out}
function parsePlayers(sm){const out={};for(const b of sm?.boxscore?.players||[]){const c=code(b.team);if(!c)continue;out[c]={};for(const cat of b.statistics||[]){const k=cat.name||cat.displayName||cat.label||'Stats';const rows=(cat.athletes||[]).map(a=>({name:a.athlete?.displayName||a.athlete?.shortName||'',stats:a.stats||[]})).filter(x=>x.name);if(rows.length)out[c][k]=rows}}return out}
function parsePlays(sm){return(sm?.plays||[]).slice(-30).map(p=>({period:p.period?.number||'',clock:p.clock?.displayValue||'',text:p.text||p.shortText||'',scoring:!!p.scoringPlay,away_score:p.awayScore,home_score:p.homeScore}))}
function parseDrive(sm){const d=sm?.drives?.current;if(!d)return null;return{team:code(d.team),description:d.description||'',result:d.displayResult||d.result||'',plays:d.plays,yards:d.yards,time:d.timeElapsed?.displayValue||''}}
async function refreshDirect(){
  const g=getGame(selected);if(!g)return;
  try{
    const sb=await json('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates='+(model.season||2026)+'&seasontype=2&week='+(model.week||1)+'&t='+Date.now());
    for(const e of sb.events||[]){
      const comp=(e.competitions||[])[0]||{};const teams={};
      for(const x of comp.competitors||[]){const c=code(x.team);if(c)teams[x.homeAway]={code:c,score:Number(x.score||0),id:String(x.team?.id||'')}}
      if(teams.away?.code!==g.away||teams.home?.code!==g.home)continue;
      const st=e.status?.type||{};const sit=comp.situation||{};const state=st.completed?'FINAL':st.state==='in'?'LIVE':'SCHEDULED';
      let poss='';if(sit.possession){poss=Object.values(teams).find(x=>x.id===String(sit.possession))?.code||''}
      const networks=[];for(const b of comp.broadcasts||[])networks.push(...(b.names||[]));
      mergeScore({game_id:g.game_id,away:g.away,home:g.home,away_score:teams.away?.score??0,home_score:teams.home?.score??0,state,detail:st.shortDetail||st.description||'',clock:e.status?.displayClock||'',period:e.status?.period||0,down_distance:sit.downDistanceText||'',possession:poss,last_play:sit.lastPlay?.text||'',commence_utc:e.date,network:[...new Set(networks)].join(', '),venue:comp.venue?.fullName||'',source:'ESPN DIRECT'});
      if((state==='LIVE'||state==='FINAL')&&e.id){
        const sm=await json('https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event='+e.id+'&t='+Date.now());
        dash.live_stats=dash.live_stats||{};
        dash.live_stats[g.game_id]={source:'ESPN GAME SUMMARY',team_stats:parseTeamStats(sm),player_stats:parsePlayers(sm),recent_plays:parsePlays(sm),current_drive:parseDrive(sm)};
      }
      return;
    }
  }catch(err){console.warn('EDGEiQ direct live refresh unavailable',err)}
}
function stat(obj,key){if(!obj)return'—';const k=Object.keys(obj).find(x=>x.toLowerCase()===key.toLowerCase());const v=obj[key]||obj[k];return v?.display??v?.value??'—'}
const statRows=[['firstDowns','1ST DOWNS'],['totalYards','TOTAL YARDS'],['yardsPerPlay','YARDS / PLAY'],['netPassingYards','PASS YARDS'],['rushingYards','RUSH YARDS'],['turnovers','TURNOVERS'],['thirdDownEff','3RD DOWN'],['redZoneAttempts','RED ZONE'],['totalPenaltiesYards','PENALTIES'],['possessionTime','POSSESSION']];
function liveState(g,s){const state=s?.state||'SCHEDULED';if(state==='LIVE'||state==='FINAL')return `<div class="ci-score"><div><span>${esc(g.away)}</span><b>${esc(s?.away_score??0)}</b></div><i>—</i><div><b>${esc(s?.home_score??0)}</b><span>${esc(g.home)}</span></div></div>`;return `<div class="ci-score pre"><strong>${esc(g.away)}</strong><i>@</i><strong>${esc(g.home)}</strong></div>`}
function teamStats(g,data){const a=data?.team_stats?.[g.away]||{},h=data?.team_stats?.[g.home]||{};return `<section class="ci-card"><div class="ci-card-title"><span>GAME STATS</span><b>${esc(g.away)}</b><b>${esc(g.home)}</b></div>${statRows.map(([k,l])=>`<div class="ci-stat-row"><span>${l}</span><b>${esc(stat(a,k))}</b><b>${esc(stat(h,k))}</b></div>`).join('')}</section>`}
function leaders(g,data){return `<section class="ci-card"><div class="ci-section-head">PLAYER LEADERS</div><div class="ci-leader-grid">${[g.away,g.home].map(t=>{const cats=data?.player_stats?.[t]||{};const keys=Object.keys(cats).filter(k=>/pass|rush|receiv/i.test(k)).slice(0,3);return `<div><h4>${esc(t)}</h4>${keys.length?keys.map(k=>{const r=cats[k]?.[0];return r?`<div class="ci-leader"><span>${esc(k)}</span><b>${esc(r.name)}</b><small>${esc((r.stats||[]).join(' · '))}</small></div>`:''}).join(''):'<p class="ci-muted">Live leaders pending.</p>'}</div>`}).join('')}</div></section>`}
function plays(data){const rows=(data?.recent_plays||[]).slice().reverse().slice(0,14);return `<section class="ci-card"><div class="ci-section-head">PLAY-BY-PLAY</div>${rows.length?rows.map(p=>`<div class="ci-play ${p.scoring?'score':''}"><time>Q${esc(p.period||'—')} ${esc(p.clock||'')}</time><span>${esc(p.text||'')}</span>${p.away_score!=null?`<b>${esc(p.away_score)}–${esc(p.home_score)}</b>`:''}</div>`).join(''):'<p class="ci-muted">Play-by-play appears here during live games.</p>'}</section>`}
function injuries(g){const rows=(dash.injuries||[]).filter(x=>x.team===g.away||x.team===g.home).slice(0,12);return `<section class="ci-card"><div class="ci-section-head">PERSONNEL WATCH</div>${rows.length?rows.map(x=>`<div class="ci-person"><span><b>${esc(x.team)} · ${esc(x.player)}</b><small>${esc(x.position||'')} ${esc(x.injury||'')}</small></span><strong>${esc(x.game_status||x.status||'—')}</strong></div>`).join(''):'<p class="ci-muted">No published injury rows.</p>'}</section>`}
function render(){
  const g=getGame(selected);if(!g)return;
  const host=$('#gameInspector');const empty=$('#inspectorEmpty');if(!host)return;
  if(empty)empty.style.display='none';host.classList.remove('hidden');host.style.display='block';
  const s=getScore(g.game_id)||{};const data=dash.live_stats?.[g.game_id]||{};const state=s.state||'SCHEDULED';const drive=data.current_drive;
  host.innerHTML=`<div class="ci-shell"><div class="ci-hero"><div class="ci-top"><div><span class="ci-eyebrow">WEEK ${esc(model.week||1)} · GAME CONTROL CENTRE</span><h2>${esc(g.away)} @ ${esc(g.home)}</h2></div><div class="ci-state ${state==='LIVE'?'live':''}">${state==='LIVE'?'● ':''}${esc(state)}</div></div>${liveState(g,s)}<div class="ci-meta"><span>${esc(s.detail||'')}</span><span>${s.clock?`Q${esc(s.period||'')} · ${esc(s.clock)}`:''}</span><span>${esc(s.venue||dash.game_meta?.[g.game_id]?.venue||'')}</span><span>${esc(s.network||dash.game_meta?.[g.game_id]?.network||'')}</span></div><div class="ci-model-strip"><div><span>EDGEiQ FAIR LINE</span><b>${esc(g.our_line||'—')}</b></div><div><span>MARKET</span><b>${esc(g.market||'—')}</b></div><div><span>DIFFERENCE</span><b>${g.edge==null?'—':Number(g.edge).toFixed(2)}</b></div><div><span>MODEL SIDE</span><b>${esc(g.model_side||'—')}</b></div><div><span>MODEL STATE</span><b>${g.locked?'FROZEN':'CURRENT'}</b></div></div></div>${state==='LIVE'?`<div class="ci-situation"><div><span>POSSESSION</span><b>${esc(s.possession||'—')}</b></div><div><span>DOWN / DISTANCE</span><b>${esc(s.down_distance||'—')}</b></div><div><span>CURRENT DRIVE</span><b>${esc(drive?.team||'—')} · ${esc(drive?.result||drive?.description||'In progress')}</b><small>${drive?.plays!=null?drive.plays+' plays':''}${drive?.yards!=null?' · '+drive.yards+' yds':''}</small></div></div>`:''}<div class="ci-grid"><div>${teamStats(g,data)}${leaders(g,data)}</div><div>${plays(data)}${injuries(g)}</div></div><div class="ci-policy">LIVE INFORMATION ONLY · PREGAME EDGEiQ FAIR LINE REMAINS FROZEN</div></div>`;
  document.querySelectorAll('.terminal-row[data-game]').forEach(el=>el.classList.toggle('selected',el.dataset.game===selected));
}
async function select(id){selected=id;render();history.replaceState(null,'','?view=command&game='+encodeURIComponent(id));if(refreshing)return;refreshing=true;await loadBase();render();await refreshDirect();render();refreshing=false}
function bind(){document.addEventListener('click',e=>{const el=e.target.closest('[data-game]');if(!el||!el.closest('#terminalGameList,#gamesMatrix,#marketRows,#performanceRows'))return;e.preventDefault();e.stopPropagation();select(el.dataset.game)},true)}
async function boot(){bind();await loadBase();const q=new URLSearchParams(location.search).get('game');if(q&&getGame(q))await select(q);setInterval(async()=>{if(!selected||refreshing)return;refreshing=true;await loadBase();render();await refreshDirect();render();refreshing=false},20000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();