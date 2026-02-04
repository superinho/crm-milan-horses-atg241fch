INSERT INTO tags (name, color) VALUES
('VIP', '#FFD700'),
('Frequente', '#0000FF'),
('Ativo', '#008000'),
('Inativo', '#808080'),
('Novo Lead', '#800080')
ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color;
