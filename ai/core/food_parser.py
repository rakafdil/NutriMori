import json
import re
import google.generativeai as genai

INDONESIAN_NUMBER_WORDS = {
    "setengah": 0.5,
    "seperempat": 0.25,
    "sepertiga": 0.33,
    "satu": 1,
    "dua": 2,
    "tiga": 3,
    "empat": 4,
    "lima": 5,
}

def _fallback_parse(text: str, default_unit="porsi"):
    parts = re.split(r"\b(dan|sama|\+|,)\b", text, flags=re.IGNORECASE)
    items = []

    for p in parts:
        p = p.strip()
        if not p or p.lower() in ["dan", "sama", "+", ","]:
            continue

        qty = 1.0
        unit = default_unit

        m = re.search(r"(\d+(\.\d+)?)", p)
        if m:
            qty = float(m.group(1))
            p = p.replace(m.group(0), "").strip()

        for w, v in INDONESIAN_NUMBER_WORDS.items():
            if w in p.lower():
                qty = v
                p = re.sub(w, "", p, flags=re.IGNORECASE).strip()
                break

        items.append({
            "name": p.strip(),
            "qty": qty,
            "unit": unit,
            "confidence": 0.5
        })

    if not items:
        return [{"name": text, "qty": 1, "unit": default_unit, "confidence": 0.5}]
    return items


def parse_food_text(text: str, default_unit="porsi"):
    prompt = f"""
    Pecahkan input makanan menjadi item terpisah.
    Tentukan jumlah (qty), satuan (unit), dan nama makanannya.

    Jika tidak ada jumlah → qty = 1.
    Jika tidak ada unit → unit = "porsi".

    Format output HARUS JSON array:
    [
      {{ "name": "ayam geprek", "qty": 1, "unit": "porsi", "confidence": 0.95 }},
      {{ "name": "nasi putih", "qty": 0.5, "unit": "porsi", "confidence": 0.92 }}
    ]

    Input user:
    "{text}"
    """

    model_names = [
        "models/gemini-flash-latest",   # Versi stabil Flash
        "models/gemini-pro-latest",     # Versi stabil Pro (Coba ini!)
        "models/gemini-2.0-flash-lite", # Ringan
        "models/gemini-2.0-flash",      # Canggih
    ]

    for mn in model_names:
        try:
            model = genai.GenerativeModel(
                mn,
                generation_config={"response_mime_type": "application/json"}
            )
            resp = model.generate_content(prompt)
            data = json.loads(resp.text)

            # normalisasi output
            norm = []
            for item in data:
                nm = str(item.get("name", "")).strip()
                if not nm:
                    continue
                qty = float(item.get("qty", 1))
                unit = str(item.get("unit", default_unit))
                conf = float(item.get("confidence", 0.9))

                norm.append({
                    "name": nm,
                    "qty": qty,
                    "unit": unit,
                    "confidence": conf
                })

            if norm:
                return norm

        except Exception as e:
            print(f"[FoodParser] Model {mn} gagal: {e}")

    # fallback jika semua gagal
    return _fallback_parse(text)