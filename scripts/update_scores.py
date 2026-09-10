from pathlib import Path
from datetime import datetime, timezone
import json
import requests

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MODEL = DATA / "model_snapshot.json"
OUT = DATA / "dashboard.json"
HEAD = {"User-Agent": "Mozilla/5.0 (compatible; NFLModelTerminal/1.0)"}
TEAM = {
    "Arizona Cardinals":"ARI","Atlanta Falcons":"ATL","Baltimore Ravens":"BAL","Buffalo Bills":"BUF",
    "Carolina Panthers":"CAR","Chicago Bears":"CHI","Cincinnati Bengals":"CIN","Cleveland Browns":"CLE",
    "Dallas Cowboys":"DAL","Denver Broncos":"DEN","Detroit Lions":"DET","Green Bay Packers":"GB",
    "Houston Texans":"HOU","Indianapolis Colts":"IND","Jacksonville Jaguars":"JAX","Kansas City Chiefs":"KC",
    "Las Vegas Raiders":"LV","Los Angeles Chargers":"LAC","Los Angeles Rams":"LA","Miami Dolphins":"MIA",
    "Minnesota Vikings":"MIN","New England Patriots":"NE","New Orleans Saints":"NO","New York Giants":"NYG",
    "New York Jets":"NYJ","Philadelphia Eagles":"PHI","Pittsburgh Steelers":"PIT","San Francisco 49ers":"SF",
    "Seattle Seahawks":"SEA","Tampa Bay Buccaneers":"TB","Tennessee Titans":"TEN","Washington Commanders":"WAS"
}

def main():
    model = json.loads(MODEL.read_text(encoding="utf-8"))
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    season = int(model.get("season", 2026))
    week = int(model.get("week", 1))
    url = f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates={season}&seasontype=2&week={week}"
    r = requests.get(url, timeout=30, headers=HEAD)
    r.raise_for_status()
    data = r.json()
    wanted = {(g["away"], g["home"]): g["game_id"] for g in model.get("games", [])}
    scores, records, meta = [], {}, {}
    now = datetime.now(timezone.utc).isoformat()

    for event in data.get("events", []):
        comp = (event.get("competitions") or [{}])[0]
        teams = {}
        for x in comp.get("competitors", []):
            code = TEAM.get((x.get("team") or {}).get("displayName"))
            if not code:
                continue
            teams[x.get("homeAway")] = (code, int(x.get("score") or 0))
            recs = x.get("records") or []
            overall = next((z.get("summary") for z in recs if z.get("type") == "total"), None)
            if not overall and recs:
                overall = recs[0].get("summary")
            if overall:
                records[code] = overall
        if "away" not in teams or "home" not in teams:
            continue
        pair = (teams["away"][0], teams["home"][0])
        gid = wanted.get(pair)
        if not gid:
            continue

        st = (event.get("status") or {}).get("type") or {}
        state = "FINAL" if st.get("completed") else ("LIVE" if st.get("state") == "in" else "SCHEDULED")
        broadcasts = []
        for b in comp.get("broadcasts") or []:
            broadcasts.extend(b.get("names") or [])
        situation = comp.get("situation") or {}
        possession = None
        poss_id = situation.get("possession")
        if poss_id:
            for x in comp.get("competitors", []):
                if str((x.get("team") or {}).get("id")) == str(poss_id):
                    possession = TEAM.get((x.get("team") or {}).get("displayName"))
                    break
        last_play = situation.get("lastPlay") or {}
        item = {
            "game_id": gid,
            "away": pair[0],
            "home": pair[1],
            "away_score": teams["away"][1],
            "home_score": teams["home"][1],
            "state": state,
            "detail": st.get("shortDetail") or st.get("description") or "",
            "clock": (event.get("status") or {}).get("displayClock") or "",
            "period": (event.get("status") or {}).get("period") or 0,
            "down_distance": situation.get("downDistanceText") or "",
            "possession": possession,
            "last_play": last_play.get("text") or "",
            "commence_utc": event.get("date"),
            "network": ", ".join(dict.fromkeys(broadcasts)) if broadcasts else "",
            "venue": (comp.get("venue") or {}).get("fullName") or "",
            "source": "ESPN_SCOREBOARD",
            "updated_at_utc": now
        }
        scores.append(item)
        meta[gid] = {k: item[k] for k in ["commence_utc", "network", "venue"]}

    if not scores:
        raise RuntimeError("scoreboard returned no matching Week games; refusing to overwrite existing dashboard")

    payload = {
        "updated_at_utc": now,
        "season": season,
        "week": week,
        "score_source": "ESPN_SCOREBOARD",
        "scores": scores,
        "records": records or old.get("records", {}),
        "game_meta": meta or old.get("game_meta", {}),
        "injuries": old.get("injuries", [])
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"live scoreboard refreshed: games={len(scores)} live={sum(x['state']=='LIVE' for x in scores)} final={sum(x['state']=='FINAL' for x in scores)}")

if __name__ == "__main__":
    main()
