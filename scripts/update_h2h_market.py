from pathlib import Path
from datetime import datetime, timezone
import json, requests

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
MODEL=DATA/'model_snapshot.json'
OUT=DATA/'h2h_market.json'
HEAD={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/152 Safari/537.36','Accept':'application/json,text/plain,*/*','Referer':'https://www.espn.com/'}
ALIAS={'LAR':'LA','WSH':'WAS','JAC':'JAX'}

def get_json(url):
    r=requests.get(url,timeout=30,headers=HEAD); r.raise_for_status(); return r.json()

def find_events(obj):
    if isinstance(obj,dict):
        ev=obj.get('events')
        if isinstance(ev,list) and ev and isinstance(ev[0],dict) and ('competitions' in ev[0] or 'date' in ev[0]): return ev
        for v in obj.values():
            found=find_events(v)
            if found: return found
    elif isinstance(obj,list):
        for v in obj:
            found=find_events(v)
            if found: return found
    return []

def code(team):
    a=(team or {}).get('abbreviation')
    return ALIAS.get(a,a)

def find_key(obj,names):
    if isinstance(obj,dict):
        for k,v in obj.items():
            if k.lower() in names and v not in (None,''):
                return v
        for v in obj.values():
            z=find_key(v,names)
            if z not in (None,''): return z
    elif isinstance(obj,list):
        for v in obj:
            z=find_key(v,names)
            if z not in (None,''): return z
    return None

def american_value(v):
    if isinstance(v,dict):
        v=find_key(v,{'moneyline','money_line','american','value','displayvalue'})
    if v is None: return None
    s=str(v).strip().replace('$','').replace(',','')
    if s.upper() in {'EVEN','EV','EVENS'}: return 100
    try: n=float(s)
    except Exception: return None
    if abs(n)<100: return None
    return int(round(n))

def decimal_from_american(a):
    if a is None: return None
    return round(1+100/abs(a),3) if a<0 else round(1+a/100,3)

def price_from_row(row):
    if not isinstance(row,dict): return None
    away=row.get('awayTeamOdds') or row.get('awayOdds') or row.get('away') or {}
    home=row.get('homeTeamOdds') or row.get('homeOdds') or row.get('home') or {}
    aa=american_value(away); ha=american_value(home)
    if aa is None or ha is None: return None
    provider=row.get('provider') or {}
    if isinstance(provider,dict): provider_name=provider.get('name') or provider.get('displayName')
    else: provider_name=str(provider)
    provider_name=provider_name or row.get('providerName') or 'ESPN odds feed'
    return {'provider':provider_name,'away_american':aa,'home_american':ha,'away_decimal':decimal_from_american(aa),'home_decimal':decimal_from_american(ha)}

def find_price(obj):
    if isinstance(obj,dict):
        odds=obj.get('odds')
        if isinstance(odds,list):
            for row in odds:
                p=price_from_row(row)
                if p: return p
        p=price_from_row(obj)
        if p: return p
        for v in obj.values():
            p=find_price(v)
            if p: return p
    elif isinstance(obj,list):
        for v in obj:
            p=find_price(v)
            if p: return p
    return None

def get_events(season,week):
    urls=[
      ('ESPN_SITE',f'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates={season}&seasontype=2&week={week}'),
      ('ESPN_CDN','https://cdn.espn.com/core/nfl/scoreboard?xhr=1&limit=50'),
      ('ESPN_CDN_SCHEDULE',f'https://cdn.espn.com/core/nfl/schedule?xhr=1&year={season}&week={week}')]
    errors=[]
    for source,url in urls:
        try:
            events=find_events(get_json(url))
            if events: return events,source
            errors.append(source+': no events')
        except Exception as e: errors.append(f'{source}: {type(e).__name__}')
    raise RuntimeError(' | '.join(errors))

def fetch_game_price(event_id):
    if not event_id: return None,None
    urls=[
      ('ESPN_CDN_GAME',f'https://cdn.espn.com/core/nfl/game?xhr=1&gameId={event_id}'),
      ('ESPN_CORE_ODDS',f'https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/{event_id}/competitions/{event_id}/odds')]
    for source,url in urls:
        try:
            p=find_price(get_json(url))
            if p: return p,source
        except Exception:
            pass
    return None,None

def main():
    model=json.loads(MODEL.read_text())
    old=json.loads(OUT.read_text()) if OUT.exists() else {'games':{}}
    wanted={(g['away'],g['home']):g['game_id'] for g in model.get('games',[])}
    events,source=get_events(int(model.get('season',2026)),int(model.get('week',1)))
    now=datetime.now(timezone.utc).isoformat(); games=dict(old.get('games') or {}); found=0
    for event in events:
        comp=(event.get('competitions') or [{}])[0]; pair={}
        for x in comp.get('competitors') or []:
            c=code(x.get('team') or {})
            if c: pair[x.get('homeAway')]=c
        if 'away' not in pair or 'home' not in pair: continue
        gid=wanted.get((pair['away'],pair['home']))
        if not gid: continue
        price=find_price(comp); price_source=source
        if not price:
            price,price_source=fetch_game_price(str(event.get('id') or ''))
        if not price: continue
        price.update({'game_id':gid,'away':pair['away'],'home':pair['home'],'source':price_source,'checked_at_utc':now})
        games[gid]=price; found+=1
    payload={'updated_at_utc':now,'source':source,'games':games,'fresh_prices_found':found}
    OUT.write_text(json.dumps(payload,indent=2))
    print(f'h2h market refresh source={source} fresh_prices={found} total_games={len(games)}')

if __name__=='__main__': main()
