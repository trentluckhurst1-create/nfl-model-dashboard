(()=>{
'use strict';
const KEY='nflops.workspace.v1';
const state={game:null,tab:'overview',mode:'GAME'};
function load(){try{Object.assign(state,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(_){}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function game(){return (window.model?.games||[]).find(g=>g.game_id===state.game)||null;}
function emit(){document.dispatchEvent(new CustomEvent('nflops:context',{detail:{...state,game:game()}}));updateChrome();}
function setGame(id){if(!id)return;state.game=id;save();emit();}
function setTab(tab){state.tab=tab||'overview';save();emit();}
function updateChrome(){const g=game();document.documentElement.dataset.contextGame=state.game||'';const rail=document.getElementById('contextRail');if(!rail)return;rail.innerHTML=g?`<span class="ctx-live">LINKED</span><b>${g.away} @ ${g.home}</b><span>OUR ${g.our_line||'—'}</span><span>MKT ${g.market||'—'}</span><span>EDGE ${g.edge==null?'—':Number(g.edge).toFixed(2)}</span><span>SIDE ${g.model_side||'—'}</span>`:`<span>NO GAME CONTEXT</span>`;}
function restore(){if(!state.game)return;const exists=(window.model?.games||[]).some(g=>g.game_id===state.game);if(exists&&typeof window.selectGame==='function')window.selectGame(state.game);}
function bind(){document.addEventListener('click',e=>{const row=e.target.closest('[data-game]');if(row?.dataset.game)setGame(row.dataset.game);const tab=e.target.closest('[data-itab]');if(tab?.dataset.itab)setTab(tab.dataset.itab);});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='l'){e.preventDefault();document.body.classList.toggle('focus-context');}});}
function boot(){load();bind();let tries=0;const timer=setInterval(()=>{tries++;if(window.model?.games?.length){clearInterval(timer);restore();updateChrome();emit();}else if(tries>40)clearInterval(timer);},100);}
window.NFLOpsContext={state,setGame,setTab,emit};
document.addEventListener('DOMContentLoaded',boot);
})();