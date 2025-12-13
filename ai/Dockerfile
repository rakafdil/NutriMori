# Gunakan Python versi 3.10
FROM python:3.10

# Set folder kerja
WORKDIR /code

# Copy requirements dan install
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua file codingan
COPY . .

# Buat folder cache untuk model agar tidak download ulang terus
RUN mkdir -p /code/cache
ENV SENTENCE_TRANSFORMERS_HOME=/code/cache

# Buka port 7860 (Port standar Hugging Face)
EXPOSE 7860

# Jalankan aplikasi (Gunicorn)
CMD ["gunicorn", "-b", "0.0.0.0:7860", "app:app"]