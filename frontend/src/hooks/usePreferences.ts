import { useState, useCallback } from "react";
import preferencesService from "@/services/prefrences.service";
import { LimitIntakes } from "@/types/user";

export interface PreferencesData {
  preferences: string[];
  allergies: string[];
  goals: string[];
  medicalHistory: string[];
  routine: { breakfast: string; lunch: string; dinner: string };
  budget: number;
}

const PREFERENCES_STORAGE_KEY = "nutrimori_preferences";

export const usePreferences = () => {
  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    preferences: [],
    allergies: [],
    goals: [],
    medicalHistory: [],
    routine: { breakfast: "07:00", lunch: "12:00", dinner: "19:00" },
    budget: 50000,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch preferences from API
  const fetchPreferences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await preferencesService.getPreferences();
      const newPreferencesData: PreferencesData = {
        preferences: data?.tastes || [],
        allergies: data?.allergies || [],
        goals: Array.isArray(data?.goals)
          ? data.goals
          : data?.goals
          ? [data.goals]
          : [],
        medicalHistory: data?.medical_history || [],
        routine: {
          breakfast: data?.meal_times?.breakfast ?? "07:00",
          lunch: data?.meal_times?.lunch ?? "12:00",
          dinner: data?.meal_times?.dinner ?? "19:00",
        },
        budget: data?.daily_budget || 50000,
      };
      setPreferencesData(newPreferencesData);
      // Save to localStorage
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(newPreferencesData)
      );
      return newPreferencesData;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch preferences");
      setError(error);
      console.error("Failed to fetch preferences:", err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load preferences from localStorage
  const loadFromCache = useCallback(() => {
    try {
      const storedPreferences = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (storedPreferences) {
        const parsed = JSON.parse(storedPreferences);
        setPreferencesData({
          preferences: parsed.preferences || [],
          allergies: parsed.allergies || [],
          goals: Array.isArray(parsed.goals)
            ? parsed.goals
            : parsed.goals
            ? [parsed.goals]
            : [],
          medicalHistory: parsed.medicalHistory || [],
          routine: parsed.routine || {
            breakfast: "07:00",
            lunch: "12:00",
            dinner: "19:00",
          },
          budget: parsed.budget || 50000,
        });
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing cached preferences data", error);
    }
    return null;
  }, []);

  // Save preferences to API
  const savePreferences = useCallback(
    async (data?: Partial<PreferencesData>) => {
      setLoading(true);
      setError(null);
      const dataToSave = data || preferencesData;
      const payload = {
        allergies: dataToSave.allergies?.length
          ? dataToSave.allergies
          : undefined,
        goals: dataToSave.goals?.length ? dataToSave.goals : undefined,
        tastes: dataToSave.preferences?.length
          ? dataToSave.preferences
          : undefined,
        medical_history: dataToSave.medicalHistory?.length
          ? dataToSave.medicalHistory
          : undefined,
        meal_times: dataToSave.routine ? { ...dataToSave.routine } : undefined,
        daily_budget: dataToSave.budget ?? undefined,
      };

      try {
        await preferencesService.updatePreferences(payload);
        // Update state and cache if data was provided
        if (data) {
          const newData = { ...preferencesData, ...data };
          setPreferencesData(newData);
          localStorage.setItem(
            PREFERENCES_STORAGE_KEY,
            JSON.stringify(newData)
          );
        }
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to save preferences");
        setError(error);
        console.error("Failed to save preferences:", err);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [preferencesData]
  );

  // Toggle selection (for arrays like preferences, allergies, etc.)
  const toggleSelection = useCallback(
    (key: keyof PreferencesData, value: string) => {
      setPreferencesData((prev) => {
        const current = prev[key] as string[];
        const newData = {
          ...prev,
          [key]: current.includes(value)
            ? current.filter((item) => item !== value)
            : [...current, value],
        };
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newData));
        return newData;
      });
    },
    []
  );

  // Update preferences state and cache
  const updatePreferencesData = useCallback(
    (data: Partial<PreferencesData>) => {
      setPreferencesData((prev) => {
        const newData = { ...prev, ...data };
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(newData));
        return newData;
      });
    },
    []
  );

  return {
    preferencesData,
    setPreferencesData,
    updatePreferencesData,
    fetchPreferences,
    loadFromCache,
    savePreferences,
    toggleSelection,
    loading,
    error,
  };
};

export const useLimitIntakes = () => {
  const [limitData, setLimitData] = useState<LimitIntakes>({
    max_calories: 2000,
    max_protein: 50,
    max_carbs: 300,
    max_fat: 65,
    max_sugar: 50,
    max_fiber: 25,
    max_sodium: 2300,
    max_cholesterol: 300,
    explanation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const LIMIT_STORAGE_KEY = "nutrimori_limit_intakes";

  // Fetch limit intakes from API
  const fetchLimitIntakes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await preferencesService.getLimitIntake();
      const newLimitData: LimitIntakes = {
        max_calories: data?.max_calories || 2000,
        max_protein: data?.max_protein || 50,
        max_carbs: data?.max_carbs || 300,
        max_fat: data?.max_fat || 65,
        max_sugar: data?.max_sugar || 50,
        max_fiber: data?.max_fiber || 25,
        max_sodium: data?.max_sodium || 2300,
        max_cholesterol: data?.max_cholesterol || 300,
        explanation: data?.explanation || "",
      };
      setLimitData(newLimitData);
      // Save to localStorage
      localStorage.setItem(LIMIT_STORAGE_KEY, JSON.stringify(newLimitData));
      return newLimitData;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch limit intakes");
      setError(error);
      console.error("Failed to fetch limit intakes:", err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load limit intakes from localStorage
  const loadFromCache = useCallback(() => {
    try {
      const storedLimits = localStorage.getItem(LIMIT_STORAGE_KEY);
      if (storedLimits) {
        const parsed = JSON.parse(storedLimits);
        const newLimitData: LimitIntakes = {
          max_calories: parsed.max_calories || 2000,
          max_protein: parsed.max_protein || 50,
          max_carbs: parsed.max_carbs || 300,
          max_fat: parsed.max_fat || 65,
          max_sugar: parsed.max_sugar || 50,
          max_fiber: parsed.max_fiber || 25,
          max_sodium: parsed.max_sodium || 2300,
          max_cholesterol: parsed.max_cholesterol || 300,
          explanation: parsed.explanation || "",
        };
        setLimitData(newLimitData);
        return newLimitData;
      }
    } catch (error) {
      console.error("Error parsing cached limit intakes data", error);
    }
    return null;
  }, []);

  return {
    limitData,
    setLimitData,
    fetchLimitIntakes,
    loadFromCache,
    loading,
    error,
  };
};
