# Nutrition Limits Module

Module ini bertanggung jawab untuk menghitung batas nutrisi harian pengguna menggunakan AI (Gemini LLM).

## Fitur

- **Perhitungan Otomatis**: Batas nutrisi dihitung secara otomatis saat user membuat atau memperbarui preferences
- **AI-Powered**: Menggunakan Gemini AI untuk perhitungan yang lebih akurat berdasarkan profil user
- **Fallback Calculation**: Jika AI gagal, sistem menggunakan formula Mifflin-St Jeor sebagai fallback
- **Efficient**: Perhitungan hanya dilakukan sekali dan disimpan ke database
- **Tabel Terpisah**: Data disimpan di tabel `nutrition_limits` yang terpisah dari `users`

## Alur Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NUTRITION LIMITS CALCULATION FLOW                     │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐        ┌───────────────────┐        ┌─────────────────────┐
  │    User      │───────▶│  User Preferences │───────▶│  Nutrition Limits   │
  │  Registration│        │     Service       │        │      Service        │
  └──────────────┘        └───────────────────┘        └─────────────────────┘
                                   │                            │
                                   │  Trigger calculation       │
                                   │  on create/update          │
                                   ▼                            ▼
                          ┌───────────────────┐        ┌─────────────────────┐
                          │   User Profile    │        │    Gemini AI        │
                          │   - age           │───────▶│   (GEMINI_API_KEY_2)│
                          │   - height_cm     │        │                     │
                          │   - weight_kg     │        │  Calculate limits   │
                          │   - gender        │        │  based on:          │
                          │                   │        │  - BMR              │
                          │   Preferences:    │        │  - Activity level   │
                          │   - goals         │        │  - Goals            │
                          │   - allergies     │        │  - Medical history  │
                          │   - medical_history│       └─────────────────────┘
                          └───────────────────┘                 │
                                                                │
                                                                ▼
                                                       ┌─────────────────────┐
                                                       │ nutrition_limits    │
                                                       │     Table           │
                                                       │                     │
                                                       │   - user_id (FK)    │
                                                       │   - max_calories    │
                                                       │   - max_protein     │
                                                       │   - max_carbs       │
                                                       │   - max_fat         │
                                                       │   - max_sugar       │
                                                       │   - max_fiber       │
                                                       │   - max_sodium      │
                                                       │   - max_cholesterol │
                                                       │   - explanation     │
                                                       └─────────────────────┘
```

## Database Schema

```sql
CREATE TABLE public.nutrition_limits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  max_calories numeric NOT NULL,
  max_protein numeric NOT NULL,
  max_carbs numeric NOT NULL,
  max_fat numeric NOT NULL,
  max_sugar numeric,
  max_fiber numeric,
  max_sodium numeric,
  max_cholesterol numeric,
  explanation text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT nutrition_limits_pkey PRIMARY KEY (id),
  CONSTRAINT nutrition_limits_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);
```

## Kapan Perhitungan Dilakukan

1. **Pertama kali**: Saat user membuat preferences (endpoint `PUT /user-preferences`)
2. **Update**: Saat user memperbarui goals, allergies, atau medical_history (endpoint `PATCH /user-preferences`)
3. **Manual**: Melalui endpoint `POST /nutrition-limits/recalculate`

## API Endpoints

### GET /nutrition-limits
Mendapatkan batas nutrisi user saat ini.

**Response:**
```json
{
  "success": true,
  "data": {
    "max_calories": 2000,
    "max_protein": 120,
    "max_carbs": 250,
    "max_fat": 65,
    "max_sugar": 50,
    "max_fiber": 25,
    "max_sodium": 2300,
    "max_cholesterol": 300,
    "explanation": "Based on your profile..."
  }
}
```

### POST /nutrition-limits/calculate
Preview perhitungan batas nutrisi tanpa menyimpan ke database.

**Request Body:**
```json
{
  "age": 25,
  "height_cm": 170,
  "weight_kg": 70,
  "gender": "male",
  "activity_level": "moderate",
  "goals": ["weight_loss"],
  "allergies": ["gluten"],
  "medical_history": ["diabetes"]
}
```

### POST /nutrition-limits/recalculate
Menghitung ulang dan menyimpan batas nutrisi untuk user saat ini.

## Environment Variables

```env
GEMINI_API_KEY_2=your_gemini_api_key_here
```

## Database Migration

Jalankan migrasi SQL berikut untuk membuat tabel `nutrition_limits`:

```sql
-- File: database/migrations/006_nutrition_limits.sql
-- Jalankan file ini di Supabase SQL Editor
```

## Fallback Calculation

Jika Gemini AI gagal, sistem menggunakan formula Mifflin-St Jeor:

**BMR (Basal Metabolic Rate):**
- Male: `10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5`
- Female: `10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161`

**Activity Multipliers:**
| Level | Multiplier |
|-------|------------|
| Sedentary | 1.2 |
| Light | 1.375 |
| Moderate | 1.55 |
| Active | 1.725 |
| Very Active | 1.9 |

**Goal Adjustments:**
- Weight Loss: -15% calories
- Muscle Gain: +10% calories, higher protein ratio

## Files Structure

```
src/nutrition-limits/
├── dto/
│   ├── index.ts
│   └── nutrition-limits.dto.ts
├── gemini.service.ts
├── index.ts
├── nutrition-limits.controller.ts
├── nutrition-limits.module.ts
├── nutrition-limits.service.ts
└── README.md
```
