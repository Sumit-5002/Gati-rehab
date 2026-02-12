import { getGeminiResponse } from '../../../shared/services/geminiService';

/**
 * Utility to generate dynamic AI insights for doctors based on patient data
 * Now powered by Gemini AI for real intelligent analysis
 */
export const generateDoctorInsights = async (patients) => {
    if (!patients || patients.length === 0) {
        return [
            {
                id: 'no-data',
                type: 'info',
                title: 'Data Collection',
                message: 'Add patients to begin receiving neural insights and recovery alerts.',
                color: 'blue'
            }
        ];
    }

    // Prepare patient summary for AI analysis
    const patientSummary = patients.map(p => ({
        name: p.name,
        condition: p.condition,
        adherence: p.adherenceRate,
        lastActive: p.lastActive
    }));

    const lowAdherenceCount = patients.filter(p => p.adherenceRate < 60).length;
    const highPerformersCount = patients.filter(p => p.adherenceRate >= 90).length;
    const averageAdherence = Math.round(patients.reduce((sum, p) => sum + (p.adherenceRate || 0), 0) / patients.length);

    try {
        // Generate AI-powered insights using Gemini
        const prompt = `You are a clinical physiotherapist AI assistant analyzing patient rehabilitation data.

Patient Statistics:
- Total Patients: ${patients.length}
- Average Adherence: ${averageAdherence}%
- Low Adherence (<60%): ${lowAdherenceCount} patients
- High Performers (≥90%): ${highPerformersCount} patients

Top 5 Patients Summary:
${patientSummary.slice(0, 5).map(p => `- ${p.name}: ${p.condition}, ${p.adherence}% adherence, Last active: ${p.lastActive}`).join('\n')}

Generate exactly 3 clinical insights for the doctor. Each insight should be:
1. Actionable and specific to the data
2. Brief (max 15 words)
3. Professionally worded

Format your response as a JSON array with this exact structure:
[
  {"title": "Short Title", "message": "Brief insight message", "color": "emerald|blue|indigo"},
  {"title": "Short Title", "message": "Brief insight message", "color": "emerald|blue|indigo"},
  {"title": "Short Title", "message": "Brief insight message", "color": "emerald|blue|indigo"}
]

Use:
- "emerald" for positive/success insights
- "blue" for warnings/alerts
- "indigo" for neutral/informational insights

Only return the JSON array, nothing else.`;

        const aiResponse = await getGeminiResponse(prompt, []);
        
        // Parse AI response
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const aiInsights = JSON.parse(jsonMatch[0]);
            return aiInsights.map((insight, idx) => ({
                id: `ai-insight-${idx}`,
                type: insight.color === 'emerald' ? 'success' : insight.color === 'blue' ? 'warning' : 'info',
                title: insight.title,
                message: insight.message,
                color: insight.color
            }));
        }
        
        // Fallback to rule-based if parsing fails
        throw new Error('Failed to parse AI response');
        
    } catch (error) {
        console.warn('[InsightGenerator] AI generation failed, using rule-based fallback:', error.message);
        
        // Fallback to rule-based insights if AI fails
        const insights = [];

        // 1. Adherence Alerts
        if (lowAdherenceCount > 0) {
            insights.push({
                id: 'adherence-alert',
                type: 'warning',
                title: 'Adherence Alert',
                message: `${lowAdherenceCount} patient${lowAdherenceCount > 1 ? 's' : ''} fell below 60% adherence. Consider intervention.`,
                color: 'blue'
            });
        }

        // 2. Recovery Peaks
        if (highPerformersCount > 0) {
            const randomPatient = patients.filter(p => p.adherenceRate >= 90)[Math.floor(Math.random() * highPerformersCount)];
            insights.push({
                id: 'recovery-peak',
                type: 'success',
                title: 'Recovery Peak',
                message: `${randomPatient.name} maintained 90%+ adherence. Excellent progress!`,
                color: 'emerald'
            });
        }

        // 3. Activity Trends
        const activeToday = patients.filter(p => p.lastActive === 'Just now' || p.lastActive?.includes('min')).length;
        if (activeToday > 0) {
            insights.push({
                id: 'activity-trend',
                type: 'info',
                title: 'Activity Trend',
                message: `${activeToday} patient${activeToday > 1 ? 's are' : ' is'} currently active or completed session recently.`,
                color: 'indigo'
            });
        }

        // Fallback if not enough insights
        if (insights.length < 2) {
            insights.push({
                id: 'general-tip',
                type: 'info',
                title: 'Clinical Tip',
                message: 'Consistent ROM monitoring helps predict recovery velocity.',
                color: 'indigo'
            });
        }

        return insights;
    }
};
