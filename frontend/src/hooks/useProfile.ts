import { useState, useCallback } from "react";
import { userService } from "@/services/user.service";

export interface ProfileData {
  username: string;
  age: number | undefined;
  height: number | undefined;
  weight: number | undefined;
}

const PROFILE_STORAGE_KEY = "nutrimori_user";

export const useProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "",
    age: undefined,
    height: undefined,
    weight: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getProfile();
      const newProfileData: ProfileData = {
        username: data?.username || "",
        age: data?.age,
        height: data?.height_cm,
        weight: data?.weight_kg,
      };
      setProfileData(newProfileData);
      // Save to localStorage
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newProfileData));
      return newProfileData;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to fetch profile");
      setError(error);
      console.error("Failed to fetch profile:", err);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile from localStorage
  const loadFromCache = useCallback(() => {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfileData({
          username: parsed.username || "",
          age: parsed.age,
          height: parsed.height,
          weight: parsed.weight,
        });
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing cached profile data", error);
    }
    return null;
  }, []);

  // Save profile to API
  const saveProfile = useCallback(
    async (data?: Partial<ProfileData>) => {
      setLoading(true);
      setError(null);
      const dataToSave = data || profileData;
      const payload = {
        username: dataToSave.username || undefined,
        age: dataToSave.age ?? undefined,
        height_cm: dataToSave.height ?? undefined,
        weight_kg: dataToSave.weight ?? undefined,
      };

      try {
        await userService.updateProfile(payload);
        // Update state and cache if data was provided
        if (data) {
          const newData = { ...profileData, ...data };
          setProfileData(newData);
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newData));
        }
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error("Failed to save profile");
        setError(error);
        console.error("Failed to save profile:", err);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [profileData]
  );

  // Update profile state and cache
  const updateProfileData = useCallback((data: Partial<ProfileData>) => {
    setProfileData((prev) => {
      const newData = { ...prev, ...data };
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  return {
    profileData,
    setProfileData,
    updateProfileData,
    fetchProfile,
    loadFromCache,
    saveProfile,
    loading,
    error,
  };
};
