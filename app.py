from flask import Flask, render_template, request, jsonify
import bot
from settings import DEBUG  # optional, for local running

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"reply": "Tell me what’s on your mind, and I’ll reply."})

    try:
        bot_reply = bot.get_bot_reply(user_message)
    except Exception:
        app.logger.exception("Error in get_bot_reply")
        bot_reply = "Sorry, something went wrong on the server."

    return jsonify({"reply": bot_reply})

if __name__ == "__main__":
    app.run()