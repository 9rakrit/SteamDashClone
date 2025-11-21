from flask import Flask, render_template, request, jsonify
import requests
import numpy as np
import time
from functools import lru_cache
from bs4 import BeautifulSoup


app = Flask(__name__)

@app.route("/")
def home():
    return render_template("dashboard.html")

@app.route("/api/search")
def search():
    q = request.args.get("query", "")
    url = f"https://steamcommunity.com/actions/SearchApps/{q}"
    try:
        data = requests.get(url).json()
        return jsonify(data)
    except:
        return jsonify([])

@app.route("/api/players/<appid>")
def players(appid):
    url = f"https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid={appid}"
    try:
        data = requests.get(url).json()
        return jsonify(data["response"].get("player_count", 0))
    except:
        return jsonify(0)

@lru_cache(maxsize=50)
def fetch_history(appid):
    url = f"https://steamcharts.com/app/{appid}/chart-data.json"
    time.sleep(0.5)  # small delay to avoid rate limiting
    r = requests.get(url, timeout=10)
    return r.json()


@app.route("/api/history/<appid>")
def history(appid):
    try:
        data = fetch_history(appid)
        history_values = [row[1] for row in data[-30:]]  # last 30 days
        return jsonify(history_values)
    except Exception as e:
        print("History Error:", str(e))
        return jsonify([])



from statsmodels.tsa.holtwinters import ExponentialSmoothing

@app.route("/api/forecast/<appid>")
def forecast(appid):
    import numpy as np
    import requests
    from statsmodels.nonparametric.smoothers_lowess import lowess

    url = f"https://steamcharts.com/app/{appid}/chart-data.json"
    data = requests.get(url).json()

    last_30 = np.array([p[1] for p in data[-30:]], dtype=float)

    # LOWESS smoothing for curve shape
    x = np.arange(len(last_30))
    smoothed = lowess(last_30, x, frac=0.25, return_sorted=False)

    # Rate of change from last few points
    recent_slope = np.mean(np.diff(smoothed[-5:]))

    forecast = []
    value = smoothed[-1]

    for i in range(30):
        decay = (1 - i / 40)  # dampen slope gradually
        seasonal = np.sin(i / 6) * 120  # soft seasonality
        value += recent_slope * decay
        forecast.append(int(value + seasonal))

    high = [int(v * 1.05) for v in forecast]
    low = [int(v * 0.95) for v in forecast]

    return jsonify({"forecast": forecast, "high": high, "low": low})






@app.route("/api/cover/<appid>")
def cover(appid):
    url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
    data = requests.get(url).json()
    try:
        img = data[appid]["data"]["header_image"]
        return jsonify({"img": img})
    except:
        return jsonify({"img": None})
    
@app.route("/api/top")
def top():
    url = "https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?count=10"
    data = requests.get(url).json()
    games = data["response"]["ranks"]
    return jsonify(games)


@app.route("/api/reviews/<appid>")
def get_reviews(appid):
    url = f"https://store.steampowered.com/appreviews/{appid}?json=1&filter=top&language=english&num_per_page=5"
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    return jsonify(r.json())


@app.route("/api/details/<appid>")
def game_details(appid):
    url = f"https://store.steampowered.com/api/appdetails?appids={appid}"
    try:
        r = requests.get(url).json()
        data = r[str(appid)]["data"]
        return jsonify({
            "name": data.get("name"),
            "release": data.get("release_date", {}).get("date", "Unknown"),
            "developer": data.get("developers", ["Unknown"]),
            "publisher": data.get("publishers", ["Unknown"]),
            "genres": [g["description"] for g in data.get("genres", [])],
            "desc": data.get("short_description", ""),
            "header": data.get("header_image", "")
        })
    except:
        return jsonify({})



@app.route("/api/news/<appid>")
def game_news(appid):
    url = f"https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid={appid}&count=5&maxlength=300"
    try:
        return jsonify(requests.get(url).json()["appnews"]["newsitems"])
    except:
        return jsonify([])
    
@app.route("/api/trending")
def trending():
    try:
        url = "https://steamcharts.com/top"
        r = requests.get(url, timeout=10)
        soup = BeautifulSoup(r.text, "html.parser")

        rows = soup.select("table.common-table tbody tr")[:5]  # top 5 trending

        games = []
        for row in rows:
            cols = row.find_all("td")
            link = cols[1].find("a")["href"]   # /app/1245620 or /app/123456
            appid = link.split("/")[-1].strip()

            games.append({
                "rank": cols[0].get_text(strip=True),
                "appid": appid,
                "name": cols[1].get_text(strip=True),
                "current": cols[2].get_text(strip=True),
                "peak": cols[3].get_text(strip=True),
                "gain": cols[4].get_text(strip=True),
            })

        return jsonify(games)
    except Exception as e:
        print("Trending error:", e)
        return jsonify([])

    
@app.route("/api/trending-games")
def trending_games():
    trending_list = [
        {"name": "Helldivers 2", "players": 450000},
        {"name": "Palworld", "players": 320000},
        {"name": "Apex Legends", "players": 210000},
    ]
    return jsonify(trending_list)   # ← wrap in jsonify








if __name__ == "__main__":
    app.run(debug=True)