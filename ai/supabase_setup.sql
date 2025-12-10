-- 1. Enable vector extension
create extension if not exists vector;

-- 2. Buat tabel untuk menyimpan embedding
create table if not exists food_embeddings (
    id serial primary key,
    food_id integer unique not null,
    nama text not null,
    embedding vector(384),  -- MiniLM-L12 menghasilkan 384 dimensi
    nutrition_data jsonb,
    created_at timestamp with time zone default now()
);

-- 3. Buat index untuk pencarian cepat
create index if not exists food_embeddings_embedding_idx 
on food_embeddings 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- 4. Function untuk similarity search dengan embedding
-- DROP dulu jika sudah ada untuk recreate dengan tipe yang benar
drop function if exists match_foods(vector(384), int);

create or replace function match_foods(
    query_embedding vector(384),
    match_count int default 5,
    match_threshold float default 0.3
)
returns table (
    food_id int,
    nama text,
    similarity float,
    nutrition_data jsonb
)
language plpgsql
as $$
begin
    return query
    select 
        fe.food_id,
        fe.nama,
        (1 - (fe.embedding <=> query_embedding))::float AS similarity,
        fe.nutrition_data
    from food_embeddings fe
    where (1 - (fe.embedding <=> query_embedding)) > match_threshold
    order by fe.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- 5. Function untuk search by text (trigram similarity)
create extension if not exists pg_trgm;

-- DROP dulu jika sudah ada
drop function if exists match_foods_by_text(text, int);

create or replace function match_foods_by_text(
    query_text text,
    match_count int default 5
)
returns table (
    food_id integer,
    nama text,
    similarity double precision,
    nutrition_data jsonb
)
language plpgsql
as $$
begin
    return query
    select 
        fe.food_id,
        fe.nama,
        similarity(lower(fe.nama), lower(query_text))::double precision as similarity,
        fe.nutrition_data
    from food_embeddings fe
    where lower(fe.nama) % lower(query_text)
       or lower(fe.nama) ilike '%' || lower(query_text) || '%'
    order by similarity(lower(fe.nama), lower(query_text)) desc
    limit match_count;
end;
$$;
