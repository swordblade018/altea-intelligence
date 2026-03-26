from settings import OPENAI_API_KEY, MODEL_NAME
from bot import reply
from resources import CRISIS_MESSAGE

mode = "MOCK" if (not OPENAI_API_KEY or MOCEL_NAME == "mock") else f"AI ({MODEL_NAME})"

print(f"Altea v0.1 - mode: {mode}. Type 'exit' to quit; type 'help' for resources.\n")

while True:
    user_text = input("You: ").strip()

    if user_text.lower() in {"exit", "quit"}:
        print("Goodbye! If you need me, you know where to find me. Take care")
        break

    if user_text.lower() == "help":
        print(CRISIS_MESSAGE)
        continue

    if user_text.lower() == "/mode":
        from settings import OPENAI_API_KEY, MODEL_NAME
        mode = "MOCK" if (not OPENAI_API_KEY or MODEL_NAME == "mock") else f"AI ({MODEL_NAME})"
        print(f"Mode: {mode}")
        continue

    bot_reply = reply(user_text)
    print("Bot:", bot_reply)