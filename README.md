# Unmute 🪞
**Emotional Abuse Recognition & Recovery Companion**

verscel link : un-mute-r1lbi7gan-richa-vasavis-projects.vercel.app

*Built for the **AIC × Anthropic Hackathon** | Track: Neuroscience & Mental Health*

Unmute helps people in emotionally abusive relationships recognize what is being done to them, understand how it is affecting their body and mind, and find the words to protect themselves. 

---

## 🎯 The Vision (Impact Potential)

**Who are we building this for, and why do they need it?**
Unmute is built for individuals experiencing covert emotional abuse—such as gaslighting, love-bombing, and coercive control. Often, victims cannot name what is happening to them; they only feel the resulting chronic stress, confusion, and physical toll. They need a safe, objective sounding board to help them recognize clinical patterns of abuse and understand the physiological impact on their nervous system before their health severely declines.

## ⚖️ Ethical Alignment & Safety

Building AI for vulnerable populations requires strict guardrails. We designed Unmute around the hackathon's core ethical questions:

**How does this help people rather than make decisions for them?**
Unmute centers user autonomy. It acts as a "silent clinical observer" and a mirror. 
* It **never** tells the user to leave or stay. 
* It **never** diagnoses the user or their partner. 
* Instead, it identifies behavioral patterns (e.g., "This sounds like DARVO") and provides evidence-based communication scripts (e.g., Grey Rock method) so the user can make informed decisions about their own boundaries.

**What could go wrong, and what are we doing about it?**
1. **Physical Danger:** An AI cannot intervene in domestic violence. *Mitigation:* We built a hardcoded "Triage" system. If the AI detects immediate threat or the user selects critical symptoms, the app immediately halts analysis and surfaces local emergency numbers (e.g., 112/911/999) and crisis resources.
2. **Data Privacy:** Abusers often monitor devices. *Mitigation:* Unmute is a client-side application. No chat history is stored in any external database; everything stays local to the browser.
3. **AI Hallucination:** The AI could give harmful psychological advice. *Mitigation:* We use heavily constrained system prompts that force the AI to act strictly as a pattern-recognizer and empathetic witness, rather than a licensed therapist.

## ✨ Core Features

* 💬 **Say it out loud:** A chat interface featuring two modes—"Real talk" (direct, honest feedback) and "Just listen" (pure support). The AI identifies the core emotion, underlying patterns, and defensive loops without lecturing.
* 🔍 **Name the pattern:** Users describe an interaction, and the AI matches it against 8 clinically recognized behaviors (e.g., Triangulation, Intermittent Reinforcement, Moving the Goalposts).
* 🛡️ **What to actually say:** Generates situational scripts based on proven boundary-setting techniques.
* 🪞 **Hold the mirror:** A reflection mode that helps users objectively look at their own actions ("Was it me?") to break defensive loops.
* 🫀 **Body keeping score:** An interactive physiological map and symptom checker. It bridges the gap between mental trauma and physical symptoms (e.g., chronic cortisol, TMJ, digestive issues) and provides a printable symptom log for doctors.

## 💻 Technical Execution

Unmute is a lightweight, high-performance single-page application designed for immediate access.

* **Frontend:** Vanilla HTML5, CSS3, and JavaScript. Zero heavy frameworks to ensure instant loading even on poor connections.
* **Backend / AI Integration:** Designed to integrate with LLM endpoints via `/api/chat` and `/api/gemini`. 
* **Prompt Engineering:** The core logic relies on complex JSON-structured system prompts (the "Therapist-brain"). The model processes the chat history silently, outputs a structured JSON analysis (detecting emotional intensity, readiness, and patterns), and *then* formulates a concise, 2-3 sentence human response.

## 🚀 Getting Started

To run Unmute locally:

1. Clone the repository.
2. Ensure you have your local server or API gateway set up to handle the `/api/gemini` or `/api/chat` POST requests.
3. Add your LLM API keys to your backend environment variables.
4. Open `index.html` in any modern web browser.

---

*"You deserve to know what's actually happening."*
