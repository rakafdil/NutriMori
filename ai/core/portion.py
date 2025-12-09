PORSI_MAP = {
    "porsi": 150,
    "piring": 150,
    "mangkuk": 250,
    "potong": 80,
    "bungkus": 75,
    "sendok": 12,
    "butir": 60,
    "gelas": 200,
    "buah": 100,
    "slice": 30
}

def portion_to_gram(jumlah, satuan, food_name=None):
    satuan = (satuan or "").lower().strip()

    if satuan in PORSI_MAP:
        return jumlah * PORSI_MAP[satuan]

    if satuan in ["gram", "g", "gr"]:
        return jumlah

    return jumlah * 100