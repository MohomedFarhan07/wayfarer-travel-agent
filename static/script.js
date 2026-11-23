
const API_URL = "/api/travel";

let threadId = sessionStorage.getItem("wayfarer_thread_id") || null;

// ----------------------------------
// DOM elements
// ----------------------------------

const elements = {
    form: document.getElementById("travelForm"),
    message: document.getElementById("travelMessage"),
    sendBtn: document.getElementById("sendBtn"),

    hero: document.getElementById("heroSection"),
    planner: document.getElementById("planner"),

    loading: document.getElementById("loadingSection"),
    results: document.getElementById("resultsSection"),

    error: document.getElementById("errorSection"),
    errorMessage: document.getElementById("errorMessage"),

    answer: document.getElementById("answerContainer"),

    newTrip: document.getElementById("newTripBtn"),
    newSearch: document.getElementById("newSearchBtn"),

    menu: document.getElementById("menuBtn"),
    sidebar: document.getElementById("sidebar"),

    dismissError: document.getElementById("dismissError"),
    exploreBtn: document.getElementById("exploreBtn")
};

// ----------------------------------
// Check required HTML elements
// ----------------------------------

const requiredElements = [
    "form",
    "message",
    "sendBtn",
    "hero",
    "planner",
    "loading",
    "results",
    "error",
    "errorMessage",
    "answer"
];

requiredElements.forEach((key) => {
    if (!elements[key]) {
        console.error(
            `WayFarer AI: Missing HTML element for "${key}". Check its ID in index.html.`
        );
    }
});

// ----------------------------------
// Safe HTML helpers
// ----------------------------------

function escapeHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]
    );
}

function safeURL(value) {
    try {
        const url = new URL(String(value), window.location.origin);

        if (url.protocol === "https:" || url.protocol === "http:") {
            return escapeHTML(url.href);
        }
    } catch (_) {}

    return null;
}

// ----------------------------------
// Markdown rendering
// ----------------------------------

function renderMarkdown(markdown) {
    if (!markdown) {
        return "Your travel plan is ready.";
    }

    // Fallback if CDN libraries are unavailable
    if (!window.marked || !window.DOMPurify) {
        console.error("Markdown libraries are not available.");
        return escapeHTML(markdown);
    }

    marked.setOptions({
        gfm: true,
        breaks: true
    });

    const rawHTML = marked.parse(String(markdown));

    // Sanitize generated HTML before displaying it
    return DOMPurify.sanitize(rawHTML);
}

// ----------------------------------
// UI helpers
// ----------------------------------

function setLoading(isLoading) {
    elements.loading.classList.toggle("hidden", !isLoading);

    elements.sendBtn.disabled = isLoading;

    const buttonText = elements.sendBtn.querySelector("span");

    if (buttonText) {
        buttonText.textContent = isLoading
            ? "Planning..."
            : "Plan my journey";
    }

    elements.sendBtn.setAttribute(
        "aria-busy",
        String(isLoading)
    );

    if (isLoading) {
        elements.results.classList.add("hidden");
        elements.error.classList.add("hidden");
    }
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.classList.remove("hidden");

    elements.error.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function hideError() {
    elements.error.classList.add("hidden");
}

// ----------------------------------
// Reset journey
// ----------------------------------

function resetUI() {
    // Hide previous results and messages
    elements.results.classList.add("hidden");
    elements.loading.classList.add("hidden");
    elements.error.classList.add("hidden");

    // Clear the previous AI response
    if (elements.answer) {
        elements.answer.innerHTML = "";
    }

    // Restore the landing page
    elements.hero.classList.remove("hidden");
    elements.planner.classList.remove("hidden");

    // Clear the input
    elements.message.value = "";

    // Start a completely new conversation
    threadId = null;
    sessionStorage.removeItem("wayfarer_thread_id");

    // Reset the submit button
    setLoading(false);

    // Focus the input
    elements.message.focus();

    // Scroll to the top
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// ----------------------------------
// Render travel plan
// ----------------------------------

function renderResults(data) {
    if (!elements.answer) {
        throw new Error(
            'Missing element with id="answerContainer" in index.html.'
        );
    }

    // Display the complete Markdown response
    elements.answer.innerHTML = renderMarkdown(data.answer);

    // Hide the landing page
    elements.hero.classList.add("hidden");
    elements.planner.classList.add("hidden");

    // Show the results section
    elements.results.classList.remove("hidden");

    // Refresh Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Scroll to the generated plan
    window.scrollTo({
        top: elements.results.offsetTop,
        behavior: "smooth"
    });
}

// ----------------------------------
// API integration
// ----------------------------------

async function planJourney(message) {
    hideError();
    setLoading(true);

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 180000);

    try {
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message,
                thread_id: threadId
            }),

            signal: controller.signal
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.error || "Unable to generate your travel plan."
            );
        }

        // Save conversation thread ID
        if (data.thread_id) {
            threadId = data.thread_id;

            sessionStorage.setItem(
                "wayfarer_thread_id",
                threadId
            );
        }

        // Display the generated travel plan
        renderResults(data);

    } catch (error) {
        console.error("Travel planning error:", error);

        if (error.name === "AbortError") {
            showError(
                "The request took too long. Please try again."
            );
        } else {
            showError(
                error.message || "Something went wrong. Please try again."
            );
        }

    } finally {
        clearTimeout(timeout);
        setLoading(false);
    }
}

// ----------------------------------
// Form submission
// ----------------------------------

elements.form.addEventListener("submit", (event) => {
    event.preventDefault();

    const message = elements.message.value.trim();

    if (!message) {
        showError("Please describe your dream journey first.");
        return;
    }

    planJourney(message);
});

// ----------------------------------
// Suggestion chips
// ----------------------------------

document.querySelectorAll(".suggestion-chip").forEach((button) => {
    button.addEventListener("click", () => {
        elements.message.value = button.dataset.prompt || "";

        elements.message.focus();

        elements.message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });
});

// ----------------------------------
// New journey buttons
// ----------------------------------

if (elements.newTrip) {
    elements.newTrip.addEventListener("click", resetUI);
}

if (elements.newSearch) {
    elements.newSearch.addEventListener("click", resetUI);
}

// ----------------------------------
// Error dismissal
// ----------------------------------

if (elements.dismissError) {
    elements.dismissError.addEventListener("click", hideError);
}

// ----------------------------------
// Mobile sidebar
// ----------------------------------

if (elements.menu && elements.sidebar) {
    elements.menu.addEventListener("click", () => {
        elements.sidebar.classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
        if (
            window.innerWidth <= 800 &&
            !elements.sidebar.contains(event.target) &&
            !elements.menu.contains(event.target)
        ) {
            elements.sidebar.classList.remove("open");
        }
    });
}

// ----------------------------------
// Explore button
// ----------------------------------

if (elements.exploreBtn) {
    elements.exploreBtn.addEventListener("click", () => {
        elements.planner.scrollIntoView({
            behavior: "smooth"
        });

        if (elements.sidebar) {
            elements.sidebar.classList.remove("open");
        }
    });
}

// ----------------------------------
// Initialize
// ----------------------------------

if (window.lucide) {
    lucide.createIcons();
}

console.log("WayFarer AI frontend initialized successfully.");
