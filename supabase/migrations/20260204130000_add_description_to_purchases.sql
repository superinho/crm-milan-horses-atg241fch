-- Add description column to purchases table
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing purchases with mock descriptions for demonstration
UPDATE purchases 
SET description = CASE 
    WHEN value > 100000 THEN 'Garanhão Puro Sangue Lusitano'
    WHEN value > 50000 THEN 'Égua Matriz Premiada'
    WHEN value > 20000 THEN 'Potro Quarto de Milha'
    ELSE 'Cobertura Promocional'
END
WHERE description IS NULL;
