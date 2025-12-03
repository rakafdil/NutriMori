import { GoogleGenAI, Type } from "@google/genai";
import { NutritionInfo, Meal } from "@/types";

export const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_API_KEY });

const MEAL_ANALYSIS_MODEL = "gemini-2.5-flash";
const CHAT_MODEL = "gemini-2.5-flash";

export const analyzeMealDescription = async (
  description: string
): Promise<NutritionInfo> => {
  try {
    const response = await ai.models.generateContent({
      model: MEAL_ANALYSIS_MODEL,
      contents: `Analyze this meal description: "${description}". Estimate nutritional values.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            calories: {
              type: Type.NUMBER,
              description: "Estimated calories in kcal",
            },
            protein: { type: Type.NUMBER, description: "Protein in grams" },
            carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
            fats: { type: Type.NUMBER, description: "Fats in grams" },
            sodium: {
              type: Type.STRING,
              enum: ["Low", "Moderate", "High"],
              description: "Sodium level assessment",
            },
            healthScore: {
              type: Type.STRING,
              enum: ["Green", "Yellow", "Red"],
              description:
                "Overall health rating (Green=Healthy, Red=Unhealthy)",
            },
            summary: {
              type: Type.STRING,
              description: "A short, friendly 1-sentence summary of the meal.",
            },
          },
          required: [
            "calories",
            "protein",
            "carbs",
            "fats",
            "sodium",
            "healthScore",
            "summary",
          ],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text) as NutritionInfo;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Error analyzing meal:", error);
    // Fallback if AI fails
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      sodium: "Unknown",
      healthScore: "Yellow",
      summary: "Could not analyze meal at this time.",
    };
  }
};

export const generateDailyInsight = async (meals: Meal[]): Promise<string> => {
  try {
    const mealSummary = meals
      .map(
        (m) =>
          `${m.name} (${m.nutrition.calories}kcal, Sodium: ${m.nutrition.sodium})`
      )
      .join(", ");

    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: `Based on these meals eaten today: [${mealSummary}], give me a one-sentence, friendly, personalized insight about the user's nutrition today. Focus on patterns like sodium or protein. Do not be robotic.`,
    });
    return response.text || "Keep tracking to get better insights!";
  } catch (e) {
    return "Great job tracking your meals today!";
  }
};
