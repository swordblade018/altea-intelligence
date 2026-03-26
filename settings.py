import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
MODEL_NAME: str = os.getenv("MODEL_NAME", "gpt-4o-mini")

DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
SAVE_TRANSCRIPTS: bool = os.getenv("SAVE_TRANSCRIPTS", "false").lower() == "true"

MOCK_ENABLED: bool = not OPENAI_API_KEY