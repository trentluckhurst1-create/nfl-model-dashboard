(()=>{
'use strict';
const BRAND='EDGEiQ NFL';
function ensureCss(){if(document.querySelector('link[href="edgeiq-brand.css"]'))return;const l=document.createElement('link');l.rel='stylesheet';l.href='edgeiq-brand.css';document.head.appendChild(l)}
function brand(){ensureCss();document.title=`${BRAND} · Operations Terminal`;let icon=document.querySelector('link[rel="icon"]');if(!icon){icon=document.createElement('link');icon.rel='icon';document.head.appendChild(icon)}icon.href='assets/edgeiq-nfl-logo.svg';const app=document.querySelector('.app-id');if(app){app.innerHTML='<img class="edgeiq-app-logo" src="assets/edgeiq-nfl-logo.svg" alt="EDGEiQ NFL"><div><strong>EDGEiQ NFL</strong><span>Operations Terminal</span></div>'}const crumb=document.getElementById('viewEyebrow');if(crumb&&/NFL|EDGE/i.test(crumb.textContent))crumb.textContent='EDGEiQ NFL / OPS';const ver=document.querySelector('.version');if(ver)ver.textContent='v5.8 · live personnel';}
function feedAge(ts){if(!ts)return'NO FEED';const ms=Date.now()-new Date(ts).getTime();if(!Number.isFinite(ms))return'UNKNOWN';const m=Math.max(0,Math.floor(ms/60000));return m<1?'<1m':`${m}m`}
function operations(){const host=document.querySelector('#systemHealth');if(!host)return;const age=typeof live!=='undefined'?feedAge(live.updated_at_utc):'—';let p=window.NFLPersonnel||{};const cov=p.coverage||{};const lines=[
 ['Score feed age',age],
 ['Roster coverage',cov.rosters!=null?`${cov.rosters}/${cov.teams||32}`:'PENDING'],
 ['Depth coverage',cov.depth_charts!=null?`${cov.depth_charts}/${cov.teams||32}`:'PENDING']
 ];
 host.querySelectorAll('.edgeiq-op-row').forEach(x=>x.remove());lines.forEach(([a,b])=>{const r=document.createElement('div');r.className='system-row edgeiq-op-row';r.innerHTML=`<span>${a}</span><b class="${b==='PENDING'||b==='NO FEED'?'':'healthy'}">${b}</b>`;host.appendChild(r)})}
function gameStrip(){const gs=(typeof model!=='undefined'&&model?.games)||[];const scores=(typeof live!=='undefined'&&live?.scores)||[];if(!gs.length)return;const liveGames=scores.filter(x=>x.state==='LIVE').length,final=scores.filter(x=>x.state==='FINAL').length,scheduled=scores.filter(x=>x.state==='SCHEDULED').length;let strip=document.getElementById('edgeiqLeagueState');if(!strip){strip=document.createElement('div');strip.id='edgeiqLeagueState';strip.className='edgeiq-league-state';document.querySelector('#view-command .stat-strip')?.after(strip)}strip.innerHTML=`<span>WEEK 1 OPS</span><b>${liveGames} LIVE</b><b>${final} FINAL</b><b>${scheduled} SCHEDULED</b><em>008A FROZEN · INFO LAYERS LIVE</em>`}
function render(){brand();operations();gameStrip()}
function boot(){render();setInterval(render,30000);document.addEventListener('nflops:information-refresh',render);document.addEventListener('nflops:context',render)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
