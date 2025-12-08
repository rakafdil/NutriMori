# file: ai/core/portion.py

PORSI_MAP = {
    "porsi": 150,
    "piring": 150,
    "mangkuk": 250,
    "potong": 80,
    "bungkus": 75,   # Default berat bungkus umum
    "sendok": 12,
    "butir": 60,
    "gelas": 200,
    "buah": 100,     # Tambahan umum
    "slice": 30
}

def portion_to_gram(jumlah, satuan, food_name=None):
    """
    Mengubah satuan porsi ke gram.
    REVISI: Tidak ada lagi hardcoded rule untuk Indomie/brand tertentu.
    """
    satuan = (satuan or "").lower().strip()

    # 1. Cek mapping satuan baku
    if satuan in PORSI_MAP:
        return jumlah * PORSI_MAP[satuan]

    # 2. Jika satuan "gram" atau "g"
    if satuan in ["gram", "g", "gr"]:
        return jumlah

    # 3. Fallback default jika satuan tidak dikenali
    # Asumsi 1 unit entitas = 100 gram (angka aman rata-rata)
    return jumlah * 100