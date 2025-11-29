-- Corrigir trigger update_searches_count para remover updated_at
CREATE OR REPLACE FUNCTION update_searches_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.search_id IS NOT NULL THEN
    UPDATE public.searches
    SET total_results = total_results + 1
    WHERE id = NEW.search_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
