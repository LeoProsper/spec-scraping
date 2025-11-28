DROP FUNCTION IF EXISTS get_last_interaction CASCADE;

CREATE OR REPLACE FUNCTION get_last_interaction(p_company_id UUID)
RETURNS TABLE (
  tipo TEXT,
  descricao TEXT,
  resultado TEXT,
  created_at TIMESTAMPTZ,
  user_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.tipo,
    i.descricao,
    i.resultado,
    i.created_at,
    u.name as user_name
  FROM public.company_interactions i
  JOIN public.accounts u ON i.user_id = u.id
  WHERE i.company_id = p_company_id
  ORDER BY i.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;
