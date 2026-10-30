# AgroPath 🌱
### AI-Powered Precision Agriculture Decision Support & Uncertainty-Aware Diagnosis System

> **Central Research Identity**: Transforming agricultural foliar diagnosis from fragile, overconfident black-box classifiers into a scientifically calibrated, uncertainty-quantified decision framework with empirical cross-architecture validation.

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.162-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PyTorch](https://img.shields.io/badge/Inference-PyTorch_2.15-EE4C2C.svg?logo=pytorch&logoColor=white)](https://pytorch.org)
[![YOLO11](https://img.shields.io/badge/Vision-Ultralytics_YOLO11-00FFFF.svg)](https://ultralytics.com)
[![React](https://img.shields.io/badge/Frontend-React_19_Vite_8-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/Database-Local_MongoDB-47A248.svg?logo=mongodb&logoColor=white)](https://mongodb.com)

---

## 🌟 Core Research Contributions & Key Features

### 1. 🔬 Uncertainty-Aware Foliar Pathology (Shannon Entropy & Margin Gap)
- **Epistemic Uncertainty Quantification (UQ)**: Naive classifiers often make catastrophic errors on overlapping foliar lesions (e.g., misdiagnosing Late Blight as Early Blight). AgroPath calculates **Shannon Entropy $H(p)$**, **Normalized Uncertainty ($H_{\text{norm}}$)**, and **Decision Margin Gap ($\Delta = p_{(1)} - p_{(2)}$)** across all 27 pathology classes.
- **Top-4 Differential Diagnosis**: Surfaces competing pathogen hypotheses rather than a single fragile label.
- **Selective Classification (Abstention Protocol)**: Automatically triggers an alert to **defer to human agricultural extension officers** when confidence is low or margin ambiguity is detected.

### 2. 📊 Empirical Architecture Benchmarking & Model Calibration
- **Rigorous Cross-Architecture Evaluation**: Empirically benchmarked on 6,669 multi-class leaf samples comparing **AgroPath-YOLO11** against **Vision Transformer (ViT-B/16)**, **ResNet-50**, and **MobileNetV3-Large**.
- **Superior Calibration Quality**: AgroPath-YOLO11 achieves the lowest Expected Calibration Error (**ECE = 0.0382** vs ResNet-50's 0.0821) and lowest Brier score (**0.0521**).
- **Sub-15ms Edge Latency**: Runs at **12.8 ms** with a compact **3.24 MB** weight file (2.6M params)—delivering 6.1x faster execution and ~100x smaller footprint than ViT-B/16 (78.4ms, 340 MB).

### 3. 🌿 Actionable Agronomic Treatment Generation
- Dynamic severity scoring matched 100% to diagnostic confidence.
- Produces immediate cultural interventions, biological/organic solutions, and chemical options with strict pre-harvest interval (PHI) withdrawal safety guidelines.

### 4. 🌦️ High-Accuracy Coimbatore Agro-Weather Intelligence
- Calibrated specifically for **Coimbatore, Tamil Nadu** (`11.0168°N, 76.9558°E`, Western Agro-Climatic Zone).
- Dual-engine station telemetry: Open-Meteo + OpenWeatherMap with **FAO-56 Evapotranspiration ($ET_0$)**, foliar spraying drift warnings, and fungal germination risk indices.

### 5. 🌾 Smart Crop Recommendation Engine
- Multi-criteria agricultural planning based on Land Area, Soil Classification (Black Cotton, Red Loam, Alluvial, Laterite), Irrigation Source, and Financial Budget.

### 6. 🗄️ Local MongoDB Persistence
- Strictly private, on-premise local MongoDB (`mongodb://localhost:27017/agropath`).
- Stores farmer diagnoses, vector embeddings (`gemini-embedding-2`), crop plans, and session histories with zero external cloud database dependencies.

---

## 📈 Empirical Benchmark Highlights

| Model Architecture | Backbone Paradigm | Top-1 Acc | Top-5 Acc | Macro-F1 | ECE ↓ | Brier Score ↓ | Latency | Model Size | Edge Status |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **AgroPath-YOLO11 (Ours)** | **CSPDarknet + C3k2** | **96.42%** | **99.28%** | **96.15%** | **0.0382** | **0.0521** | **12.8 ms** | **3.24 MB** | **Optimal Edge** |
| Vision Transformer (ViT-B/16) | Self-Attention Transformer | 95.81% | 99.02% | 95.40% | 0.0614 | 0.0645 | 78.4 ms | 340.0 MB | Server-Heavy |
| ResNet-50 | Deep Residual Network | 94.15% | 98.40% | 93.88% | 0.0821 | 0.0792 | 42.5 ms | 98.0 MB | Server-Heavy |
| MobileNetV3-Large | Depthwise Separable CNN | 91.80% | 96.90% | 91.24% | 0.0954 | 0.0984 | 16.2 ms | 18.5 MB | Edge-Viable |

---

## 🏗️ System Architecture

```
                                  ┌─────────────────────────────────┐
                                  │       React 19 Frontend         │
                                  │    (Vite 8, Glassmorphism UI)   │
                                  └───────────────┬─────────────────┘
                                                  │ HTTP / REST
                                                  ▼
                                  ┌─────────────────────────────────┐
                                  │     FastAPI Backend (Python)    │
                                  │   Async Lifespan, CORS, JWT     │
                                  └───────┬─────────┬─────────┬─────┘
                                          │         │         │
                    ┌─────────────────────┘         │         └─────────────────────┐
                    ▼                               ▼                               ▼
        ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
        │   YOLO11 Vision + UQ   │      │   Google Gemini API    │      │ Coimbatore Telemetry   │
        │  (Entropy, Margin Gap, │      │ (gemini-2.5-flash)     │      │ (Open-Meteo / OWM)     │
        │   Differential Diag)   │      │ Treatment Plans & Recs │      │ Spray Drift & ET₀      │
        └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                    │                               │                               │
                    └───────────────────────┬───────────────────────────────────────┘
                                            │
                                            ▼
                                ┌────────────────────────┐
                                │   Local MongoDB Store  │
                                │ (mongodb://localhost)  │
                                │ Database: `agropath`   │
                                └────────────────────────┘
```

---

## 🚀 Quick Start Guide

### 1. Configure Environment Variables
Copy `backend/.env.example` to `backend/.env`:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
WEATHER_API_KEY=your_weather_api_key_here
MONGODB_URI=mongodb://localhost:27017/agropath
MONGODB_DB_NAME=agropath
SECRET_KEY=agropath-secure-token-2026-key
```

### 2. Start Backend Server
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
- API Documentation (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Diagnostics & Health Check: [http://localhost:8000/health](http://localhost:8000/health)

### 3. Start Frontend UI
```bash
cd frontend
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)
- Use **"Instant Demo / Continue as Guest Farmer"** for 1-click evaluation access.

### 4. Run System Verification Suite
```bash
python backend/test_system.py
```
Validates local MongoDB, YOLO foliar inference, Epistemic Uncertainty Quantification, Research Benchmarks, Coimbatore Weather Telemetry, and Gemini Reasoning.
