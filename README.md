<p style={{fontSize: 50}}>Ogoo AI 🤖</p>
A high-performance, cross-platform AI Assistant built with React Native and FastAPI.

Ogoo is a sleek, responsive chat application that leverages the power of the Gemini 1.5 Flash model to provide intelligent, context-aware responses. It features a robust Python backend and a fluid mobile frontend designed for the modern user.

🚀 Features
Real-time AI Chat: Powered by Google Gemini for natural, witty conversation.

Smart Search: Integrated DuckDuckGo API for live web-querying capabilities.

Fluid UI: Built with React Native and Reanimated for 60fps animations.

Auto-Scrolling: Intelligent chat history management with FlatList and useRef.

Optimised Backend: Asynchronous FastAPI architecture for high-speed request handling.

🛠️ Tech Stack
Frontend
Framework: React Native (Expo SDK 50+)

Icons: Lucide React Native

Animation: React Native Reanimated

Network: Fetch API with async/await

Backend
Language: Python 3.10+

Framework: FastAPI

AI Engine: Google Generative AI (Gemini)

Deployment: Vercel (Serverless Functions)

📦 Installation & Setup
1. Backend Setup
Bash
cd backend
pip install -r requirements.txt
# Set your GEMINI_API_KEY in your environment variables
uvicorn main:app --reload
2. Mobile Setup
Bash
cd ogoo-bot
npm install
npx expo start
🔌 API Reference
Post a message to Ogoo
HTTP
POST /main
Content-Type: application/json

{
  "message": "Hello Ogoo, how does React Native work?"
}
Response:

JSON
{
  "reply": "React Native allows you to build native apps using JavaScript and React! 🚀"
}
👤 Author
Developer Ekene

GitHub: developerekene

Portfolio: [Tool Box App]

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
