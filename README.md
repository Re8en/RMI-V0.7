
# RMI: Relational Mediation Interface (v0.7)

> **Status:** Research-Grade Prototype | **Version:** 0.7 | **Domain:** Relational Psychology / Human-Computer Interaction

RMI (Relational Mediation Interface) is a web-based prototype designed for **relational reflection and mediation**. Unlike traditional social apps or AI chatbots that aim to replace human connection, RMI acts as a "Relational Mirror," helping users visualize their social support structures and encouraging real-world interaction through adaptive nudging.

## 🌟 Core Philosophy: "Agency over Automation"
RMI adheres to the principle of non-replacement. It provides:
- **Structural Awareness**: Visualizing the user's social network in "Rings" (Inner, Middle, Outer).
- **Reflective Nudging**: Suggesting real-world actions rather than automating them.
- **Adaptive Interventions**: Three operation modes based on the user's emotional state and interaction patterns.

## 📊 Key Metrics
RMI tracks the balance between digital and physical connections using two core indices:

1.  **AIC (AI Interaction Concentration)**:
    - Measures the percentage of "social energy" spent interacting with AI.
    - Calculated based on session frequency and duration within the RMI interface.
2.  **RII (Real Interaction Index)**:
    - Measures the percentage of documented real-world interactions.
    - Derived from manual logging of calls, texts, and physical meetings.

## ⚙️ Adaptive Operation Modes
- **Emotional Holding Mode (Case 1)**: Triggered by high emotional intensity. Focuses on stabilization and professional resource connection.
- **Relational Activation Mode (Case 2)**: Triggered when AIC is high and RII is low. Actively nudges users toward "gentle disconnects" in their network.
- **Reflective Stability Mode (Case 3)**: The baseline state where interactions are balanced. Focuses on high-level network overview.

## 🚀 Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **Visualization**: Relational Map (Custom SVG/CSS), Recharts (Trends).
- **Intelligence**: Google Gemini Pro API (for semantic analysis and emotional estimation).
- **Icons**: Lucide React.

## 🛠️ How to Run Locally
1.  Clone this repository.
2.  Ensure you have a modern web browser.
3.  This project uses ES modules and `esm.sh` for dependencies, so no heavy `npm install` is required for basic viewing. 
4.  **Important**: To use the AI features, you must provide a `process.env.API_KEY` with access to the Gemini API.

---
*This project is part of a paper-grade research study on relational mediation. All data is persisted locally in the browser's `localStorage` and never leaves the client.*