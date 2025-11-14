# Game Dashboard
Features:
- Live Steam CCU (current players)
- Game search by name (Steam store search)
- 30‑day player history (SteamCharts)
- 30‑day forecast (Prophet) with confidence band
- Reddit sentiment (subreddit auto-detect + VADER)
- Two-game comparison mode


## Setup
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
python - <<EOF
import nltk; nltk.download('vader_lexicon')
EOF