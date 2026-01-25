# ARISE 🚀

**Gamifying Your Growth.**

ARISE is an interactive web application designed to help users track their financial and physical health through gamification. By rewarding wise choices and penalizing poor ones with an experience-based leveling system, ARISE transforms the "chore" of self-improvement into an engaging RPG-like experience.

**[Live Demo 🌐](https://arise-zeta-umber.vercel.app/)**

---

## 💡 The Inspiration

Tracking finance, workouts, and nutrition is often tedious and overwhelming. Most people give up because they lack immediate feedback. ARISE was born from the idea that our lives are the ultimate game. By unifying financial and health tracking into one interactive dashboard, we make better decision-making addictive.

## ✨ Key Features

* **🎮 Gamified Experience**: Gain XP for positive actions (gym sessions, saving money) and lose levels for setbacks.
* **🧠 AI-Driven Evaluation**: Integrated **Gemini AI** to analyze task difficulty and complexity to dynamically assign reward values.
* **💰 Financial Intelligence**: Real-time transaction tracking powered by the **Capital One API** to categorize spending as "good" or "bad" financial moves.
* **🔊 Immersive Audio**: Integrated **Eleven Labs** to provide high-quality audio feedback and celebratory sounds upon leveling up.
* **📊 Unified Dashboard**: A single source of truth for your physical and fiscal health.

---

## 🛠️ Tech Stack

| Category | Technology |
| --- | --- |
| **Frontend** | TypeScript, Next.js, Tailwind CSS |
| **Backend** | JavaScript, Node.js |
| **AI/LLM** | Google Gemini API |
| **Financial API** | Capital One |
| **Audio API** | Eleven Labs |
| **Health Monitoring** | Google Fit API |

---

## 🚀 Challenges & Lessons

* **API Orchestration**: Merging Capital One’s transaction data with Gemini’s reasoning capabilities required complex prompt engineering to ensure tasks were ranked fairly.
* **Team Synergy**: As the first hackathon for over half our team, we overcame initial hurdles in file structure and Git workflow to build a cohesive codebase.
* **Persistence**: From 1:00 AM brainstorming sessions to "dummy" data integration for financial testing, we learned the value of pivoting and perseverance.

---

## 📦 Installation & Setup

1. **Clone the repo:**
```bash
git clone https://github.com/algorithmsglitch/ARISE.git

```


2. **Install dependencies:**
```bash
npm install

```


3. **Environment Variables:**
Create a `.env` file and include your keys for:
* `GEMINI_API_KEY`
* `CAPITAL_ONE_API_KEY`
* `ELEVEN_LABS_API_KEY`


4. **Launch:**
```bash
npm run dev

```
---
