CREATE OR REPLACE FUNCTION drop_function(function_name TEXT)
RETURNS VOID AS $$
DECLARE
    r RECORD;
    function_signature TEXT;
BEGIN
    FOR r IN
        SELECT p.oid,
               p.proname,
               pg_catalog.pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = function_name
        AND n.nspname = current_schema()
    LOOP
        function_signature := r.proname || '(' || r.args || ')';
        EXECUTE 'DROP FUNCTION IF EXISTS ' || function_signature;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
