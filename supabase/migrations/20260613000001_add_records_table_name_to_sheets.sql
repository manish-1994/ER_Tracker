-- Migration: Add records_table_name column to public.sheets table
-- Architecture: Persist exact physical table mapping to prevent dynamic table name guessing

ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS records_table_name TEXT;

-- Update existing baseline sheet records with their verified tables
UPDATE public.sheets SET records_table_name = 'records_82788dc9238b480b8b4040caef236409' WHERE id = 3 OR id = 5;
UPDATE public.sheets SET records_table_name = 'records_4059d22372a6457ba4b8129667a5ac54' WHERE id = 7;
UPDATE public.sheets SET records_table_name = 'records_e61aaaa26fd043a3a2d764df2aa14024' WHERE id = 8;
UPDATE public.sheets SET records_table_name = 'records_408e6806fae64721b6932558ec6d4664' WHERE id = 9;
UPDATE public.sheets SET records_table_name = 'records_2ea3533fbc444fd3a5b979639e38dbb7' WHERE id = 10;
UPDATE public.sheets SET records_table_name = 'records_e06051ec060f4c0d968275577903d11f' WHERE id = 11;
UPDATE public.sheets SET records_table_name = 'records_f054686c1cc947eb820ad9390ab36513' WHERE id = 12;
UPDATE public.sheets SET records_table_name = 'records_8194a89493c74d3ba83643fe34b5fea1' WHERE id = 13;
UPDATE public.sheets SET records_table_name = 'records_036fe570b67740bb8890ad60ffcfa25e' WHERE id = 14;
UPDATE public.sheets SET records_table_name = 'records_fd2763f2ba5a404f82b6c86ea86c3cff' WHERE id = 15;
UPDATE public.sheets SET records_table_name = 'records_6070970ff3bf42d0b68ee4cd28fb9060' WHERE id = 16;
UPDATE public.sheets SET records_table_name = 'records_01d6a3666c9f44dc90935215c53116d1' WHERE id = 17;
UPDATE public.sheets SET records_table_name = 'records_b84c776822e74b60b561e3248cba8633' WHERE id = 18;
UPDATE public.sheets SET records_table_name = 'records_cff7af7ed0394995a732cccabc486fbd' WHERE id = 19;
UPDATE public.sheets SET records_table_name = 'records_86cff3dade0e4ded9fbc557537b39019' WHERE id = 20;
UPDATE public.sheets SET records_table_name = 'records_c1b4d64899f24d128df55c8127d34c03' WHERE id = 21;
UPDATE public.sheets SET records_table_name = 'records_e34e3cc1f2c048498d4282392164466f' WHERE id = 22;
UPDATE public.sheets SET records_table_name = 'records_66b58351b75a4f0497478590cc12f7da' WHERE id = 23;

