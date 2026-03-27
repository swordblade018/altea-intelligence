# bot.py

import os
import random
from settings import OPENAI_API_KEY, MODEL_NAME, MOCK_ENABLED

# Try to import OpenAI client
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

# ---- API / mock wiring -------------------------------------------------

# Single switch: can also be controlled from .env as USE_REAL_API=True/False
USE_REAL_API = os.getenv("USE_REAL_API", "true").lower() == "true"

client = None
if USE_REAL_API and not MOCK_ENABLED and OpenAI is not None and OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)

# ---- Safety + crisis handling ------------------------------------------

CRISIS_KEYWORDS = [
    "suicide", "kill myself", "end it", "want to die",
    "self-harm", "self harm", "cutting", "no reason to live",
    "hurt myself", "overdose", "take my life",
]

CRISIS_MESSAGE = (
    "I’m really glad you reached out — it sounds like you’re going through something incredibly difficult.\n\n"
    "I can’t help with crisis situations, but you deserve real support right now.\n\n"
    "🇬🇧 UK support:\n"
    "📞 Samaritans (24/7): 116 123\n"
    "📱 Text 'SHOUT' to 85258\n\n"
    "If you’re in immediate danger, call 999 or go to A&E.\n\n"
    "(This is a prewritten safety message.)"
)

def _contains_crisis(text: str) -> bool:
    t = (text or "").lower()
    return any(k in t for k in CRISIS_KEYWORDS)

# ---- Mock behaviour -----------------------------------------------------

ACKS = [
    "I hear you.",
    "Thank you for sharing that.",
    "That sounds tough.",
]

OPEN_QUESTIONS = [
    "What could help you right now, even just by a little bit?",
    "What made this feel harder today?",
    "Would one tiny next step help?",
]

def _pick_ack(t: str) -> str:
    tl = (t or "").lower()
    if "exam" in tl or "test" in tl or "deadline" in tl:
        return "Exams and deadlines can feel heavy."
    if "anxious" in tl or "anxiety" in tl:
        return "Feeling anxious can be exhausting."
    if "stressed" in tl or "overwhelmed" in tl:
        return "That sounds really overwhelming."
    if "tired" in tl or "lonely" in tl or "angry" in tl:
        return "I hear how you're feeling."
    return random.choice(ACKS)

def _mock_model_response(user_text: str) -> str:
    ack = _pick_ack(user_text)
    tl = user_text.lower()
    theme = next((w for w in ["exam", "deadline", "school", "work", "family"] if w in tl), None)
    reflection = f" You mentioned {theme}." if theme else ""
    question = random.choice(OPEN_QUESTIONS)
    return f"{ack}{reflection} {question}"

# ---- Main entrypoint ----------------------------------------------------

def reply(user_text: str) -> str:
    text = (user_text or "").strip()

    if not text:
        return "I’m here when you’re ready."

    if _contains_crisis(text):
        return CRISIS_MESSAGE

    # Mock path
    if client is None or MOCK_ENABLED or not USE_REAL_API:
        return _mock_model_response(text)

    # Real API path (no global history for public demo)
    try:
        system_message = {
            "role": "system",
            "content": (
                "Your name is Altea. You are a calm, supportive AI mental health chatbot. "
                "You help users feel heard, understood, and less alone. "
                "You respond with empathy, warmth, and patience. "
                "You ask gentle, open-ended questions to help users reflect. "
                "You avoid being overly robotic or clinical, and instead sound natural and human. "
                "You do not diagnose conditions or provide medical advice. "
                "If a user seems distressed, you gently encourage seeking support from trusted people or professionals."
                "You were made by someone called Jon Toledo. His backstory is that he experienced mental-health related blackouts before exams, and wants to help people who may be in the same situation"
            ),
        }

        messages = [system_message, {"role": "user", "content": text}]

        resp = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
        )

        return (resp.choices[0].message.content or "").strip() or "I’m here with you."

    except Exception:
        return "Sorry — I’m having trouble reaching the server right now."

def get_bot_reply(message: str) -> str:
    return reply(message)