# 🧠 MindEase

> A mental wellness app — **demo version**

MindEase is a React Native (Expo) app that helps users track their mood, journal their thoughts, and get AI-powered mental wellness advice.

---

## 📱 Features

- **Mood Tracking** – Log your daily mood with emoji-based inputs
- **AI Journaling** – Write entries and receive AI-powered emotional insights
- **Face Emotion Detection** – Analyze emotions via camera
- **Spotify Integration** – Get mood-based music recommendations
- **Streak System** – Stay consistent with daily wellness check-ins
- **OTP Email Verification** – Secure account creation flow

---

## 🗂 Project Structure

```
MindEase-v11/
├── Client/        # React Native (Expo) mobile app
└── Server/        # Node.js + Express REST API
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- MongoDB Atlas account
- Groq API key

### Client Setup
```bash
cd Client
npm install
# Copy .env.example to .env and fill in your values
npm start
```

### Server Setup
```bash
cd Server
npm install
# Copy .env.example to .env and fill in your values
npm run dev
```

---

## ⚙️ Environment Variables

### Client (`Client/.env`)
```
EXPO_PUBLIC_API_URL=http://<your-local-ip>:5000
```

### Server (`Server/.env`)
```
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SENDER_EMAIL=your_email
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
PORT=5000
```

---

## ⚠️ Note

This is a **demo/development version**. Not intended for production use.

---

## 📄 License

MIT
