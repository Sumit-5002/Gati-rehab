
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

export const getGeminiResponse = async (prompt, history = []) => {
    try {
        if (!API_KEY) {
            throw new Error("Gemini API Key is missing. Please add VITE_GEMINI_API_KEY to your .env file.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: history.map(msg => ({
                role: msg.sender === 'doctor' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            })),
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("[GeminiService] Error:", error);
        throw error;
    }
};

export const generatePatientReport = async (patientData, format = 'Clinical Summary') => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Act as a professional Clinical Physiotherapist Assistant. 
      Generate a ${format} for the following patient:
      
      Patient Name: ${patientData.name}
      Condition: ${patientData.condition}
      Adherence Rate: ${patientData.adherenceRate}%
      Completed Sessions: ${patientData.completedSessions}
      Total Sessions: ${patientData.totalSessions}
      Last Active: ${patientData.lastActive}
      Progress Level: ${patientData.progressLevel}
      
      The report should be professional, concise, and structured. 
      Include sections for: Summary, Progress Status, and Recommendations.
      Format: ${format}
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("[GeminiService] Report generation error:", error);
        throw error;
    }
};
