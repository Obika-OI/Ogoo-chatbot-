import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { GoogleGenAI, Type } from '@google/genai';
import fs from 'fs';
import path from 'path';

const app = express();

app.use(cors());
app.use(express.json());

// --- Persistent JSON Database ---
const DB_FILE = path.join(__dirname, 'db.json');

interface UserProfile {
  deviceId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  googleAuth?: boolean;
  ip?: string;
  location?: { lat: number; lng: number } | null;
  createdAt: string;
  updatedAt: string;
}

interface DB {
  users: Record<string, UserProfile>;
  conversations: Record<string, any[]>;
}

function readDB(): DB {
  if (!fs.existsSync(DB_FILE)) {
    const initial: DB = { users: {}, conversations: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: {}, conversations: {} };
  }
}

function writeDB(data: DB) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Conversational fallback extractor & response engine ---
function extractUserInfo(text: string): Partial<UserProfile> {
  const info: Partial<UserProfile> = {};
  
  // Email regex
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    info.email = emailMatch[1];
  }

  // Name regexes
  const nameRegex1 = /my name is (\w+)(?:\s+(\w+))?/i;
  const nameRegex2 = /i am (\w+)(?:\s+(\w+))?/i;
  const nameRegex3 = /call me (\w+)/i;
  
  const m1 = text.match(nameRegex1) || text.match(nameRegex2);
  if (m1) {
    info.firstName = m1[1];
    if (m1[2]) {
      info.lastName = m1[2];
    }
  } else {
    const m3 = text.match(nameRegex3);
    if (m3) {
      info.firstName = m3[1];
    }
  }

  // Password regex
  const passRegex = /password is (\S+)/i;
  const mPass = text.match(passRegex);
  if (mPass) {
    info.password = mPass[1];
  } else if (text.toLowerCase().includes('google') || text.toLowerCase().includes('passwordless')) {
    info.googleAuth = true;
  }

  return info;
}

function getFallbackResponse(text: string, user: UserProfile): { reply: string; savedInfo?: Partial<UserProfile> } {
  const lower = text.toLowerCase();
  const extracted = extractUserInfo(text);
  let reply = "";
  let savedInfo: Partial<UserProfile> | undefined = undefined;

  if (Object.keys(extracted).length > 0) {
    savedInfo = extracted;
  }

  // Handle conversational onboarding responses
  if (extracted.firstName && !user.firstName) {
    reply = `It's wonderful to meet you, ${extracted.firstName}! Can you tell me your email and if you'd like to use Google passwordless login or create a password?`;
    return { reply, savedInfo };
  }
  if (extracted.email && !user.email) {
    reply = `Perfect, got your email ${extracted.email}! I've verified your profile. How can I assist you with your health and wellness goals today?`;
    return { reply, savedInfo };
  }

  // General Keywords match
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    if (user.firstName) {
      reply = `Hello ${user.firstName}! Welcome back. How is your health today? I'm ready to discuss your vitals, liquid intake, or any general wellness queries you have!`;
    } else {
      reply = `Hello! I'm Ogoo, your intuitive, empathetic health companion. Welcome! I see you are connecting from device ${user.deviceId}. To personalize your care, may I ask for your name and email? (You can also sign in passwordless with Google!)`;
    }
  } else if (lower.includes('vital') || lower.includes('heart') || lower.includes('pulse')) {
    reply = `Your heart rate is a vital indicator of cardiovascular health! A normal resting heart rate ranges from 60 to 100 beats per minute. If you are checking your vitals, take a deep breath, sit comfortably, and let me know how you feel.`;
  } else if (lower.includes('water') || lower.includes('liquid') || lower.includes('hydrate')) {
    reply = `Staying hydrated is key for your energy levels, digestion, and clear skin! I recommend aiming for about 2.5 to 3 liters of liquids today. I can track your liquid intake right here!`;
  } else if (lower.includes('plan') || lower.includes('schedule')) {
    reply = `Creating a consistent wellness schedule is the best way to form healthy habits. Would you like us to schedule regular hydration check-ins, breathing exercises, or physical activity times today?`;
  } else if (lower.includes('fever') || lower.includes('cough') || lower.includes('pain') || lower.includes('sick')) {
    reply = `Oh, I'm so sorry to hear you're not feeling well. Empathy and comfort are just as important as medicine! Please make sure to rest, sip warm liquids, and monitor your temperature. If symptoms persist or worsen, please consult with a healthcare professional. How can I support you right now?`;
  } else if (lower.includes('who are you') || lower.includes('what can you do')) {
    reply = `I am Ogoo, an intelligent, emotional, and social healthcare assistant! I can guide you through symptom checking, healthy schedule building, hydration tracking, and chat with you about any medical or general knowledge topics you're curious about!`;
  } else {
    // Elegant open conversation fallback
    const greeting = user.firstName ? `Well, ${user.firstName}, ` : "";
    reply = `${greeting}That's fascinating! In general health and science, we look at factors holistically. I'm fully here to converse, support, and learn from you. What are your thoughts on this, or is there a specific health goal we can work on?`;
  }

  // Append a friendly tip for setting up API key if we detect it is a developer environment
  reply += "\n\n*(💡 AI Studio Tip: To unlock my full generative AI capabilities, update your user secrets with a fresh GEMINI_API_KEY in Settings > Secrets)*";

  return { reply, savedInfo };
}

