PORSI_MAP = {
    "porsi": 150,
    "piring": 150,
    "mangkuk": 250,
    "potong": 80,
    "bungkus": 75,
    "sendok": 12,
    "butir": 60,
    "gelas": 200,
}

def portion_to_gram(jumlah, satuan, food_name=None):
    satuan = (satuan or "").lower().strip()

    # Jika satuan ada di table konversi
    if satuan in PORSI_MAP:
        return jumlah * PORSI_MAP[satuan]

    # fallback: makanan mie instant
    if "indomie" in (food_name or ""):
        return 85 * jumlah

    # fallback default
    return jumlah * 100