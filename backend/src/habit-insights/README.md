# Habit Insights Module

Module ini menyediakan analisis pola makan pengguna dengan berbagai periode waktu (weekly, monthly, yearly, overall) menggunakan Machine Learning. Sistem mengintegrasikan NestJS backend dengan Python ML API untuk menghasilkan insight mendalam tentang kebiasaan makan, deteksi pola positif/negatif, dan rekomendasi personal.

## 📋 Fitur Utama

- **Multi-Period Analysis**: Mendukung analisis weekly, monthly, yearly, dan overall
- **Machine Learning Integration**: Menggunakan Python ML API untuk analisis mendalam
- **Pattern Detection**: Mengidentifikasi pola positif dan negatif dalam kebiasaan makan
  - Asupan gula berlebih di akhir pekan
  - Konsistensi makan sayur
  - Pola skip sarapan
  - Weekend overeating
- **Nutrient Trends**: Tracking tren nutrisi (kalori, protein, karbohidrat, lemak, serat)
- **Meal Timing Analysis**: Menganalisis konsistensi waktu makan per kategori
- **Smart Recommendations**: Rekomendasi actionable dan personal berdasarkan pola terdeteksi
- **Health Score**: Skor kesehatan 0-100 berdasarkan multiple factors
- **Fallback System**: Rule-based analysis jika ML API tidak tersedia

## 🏗️ Arsitektur

```
┌─────────────────┐
│   Client App    │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP Request
         │ GET /habit-insights?userId=xxx&period=weekly
         ▼
┌─────────────────────────────────────────────────┐
│         NestJS Backend (Port 3000)              │
│  ┌───────────────────────────────────────────┐  │
│  │   HabitInsightsController                 │  │
│  │   - JWT Authentication                    │  │
│  │   - Query Validation                      │  │
│  └─────────────────┬─────────────────────────┘  │
│                    │                             │
│  ┌─────────────────▼─────────────────────────┐  │
│  │   HabitInsightsService                    │  │
│  │   - Calculate date range by period        │  │
│  │   - Fetch food logs from Supabase         │  │
│  │   - Local data analysis                   │  │
│  │   - Call ML API                           │  │
│  │   - Pattern enhancement & classification  │  │
│  │   - Health score calculation              │  │
│  └─────────┬──────────────────┬──────────────┘  │
│            │                  │                  │
│            │                  │ HTTP POST        │
│            │                  ▼                  │
│  ┌─────────▼──────────┐  ┌──────────────────┐  │
│  │  SupabaseService   │  │  Python ML API   │  │
│  │  - Query food logs │  │  (Port 5000)     │  │
│  │  - User profile    │  │  - Pattern detect│  │
│  └────────────────────┘  │  - Recommendations│ │
│                          └──────────────────┘  │
└─────────────────────────────────────────────────┘
```


## 🔌 API Endpoints

### GET `/habit-insights`

Menganalisis pola makan pengguna dan menghasilkan insight berdasarkan periode yang ditentukan.

**Authentication**: Required (JWT Bearer Token)

**Query Parameters**:

| Parameter   | Type   | Required | Default        | Description                                    |
|-------------|--------|----------|----------------|------------------------------------------------|
| `userId`    | UUID   | ✅ Yes   | -              | ID pengguna yang akan dianalisis               |
| `period`    | enum   | ✅ Yes   | -              | Period type: `weekly`, `monthly`, `yearly`, `overall` |
| `startDate` | string | ❌ No    | Auto-calculated| Tanggal mulai analisis (ISO 8601: YYYY-MM-DD) |
| `endDate`   | string | ❌ No    | Today          | Tanggal akhir analisis (ISO 8601: YYYY-MM-DD) |

**Period Type Behavior**:

| Period    | Date Range (if not specified)        | Use Case                           |
|-----------|--------------------------------------|------------------------------------|
| `weekly`  | Last 7 days                          | Analisis mingguan rutin           |
| `monthly` | Last 30 days                         | Review bulanan                    |
| `yearly`  | Last 365 days                        | Trend tahunan                     |
| `overall` | All time (up to 10 years)            | Comprehensive history analysis    |

