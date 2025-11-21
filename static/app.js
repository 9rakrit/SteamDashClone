let chart;
let compareMode = false;
let secondGame = null;


document.getElementById("search-btn").addEventListener("click", () => {
    let q = document.getElementById("q").value.trim();
    if (!q) return;
    searchGames(q);
});

document.getElementById("compare-btn").addEventListener("click", () => {
  compareMode = true;
  alert("Compare Mode Active: Search and select a second game to overlay.");
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
        li.onclick = () => {
    if (!compareMode) {
        loadGame(game.name, game.appid);
    } else {
        loadSecondGame(game.appid, game.name);
        compareMode = false;
    }
};

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


    loadDetails(appid);

    loadNews(appid);



    // ---- FORECAST ----
    const forecastRes = await fetch(`/api/forecast/${appid}`);
    const forecastData = await forecastRes.json();

    drawChart(history, forecastData.forecast, forecastData.high, forecastData.low);


loadReviews(appid);
loadTrending();




}

async function loadTrending() {
    const res = await fetch(`/api/trending`);
    const games = await res.json();

    const box = document.getElementById("trending-list");
    box.innerHTML = games.map(g => `
        <div class="trending-item">
            <span>${g.name}</span>
            <span class="trending-gain ${g.gain.startsWith('+') ? 'positive' : 'negative'}">
                ${g.gain}
            </span>
        </div>
    `).join("");
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

function renderComparison() {
  if (!chart) return;

  chart.data.datasets.push({
    label: `${secondGame.name} (Actual)`,
    data: secondGame.history,
    borderColor: "#c77dff",
    borderWidth: 2,
    tension: 0.3
  });

  chart.data.datasets.push({
    label: `${secondGame.name} (Forecast)`,
    data: [...Array(secondGame.history.length).fill(null), ...secondGame.forecast],
    borderColor: "#c77dff77",
    borderDash: [6, 6],
    borderWidth: 2,
    tension: 0.3
  });

  chart.update();
}


// ---- THEME MODE TOGGLE ----
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// Load saved theme
let theme = localStorage.getItem("theme") || "dark";
document.documentElement.className = theme;
themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";

themeToggle.addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.className = theme;
    themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
    localStorage.setItem("theme", theme);
});

function padHistoryData(data, targetLength) {
    const padAmount = targetLength - data.length;
    return [...Array(padAmount).fill(null), ...data];
}

function padForecast(data, historyLength) {
    // historyLength = how many history points the main game has (e.g. 30)
    return [...Array(historyLength).fill(null), ...data];
}




async function loadSecondGame(appid, name) {

  // --- HISTORY DATA ---
  const historyRes = await fetch(`/api/history/${appid}`);
  const historyData = await historyRes.json();   // already an array of numbers
  let secondHistory = historyData.slice();       // copy
  // pad second history to align x-axis with main chart
  // Ensure both histories have equal length (last 30 days)
const mainHistoryLength = chart.data.datasets[0].data.length;
secondHistory = secondHistory.slice(-mainHistoryLength);


  // Add overlay history dataset
  chart.data.datasets.push({
      label: `${name} History`,
      data: secondHistory,
      borderColor: "orange",
      backgroundColor: "rgba(255,140,0,0.2)",
      borderWidth: 2,
      pointRadius: 2,
      tension: 0.3
  });




   // --- FORECAST DATA ---
  const forecastRes = await fetch(`/api/forecast/${appid}`);
  const forecastData = await forecastRes.json();

  const secondForecast = forecastData.forecast;
  const secondHigh     = forecastData.high;
  const secondLow      = forecastData.low;

  const mainHistoryLen = chart.data.datasets[0].data.length; // base game history length

  chart.data.datasets.push({
      label: `${name} Forecast`,
      data: padForecast(secondForecast, mainHistoryLen),
      borderColor: "rgb(255,215,0)",
      borderWidth: 2,
      borderDash: [6,4],
      tension: 0.3
  });

  chart.data.datasets.push({
      label: `${name} High`,
      data: padForecast(secondHigh, mainHistoryLen),
      borderColor: "rgb(255,255,102)",
      borderDash: [6,4],
      tension: 0.3
  });

  chart.data.datasets.push({
      label: `${name} Low`,
      data: padForecast(secondLow, mainHistoryLen),
      borderColor: "rgb(255,99,71)",
      borderDash: [6,4],
      tension: 0.3
  });

  chart.update();
}


