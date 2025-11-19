from flask import Flask, render_template, request, jsonify
import requests
import numpy as np

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

@app.route("/api/history/<appid>")
def history(appid):
    url = f"https://steamcharts.com/app/{appid}/chart-data.json"
    data = requests.get(url).json()
    last_30 = [p[1] for p in data[-30:]]
    return jsonify(last_30)

from prophet import Prophet
import pandas as pd

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



if __name__ == "__main__":
    app.run(debug=True)