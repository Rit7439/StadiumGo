# # StadiumGo 🏟️

> **AI-Powered Smart Stadium Experience System**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)](https://stadiumgo-776914828699.asia-south1.run.app/)

A premium, interactive single-page application demonstrating a four-layer smart stadium operating system. Built with modern web technologies and deployed on Google Cloud Run.

## 🌐 Live Demo

**[https://stadiumgo-776914828699.asia-south1.run.app/](https://stadiumgo-776914828699.asia-south1.run.app/)**

## ✨ Features

- **Real-time AI Decision Log** — Live-streaming ML decision feed with animated counters
- **3D Interactive Cards** — VanillaTilt.js powered tilt effects on all feature cards
- **Smooth Scroll** — Lenis + GSAP ticker integration for frame-perfect scrolling
- **Typewriter Hero** — Typed.js cycling through system capabilities
- **3D Globe** — Three.js powered rotating globe showing global stadium network
- **Four-Layer Architecture** — Fan Experience · Crowd Intelligence · Venue Ops · Command Core

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 (Semantic) |
| Styling | Vanilla CSS (Custom Design System) |
| Animations | GSAP + ScrollTrigger |
| 3D Rendering | Three.js |
| Smooth Scroll | Lenis |
| Interactions | VanillaTilt.js |
| Typewriter | Typed.js |
| Deployment | Google Cloud Run + nginx:alpine |

## 🚀 Deployment

Containerized with Docker and deployed on **Google Cloud Run** (asia-south1):

```bash
gcloud builds submit --tag gcr.io/promptwars-virtual-493419/stadiumgo .
gcloud run deploy stadiumgo --image gcr.io/promptwars-virtual-493419/stadiumgo --platform managed --region asia-south1 --allow-unauthenticated --port 8080
```

## 👨‍💻 Built By

**Ritam Das** — [LinkedIn](https://www.linkedin.com/in/ritamdas/) · [GitHub](https://github.com/Rit7439/StadiumGo)