from pathlib import Path
from datetime import datetime,timezone
import json,requests

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
MODEL=DATA/'model_snapshot.json'
OUT=DATA/'dashboard.json'

TEAM={
"Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF","Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE","Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB","Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC","Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LA","Miami Dolphins":"MIA","Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG","New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF","Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"}

def fetch_week(model):
    url='https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=1'
    try:
        r=requests.get(url,timeout=30,headers={'User-Agent':'Mozilla/5.0'})
        r.raise_for_status()
        d=r.json()
    except Exception as e:
        print('scoreboard refresh failed:',e)
        return [],{},{}

    wanted={(g['away'],g['home']):g['game_id'] for g in model['games']}
    out=[];records={};meta={}
    for e in d.get('events',[]):
        c=(e.get('competitions') or [{}])[0]
        t={}
        for x in c.get('competitors',[]):
            code=TEAM.get(x.get('team',{}).get('displayName'))
            if not code: continue
            t[x.get('homeAway')]=(code,x.get('score'))
            recs=x.get('records') or []
            overall=next((z.get('summary') for z in recs if z.get('type')=='total'),None)
            if not overall and recs: overall=recs[0].get('summary')
            if overall: records[code]=overall
        if 'away' not in t or 'home' not in t: continue
        pair=(t['away'][0],t['home'][0]);gid=wanted.get(pair)
        if not gid: continue
        st=e.get('status',{}).get('type',{})
        state='FINAL' if st.get('completed') else ('LIVE' if st.get('state')=='in' else 'SCHEDULED')
        broadcasts=[]
        for b in c.get('broadcasts') or []:
            broadcasts.extend(b.get('names') or [])
        venue=(c.get('venue') or {}).get('fullName')
        item={
            'game_id':gid,'away':pair[0],'home':pair[1],
            'away_score':int(t['away'][1] or 0),'home_score':int(t['home'][1] or 0),
            'state':state,'detail':st.get('shortDetail') or st.get('description') or '',
            'commence_utc':e.get('date'),'network':', '.join(dict.fromkeys(broadcasts)) if broadcasts else '',
            'venue':venue or ''}
        out.append(item)
        meta[gid]={'commence_utc':item['commence_utc'],'network':item['network'],'venue':item['venue']}
    return out,records,meta

def main():
    model=json.loads(MODEL.read_text(encoding='utf-8'))
    old=json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {}
    scores,records,game_meta=fetch_week(model)
    payload={
        'updated_at_utc':datetime.now(timezone.utc).isoformat(),
        'season':2026,'week':1,
        'scores':scores or old.get('scores',[]),
        'records':records or old.get('records',{}),
        'game_meta':game_meta or old.get('game_meta',{}),
        'injuries':old.get('injuries',[])
    }
    OUT.write_text(json.dumps(payload,indent=2),encoding='utf-8')
    print(f"dashboard refreshed: scores={len(payload['scores'])} records={len(payload['records'])}")

if __name__=='__main__':
    main()
