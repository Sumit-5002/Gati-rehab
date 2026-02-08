import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const PRIMARY_MODEL = "gemini-2.5-flash";
const LITE_MODEL = "gemini-2.5-flash-lite";

/**
 * Helper to get dynamic System Instructions with the current date
 */
const getSystemInstruction = () => {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit'
    });

    return `
    Identity: Your name is Gati Neural Assistant. 
    Origin: You were developed by team Heal-gorithms.
    Role: You are a professional Clinical Physiotherapist Assistant.
    
    Current Context:
    - Today's Date: ${dateString}
    - Current Time: ${timeString}
    
    Behavioral Guidelines:
    1. Introduction: Always state you are Gati Neural Assistant by team Heal-gorithms if asked.
    2. Date/Time: You are aware of the current date and time provided above. Use it to answer schedule-related questions.
    3. Clinical Queries: Expert in physiotherapy and rehab. Provide structured, Markdown-formatted advice.
    4. Tone: Professional, empathetic, and concise.
    5. Disclaimer: Medical decisions must be confirmed by a licensed Senior Physiotherapist.
  `;
};

export const getGeminiResponse = async (prompt, history = []) => {
    try {
        if (!API_KEY) throw new Error("API Key is missing.");
        return await callGemini(PRIMARY_MODEL, prompt, history);
    } catch (error) {
        if (error.message?.includes("429") || error.message?.includes("404")) {
            console.warn("Gati Neural Assistant: Switching to Lite Engine...");
            try {
                return await callGemini(LITE_MODEL, prompt, history);
            } catch (liteError) {
                if (liteError.message?.includes("429")) {
                    return "I am currently at my daily limit. Please reach out again tomorrow. Developed by team Heal-gorithms.";
                }
                throw liteError;
            }
        }
        throw error;
    }
};

async function callGemini(modelId, prompt, history) {
    // We call getSystemInstruction() here so the date is fresh every time
    const model = genAI.getGenerativeModel({
        model: modelId,
        systemInstruction: getSystemInstruction()
    });

    const chat = model.startChat({
        history: history.map(msg => ({
            role: msg.sender === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.text }],
        })),
        generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
        },
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text();
}

export const generatePatientReport = async (patientData, format = 'Clinical Summary') => {
    try {
        const model = genAI.getGenerativeModel({
            model: PRIMARY_MODEL,
            systemInstruction: getSystemInstruction()
        });

        const prompt = `
            TASK: Generate a ${format}.
            Patient: ${patientData.name}
            Condition: ${patientData.condition}
            Adherence: ${patientData.adherenceRate}%
            
            Sign off as: "Gati Neural Assistant — Developed by team Heal-gorithms"
        `;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error('[GeminiService] Report generation error:', error);
        return "Unable to generate report at this time. Developed by team Heal-gorithms.";
    }
};