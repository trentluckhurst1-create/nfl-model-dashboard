#!/usr/bin/env python3
"""EDGEiQ NFL trusted X reporter wire.

Reads X_BEARER_TOKEN only from the runtime environment/GitHub Actions secret.
Never exposes credentials to browser assets. The resulting JSON is operational
context only and must never become an 008A model input.
"""
from __future__ import annotations
import json, os, re, urllib.parse, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data'/'x_wire.json'
API='https://api.x.com/2/tweets/search/recent'
# Deliberately small national-source whitelist. Expand only by explicit review.
TRUSTED={
 'AdamSchefter':'Adam Schefter',
 'RapSheet':'Ian Rapoport',
 'TomPelissero':'Tom Pelissero',
 'MikeGarafolo':'Mike Garafolo',
 'AlbertBreer':'Albert Breer',
 'FieldYates':'Field Yates',
}
TEAM_WORDS={
 'ARI':['cardinals','arizona'],'ATL':['falcons','atlanta'],'BAL':['ravens','baltimore'],'BUF':['bills','buffalo'],
 'CAR':['panthers','carolina'],'CHI':['bears','chicago'],'CIN':['bengals','cincinnati'],'CLE':['browns','cleveland'],
 'DAL':['cowboys','dallas'],'DEN':['broncos','denver'],'DET':['lions','detroit'],'GB':['packers','green bay'],
 'HOU':['texans','houston'],'IND':['colts','indianapolis'],'JAX':['jaguars','jacksonville'],'KC':['chiefs','kansas city'],
 'LV':['raiders','las vegas'],'LAC':['chargers','los angeles chargers'],'LA':['rams','los angeles rams'],
 'MIA':['dolphins','miami'],'MIN':['vikings','minnesota'],'NE':['patriots','new england'],'NO':['saints','new orleans'],
 'NYG':['giants','new york giants'],'NYJ':['jets','new york jets'],'PHI':['eagles','philadelphia'],'PIT':['steelers','pittsburgh'],
 'SF':['49ers','san francisco'],'SEA':['seahawks','seattle'],'TB':['buccaneers','bucs','tampa bay'],
 'TEN':['titans','tennessee'],'WAS':['commanders','washington commanders']}

def now(): return datetime.now(timezone.utc).isoformat()
def classify(t):
 s=t.lower()
 if re.search(r'\b(out|questionable|doubtful|injur|acl|achilles|concussion|ir\b|inactive)',s): return 'injury'
 if re.search(r'\b(trade|traded|sign|signed|release|released|waive|waived|contract|extension)',s): return 'transaction'
 if re.search(r'\b(qb|quarterback|starter|starting)',s): return 'qb'
 if re.search(r'\b(weather|wind|rain|snow|temperature)',s): return 'weather'
 return 'breaking'
def teams(t):
 s=t.lower();return [c for c,words in TEAM_WORDS.items() if any(w in s for w in words)]
def load_old():
 try:return json.loads(OUT.read_text(encoding='utf-8'))
 except Exception:return {'items':[]}
def write(status,items,error=None):
 payload={'schema_version':'1.0','updated_at_utc':now(),'status':status,'source':'X_API_V2','policy':'CURATED_TRUSTED_REPORTERS_ONLY','model_input':False,'trusted_accounts':TRUSTED,'items':items[:100]}
 if error: payload['error']=error
 OUT.write_text(json.dumps(payload,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def main():
 token=os.getenv('X_BEARER_TOKEN','').strip();old=load_old()
 if not token:
  write('AWAITING_X_BEARER_TOKEN',old.get('items',[]));print('X_WIRE=AWAITING_X_BEARER_TOKEN');return
 query='('+' OR '.join(f'from:{x}' for x in TRUSTED)+') -is:retweet'
 params=urllib.parse.urlencode({'query':query,'max_results':'100','tweet.fields':'created_at,author_id','expansions':'author_id','user.fields':'username,name'})
 req=urllib.request.Request(API+'?'+params,headers={'Authorization':f'Bearer {token}','User-Agent':'EDGEiQ-NFL/1.0'})
 try:
  with urllib.request.urlopen(req,timeout=20) as r:data=json.load(r)
  users={u['id']:u for u in data.get('includes',{}).get('users',[])};items=[]
  for x in data.get('data',[]):
   u=users.get(x.get('author_id'),{});handle=u.get('username','');text=x.get('text','').strip()
   if handle not in TRUSTED or not text:continue
   items.append({'id':x['id'],'title':text,'summary':text,'url':f'https://x.com/{handle}/status/{x["id"]}','published':x.get('created_at'),'source':TRUSTED[handle],'handle':'@'+handle,'source_type':'x_reporter','trust':'TRUSTED_REPORTER','category':classify(text),'teams':teams(text)})
  items.sort(key=lambda z:z.get('published') or'',reverse=True);write('OK',items);print(f'X_WIRE=OK ITEMS={len(items)}')
 except Exception as e:
  write('SOURCE_UNAVAILABLE',old.get('items',[]),type(e).__name__);print(f'X_WIRE=SOURCE_UNAVAILABLE {type(e).__name__}')
if __name__=='__main__':main()
