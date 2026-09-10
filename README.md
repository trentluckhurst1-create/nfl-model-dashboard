# NFL Model Dashboard

Public one-stop dashboard for the frozen 008A NFL fair-line model.

## Features
- Weekly game board
- Frozen model fair lines
- Market reference and edge
- Scores/results
- Injury news
- Prospective validation ledger
- 4+ discrepancy indicator (`POST_HOC_NOT_CERTIFIED`)
- Model methodology/governance

## Production governance
- Engine: `008A_RIDGE`
- Architecture: `002D_SUCCESS_PLUS_007C_SNAP_WEIGHTED_STATUS`
- Training cutoff: end of 2024
- 2025 labels do not refit the frozen Ridge
- Market is never a model input
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
