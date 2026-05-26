INSERT INTO public.tags (name, color)
VALUES
  ('OURO', '#B8892F'),
  ('PRATA', '#8A94A6'),
  ('BRONZE', '#A86432'),
  ('Comprador recente', '#0F766E'),
  ('Alto valor', '#1D4ED8'),
  ('Licitante ativo', '#7C3AED'),
  ('Inativo com potencial', '#B45309'),
  ('Engajado em campanhas', '#BE185D')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;
