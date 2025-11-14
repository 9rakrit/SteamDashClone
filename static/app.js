const q = document.getElementById("q");
const searchBtn = document.getElementById("search-btn");
const results = document.getElementById("results");
let chart;

searchBtn.onclick = async () => {
  if (!q.value.trim()) return;
  const games = await fetch(`/api/search?query=${q.value}`).then(r => r.json());

  results.innerHTML = "";
  results.style.display = "block";

  games.forEach(g => {
    const li = document.createElement("li");
    li.innerText = `${g.name} (AppID: ${g.appid})`;

    li.onclick = () => {
      loadGame(g.appid, g.name);
      results.innerHTML = "";
      results.style.display = "none";
    };

    results.appendChild(li);
  });
};

async function loadGame(appid, name) {
  document.getElementById("selected-name").innerText = name;
  document.getElementById("selected-appid").innerText = appid;

  const players = await fetch(`/api/players/${appid}`).then(r => r.json());
  document.getElementById("current-players").innerText =
      players ? players.toLocaleString() : "—";

  const history = await fetch(`/api/history/${appid}`).then(r => r.json());
  const forecastResp = await fetch(`/api/forecast/${appid}`).then(r => r.json());

  drawChart(history, forecastResp.forecast, forecastResp.high, forecastResp.low);
}

function drawChart(history, forecast, high, low) {
  const ctx = document.getElementById("chart").getContext("2d");
  if (chart) chart.destroy();

  const labels = [...Array(60).keys()];

  const pad = Array(history.length).fill(null);  // shift forecast visually
  const forecastShifted = [...pad, ...forecast];
  const highShifted = [...pad, ...high];
  const lowShifted = [...pad, ...low];

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Actual Players",
          data: history,
          borderColor: "#76b3ff",
          borderWidth: 3,
          tension: 0.3,
        },
        {
          label: "Forecast",
          data: forecastShifted,
          borderColor: "#55ff99",
          borderDash: [6, 6],
          borderWidth: 3,
          tension: 0.3,
        },
        {
          label: "High",
          data: highShifted,
          borderColor: "#ffcc33",
          borderDash: [6, 6],
          tension: 0.3,
        },
        {
          label: "Low",
          data: lowShifted,
          borderColor: "#ff6666",
          borderDash: [6, 6],
          tension: 0.3,
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { display: false }
      }
    }
  });
}

