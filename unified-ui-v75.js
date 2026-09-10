(()=>{
'use strict';
const MODULES={
 command:{eyebrow:'EDGEiQ NFL / COMMAND',title:'NFL Command Centre',desc:'Week control, live state, market separation and system health in one operating view.',badge:'OPERATIONS'},
 games:{eyebrow:'NFL / SCHEDULE',title:'Games',desc:'Every matchup presented through the same premium EDGEiQ research workflow.',badge:'MATCHUPS'},
 market:{eyebrow:'MODEL FIRST / MARKET SECOND',title:'Market Monitor',desc:'Consensus, line movement and EDGEiQ separation without contaminating the frozen fair line.',badge:'MARKET'},
 injuries:{eyebrow:'NFL / OFFICIAL AVAILABILITY',title:'Personnel Centre',desc:'Verified injury and availability intelligence, clearly separated from model governance.',badge:'PERSONNEL'},
 news:{eyebrow:'INTEL / TRUSTED SOURCES',title:'Intelligence Desk',desc:'Matchup-relevant reporting and developments, information-only unless separately certified.',badge:'INTELLIGENCE'},
 performance:{eyebrow:'MODEL / EXPERIMENT 030',title:'Prospective Performance',desc:'Immutable live records, results and forward performance tracking with no post-result rewrite.',badge:'PERFORMANCE'},
 standings:{eyebrow:'NFL / 2026',title:'Standings',desc:'League context presented in the same EDGEiQ terminal design system.',badge:'LEAGUE'},
 model:{eyebrow:'MODEL / PRODUCTION',title:'Model Console',desc:'Frozen architecture, governance controls and information-layer isolation.',badge:'008A RIDGE'}
};
function banner(key){const m=MODULES[key]||MODULES.command;const el=document.createElement('section');el.className='eq-module-banner';el.dataset.eqModule=key;el.innerHTML=`<div><span class="eq-eyebrow">${m.eyebrow}</span><h1>${m.title}</h1><p>${m.desc}</p></div><div class="eq-module-badge">${m.badge}</div>`;return el}
function apply(){document.body.classList.add('edgeiq-v75');document.querySelectorAll('.view').forEach(v=>{const key=v.id.replace('view-','');if(!v.querySelector(':scope > .eq-module-banner'))v.prepend(banner(key));});const ver=document.querySelector('.version');if(ver)ver.textContent='v7.5 · unified approved UI'}
function keepCurrent(){const active=document.querySelector('.side-nav button.active')?.dataset?.view||'command';const m=MODULES[active];if(m){const e=document.querySelector('#viewEyebrow');const t=document.querySelector('#viewTitle');if(e)e.textContent=m.eyebrow;if(t)t.textContent=m.title}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{apply();keepCurrent()});else{apply();keepCurrent()}
document.addEventListener('click',e=>{const b=e.target.closest?.('.side-nav button[data-view]');if(!b)return;setTimeout(()=>{apply();keepCurrent()},0)},true);
window.EDGEiQUI={version:'7.5',apply};
})();