**Example Requests**:

```bash
# Weekly analysis (default: last 7 days)
GET /habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=weekly
Authorization: Bearer <your-jwt-token>

# Monthly analysis with custom dates
GET /habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=monthly&startDate=2023-10-01&endDate=2023-10-31
Authorization: Bearer <your-jwt-token>

# Yearly analysis
GET /habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=yearly
Authorization: Bearer <your-jwt-token>

# Overall analysis (all user's data)
GET /habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=overall
Authorization: Bearer <your-jwt-token>
```

**Example Response**:

```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "period": "weekly",
  "dateRange": {
    "start": "2023-10-01",
    "end": "2023-10-07"
  },
  "daysAnalyzed": 7,
  "totalMeals": 21,
  "averageCalories": 2100,
  "patterns": [
    {
      "type": "negative",
      "message": "Asupan gula berlebih di akhir pekan",
      "daysDetected": ["Saturday", "Sunday"],
      "frequency": "Weekly",
      "impact": "High"
    },
    {
      "type": "positive",
      "message": "Konsisten makan sayur saat makan siang",
      "streak": 5,
      "frequency": "Daily",
      "impact": "High"
    },
    {
      "type": "negative",
      "message": "Sering melewatkan sarapan",
      "daysDetected": ["Monday", "Wednesday", "Friday"],
      "frequency": "43% of days",
      "impact": "High"
    },
    {
      "type": "negative",
      "message": "Asupan kalori berlebih di akhir pekan",
      "daysDetected": ["Saturday", "Sunday"],
      "frequency": "Weekly",
      "impact": "Medium"
    }
  ],
  "summary": "Analyzed 21 meals over 7 days. Several patterns were identified that could benefit from attention.",
  "recommendations": [
    "Kurangi konsumsi gula di akhir pekan",
    "Pertahankan kebiasaan baik makan sayur",
    "Usahakan untuk tidak melewatkan sarapan",
    "Kontrol porsi makan di akhir pekan",
    "Maintain consistent eating patterns throughout the week"
  ],
  "nutrientTrends": [
    {
      "nutrient": "Calories",
      "averageDaily": 2150.5,
      "trend": "stable",
      "recommended": 2100,
      "status": "On target"
    },
    {
      "nutrient": "Protein",
      "averageDaily": 65.2,
      "trend": "increasing",
      "recommended": 70,
      "status": "Below target"
    },
    {
      "nutrient": "Carbohydrates",
      "averageDaily": 280.8,
      "trend": "stable",
      "recommended": 262.5,
      "status": "Above target"
    },
    {
      "nutrient": "Fat",
      "averageDaily": 72.3,
      "trend": "stable",
      "recommended": 70,
      "status": "On target"
    },
    {
      "nutrient": "Fiber",
      "averageDaily": 28.1,
      "trend": "increasing",
      "recommended": 30,
      "status": "Below target"
    }
  ],
  "mealTimings": [
    {
      "mealType": "Breakfast",
      "averageTime": "07:25",
      "consistency": 85,
      "note": "Very consistent meal timing"
    },
    {
      "mealType": "Lunch",
      "averageTime": "12:45",
      "consistency": 72,
      "note": "Moderately consistent meal timing"
    },
    {
      "mealType": "Dinner",
      "averageTime": "19:15",
      "consistency": 68,
      "note": "Moderately consistent meal timing"
    },
    {
      "mealType": "Snack",
      "averageTime": "15:30",
      "consistency": 45,
      "note": "Inconsistent meal timing - consider establishing a routine"
    }
  ],
  "healthScore": 72,
  "generatedAt": "2025-12-09T10:30:00.000Z"
}
```

## 📊 Response Fields Explained

### Main Response Object

