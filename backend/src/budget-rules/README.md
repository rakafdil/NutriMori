# Budget Rules Module

Modul untuk mengelola aturan budget makanan dan analisis pengeluaran berdasarkan `daily_budget` dari tabel `user_preferences`.

## Overview

Budget Rules Module menyediakan fitur:
- **Budget Tier Classification** - Klasifikasi budget harian ke dalam 5 tier
- **Meal Budget Allocation** - Alokasi persentase budget per waktu makan
- **Budget Analysis** - Analisis pengeluaran vs budget yang dialokasikan
- **Budget-aware Recommendations** - Rekomendasi makanan sesuai budget

## Database Schema

### Tabel `user_preferences` (existing)
```sql
CREATE TABLE public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  allergies ARRAY,
  goals ARRAY,
  tastes ARRAY,
  medical_history ARRAY,
  meal_times jsonb DEFAULT '[]'::jsonb,
  daily_budget integer DEFAULT 0,  -- Budget harian dalam IDR
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
```

### Tabel `budget_rules`
```sql
CREATE TABLE public.budget_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  description text,
  min_daily_budget numeric,
  max_daily_budget numeric,
  meal_period text,  -- 'breakfast', 'lunch', 'dinner', 'snack'
  budget_percentage numeric,
  severity text DEFAULT 'info',  -- 'info', 'warning', 'critical'
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Tabel `food_prices`
```sql
CREATE TABLE public.food_prices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  food_id bigint NOT NULL,
  price_per_100g numeric NOT NULL DEFAULT 0,
  price_per_serving numeric,
  serving_size_g numeric DEFAULT 100,
  price_source text,  -- 'manual', 'api', 'estimated'
  region text DEFAULT 'Indonesia',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT food_prices_food_id_fkey FOREIGN KEY (food_id) REFERENCES public.food_items(id)
);
```

## Budget Tiers

| Tier | Budget Harian (IDR) | Deskripsi |
|------|---------------------|-----------|
| `very_low` | ≤ Rp25.000 | Budget sangat terbatas |
| `low` | Rp25.001 - Rp40.000 | Budget terbatas |
| `medium` | Rp40.001 - Rp60.000 | Budget standar |
| `high` | Rp60.001 - Rp100.000 | Budget cukup |
| `very_high` | > Rp100.000 | Budget tinggi |

## Meal Budget Allocation

Default alokasi budget per waktu makan:

| Meal Type | Persentase | Contoh (Budget Rp50.000) |
|-----------|------------|--------------------------|
| `breakfast` | 25% | Rp12.500 |
| `lunch` | 35% | Rp17.500 |
| `dinner` | 30% | Rp15.000 |
| `snack` | 10% | Rp5.000 |

## Integration

### Nutrition Analysis

Budget analysis otomatis dihitung saat `analyzeNutrition()` dipanggil:

```typescript
// Response includes budgetAnalysis if user has daily_budget set
{
  analysisId: "...",
  foodLogId: "...",
  nutritionFacts: { ... },
  budgetAnalysis: {
    estimatedCost: 15000,
    allocatedBudget: 17500,
    dailyBudget: 50000,
    isWithinBudget: true,
    budgetUtilization: 85,
    budgetTier: "medium",
    budgetWarnings: [],
    budgetTips: ["Pilihan makanan ini ramah budget!"]
  }
}
```

### Habit Insights

Budget insight otomatis dihitung saat `generateInsight()` dipanggil:

```typescript
// Response includes budgetInsight if user has daily_budget set
{
  userId: "...",
  period: "weekly",
  patterns: [...],
  budgetInsight: {
    dailyBudget: 50000,
    budgetTier: "medium",
    averageDailySpending: 45000,
    totalSpending: 315000,
    daysWithinBudget: 5,
    daysOverBudget: 2,
    spendingTrend: "stable",
    budgetUtilization: 90,
    budgetPatterns: [
      {
        type: "positive",
        message: "Konsisten menjaga pengeluaran dalam budget",
        impact: "High"
      }
    ],
    budgetRecommendations: [
      "Pilih paket hemat jika makan di luar",
      "Kombinasikan makan di rumah dan di luar"
    ]
  }
}
```

## Budget Patterns

Pola budget yang dideteksi:

| Pattern | Type | Kondisi |
|---------|------|---------|
| Weekend Overspending | `negative` | Rata-rata pengeluaran weekend > 130% weekday |
| Consistent Budget | `positive` | ≥80% hari dalam budget |
| Frequent Overspending | `negative` | ≥40% hari melebihi budget |
| Extreme Spending | `negative` | Ada hari dengan pengeluaran >150% budget |
| Very Low Spending | `neutral` | ≥2 hari dengan pengeluaran <30% budget |

## Budget Tips by Tier

### Very Low (≤ Rp25.000)
- Beli bahan mentah dan masak sendiri
- Pilih protein nabati seperti tempe dan tahu
- Beli sayuran lokal musiman
- Hindari makanan kemasan

### Low (Rp25.001 - Rp40.000)
- Masak untuk beberapa hari sekaligus
- Kombinasikan protein hewani dan nabati
- Bawa bekal dari rumah

### Medium (Rp40.001 - Rp60.000)
- Pilih paket hemat jika makan di luar
- Kombinasikan makan di rumah dan di luar

### High (Rp60.001 - Rp100.000)
- Investasi di makanan berkualitas
- Variasikan jenis protein

### Very High (> Rp100.000)
- Fokus pada kualitas dan variasi nutrisi
- Pertimbangkan makanan organik

## Types

### BudgetAnalysisDto (Nutrition Analysis)
```typescript
interface BudgetAnalysisDto {
  estimatedCost: number;      // Perkiraan biaya makanan (IDR)
  allocatedBudget: number;    // Alokasi budget untuk meal type (IDR)
  dailyBudget: number;        // Budget harian user (IDR)
  isWithinBudget: boolean;    // Apakah dalam budget
  budgetUtilization: number;  // Persentase penggunaan budget
  budgetTier?: string;        // Tier budget
  budgetWarnings?: string[];  // Peringatan budget
  budgetTips?: string[];      // Tips menghemat
}
```

### BudgetInsightDto (Habit Insights)
```typescript
interface BudgetInsightDto {
  dailyBudget: number;
  budgetTier: string;
  averageDailySpending: number;
  totalSpending: number;
  daysWithinBudget: number;
  daysOverBudget: number;
  spendingTrend: 'increasing' | 'decreasing' | 'stable';
  budgetUtilization: number;
  budgetPatterns: BudgetPatternDto[];
  budgetRecommendations: string[];
}
```

### BudgetPatternDto
```typescript
interface BudgetPatternDto {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
  daysAffected?: string[];
  impact?: 'Low' | 'Medium' | 'High';
}
```

## Usage Example

### Set User Budget
```bash
# Update user preferences with daily budget
PATCH /user-preferences
{
  "daily_budget": 50000
}
```

### Get Nutrition Analysis with Budget
```bash
# Analyze nutrition - budget analysis included automatically
POST /nutrition-analysis
{
  "foodLogId": "uuid-here"
}
```

### Get Habit Insights with Budget
```bash
# Get habit insights - budget insight included automatically
GET /habit-insights?period=weekly
```

## Food Price Estimation

Jika harga makanan tidak tersedia di tabel `food_prices`, sistem menggunakan estimasi:
- **Fallback**: 1 kalori ≈ Rp12

Harga default per food group (per 100g):
| Food Group | Harga/100g | Harga/Serving |
|------------|------------|---------------|
| Daging | Rp12.000 | Rp18.000 |
| Ikan | Rp8.000 | Rp12.000 |
| Telur | Rp3.000 | Rp3.000 |
| Tempe | Rp1.500 | Rp3.000 |
| Tahu | Rp1.200 | Rp2.500 |
| Sayuran | Rp1.500 | Rp3.000 |
| Buah | Rp2.500 | Rp5.000 |
| Nasi | Rp800 | Rp2.000 |
| Mie | Rp2.000 | Rp5.000 |

## Migration

Jalankan migration untuk membuat tabel yang diperlukan:

```bash
# Run migration
psql -f database/migrations/008_budget_rules.sql
```

## Related Modules

- `nutrition-analysis` - Menggunakan budget analysis untuk setiap meal
- `habit-insights` - Menggunakan budget insight untuk analisis periodik
- `user-preferences` - Menyimpan `daily_budget` user
