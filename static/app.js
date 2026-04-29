// app.js

const chatForm = document.getElementById("chat-form");
const messageInput = document.getElementById("message-input");
const chatWindow = document.getElementById("chat-window");
const expandBtn = document.getElementById("expand-btn");
const appContainer = document.querySelector(".app-container");


let isSending = false;

// Store current conversation while page is open
let conversationHistory = [];


// This function makes the text that have stars between them to be displayed as bold text
function formatBotMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

function typeWriter(element, text, speed = 20) {
    let i = 0;
    let visibleText = "";

    element.innerHTML = ""; // start empty

    function typing() {
        if (i < text.length) {
            visibleText += text.charAt(i);
            element.innerHTML = formatBotMessage(visibleText);

            i++;

            chatWindow.parentElement.scrollTop = chatWindow.parentElement.scrollHeight;
            
            setTimeout(typing, speed);
        }
    }

    typing();
}


// This function reads text out loud using the browser's built-in speech system
function speakText(text) {
    if (!("speechSynthesis" in window)) {
        alert("Text-to-speech is not supported in this browser");
        return;
    }

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-GB";
    speech.rate = 0.95;
    speech.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
}

// ---- Message helpers ----------------------------------------------------

function addMessageToChat(role, text) {
    const row = document.createElement("div");
    row.classList.add("message-row", role); // "user" or "bot"

    // if it's a bot message, add the avatar first
    if (role === "bot") {
        const avatar = document.createElement("img");
        avatar.src = "/static/alteacolouredcircle.png";
        avatar.alt = "Altea avatar";
        avatar.classList.add("message-avatar");
        row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.classList.add("message-bubble");

    if (role === "bot") {
        typeWriter(bubble, text, 8);

        const messageContainer = document.createElement("div");
        messageContainer.classList.add("bot-message-container");

        messageContainer.appendChild(bubble);

        const speakButton = document.createElement("button");
        speakButton.textContent = "🔊";
        speakButton.classList.add("speak-button");
        speakButton.setAttribute("aria-label", "Read Altea's response aloud");

        speakButton.addEventListener("click", () => {
            speakText(text);
        });

        messageContainer.appendChild(speakButton);
        row.appendChild(messageContainer);
    } else {
        bubble.textContent = text;
        row.appendChild(bubble);
    }

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
    bubble.textContent = "Altea is thinking...";

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

    // Save user input into conversation history
    conversationHistory.push({
        role: "user",
        content: message
    });

    const sendBtn = chatForm.querySelector('button[type="submit"]');
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
            body: JSON.stringify({
                message: message,
                history: conversationHistory
            }),
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

        const botReply = (data && data.reply) ? data.reply : "I’m here with you.";

        addMessageToChat("bot", botReply);

        // Save bot reply into conversation history
        conversationHistory.push({
            role: "assistant",
            content: botReply
        });

        // Keep only the latest 20 messages to control token usage
        conversationHistory = conversationHistory.slice(-20);

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
        sendBtn.disabled = false;
    }
}

if (expandBtn && appContainer) {
    expandBtn.addEventListener("click", () => {
        appContainer.classList.toggle("expanded");

        const isExpanded = appContainer.classList.contains("expanded");

        expandBtn.setAttribute(
            "aria-label",
            isExpanded ? "Collapse chat" : "Expand chat"
        );

        expandBtn.textContent = isExpanded ? "↔" : "⛶";
    });
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