| Field            | Type     | Description                                           |
|------------------|----------|-------------------------------------------------------|
| `userId`         | string   | UUID pengguna yang dianalisis                         |
| `period`         | enum     | Tipe periode: weekly, monthly, yearly, overall        |
| `dateRange`      | object   | Object berisi start dan end date (YYYY-MM-DD)         |
| `daysAnalyzed`   | number   | Jumlah hari yang dianalisis dalam periode             |
| `totalMeals`     | number   | Total meal logs yang tercatat dalam periode           |
| `averageCalories`| number   | Rata-rata kalori harian dalam periode                 |
| `patterns`       | array    | List pola kebiasaan makan (positive/negative/neutral) |
| `summary`        | string   | Ringkasan hasil analisis dari ML                      |
| `recommendations`| string[] | List rekomendasi actionable (max 5-10)                |
| `nutrientTrends` | array    | Tren nutrisi dengan status dan rekomendasi            |
| `mealTimings`    | array    | Analisis konsistensi waktu makan                      |
| `healthScore`    | number   | Skor kesehatan 0-100                                  |
| `generatedAt`    | string   | Timestamp ISO 8601 saat insight dibuat                |

### Pattern Object

| Field          | Type     | Description                                              |
|----------------|----------|----------------------------------------------------------|
| `type`         | enum     | Klasifikasi: `positive`, `negative`, atau `neutral`      |
| `message`      | string   | Deskripsi pola yang terdeteksi                           |
| `daysDetected` | string[] | *Optional*. Hari-hari saat pola terdeteksi (contoh: ["Saturday", "Sunday"]) |
| `streak`       | number   | *Optional*. Untuk pola positif: berapa hari berturut-turut |
| `frequency`    | string   | Frekuensi kemunculan: "Daily", "Weekly", "Monthly", "43% of days" |
| `impact`       | enum     | Tingkat dampak: `Low`, `Medium`, `High`                  |

**Pattern Types & Examples**:

1. **Negative Patterns** 🔴
   - Asupan gula berlebih di akhir pekan
   - Sering melewatkan sarapan
   - Asupan kalori berlebih di akhir pekan
   - Late evening eating pattern
   - Low protein intake
   - Inconsistent carbohydrate intake

2. **Positive Patterns** 🟢
   - Konsisten makan sayur saat makan siang
   - Regular meal timing
   - Balanced nutrient intake
   - Adequate water consumption

3. **Neutral Patterns** ⚪
   - Variasi menu yang cukup
   - Normal eating frequency

### Nutrient Trend Object

| Field          | Type   | Description                                        |
|----------------|--------|----------------------------------------------------|
| `nutrient`     | string | Nama nutrisi: Calories, Protein, Carbohydrates, Fat, Fiber |
| `averageDaily` | number | Rata-rata asupan harian dalam periode              |
| `trend`        | enum   | Arah tren: `increasing`, `decreasing`, `stable`    |
| `recommended`  | number | Target asupan yang direkomendasikan                |
| `status`       | enum   | Status: `Below target`, `On target`, `Above target`|

**Trend Calculation Logic**:
- **Increasing**: Second half average > first half average by >10%
- **Decreasing**: Second half average < first half average by >10%
- **Stable**: Change within ±10%

**Status Logic**:
- **Below target**: Average < 90% of recommended
- **On target**: Average between 90%-110% of recommended
- **Above target**: Average > 110% of recommended

### Meal Timing Object

| Field         | Type   | Description                                          |
|---------------|--------|------------------------------------------------------|
| `mealType`    | string | Kategori: Breakfast, Lunch, Dinner, Snack            |
| `averageTime` | string | Waktu rata-rata (HH:MM format)                       |
| `consistency` | number | Skor konsistensi 0-100 (100 = sangat konsisten)      |
| `note`        | string | Catatan analisis waktu makan                         |

**Meal Type Time Windows**:
- **Breakfast**: 05:00 - 11:00
- **Lunch**: 11:00 - 15:00
- **Dinner**: 17:00 - 21:00
- **Snack**: 15:00 - 17:00, 21:00 - 05:00

**Consistency Score**:
- **80-100**: Very consistent meal timing
- **60-79**: Moderately consistent meal timing
- **0-59**: Inconsistent meal timing - consider establishing a routine

**Error Responses**:

