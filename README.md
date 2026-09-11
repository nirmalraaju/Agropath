#AgroPath 🌱

An AI-Powered Decision Support System for First-Time Farmers

AgroPath is an AI-powered web application designed to help first-time farmers make better agricultural decisions using computer vision, Large Language Models (LLMs), and weather intelligence.

The system aims to provide practical assistance for crop disease detection, crop recommendation, and farming guidance through a simple web interface.

🚀 Project Status

Current Status: MVP / Under Development

The project is being developed incrementally for a minimum working demonstration.

Current Focus

🌿 Plant disease detection using YOLO11

📷 Image upload and AI-based disease analysis

🤖 AI-assisted agricultural recommendations

Planned Features

🌾 Crop Recommendation

🌦️ Weather-based farming guidance

💬 AI Farming Assistant

📋 Disease Detection History

📊 Farmer Dashboard

🗄️ Database Integration

🏗️ System Architecture

                    AgroPath
                       │
        ┌──────────────┴──────────────┐
        │                             │
    React Frontend               FastAPI Backend
        │                             │
        │                    ┌────────┼────────┐
        │                    │        │        │
        │                  YOLO11   Gemini  Weather
        │                    │        │        │
        └────────────────────┴────────┴────────┘
                       │
                  Data Storage
                 (Planned)

🧠 AI Components

Disease Detection

The disease detection module uses YOLO11 for plant disease detection from uploaded images.

Basic workflow:

Leaf Image
    ↓
Image Upload
    ↓
FastAPI
    ↓
YOLO11
    ↓
Disease Detection
    ↓
Confidence + Bounding Box
    ↓
Web Interface

Crop Recommendation

The planned crop recommendation module uses Gemini Flash to generate recommendations based on:

Location

Land Area

Soil Type

Water Source

Budget

The system is designed to return ranked crop recommendations along with relevant cultivation information.

🛠️ Technology Stack

Frontend

React

Vite

Axios

React Router

Backend

Python

FastAPI

Uvicorn

AI / Machine Learning

YOLO11

Ultralytics

PyTorch

Gemini Flash API

Database

MongoDB Atlas (planned)

Development

Git

GitHub

VS Code

📁 Project Structure

Agropath/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── services/
│   │   └── main.py
│   ├── models/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
│
├── Disease-detection/
│
├── .gitignore
└── README.md

Note: Large model files, environment variables, datasets, and generated files are excluded from the Git repository.

⚙️ Getting Started

1. Clone the repository

git clone https://github.com/nirmalraaju/Agropath.git
cd Agropath

2. Frontend Setup

cd frontend
npm install
npm run dev

3. Backend Setup

Open another terminal:

cd backend

Create a virtual environment:

python -m venv venv

Activate it on Windows:

venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

Start FastAPI:

uvicorn app.main:app --reload

🔐 Environment Variables

Create a .env file locally for API keys and configuration.

Example:

GEMINI_API_KEY=your_api_key_here
MONGODB_URI=your_mongodb_connection_string_here

Never commit .env or API keys to GitHub.

🔬 Research Direction

AgroPath is based on a research-oriented architecture combining:

YOLO11-based plant disease detection

PathoYOLO improvements

Gemini-based agricultural reasoning

Weather-aware farming recommendations

Future research work includes model improvements, ablation studies, severity estimation, offline inference, and multilingual/voice assistance.

👥 Contributors

This project is developed collaboratively.

See the repository's contributor list for current contributors.

📌 Disclaimer

AgroPath is an academic/research project intended to provide decision-support information. AI-generated recommendations should not be considered a substitute for professional agricultural advice.

📄 License

This project is currently intended for academic and educational purposes.