async function loadDetails(appid) {
    const res = await fetch(`/api/details/${appid}`);
    const d = await res.json();

    document.getElementById("details-desc").innerText = d.desc || "No description available.";
    document.getElementById("details-release").innerText = d.release;
    document.getElementById("details-dev").innerText = d.developer.join(", ");
    document.getElementById("details-pub").innerText = d.publisher.join(", ");
    document.getElementById("details-genres").innerText = d.genres.join(", ");
}


async function loadNews(appid) {
  const res = await fetch(`/api/news/${appid}`);
  const news = await res.json();

  const list = document.getElementById("news-list");
  list.innerHTML = "";

  if (!news.length) {
      list.innerHTML = "<p>No recent news available.</p>";
      return;
  }

  news.forEach(article => {
      const li = document.createElement("li");
      li.className = "news-item";
      li.innerHTML = `
        <strong>${article.title}</strong><br>
        <small>${new Date(article.date * 1000).toLocaleDateString()}</small><br>
        ${article.contents.substring(0, 180)}... 
        <br><a href="${article.url}" target="_blank">Read more →</a>
      `;
      list.appendChild(li);
  });
}

async function loadTrending() {
    const res = await fetch("/api/trending");
    const games = await res.json();

    const container = document.getElementById("trending-container");
    container.innerHTML = "";

    games.forEach(g => {
        const card = document.createElement("div");
        card.className = "trending-card";
        card.innerHTML = `
            <div class="trend-rank">#${g.rank}</div>
            <div class="trend-name">${g.name}</div>
            <div class="trend-players">${g.current} players</div>
            <div class="trend-gain">Gain: ${g.gain}</div>
        `;
        
        card.onclick = () => loadGame(g.name, g.appid);  // 👈 key part
        container.appendChild(card);
    });
}
loadTrending();







function calculateSentiment(reviews) {
    let positive = 0, neutral = 0, negative = 0;

    reviews.forEach(r => {
        const text = r.review.toLowerCase();
        if (text.includes("good") || text.includes("love") || text.includes("amazing")) positive++;
        else if (text.includes("bad") || text.includes("hate") || text.includes("trash")) negative++;
        else neutral++;
    });

    return [positive, neutral, negative];  // return array
}



function drawSentimentChart(values) {
    const ctx = document.getElementById("sentimentChart").getContext("2d");

    if (window.sentimentChartInstance) window.sentimentChartInstance.destroy();

    window.sentimentChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ["Positive", "Neutral", "Negative"],
            datasets: [{
                label: "Review Count",
                data: values,   // <-- array now works!
                backgroundColor: ["#4ade80", "#facc15", "#f87171"]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    ticks: { color: "#fff" },
                    beginAtZero: true
                },
                x: {
                    ticks: { color: "#fff" }
                }
            },
            plugins: {
                legend: { labels: { color: "#fff" } }
            }
        }
    });
}






async function loadReviews(appid) {
    const res = await fetch(`/api/reviews/${appid}`);
    const data = await res.json();
    const reviews = data.reviews || [];

    const reviewsContainer = document.getElementById("reviews-container");
    reviewsContainer.innerHTML = `<h3 class="section-title">Top Steam Reviews</h3>`;

    reviews.forEach(r => {
        const div = document.createElement("div");
        div.className = "review-card";
        div.innerHTML = `
            <p>${r.review}</p>
            <div class="review-stats">
                👍 Helpful: ${r.votes_up} • 😂 Funny: ${r.votes_funny}
            </div>
        `;
        reviewsContainer.appendChild(div);
    });

    const sentiments = calculateSentiment(reviews);
    drawSentimentChart(sentiments);
}