| Status | Error                      | Description                           |
|--------|----------------------------|---------------------------------------|
| 400    | Bad Request                | Invalid query parameters              |
| 401    | Unauthorized               | Missing or invalid JWT token          |
| 404    | User Not Found             | User ID doesn't exist                 |
| 404    | No Food Logs Found         | No data in specified period           |
| 500    | Internal Server Error      | Server or ML API error                |

## 🔍 Cara Kerja Analisis

### 1. Data Collection Phase

```typescript
// Step 1: Verify user exists and get profile
const user = await supabase
  .from('users')
  .select('*, user_preferences(*)')
  .eq('id', userId)
  .single();

// Step 2: Calculate date range based on period
const { startDate, endDate } = calculateDateRange(period, startDate?, endDate?);

// Step 3: Fetch food logs with related data
const foodLogs = await supabase
  .from('user_food_logs')
  .select('*, food_items(*), nutrition_rules(*)')
  .eq('user_id', userId)
  .gte('created_at', startDate)
  .lte('created_at', endDate)
  .order('created_at', { ascending: true });
```

### 2. Local Analysis (NestJS)

**A. Nutrient Trends Analysis**

```typescript
// Untuk setiap nutrient (calories, protein, carbs, fat, fiber):
1. Ekstrak nilai dari semua food logs
2. Hitung average daily intake
3. Calculate trend (increasing/decreasing/stable)
   - Split data menjadi 2 bagian
   - Compare first half vs second half average
4. Bandingkan dengan recommended intake (based on BMR)
5. Tentukan status (Below/On/Above target)
```

**B. Meal Timing Analysis**

```typescript
// Untuk setiap meal type (breakfast, lunch, dinner, snack):
1. Filter logs berdasarkan time window
2. Calculate average time dalam menit
3. Convert ke HH:MM format
4. Calculate consistency score:
   - Hitung standard deviation dari waktu makan
   - Lower stdDev = higher consistency
   - Score = 100 - (stdDev / maxStdDev * 100)
5. Generate note berdasarkan consistency score
```

**C. Daily Statistics**

```typescript
// Agregasi per hari:
1. Group logs by date
2. Count meals per day
3. Sum total calories per day
4. Calculate average across all days
```

### 3. ML Analysis (Python API)

**Request to ML API**:

```json
POST http://localhost:5000/analyze-habits
{
  "food_logs": [...],
  "user_profile": {
    "username": "john_doe",
    "age": 28,
    "height_cm": 175,
    "weight_kg": 70,
    "goals": "weight_loss",
    "allergies": [],
    "tastes": ["sweet", "savory"],
    "medical_history": []
  },
  "period": "weekly"
}
```

**ML API Processing**:

1. **Pattern Detection** using rule-based + ML models:
   - Late evening eating (meals after 20:00)
   - Low meal frequency (<3 meals/day)
   - Weekend overeating (20%+ more calories)
   - Insufficient/excessive caloric intake
   - Low protein intake (<recommended)
   - Inconsistent carbohydrate intake
   - Limited food variety (low unique items)
   - Frequent meal skipping (especially breakfast)

2. **Recommendation Generation**:
   - Personalized berdasarkan user profile
   - Prioritized berdasarkan impact level
   - Actionable dan specific
   - Max 5-10 recommendations

3. **Summary Generation**:
   - Overall assessment
   - Highlight key findings
   - Brief context

### 4. Pattern Enhancement (NestJS)

Setelah menerima data dari ML API, backend melakukan enhancement:

**A. Weekend Overeating Detection**

```typescript
1. Split logs: weekend (Sat, Sun) vs weekday (Mon-Fri)
2. Calculate average calories per meal for each
3. If weekend avg > weekday avg * 1.2:
   → Pattern: "Asupan kalori berlebih di akhir pekan"
   → Type: negative
   → Days: ["Saturday", "Sunday"]
```

**B. Vegetable Consistency Detection**

```typescript
1. Keywords: ['sayur', 'vegetable', 'salad', 'bayam', ...]
2. Group logs by date
3. Check each date for vegetable consumption
4. Track consecutive days with vegetables
5. If streak ≥ 5 days:
   → Pattern: "Konsisten makan sayur"
   → Type: positive
   → Streak: 5
```

