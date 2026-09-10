# EDGEiQ NFL

Professional one-stop NFL intelligence and operations terminal built around the frozen 008A fair-line model.

## Product identity
- Name: `EDGEiQ NFL`
- Terminal: live NFL operations, matchup intelligence, market reference, personnel, scores and prospective model validation
- Brand principle: data, discipline, edge

## Features
- Weekly game board
- Frozen model fair lines
- Market reference and edge
- Team logos and matchup identity
- Live scores/game state
- Injury and personnel intelligence
- Prospective validation ledger
- 4+ discrepancy indicator (`POST_HOC_NOT_CERTIFIED`)
- Model methodology/governance

## Production governance
- Engine: `008A_RIDGE`
- Architecture: `002D_SUCCESS_PLUS_007C_SNAP_WEIGHTED_STATUS`
- Training cutoff: end of 2024
- 2025 labels do not refit the frozen Ridge
- Market is never a model input
- News/live-game information is never a model input
- Locked live rows are immutable

## GitHub Pages
Enable Pages from `main` / repository root.

## Public/private separation
Only publish generated model outputs. Do not commit raw research data, API keys, private caches or `.env` files.

## Local preview (PowerShell)
```powershell
python -m http.server 8080
Start-Process 'http://localhost:8080'
```
