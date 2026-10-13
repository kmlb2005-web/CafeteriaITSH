-- ============================================================
-- 001_pago_estado.sql — Sprint 3 (specs/004-advance-orders-payment)
-- Estado del pago: registro de la intención y resultado del pago
-- (entidad "Pago / Transacción" de la spec maestra). La unicidad
-- de pedido_id garantiza un solo renglón: los reintentos actualizan
-- el estado sin duplicar cobros. research.md R1.
-- Aplicar: cd backend && npm run migrate
-- ============================================================
ALTER TABLE pago
  ADD COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
    AFTER metodo,
  ADD CONSTRAINT chk_pago_estado
    CHECK (estado IN ('pendiente', 'confirmado', 'rechazado'));
