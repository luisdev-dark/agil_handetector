# 🚀 Quick Start Guide - ASL Recognition System

## Prerequisites

- Python 3.8+
- Webcam or camera device
- Modern web browser

## ⚡ Quick Installation (5 minutes)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd asl-recognition-system
pip install -r requirements.txt
```

### 2. Download Model
Download the trained model from [Google Drive link] and place it in `models/asl_quick_model.h5`

### 3. Run Application
```bash
python app.py
```

### 4. Open Browser
Visit: `http://localhost:5000`

## 🎮 Available Features

- **Main Recognition** (`/`) - Real-time ASL letter detection
- **Practice Mode** (`/practice`) - Guided learning experience
- **Games Menu** (`/games`) - Gamified learning with 3 mini-games
- **Guide** (`/guide`) - Visual ASL alphabet reference
- **Dashboard** (`/dashboard`) - System metrics and statistics

## 🧪 Running Tests

```bash
# Run all game system tests
cd static/js/games/tests
node run-all-tests.js
```

## 📁 Project Structure

```
├── app.py                 # Flask application
├── models/               # Trained ML models
├── src/                  # Python source code
├── static/               # CSS, JS, images
├── templates/            # HTML templates
└── requirements.txt      # Python dependencies
```

## 🔧 Troubleshooting

**Camera not working?**
- Ensure camera permissions are granted
- Try refreshing the page
- Check browser compatibility

**Model not loading?**
- Verify model file exists in `models/` directory
- Check file name matches `asl_quick_model.h5`

**Port already in use?**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

## 📞 Support

For issues or questions, check the main README.md or create an issue in the repository.