(()=>{
'use strict';
const KEY='nflops.workspace.v2';
const state={game:null,tab:'overview',mode:'GAME'};
const appModel=()=>typeof model!=='undefined'&&model?model:{games:[]};
function load(){try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||localStorage.getItem('nflops.workspace.v1')||'{}'))}catch(_){}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function game(){return (appModel().games||[]).find(g=>g.game_id===state.game)||null;}
function emit(){const detail={...state,game:game()};document.dispatchEvent(new CustomEvent('nflops:context',{detail}));window.dispatchEvent(new CustomEvent('nfl:game-context',{detail}));updateChrome();}
function setGame(id){if(!id||state.game===id)return;state.game=id;save();emit();}
function setTab(tab){state.tab=tab||'overview';save();emit();}
function updateChrome(){const g=game();document.documentElement.dataset.contextGame=state.game||'';const rail=document.getElementById('contextRail');if(!rail)return;let mkt=g?.market||'—';try{if(g&&typeof currentMarket==='function')mkt=currentMarket(g)}catch(_){}rail.innerHTML=g?`<span class="ctx-live">LINK A</span><b>${g.away} @ ${g.home}</b><span>OUR ${g.our_line||'—'}</span><span>MKT ${mkt}</span><span>EDGE ${g.edge==null?'—':Number(g.edge).toFixed(2)}</span><span>SIDE ${g.model_side||'—'}</span>`:`<span>NO GAME CONTEXT</span>`;}
function restore(){if(!state.game)return;const exists=(appModel().games||[]).some(g=>g.game_id===state.game);if(exists&&typeof selectGame==='function')selectGame(state.game);}
function bind(){document.addEventListener('click',e=>{const row=e.target.closest('[data-game]');if(row?.dataset.game)setGame(row.dataset.game);const tab=e.target.closest('[data-itab]');if(tab?.dataset.itab)setTab(tab.dataset.itab);});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='l'){e.preventDefault();document.body.classList.toggle('focus-context');}});}
function boot(){load();bind();let tries=0;const timer=setInterval(()=>{tries++;if((appModel().games||[]).length){clearInterval(timer);restore();updateChrome();emit();}else if(tries>60)clearInterval(timer);},100);}
window.NFLWorkspace={getGame:()=>state.game,getState:()=>({...state}),setGame,setTab,getGameRecord:game};
window.NFLOpsContext={state,setGame,setTab,emit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();