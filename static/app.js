// app.js

const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const chatWindow = document.getElementById("chat-window");

let isSending = false;


// This function makes the text that have stars between them to be displayed as bold text
function formatBotMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

// ---- Message helpers ----------------------------------------------------

function addMessageToChat(role, text) {
    const row = document.createElement("div");
    row.classList.add("message-row", role); // "user" or "bot"

    // if it's a bot message, add the avatar first
    if (role === "bot") {
        const avatar = document.createElement("img");
        avatar.src = "/static/altealogo.png";
        avatar.alt = "Altea avatar";
        avatar.classList.add("message-avatar");
        row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    if (role === "bot") {
        bubble.innerHTML = formatBotMessage(text);
    } else {
        bubble.textContent = text;
    }

    row.appendChild(bubble);
    chatWindow.appendChild(row);

    // Scroll to bottom
    chatWindow.parentElement.scrollTop = chatWindow.parentElement.scrollHeight;
}

// ---- Typing indicator ---------------------------------------------------

function showTypingIndicator() {
    // avoid duplicates
    if (document.getElementById("typing-indicator")) return;

    const row = document.createElement("div");
    row.classList.add("message-row", "bot");
    row.id = "typing-indicator";

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble", "typing");
    bubble.textContent = "Altea is typing...";

    row.appendChild(bubble);
    chatWindow.appendChild(row);

    chatWindow.parentElement.scrollTop = chatWindow.parentElement.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById("typing-indicator");
    if (typing) typing.remove();
}

// ---- Send message -------------------------------------------------------

async function sendMessage(message) {
    if (isSending) return; // prevent double-sends
    isSending = true;

    // Show user message immediately
    addMessageToChat("user", message);

    const sendBtn = chatForm.querySelector("button");
    sendBtn.disabled = true;

    messageInput.value = "";
    messageInput.focus();

    // Show typing animation while we wait for the backend
    showTypingIndicator();

    // Add a timeout so the UI doesn't hang forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        // Try to parse JSON, but don't crash if server returns non-JSON
        let data = null;
        try {
            data = await response.json();
        } catch (_) {
            data = null;
        }

        removeTypingIndicator();

        if (!response.ok) {
            const msg =
                (data && data.reply) ? data.reply : "Server error. Please try again.";
            addMessageToChat("bot", msg);
            return;
        }

        addMessageToChat("bot", (data && data.reply) ? data.reply : "I’m here with you.");
    } catch (err) {
        clearTimeout(timeout);
        console.error(err);
        removeTypingIndicator();

        if (err && err.name === "AbortError") {
            addMessageToChat("bot", "The server is taking too long to respond. Please try again.");
        } else {
            addMessageToChat("bot", "Error contacting server.");
        }
    } finally {
        isSending = false;
        chatForm.querySelector("button").disabled = false;
    }
}

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = messageInput.value.trim();
    if (msg) sendMessage(msg);
});

// ---- Wellbeing tips rotation --------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    const tipElement = document.getElementById("wellbeing-tip-text");
    if (!tipElement) return; // safety check

    const tips = [
        "Take things one at a time. You don't have to handle everything today.",
        "It's okay to feel how you're feeling. Your emotions are valid.",
        "You're allowed to rest. Doing nothing for a moment can still be progress.",
        "If your thoughts feel loud, try focusing on one small, concrete task.",
        "You don't have to go through everything alone. Reaching out is a strength.",
        "Drinking some water and taking a few deep breaths can be a gentle reset.",
        "It's okay if today wasn't perfect. Showing up at all still counts.",
        "Talking about how you feel is not a burden; it's a way to look after yourself.",
        "Even tiny steps forward still move you in the right direction.",
        "You're learning, not falling. Every experience teaches you something.",
    ];

    let currentTip = 0;
    tipElement.textContent = tips[currentTip];

    function showNextTip() {
        currentTip = (currentTip + 1) % tips.length;
        tipElement.textContent = tips[currentTip];
    }

    // Change tip every 8 seconds (8000ms)
    setInterval(showNextTip, 8000);
});