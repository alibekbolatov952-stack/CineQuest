import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getMovieSummary(movieTitle: string, overview: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the movie "${movieTitle}" in 2-3 sentences based on this overview: ${overview}. Make it sound exciting and intriguing in Russian.`,
  });
  return response.text;
}

export async function getAIRecommendations(userFavorites: string[], userHistory: string[]) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Based on these favorite movies: ${userFavorites.join(', ')} and watch history: ${userHistory.join(', ')}, recommend 5 similar movies. Return only a JSON array of movie titles.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
}

export async function getMoodRecommendations(mood: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Recommend 5 movies for a "${mood}" mood. Return only a JSON array of movie titles.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
}