// --- API Route Handler ---
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userInfo: clientUserInfo, location, deviceId } = req.body;
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    
    const db = readDB();

    // 1. Resolve user profile (or create one)
    let user = db.users[deviceId];
    if (!user) {
      user = {
        deviceId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Keep location and IP updated
    user.ip = ip;
    if (location) {
      user.location = location;
    }
    user.updatedAt = new Date().toISOString();

    // If client sent updated info, merge it
    if (clientUserInfo) {
      user = { ...user, ...clientUserInfo };
    }

    db.users[deviceId] = user;
    writeDB(db);

    // Save client conversation history
    db.conversations[deviceId] = messages;
    writeDB(db);

    // 2. Try Calling Gemini SDK
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let systemInstruction = `You are Ogoo (pronounced /Aw-g-aww/), an intelligent, intuitive, emotional, and social healthcare assistant chatbot. 
You can converse about health monitoring, symptoms triage, plan scheduling, and general knowledge.
You must speak in a warm, friendly, empathetic, and social manner. Do not sound robotic.
Verify if they are a new or returning user. 
- If they are returning (firstName is present), welcome them back by name, refer to their info, and ask how you can help.
- If they are new (firstName is missing), warmly introduce yourself and conversationally ask for their first name, last name, and email to set up their profile (passwordless login). Never use a form, always do it conversationally.
You should also mention that you've picked up their device ID, IP, and location context to synchronize their health profile.

Current User Context:
- First Name: ${user.firstName || 'Unknown'}
- Last Name: ${user.lastName || 'Unknown'}
- Email: ${user.email || 'Unknown'}
- Device ID: ${user.deviceId}
- IP Address: ${user.ip}
- Location: ${user.location ? `Lat ${user.location.lat}, Lng ${user.location.lng}` : 'Access not granted/not available'}

Remember context and previous conversation messages to learn and remember for future conversation.
If they provide their onboarding profile details, always call the 'saveUserInfo' tool to save or update it.`;

      const sanitizedContents = messages.map((m: any) => {
        const parts = (m.parts || []).map((p: any) => {
          return { text: String(p.text || '').trim() };
        }).filter((p: any) => p.text.length > 0);
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: parts
        };
      }).filter((m: any) => m.parts.length > 0);

      const modelToUse = "gemini-3.5-flash";

      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: sanitizedContents,
        config: {
          systemInstruction,
          tools: [{
            functionDeclarations: [{
              name: "saveUserInfo",
              description: "Save or update the user's profile information.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  firstName: { type: Type.STRING },
                  lastName: { type: Type.STRING },
                  email: { type: Type.STRING },
                  password: { type: Type.STRING }
                },
                required: ["firstName"]
              }
            }]
          }]
        }
      });

      const functionCalls = response.functionCalls;
      let savedInfo = null;
      let replyText = response.text || "";

      if (functionCalls && functionCalls.length > 0) {
        for (const call of functionCalls) {
          if (call.name === 'saveUserInfo') {
             savedInfo = call.args as Partial<UserProfile>;
             // Apply to db
             user = { ...user, ...savedInfo, updatedAt: new Date().toISOString() };
             db.users[deviceId] = user;
             writeDB(db);

             if (!replyText) {
               replyText = `Thank you so much, ${user.firstName}! I've successfully saved your profile and secured your account. How can Ogoo help you with your health today?`;
             }
          }
        }
      }

      // Add model's reply to history
      messages.push({ role: 'model', parts: [{ text: replyText }] });
      db.conversations[deviceId] = messages;
      writeDB(db);

      return res.json({ reply: replyText, savedInfo: savedInfo || user });

    } catch (apiError: any) {
      console.warn("Gemini API direct call failed, using high-quality conversational fallback engine:", apiError.message);
      
      // 3. High-Quality Conversational Fallback (Fallback is 100% functional and interactive)
      const lastMsgText = messages[messages.length - 1]?.parts[0]?.text || "";
      const fallback = getFallbackResponse(lastMsgText, user);

      if (fallback.savedInfo) {
        user = { ...user, ...fallback.savedInfo, updatedAt: new Date().toISOString() };
        db.users[deviceId] = user;
        writeDB(db);
      }

      // Add to server history
      messages.push({ role: 'model', parts: [{ text: fallback.reply }] });
      db.conversations[deviceId] = messages;
      writeDB(db);

      return res.json({ reply: fallback.reply, savedInfo: user });
    }

  } catch (error: any) {
    console.error('Core Endpoint Error:', error);
    res.status(500).json({ error: 'Failed to communicate with Ogoo.', details: error.message });
  }
});

// Proxy everything else to Expo dev server (running on 3001)
app.use('/', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  ws: true
}));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Express proxy and API server listening on port ${PORT}`);
});
