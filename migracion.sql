-- Ejecutar UNA sola vez sobre la base `proyectoc` (HeidiSQL → pestaña Consulta).
-- Haz un respaldo antes (HeidiSQL → Exportar base de datos como SQL).
USE `proyectoc`;

-- 1) Inventario: la página maneja categoría, precio y favoritos, y la tabla no los tenía.
--    También 'unidades' era varchar; debe ser numérica para poder descontar stock.
UPDATE `inventario` SET `codigo` = UPPER(`codigo`);   -- PAP-001 vs pap-002: unifica mayúsculas

ALTER TABLE `inventario`
  MODIFY `producto`  VARCHAR(150) NOT NULL,
  MODIFY `unidades`  INT NOT NULL DEFAULT 0,
  ADD COLUMN `categoria` VARCHAR(80)   NOT NULL DEFAULT 'General' AFTER `producto`,
  ADD COLUMN `precio`    DECIMAL(10,2) NULL AFTER `unidades`,
  ADD COLUMN `favorito`  TINYINT(1)    NOT NULL DEFAULT 0;

-- Precios tomados de tus ventas de ejemplo
UPDATE `inventario` SET `precio` = 25  WHERE `codigo` = 'PAP-001';
UPDATE `inventario` SET `precio` = 65  WHERE `codigo` = 'PAP-002';
UPDATE `inventario` SET `precio` = 110 WHERE `codigo` = 'PAP-003';
UPDATE `inventario` SET `precio` = 18  WHERE `codigo` = 'PAP-004';
UPDATE `inventario` SET `precio` = 15  WHERE `codigo` = 'PAP-005';

-- 2) Ventas (detalle): IDventa no era autoincremental y no estaba ligada a puntoventa.
ALTER TABLE `ventas`
  MODIFY `IDventa` INT NOT NULL AUTO_INCREMENT,
  ADD KEY `idx_ventas_numerov` (`NumeroV`),
  ADD CONSTRAINT `fk_ventas_puntoventa`
    FOREIGN KEY (`NumeroV`) REFERENCES `puntoventa` (`NumeroV`)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 3) Correcciones de datos de ejemplo
UPDATE `ventas` SET `Producto` = 'cuaderno profesional' WHERE `Producto` = 'cuadero profesional';
-- V-0002: el detalle suma 130 (2 x 65) pero la cabecera dice 120. Descomenta si 130 es lo correcto:
-- UPDATE `puntoventa` SET `Subtotal` = 130, `Total` = 130 WHERE `NumeroV` = 'V-0002';
