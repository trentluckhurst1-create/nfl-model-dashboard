from pathlib import Path
from datetime import datetime, timezone
import json
import requests

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
MODEL = DATA / "model_snapshot.json"
OUT = DATA / "dashboard.json"
HEAD = {"User-Agent": "Mozilla/5.0 (compatible; EDGEiQ-NFL/2.0)"}
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
ALIAS = {"LAR":"LA","WSH":"WAS","JAC":"JAX"}

def code_from_team(t):
    if not isinstance(t, dict):
        return None
    abbr = t.get("abbreviation")
    if abbr:
        return ALIAS.get(abbr, abbr)
    return TEAM.get(t.get("displayName"))

def get_json(url):
    r = requests.get(url, timeout=30, headers=HEAD)
    r.raise_for_status()
    return r.json()

def parse_team_stats(summary):
    out = {}
    for block in (summary.get("boxscore") or {}).get("teams") or []:
        code = code_from_team(block.get("team") or {})
        if not code:
            continue
        stats = {}
        for s in block.get("statistics") or []:
            name = s.get("name") or s.get("label")
            if not name:
                continue
            stats[name] = {
                "label": s.get("label") or name,
                "display": s.get("displayValue") if s.get("displayValue") is not None else s.get("value")
            }
        out[code] = stats
    return out

def parse_player_leaders(summary):
    leaders = {}
    for team_block in (summary.get("boxscore") or {}).get("players") or []:
        code = code_from_team(team_block.get("team") or {})
        if not code:
            continue
        team_out = {}
        for cat in team_block.get("statistics") or []:
            label = cat.get("name") or cat.get("displayName") or cat.get("label") or "category"
            rows = []
            for a in cat.get("athletes") or []:
                athlete = a.get("athlete") or {}
                name = athlete.get("displayName") or athlete.get("shortName") or athlete.get("fullName")
                if not name:
                    continue
                vals = a.get("stats") or []
                rows.append({"name": name, "stats": vals, "starter": bool(a.get("starter"))})
            if rows:
                team_out[label] = rows[:6]
        if team_out:
            leaders[code] = team_out
    return leaders

def parse_plays(summary):
    plays = summary.get("plays") or []
    out = []
    for p in plays[-20:]:
        period = (p.get("period") or {}).get("number") or p.get("period")
        clock = (p.get("clock") or {}).get("displayValue") if isinstance(p.get("clock"), dict) else p.get("clock")
        out.append({
            "id": str(p.get("id") or ""),
            "period": period,
            "clock": clock or "",
            "text": p.get("text") or p.get("shortText") or "",
            "scoring": bool(p.get("scoringPlay")),
            "home_score": p.get("homeScore"),
            "away_score": p.get("awayScore")
        })
    return out

def parse_scoring(summary):
    rows = []
    for p in summary.get("scoringPlays") or []:
        period = (p.get("period") or {}).get("number") or p.get("period")
        clock = (p.get("clock") or {}).get("displayValue") if isinstance(p.get("clock"), dict) else p.get("clock")
        rows.append({
            "period": period,
            "clock": clock or "",
            "text": p.get("text") or p.get("shortText") or "",
            "home_score": p.get("homeScore"),
            "away_score": p.get("awayScore")
        })
    return rows[-12:]

def parse_drive(summary):
    d = (summary.get("drives") or {}).get("current") or {}
    if not d:
        return {}
    team = code_from_team(d.get("team") or {})
    return {
        "team": team,
        "description": d.get("description") or "",
        "yards": d.get("yards"),
        "plays": d.get("plays"),
        "time_elapsed": (d.get("timeElapsed") or {}).get("displayValue") if isinstance(d.get("timeElapsed"), dict) else d.get("timeElapsed"),
        "result": d.get("displayResult") or d.get("result") or ""
    }

def main():
    model = json.loads(MODEL.read_text(encoding="utf-8"))
    old = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    season = int(model.get("season", 2026))
    week = int(model.get("week", 1))
    url = f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates={season}&seasontype=2&week={week}"
    data = get_json(url)
    wanted = {(g["away"], g["home"]): g["game_id"] for g in model.get("games", [])}
    scores, records, meta, live_stats = [], {}, {}, {}
    now = datetime.now(timezone.utc).isoformat()

    for event in data.get("events", []):
        comp = (event.get("competitions") or [{}])[0]
        teams = {}
        for x in comp.get("competitors", []):
            code = code_from_team(x.get("team") or {})
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
                    possession = code_from_team(x.get("team") or {})
                    break
        last_play = situation.get("lastPlay") or {}
        item = {
            "game_id": gid,
            "espn_event_id": str(event.get("id") or ""),
            "away": pair[0], "home": pair[1],
            "away_score": teams["away"][1], "home_score": teams["home"][1],
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
        meta[gid] = {k: item[k] for k in ["commence_utc", "network", "venue", "espn_event_id"]}

        if state in {"LIVE", "FINAL"} and event.get("id"):
            try:
                summary = get_json(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event={event['id']}")
                live_stats[gid] = {
                    "source": "ESPN_GAME_SUMMARY",
                    "updated_at_utc": now,
                    "team_stats": parse_team_stats(summary),
                    "player_stats": parse_player_leaders(summary),
                    "recent_plays": parse_plays(summary),
                    "scoring_plays": parse_scoring(summary),
                    "current_drive": parse_drive(summary)
                }
            except Exception as e:
                prior = (old.get("live_stats") or {}).get(gid)
                if prior:
                    live_stats[gid] = prior
                live_stats.setdefault(gid, {})["error"] = type(e).__name__

    if not scores:
        raise RuntimeError("scoreboard returned no matching Week games; refusing to overwrite existing dashboard")

    payload = {
        "updated_at_utc": now,
        "season": season,
        "week": week,
        "score_source": "ESPN_SCOREBOARD",
        "live_stats_source": "ESPN_GAME_SUMMARY",
        "scores": scores,
        "records": records or old.get("records", {}),
        "game_meta": meta or old.get("game_meta", {}),
        "live_stats": live_stats or old.get("live_stats", {}),
        "injuries": old.get("injuries", [])
    }
    OUT.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"live scoreboard refreshed: games={len(scores)} live={sum(x['state']=='LIVE' for x in scores)} final={sum(x['state']=='FINAL' for x in scores)} rich={len(live_stats)}")

if __name__ == "__main__":
    main()
