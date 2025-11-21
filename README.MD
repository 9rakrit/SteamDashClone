# 🎮 MetaArena
### **Insight, competition, and forecasting — all in one arena**

MetaArena is a real-time analytics dashboard for Steam games, combining player statistics, predictive forecasts, sentiment insights, trending rankings, review analysis, and head-to-head comparison. Designed for gamers, analysts, and developers — MetaArena turns live data into actionable intelligence.

---

## 🚀 Features

### 🔍 Search Any Game
- Fetch real-time Steam player statistics
- Displays:
  - 🎯 **Current players**
  - 📈 **Avg / Peak (30-day)**
  - 🆔 **AppID**
  - 🖼 **Game cover**
  - 🏷 **Genre, publisher, developer**
  - 📅 **Release date**

---

### ⚔️ Compare Mode (Game vs Game Dashboard)
Compare the performance of two games visually:
- Overlayed **actual player history**
- Dual-line **forecast predictions**
- Side-by-side trends to determine popularity shifts
- Allows competitive analytics & decision making
Uses the same forecasting engine for both selected titles.

---

### 📈 Player Forecasting
Predicts future player trends for the next 30 days using:
- **LOWESS curve smoothing**
- **Slope projection model**
- **High & Low variation ranges**

Visualized using **Chart.js** with:
- Actual values (30 days)
- Forecast (next 30 days)
- High confidence boundary
- Low boundary line

---

### 😄 Community Sentiment Analysis
Categorizes recent reviews based on text sentiment:
- **Positive**
- **Neutral**
- **Negative**
- Displays total review counts
- Rendered as a customizable bar chart

---

### 💬 Top Steam Reviews
Dynamic review cards showing:
- Review text
- 👍 **Helpful votes**
- 😂 **Funny votes**
- Recommendation status
- Clean UI without overflowing text

---

### 🔥 Trending Games
Scraped from **SteamCharts** and displays:
- Rank
- Live player counts
- 24-hour gain/loss
- Top 5 trending titles

---

### 📰 Latest Patch Notes & News
Real game news updates via official Steam News API:
- Latest articles
- Publication date
- Preview text + external link

---

## 🧠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Flask (Python)** | Backend server & routing |
| **Steam Web API / Steam News / SteamCharts** | Real-time game data |
| **BeautifulSoup** | Scraping for trending games |
| **NumPy / Statsmodels LOWESS** | Forecasting model |
| **Chart.js** | Interactive visual charts |
| **HTML / CSS / JavaScript** | Front-end |
| **Requests** | API & HTTP data fetching |

---

## 📂 Project Structure
MetaArena/
│
├── app.py # Flask backend + APIs + logic
├── /templates/ # Jinja HTML pages
│ ├── dashboard.html
│ ├── compare.html
│
├── /static/
│ ├── style.css # UI styling
│ ├── script.js # Front-end fetch & charts
│
└── README.md

---

## 🎯 Project Purpose
MetaArena demonstrates the integration of real-world live APIs, machine-learning-based forecasting, and dynamic front-end visualization. It highlights capabilities in:

- Predictive analytics
- Data engineering & web scraping
- Sentiment analysis of consumer feedback
- UI/UX dashboard development
- REST API integration and full-stack architecture




