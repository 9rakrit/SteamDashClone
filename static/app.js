let chart;

document.getElementById("search-btn").addEventListener("click", () => {
    let q = document.getElementById("q").value.trim();
    if (!q) return;
    searchGames(q);
});

async function searchGames(query) {
    const resultsBox = document.getElementById("results");
    resultsBox.innerHTML = "";
    resultsBox.style.display = "block";

    const res = await fetch(`/api/search?query=${query}`);
    const games = await res.json();

    games.forEach(game => {
        const li = document.createElement("li");
        li.textContent = `${game.name} (AppID: ${game.appid})`;
        li.onclick = () => loadGame(game.name, game.appid);
        resultsBox.appendChild(li);
    });
}

async function loadGame(name, appid) {
    document.getElementById("results").innerHTML = "";
    document.getElementById("selected-name").innerText = name;
    document.getElementById("selected-appid").innerText = appid;

    // ---- CURRENT PLAYERS ----
    const playersRes = await fetch(`/api/players/${appid}`);
    const playerCount = await playersRes.json();
    document.getElementById("current-players").innerText =
        Number(playerCount).toLocaleString();

    // ---- COVER IMAGE ----
    fetch(`/api/cover/${appid}`)
      .then(r => r.json())
      .then(d => {
          document.getElementById("cover-img").src = d.img;
      });

    // ---- HISTORY AVERAGE + PEAK ----
    const histRes = await fetch(`/api/history/${appid}`);
    const history = await histRes.json();

    const avg = Math.round(history.reduce((a,b)=>a+b) / history.length);
    const peak = Math.max(...history);

    document.getElementById("avg-peak").innerText =
        `${avg.toLocaleString()} / ${peak.toLocaleString()}`;

    // ---- FORECAST ----
    const forecastRes = await fetch(`/api/forecast/${appid}`);
    const forecastData = await forecastRes.json();

    drawChart(history, forecastData.forecast, forecastData.high, forecastData.low);
}

// ---- CHART RENDERING ----
function drawChart(history, forecast, high, low) {

    if (chart) chart.destroy();

    const ctx = document.getElementById("chart").getContext("2d");

    const labels = [
        ...history.map((_, i) => `-${29 - i}`),
        ...forecast.map((_, i) => `+${i+1}`)
    ];

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Actual Players",
                    data: history,
                    borderColor: "#4eaaff",
                    tension: 0.35,
                    pointRadius: 3
                },
                {
                    label: "Forecast",
                    data: [...Array(history.length).fill(null), ...forecast],
                    borderColor: "#00c46e",
                    borderDash: [6,6],
                    tension: 0.35,
                    pointRadius: 3
                },
                {
                    label: "High",
                    data: [...Array(history.length).fill(null), ...high],
                    borderColor: "#ffd54a",
                    borderDash: [6,6],
                    tension: 0.35,
                    pointRadius: 3
                },
                {
                    label: "Low",
                    data: [...Array(history.length).fill(null), ...low],
                    borderColor: "#ff4d4d",
                    borderDash: [6,6],
                    tension: 0.35,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: "white" }}},
            scales: {
                y: { ticks: { color: "white" }, grid: { color: "#1e293b" }},
                x: { ticks: { color: "white" }, grid: { color: "#1e293b" }}
            }
        }
    });
}