**C. Breakfast Skipping Detection**

```typescript
1. Group logs by date
2. For each date, check if any log between 05:00-10:00
3. Count days without breakfast
4. If skip percentage > 30%:
   → Pattern: "Sering melewatkan sarapan"
   → Type: negative
   → Days detected: list of weekdays
```

**D. Sugar Intake Pattern Detection**

```typescript
1. Keywords: ['gula', 'sugar', 'manis', 'sweet', 'cake', ...]
2. Filter weekend logs
3. Count logs with sugar keywords
4. If sugar percentage > 40% on weekends:
   → Pattern: "Asupan gula berlebih di akhir pekan"
   → Type: negative
   → Days: ["Saturday", "Sunday"]
```

### 5. Health Score Calculation

**Formula** (Total: 100 points):

```typescript
Health Score = Nutrient Balance (40) + Meal Consistency (30) + Meal Frequency (30)
```

**Breakdown**:

1. **Nutrient Balance (40 points)**:
   ```
   Score = (Nutrients "On target" / Total nutrients) × 40
   Example: 3 out of 5 nutrients on target = (3/5) × 40 = 24 points
   ```

2. **Meal Consistency (30 points)**:
   ```
   Average consistency = Sum of all meal timing consistency / Number of meal types
   Score = (Average consistency / 100) × 30
   Example: Avg 75% consistency = (75/100) × 30 = 22.5 points
   ```

3. **Meal Frequency (30 points)**:
   ```
   Avg meals per day = Total meals / Unique dates
   Score = min((Avg meals per day / 4) × 30, 30)
   Example: 3 meals/day = (3/4) × 30 = 22.5 points
   ```

**Health Score Interpretation**:

| Score Range | Category      | Description                                    |
|-------------|---------------|------------------------------------------------|
| 90-100      | Excellent     | Outstanding nutrition habits                   |
| 80-89       | Very Good     | Strong habits with minor improvements needed   |
| 70-79       | Good          | Solid foundation, some areas to work on        |
| 60-69       | Fair          | Moderate habits, several areas need attention  |
| 50-59       | Needs Work    | Significant improvements recommended           |
| 0-49        | Poor          | Major changes needed for health improvement    |

### 6. Fallback Mechanism

Jika ML API tidak available atau error:

```typescript
try {
  const mlInsights = await callMLAnalysis(...);
} catch (error) {
  // Fallback ke rule-based analysis
  const mlInsights = generateBasicInsights(foodLogs, user);
  // Tetap menghasilkan summary, recommendations, patterns
  // Tapi menggunakan algoritma sederhana
}
```

**Fallback Logic**:
- Check average meals per day
- Identify basic patterns (low frequency)
- Generate generic but helpful recommendations
- Still provide useful insights to user

## 🔧 Setup & Configuration

### 1. Environment Variables

Tambahkan ke file `.env`:

```env
# ML API Configuration
ML_API_URL=http://localhost:5000

# Supabase Configuration (should already exist)
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# JWT Configuration (should already exist)
JWT_SECRET=your_jwt_secret
```

### 2. Install Python Dependencies

```bash
cd ai
pip install -r requirements.txt
```

**requirements.txt**:
```txt
flask
flask-cors
pandas
numpy
scikit-learn
openai  # if using GPT for insights
google-generativeai  # if using Gemini
```

### 3. Start Python ML API Server

```bash
cd ai
python app.py
```

Server akan berjalan di `http://localhost:5000`

### 4. Verify ML API Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "ML API is running"
}
```

### 5. Start NestJS Backend

```bash
cd backend
npm install
npm run start:dev
```

Server akan berjalan di `http://localhost:3000`

## 🧪 Testing

### Manual Testing dengan cURL

