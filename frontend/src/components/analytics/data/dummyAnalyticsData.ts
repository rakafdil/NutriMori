import { HabitInsightsData } from "@/types/habitInsights";

export const dummyAnalyticsData: HabitInsightsData = {
  calorieIntake: [
    { day: "Mon", cal: 1850 },
    { day: "Tue", cal: 2100 },
    { day: "Wed", cal: 1920 },
    { day: "Thu", cal: 2250 },
    { day: "Fri", cal: 1780 },
    { day: "Sat", cal: 2400 },
    { day: "Sun", cal: 2150 },
  ],
  macronutrients: [
    { name: "Protein", value: 30 },
    { name: "Carbs", value: 45 },
    { name: "Fat", value: 25 },
  ],
  mealTiming: [
    {
      day: 0,
      dayName: "Mon",
      slots: [
        { slot: 1, calories: 350 },
        { slot: 2, calories: 150 },
        { slot: 3, calories: 650 },
        { slot: 4, calories: 200 },
        { slot: 5, calories: 500 },
      ],
    },
    {
      day: 1,
      dayName: "Tue",
      slots: [
        { slot: 1, calories: 400 },
        { slot: 2, calories: 100 },
        { slot: 3, calories: 700 },
        { slot: 4, calories: 250 },
        { slot: 5, calories: 650 },
      ],
    },
    {
      day: 2,
      dayName: "Wed",
      slots: [
        { slot: 1, calories: 300 },
        { slot: 2, calories: 200 },
        { slot: 3, calories: 600 },
        { slot: 4, calories: 180 },
        { slot: 5, calories: 640 },
      ],
    },
    {
      day: 3,
      dayName: "Thu",
      slots: [
        { slot: 1, calories: 450 },
        { slot: 2, calories: 120 },
        { slot: 3, calories: 750 },
        { slot: 4, calories: 280 },
        { slot: 5, calories: 650 },
      ],
    },
    {
      day: 4,
      dayName: "Fri",
      slots: [
        { slot: 1, calories: 320 },
        { slot: 2, calories: 80 },
        { slot: 3, calories: 580 },
        { slot: 4, calories: 200 },
        { slot: 5, calories: 600 },
      ],
    },
    {
      day: 5,
      dayName: "Sat",
      slots: [
        { slot: 1, calories: 500 },
        { slot: 2, calories: 300 },
        { slot: 3, calories: 800 },
        { slot: 4, calories: 350 },
        { slot: 5, calories: 450 },
      ],
    },
    {
      day: 6,
      dayName: "Sun",
      slots: [
        { slot: 1, calories: 480 },
        { slot: 2, calories: 250 },
        { slot: 3, calories: 720 },
        { slot: 4, calories: 300 },
        { slot: 5, calories: 400 },
      ],
    },
  ],
  aiPatternDiscovery: {
    title: "Weekend Calorie Spike Detected",
    description:
      "Your calorie intake increases by 25% on weekends. Consider balancing meals with",
    highlights: ["more protein", "fewer processed snacks"],
  },
  dietScore: 78,
};
