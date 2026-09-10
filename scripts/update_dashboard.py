from pathlib import Path
from datetime import datetime,timezone
import json,requests
ROOT=Path(__file__).resolve().parents[1];DATA=ROOT/'data';MODEL=DATA/'model_snapshot.json';OUT=DATA/'dashboard.json'
TEAM={"Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF","Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE","Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB","Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC","Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LA","Miami Dolphins":"MIA","Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG","New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"}
def scores(model):
 try:d=requests.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026',timeout=30).json()
 except:return []
 wanted={(g['away'],g['home']):g['game_id'] for g in model['games']};out=[]
 for e in d.get('events',[]):
  c=(e.get('competitions')or[{}])[0];t={}
  for x in c.get('competitors',[]):
   code=TEAM.get(x.get('team',{}).get('displayName'))
   if code:t[x.get('homeAway')]=(code,x.get('score'))
  if 'away' not in t or 'home' not in t:continue
  pair=(t['away'][0],t['home'][0]);gid=wanted.get(pair)
  if not gid:continue
  st=e.get('status',{}).get('type',{});state='FINAL' if st.get('completed') else ('LIVE' if st.get('state')=='in' else 'SCHEDULED')
  out.append({'game_id':gid,'away':pair[0],'home':pair[1],'away_score':int(t['away'][1]or 0),'home_score':int(t['home'][1]or 0),'state':state,'detail':st.get('shortDetail','')})
 return out
def main():
 model=json.loads(MODEL.read_text());old=json.loads(OUT.read_text()) if OUT.exists() else {};payload={'updated_at_utc':datetime.now(timezone.utc).isoformat(),'scores':scores(model),'injuries':old.get('injuries',[])};OUT.write_text(json.dumps(payload,indent=2));print('dashboard refreshed')
if __name__=='__main__':main()