```bash
# 1. Login to get JWT token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response: { "access_token": "eyJhbG..." }

# 2. Get weekly insights
curl -X GET "http://localhost:3000/habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=weekly" \
  -H "Authorization: Bearer eyJhbG..."

# 3. Get monthly insights with custom dates
curl -X GET "http://localhost:3000/habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=monthly&startDate=2023-10-01&endDate=2023-10-31" \
  -H "Authorization: Bearer eyJhbG..."

# 4. Get yearly insights
curl -X GET "http://localhost:3000/habit-insights?userId=123e4567-e89b-12d3-a456-426614174000&period=yearly" \
  -H "Authorization: Bearer eyJhbG..."
```

### Testing dengan Postman

**Step 1: Create Request**
- Method: `GET`
- URL: `http://localhost:3000/habit-insights`
- Params:
  - `userId`: `123e4567-e89b-12d3-a456-426614174000`
  - `period`: `weekly` / `monthly` / `yearly` / `overall`
  - `startDate`: `2023-10-01` (optional)
  - `endDate`: `2023-10-31` (optional)

**Step 2: Add Authorization**
- Type: `Bearer Token`
- Token: `<your-jwt-token>`

**Step 3: Send Request**

### Unit Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npm run test -- habit-insights.service.spec.ts
```

## 🎯 Use Cases & Integration Examples

### 1. Personal Health Dashboard

**Frontend Integration**:

```typescript
// React/Next.js example
const DashboardPage = () => {
  const [insights, setInsights] = useState(null);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    const fetchInsights = async () => {
      const response = await fetch(
        `/api/habit-insights?userId=${userId}&period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      setInsights(data);
    };

    fetchInsights();
  }, [period]);

  return (
    <div>
      <PeriodSelector value={period} onChange={setPeriod} />
      <HealthScoreCard score={insights?.healthScore} />
      <PatternsSection patterns={insights?.patterns} />
      <NutrientTrendsChart trends={insights?.nutrientTrends} />
      <RecommendationsList items={insights?.recommendations} />
    </div>
  );
};
```

### 2. Cron Job for Automated Insights

**Weekly Report Generation**:

```typescript
// cron.service.ts
@Cron('0 9 * * 1') // Every Monday at 9 AM
async generateWeeklyReports() {
  const users = await this.getActiveUsers();

  for (const user of users) {
    try {
      const insights = await this.habitInsightsService.generateInsight({
        userId: user.id,
        period: PeriodType.WEEKLY,
      });

      // Send email or push notification
      await this.notificationService.sendWeeklyReport(user, insights);

      // Store in database for history
      await this.storeInsightHistory(insights);
    } catch (error) {
      console.error(`Failed to generate report for user ${user.id}:`, error);
    }
  }
}
```

### 3. Nutrition Coaching Integration

```typescript
// nutrition-coach.service.ts
async getCoachingPlan(userId: string) {
  // Get last 3 months of insights
  const insights = await this.habitInsightsService.generateInsight({
    userId,
    period: PeriodType.MONTHLY,
  });

  // Analyze patterns over time
  const highImpactPatterns = insights.patterns
    .filter(p => p.impact === 'High' && p.type === 'negative');

  // Generate personalized coaching plan
  const plan = {
    focusAreas: highImpactPatterns.map(p => p.message),
    weeklyGoals: this.generateWeeklyGoals(highImpactPatterns),
    recommendations: insights.recommendations,
    targetScore: insights.healthScore + 10, // Aim for +10 improvement
  };

  return plan;
}
```

### 4. Progress Tracking Over Time

```typescript
// progress.service.ts
async trackProgress(userId: string) {
  const periods = ['2023-01', '2023-02', '2023-03', '2023-04'];
  const progressData = [];

  for (const month of periods) {
    const insights = await this.habitInsightsService.generateInsight({
      userId,
      period: PeriodType.MONTHLY,
      startDate: `${month}-01`,
      endDate: `${month}-28`,
    });

    progressData.push({
      month,
      healthScore: insights.healthScore,
      averageCalories: insights.averageCalories,
      positivePatterns: insights.patterns.filter(p => p.type === 'positive').length,
      negativePatterns: insights.patterns.filter(p => p.type === 'negative').length,
    });
  }

  return {
    timeline: progressData,
    improvement: this.calculateImprovement(progressData),
    insights: this.generateProgressInsights(progressData),
  };
}
```
## 🐛 Troubleshooting

### Problem 1: ML API Connection Failed

**Error**: `ML API call failed: fetch failed`

**Solutions**:

1. **Check if Python ML API is running**:
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify ML_API_URL in .env**:
   ```env
   ML_API_URL=http://localhost:5000  # Should not have trailing slash
   ```

3. **Check firewall settings**:
   ```bash
   # Windows
   netstat -ano | findstr :5000

   # macOS/Linux
   lsof -i :5000
   ```

4. **Review Python API logs**:
   ```bash
   # Check for errors in Python console
   # Common issues: missing dependencies, port already in use
   ```

5. **Test fallback system**:
   - Stop Python API
   - Make request to verify fallback works
   - Should still return insights (basic)

### Problem 2: No Food Logs Found

**Error**: `No food logs found for user ${userId} in the specified period`

**Solutions**:

1. **Verify user has food logs**:
   ```sql
   SELECT COUNT(*) FROM user_food_logs WHERE user_id = '123e4567-...';
   ```

2. **Check date range**:
   ```typescript
   // For weekly: checks last 7 days
   // Make sure user has logs in that period
   ```

3. **Try different period**:
   ```bash
   # If weekly returns nothing, try monthly
   GET /habit-insights?userId=xxx&period=monthly
   
   # Or use overall to check all data
   GET /habit-insights?userId=xxx&period=overall
   ```

4. **Verify user_id is correct**:
   ```bash
   # Make sure UUID format is correct
   # UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   ```

### Problem 3: Low Health Score

**Issue**: User consistently gets low health score (<50)

**Analysis Steps**:

1. **Check patterns array**:
   ```typescript
   // Look for high-impact negative patterns
   const criticalIssues = patterns.filter(
     p => p.type === 'negative' && p.impact === 'High'
   );
   ```

2. **Review nutrientTrends**:
   ```typescript
   // Check how many nutrients are "Below target"
   const deficientNutrients = nutrientTrends.filter(
     t => t.status === 'Below target'
   );
   ```

3. **Examine mealTimings consistency**:
   ```typescript
   // Low consistency scores (<60) hurt health score
   const inconsistentMeals = mealTimings.filter(
     m => m.consistency < 60
   );
   ```

4. **Provide targeted recommendations**:
   - Focus on top 3 issues from response
   - Create action plan to address high-impact patterns
   - Set achievable short-term goals

### Problem 4: Incorrect Pattern Detection

**Issue**: Patterns don't match actual user behavior

**Debugging**:

1. **Check raw food logs data**:
   ```sql
   SELECT * FROM user_food_logs 
   WHERE user_id = 'xxx' 
   ORDER BY created_at DESC 
   LIMIT 50;
   ```

2. **Verify time zones**:
   ```typescript
   // Make sure timestamps are in correct timezone
   // Check if breakfast detection window (05:00-10:00) is appropriate
   ```

3. **Review keyword lists**:
   ```typescript
   // For vegetable detection
   const vegetableKeywords = ['sayur', 'vegetable', 'salad', ...];
   
   // May need to add more keywords based on your data
   ```

4. **Adjust thresholds**:
   ```typescript
   // Weekend overeating: currently 20% threshold
   if (weekendAvgCalories > weekdayAvgCalories * 1.2) // Adjust 1.2 if needed
   
   // Breakfast skip: currently 30% threshold  
   if (skipPercentage > 30) // Adjust 30 if needed
   ```

### Problem 5: Slow Response Time

**Issue**: Request takes >5 seconds

**Optimizations**:

1. **Add database indexes**:
   ```sql
   CREATE INDEX idx_food_logs_user_date 
   ON user_food_logs(user_id, created_at);
   ```

2. **Implement caching**:
   ```typescript
   // Cache insights for 1 hour
   @UseInterceptors(CacheInterceptor)
   @CacheTTL(3600)
   async getHabitInsight(query: GetHabitInsightDto) {
     // ...
   }
   ```

3. **Optimize ML API**:
   ```python
   # Use batch processing
   # Cache model predictions
   # Reduce model complexity if needed
   ```

4. **Limit data range for overall period**:
   ```typescript
   // Instead of 10 years, limit to 2 years
   case PeriodType.OVERALL:
     startDate = new Date(endDate.getTime() - 730 * 24 * 60 * 60 * 1000);
   ```

## 📈 Performance Optimization

### Caching Strategy

```typescript
// app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      ttl: 3600, // 1 hour
      max: 100, // max items in cache
    }),
  ],
})
```

### Database Query Optimization

```sql
-- Recommended indexes
CREATE INDEX idx_user_food_logs_user_created 
ON user_food_logs(user_id, created_at DESC);

CREATE INDEX idx_user_food_logs_created 
ON user_food_logs(created_at);

-- Analyze query performance
EXPLAIN ANALYZE 
SELECT * FROM user_food_logs 
WHERE user_id = 'xxx' 
AND created_at >= '2023-10-01'
AND created_at <= '2023-10-31';
```

### Batch Processing for Multiple Users

```typescript
async generateInsightsForMultipleUsers(userIds: string[], period: PeriodType) {
  const batchSize = 10;
  const results = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    const promises = batch.map(userId =>
      this.generateInsight({ userId, period })
    );

    const batchResults = await Promise.allSettled(promises);
    results.push(...batchResults);

    // Small delay to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
```

## 🔐 Security Considerations

### 1. Authentication & Authorization

- ✅ Endpoint protected by JWT Guard
- ✅ Validate user has permission to access data
- ⚠️ Implement user-specific access control:

```typescript
// Add user ownership check
if (requestUser.id !== query.userId && !requestUser.isAdmin) {
  throw new ForbiddenException('Cannot access other user insights');
}
```

### 2. Rate Limiting

```typescript
// main.ts
import rateLimit from 'express-rate-limit';

app.use(
  '/habit-insights',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each user to 10 requests per windowMs
    message: 'Too many requests from this user, please try again later.',
  })
);
```

### 3. Data Privacy

- 🔒 Sensitive health data - follow GDPR/HIPAA guidelines
- 🔒 Encrypt data in transit (HTTPS)
- 🔒 Encrypt sensitive fields in database
- 🔒 Log access for audit trails
- 🔒 Allow users to delete their data (GDPR right to erasure)

### 4. Input Validation

```typescript
// DTO with proper validation
export class GetHabitInsightDto {
  @IsUUID('4')
  userId: string;

  @IsEnum(PeriodType)
  period: PeriodType;

  @IsOptional()
  @IsDateString()
  @Validate(CustomDateValidator) // Ensure date is not in future
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @Validate(CustomDateValidator)
  endDate?: string;
}
```

## 📝 Future Enhancements

- [ ] **Real-time insights** dengan WebSocket untuk live updates
- [ ] **Export insights to PDF** untuk print atau share dengan dokter
- [ ] **Compare dengan users lain** (anonymized) untuk benchmark
- [ ] **Integration dengan wearables** (Fitbit, Apple Health, Samsung Health)
- [ ] **Gamification**: badges berdasarkan health score improvement
- [ ] **Weekly email reports** automated via cron job
- [ ] **Mobile push notifications** untuk reminders dan milestones
- [ ] **Multi-language support** untuk insights dan recommendations
- [ ] **Voice insights** - text-to-speech untuk accessibility
- [ ] **Chat interface** - conversational insights dengan LLM
- [ ] **Meal planning suggestions** berdasarkan patterns yang terdeteksi
- [ ] **Social sharing** - share achievements dengan friends (privacy-aware)
- [ ] **Professional dashboard** untuk nutritionists/dietitians
- [ ] **A/B testing framework** untuk optimize recommendations
- [ ] **Predictive analytics** - predict health score trajectory

## 📚 References & Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Nutrition Recommendations (WHO)](https://www.who.int/nutrition)
- [BMR Calculation Methods](https://en.wikipedia.org/wiki/Basal_metabolic_rate)
- [Pattern Detection in Health Data](https://www.ncbi.nlm.nih.gov/pmc/)