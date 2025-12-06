-- Run this in Supabase SQL Editor to check the foreign key constraints

-- Check the profiles table constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='profiles';

-- Check if profiles table exists
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'users') 
AND table_schema = 'public';
