@echo off
REM =============================================================================
REM Generate Sample Food Logs for Testing Habit Insights (Windows)
REM =============================================================================
REM Usage: generate-sample-data.bat <access_token> [days]
REM Example: generate-sample-data.bat "eyJhbGc..." 7
REM =============================================================================

setlocal enabledelayedexpansion

REM Configuration
if "%BASE_URL%"=="" set BASE_URL=https://nutrimori.vercel.app/api
set TOKEN=%1
set DAYS=%2
if "%DAYS%"=="" set DAYS=7

REM Check if token is provided
if "%TOKEN%"=="" (
    echo Error: Access token required
    echo Usage: %0 ^<access_token^> [days]
    echo Example: %0 "eyJhbGciOiJIUzI1NiIsImtpZCI6IjZZc01tTGxWK1pBU0UxNEYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3loZGlkeHBzanJhcHlvdWR5eXBiLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiI0OTkyNjhhZS05MGRjLTQ1OTEtYmE0My1lYWY5YTNmNjNmNzEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1MzY3OTMxLCJpYXQiOjE3NjUzNjQzMzEsImVtYWlsIjoidXNlckBnbWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImVtYWlsIjoidXNlckBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IktpbmciLCJwaG9uZV92ZXJpZmllZCI6ZmFsc2UsInN1YiI6IjQ5OTI2OGFlLTkwZGMtNDU5MS1iYTQzLWVhZjlhM2Y2M2Y3MSJ9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzY1MzY0MzMxfV0sInNlc3Npb25faWQiOiIzNjMyYTkwYy0yNTZlLTRiZmMtYjI3Yy04MDA1ZDI1NTJjYzMiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.ig5marHoKdHUptT8hvooTgUfBjvyDLHhRVwbMxo_4hw" 7
    exit /b 1
)

echo === Generating Sample Food Logs ===
echo Base URL: %BASE_URL%
echo Days: %DAYS%
echo.

REM Sample meals
set BREAKFAST[0]=2 telur rebus, roti gandum 2 lembar, kopi hitam
set BREAKFAST[1]=oatmeal dengan buah, susu almond
set BREAKFAST[2]=nasi uduk, ayam goreng, tempe
set BREAKFAST[3]=pancake, maple syrup, buah strawberry
set BREAKFAST[4]=bubur ayam, kerupuk, cakwe

set LUNCH[0]=nasi putih 1 piring, ayam bakar, sayur bayam, tempe goreng
set LUNCH[1]=mie ayam bakso, pangsit, sayur sawi
set LUNCH[2]=nasi padang: rendang, sambal ijo, sayur nangka
set LUNCH[3]=gado-gado, lontong, kerupuk
set LUNCH[4]=soto ayam, nasi, emping, sate

set DINNER[0]=nasi putih, ikan bakar, sayur asem
set DINNER[1]=nasi goreng seafood, telur mata sapi
set DINNER[2]=sop buntut, nasi, kerupuk
set DINNER[3]=pecel lele, nasi, lalapan
set DINNER[4]=nasi, ayam kecap, tahu tempe, sayur

set SNACK[0]=pisang goreng 3 potong, teh manis
set SNACK[1]=kopi, kue kering
set SNACK[2]=salad buah

set SUCCESS_COUNT=0
set FAIL_COUNT=0

REM Generate data for each day
for /L %%i in (0,1,%DAYS%) do (
    set /a DAY_NUM=!DAYS!-%%i
    echo Day !DAY_NUM!:
    
    REM Random selection (simplified - using modulo of time)
    set /a B_IDX=!RANDOM! %% 5
    set /a L_IDX=!RANDOM! %% 5
    set /a D_IDX=!RANDOM! %% 5
    set /a S_IDX=!RANDOM! %% 3
    
    REM Calculate dates (simplified - using current date)
    for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
        set CURRENT_DATE=%%c-%%a-%%b
    )
    
    REM Breakfast (07:00)
    set BREAKFAST_TIME=!CURRENT_DATE!T07:00:00Z
    set "BREAKFAST_TEXT=!BREAKFAST[%B_IDX%]!"
    
    curl -s -X POST "%BASE_URL%/food-logs" ^
        -H "Authorization: Bearer %TOKEN%" ^
        -H "Content-Type: application/json" ^
        -d "{\"raw_text\":\"!BREAKFAST_TEXT!\",\"meal_type\":\"breakfast\",\"created_at\":\"!BREAKFAST_TIME!\"}" ^
        > nul 2>&1
    
    if !ERRORLEVEL! EQU 0 (
        echo   [OK] Breakfast created
        set /a SUCCESS_COUNT+=1
    ) else (
        echo   [FAIL] Breakfast failed
        set /a FAIL_COUNT+=1
    )
    
    REM Lunch (12:30)
    set LUNCH_TIME=!CURRENT_DATE!T12:30:00Z
    set "LUNCH_TEXT=!LUNCH[%L_IDX%]!"
    
    curl -s -X POST "%BASE_URL%/food-logs" ^
        -H "Authorization: Bearer %TOKEN%" ^
        -H "Content-Type: application/json" ^
        -d "{\"raw_text\":\"!LUNCH_TEXT!\",\"meal_type\":\"lunch\",\"created_at\":\"!LUNCH_TIME!\"}" ^
        > nul 2>&1
    
    if !ERRORLEVEL! EQU 0 (
        echo   [OK] Lunch created
        set /a SUCCESS_COUNT+=1
    ) else (
        echo   [FAIL] Lunch failed
        set /a FAIL_COUNT+=1
    )
    
    REM Dinner (19:00)
    set DINNER_TIME=!CURRENT_DATE!T19:00:00Z
    set "DINNER_TEXT=!DINNER[%D_IDX%]!"
    
    curl -s -X POST "%BASE_URL%/food-logs" ^
        -H "Authorization: Bearer %TOKEN%" ^
        -H "Content-Type: application/json" ^
        -d "{\"raw_text\":\"!DINNER_TEXT!\",\"meal_type\":\"dinner\",\"created_at\":\"!DINNER_TIME!\"}" ^
        > nul 2>&1
    
    if !ERRORLEVEL! EQU 0 (
        echo   [OK] Dinner created
        set /a SUCCESS_COUNT+=1
    ) else (
        echo   [FAIL] Dinner failed
        set /a FAIL_COUNT+=1
    )
    
    echo.
    timeout /t 1 /nobreak > nul
)

echo === Summary ===
echo Total Success: !SUCCESS_COUNT!
echo Total Failed: !FAIL_COUNT!
echo.

if !SUCCESS_COUNT! GTR 0 (
    echo [SUCCESS] Sample data generated!
    echo.
    echo You can now test habit insights with:
    echo   GET %BASE_URL%/habit-insights?period=weekly
    echo   Authorization: Bearer %TOKEN%
) else (
    echo [FAILED] Could not generate sample data
    echo Please check:
    echo   - Access token is valid
    echo   - Backend server is running
    echo   - Food logs endpoint is accessible
)

endlocal
