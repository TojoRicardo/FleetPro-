-- Add unit_price to invoices for billing breakdown
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2);

-- Backfill unit_price from line_items or amount/vehicle_count where possible
UPDATE invoices
SET unit_price = CASE
  WHEN vehicle_count > 0 THEN ROUND(amount / vehicle_count, 2)
  ELSE amount
END
WHERE unit_price IS NULL;
