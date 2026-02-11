import { GoogleGenerativeAI } from "@google/generative-ai";
import { AVAILABLE_EXERCISES } from "../../ai/utils/secondaryExercises";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * AI-Powered Exercise Recommendation Engine
 * Uses Gemini to analyze patient profile and suggest personalized exercises
 */
export const getAIExerciseRecommendations = async (patientProfile) => {
    try {
        if (!genAI) {
            console.warn('[AI Recommendations] Gemini API not configured, using fallback');
            return getFallbackRecommendations(patientProfile);
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: `You are an expert physiotherapy AI assistant specializing in rehabilitation exercise prescription.
      
Your role is to analyze patient profiles and recommend appropriate exercises from the available exercise database.

CRITICAL RULES:
1. Only recommend exercises that exist in the provided exercise list
2. Consider the patient's injury type, rehab phase, pain level, and fitness level
3. Start conservatively for new patients or those in acute phase
4. Provide clear reasoning for each recommendation
5. Suggest 3-5 exercises maximum per session
6. Format your response as valid JSON only, no markdown or extra text

Response format:
{
  "recommendedExercises": ["exercise-id-1", "exercise-id-2"],
  "reasoning": "Brief explanation of why these exercises were chosen",
  "precautions": ["Important safety note 1", "Important safety note 2"],
  "progressionTips": "How to progress when ready"
}`
        });

        const exerciseList = Object.entries(AVAILABLE_EXERCISES).map(([id, data]) => ({
            id,
            name: data.name,
            difficulty: data.difficulty,
            intensity: data.intensity,
            suitableFor: data.suitableFor,
            phase: data.phase
        }));

        const prompt = `Analyze this patient profile and recommend appropriate exercises:

Patient Profile:
- Injury/Condition: ${patientProfile.injuryType || 'General Recovery'}
- Rehabilitation Phase: ${patientProfile.rehabPhase || 'Mid'}
- Pain Level (0-10): ${patientProfile.currentPainLevel || 5}
- Fitness Level: ${patientProfile.fitnessLevel || 'Moderate'}
- Age: ${patientProfile.age || 'Not specified'}
- Previous Exercise Experience: ${patientProfile.hasExercisedBefore ? 'Yes' : 'No'}
- Special Considerations: ${patientProfile.specialNotes || 'None'}

Available Exercises:
${JSON.stringify(exerciseList, null, 2)}

Provide your recommendations in the specified JSON format.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Extract JSON from response (handle markdown code blocks)
        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        const recommendations = JSON.parse(jsonText);

        // Validate recommended exercises exist
        const validExercises = recommendations.recommendedExercises.filter(
            id => AVAILABLE_EXERCISES[id]
        );

        return {
            exercises: validExercises,
            reasoning: recommendations.reasoning,
            precautions: recommendations.precautions || [],
            progressionTips: recommendations.progressionTips || '',
            source: 'AI-Powered'
        };

    } catch (error) {
        console.error('[AI Recommendations] Error:', error);
        return getFallbackRecommendations(patientProfile);
    }
};

/**
 * Fallback recommendation system when AI is unavailable
 */
const getFallbackRecommendations = (patientProfile) => {
    const { injuryType = 'General Recovery', rehabPhase = 'Mid' } = patientProfile;

    const allExercises = Object.entries(AVAILABLE_EXERCISES).map(([id, data]) => ({ id, ...data }));

    // Filter by phase and injury type
    let suitable = allExercises.filter(ex => {
        if (ex.phase && ex.phase !== rehabPhase) return false;
        if (ex.suitableFor && !ex.suitableFor.includes(injuryType)) return false;
        return true;
    });

    // If no matches, use easy exercises
    if (suitable.length === 0) {
        suitable = allExercises.filter(ex => ex.difficulty === 'Easy').slice(0, 3);
    }

    // Sort by intensity and take top 4
    suitable.sort((a, b) => a.intensity - b.intensity);
    const exercises = suitable.slice(0, 4).map(ex => ex.id);

    return {
        exercises,
        reasoning: `Selected exercises suitable for ${injuryType} in ${rehabPhase} phase based on clinical guidelines.`,
        precautions: [
            'Stop if you experience sharp pain',
            'Move slowly and with control',
            'Breathe normally throughout'
        ],
        progressionTips: 'Increase repetitions by 2-3 when current sets feel comfortable',
        source: 'Rule-Based'
    };
};

/**
 * Get real-time AI coaching feedback during exercise
 */
export const getAICoachingFeedback = async (exerciseId, performanceData) => {
    try {
        if (!genAI) return null;

        const exercise = AVAILABLE_EXERCISES[exerciseId];
        if (!exercise) return null;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: `You are a real-time physiotherapy coach providing instant feedback during exercises.
      
Be concise, encouraging, and specific. Your feedback should be 1-2 sentences maximum.
Focus on the most critical correction needed right now.`
        });

        const prompt = `Exercise: ${exercise.name}
Current Performance:
- Form Quality: ${performanceData.formQuality}%
- Current Angle: ${performanceData.currentAngle}°
- Rep Count: ${performanceData.repCount}
- Common Mistakes for this exercise: ${exercise.commonMistakes?.join(', ')}

Provide brief, actionable coaching feedback (1-2 sentences max).`;

        const result = await model.generateContent(prompt);
        return result.response.text();

    } catch (error) {
        console.error('[AI Coaching] Error:', error);
        return null;
    }
};

/**
 * Analyze session performance and provide insights
 */
export const analyzeSessionPerformance = async (sessionData) => {
    try {
        if (!genAI) return null;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            systemInstruction: `You are an expert physiotherapist analyzing rehabilitation session data.
      
Provide constructive feedback focusing on:
1. What went well
2. Areas for improvement
3. Specific tips for next session

Keep it encouraging and actionable. Format as JSON with keys: strengths, improvements, nextSessionTips`
        });

        const prompt = `Analyze this rehabilitation session:

Exercise: ${sessionData.exerciseName}
Repetitions Completed: ${sessionData.reps}
Form Quality Score: ${sessionData.quality}%
Range of Motion: ${sessionData.rangeOfMotion}°
Duration: ${sessionData.duration}

Provide analysis in JSON format.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let jsonText = responseText.trim();
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.replace(/```\n?/g, '');
        }

        return JSON.parse(jsonText);

    } catch (error) {
        console.error('[Session Analysis] Error:', error);
        return null;
    }
};
