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

@app.route("/api/forecast/<appid>")
def forecast(appid):
    url = f"https://steamcharts.com/app/{appid}/chart-data.json"
    data = requests.get(url).json()
    last_30 = np.array([p[1] for p in data[-30:]])

    x = np.arange(len(last_30))
    slope, intercept = np.polyfit(x, last_30, 1)
    future = []
    last_val = last_30[-1]

    for i in range(1, 31):
        seasonal = np.sin(i / 3) * 2000
        y = last_val + slope * i + seasonal
        future.append(max(int(y), 0))

    high = [int(v * 1.15) for v in future]
    low = [int(v * 0.85) for v in future]

    return jsonify({"forecast": future, "high": high, "low": low})

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


if __name__ == "__main__":
    app.run(debug=True)
