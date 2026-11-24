-- =====================================================================
-- DATOS DE EJEMPLO (opcional) · norte argentino
-- Propiedades ficticias SIN fotos, con ubicaciones aproximadas: sirven para probar filtros y fichas.
-- Para reemplazar los ejemplos anteriores SIN tocar lo que cargaste desde el panel, ejecutá primero:
--     delete from public.properties where created_by is null;
-- Los precios nulos muestran "Consultar precio" en el sitio.
-- =====================================================================
insert into public.properties
  (title, description, operation, type, status, featured, show_when_closed, price, currency,
   bedrooms, bathrooms, garage_spaces, area_total, area_covered, features,
   province, city, neighborhood, address, latitude, longitude, video_url)
values
('Casa de 3 dormitorios con pileta en Yerba Buena',
 E'Casa familiar en lote de 600 m² con jardín, pileta y quincho con parrilla. Living-comedor amplio, cocina separada, tres dormitorios (uno en suite) y cochera cubierta para dos autos.\n\nCerca de colegios, comercios y de la avenida Aconquija.',
 'venta', 'casa', 'publicada', true, true, 215000, 'USD',
 3, 2, 2, 600, 240, array['pileta','patio','parrilla','quincho','jardin','aire_acondicionado','seguridad'],
 'Tucumán', 'Yerba Buena', 'Marcos Paz', 'Av. Aconquija 1200', -26.8163, -65.3167, null),

('Departamento 2 dormitorios a estrenar en el centro de San Miguel de Tucumán',
 E'Departamento luminoso en piso alto con balcón y vista abierta. Cocina integrada, placard en ambos dormitorios y baño completo. El edificio cuenta con SUM, terraza con parrilla y cochera opcional.',
 'venta', 'departamento', 'publicada', true, true, 98000, 'USD',
 2, 1, 0, 62, 55, array['balcon','ascensor','amenities','aire_acondicionado','apto_credito'],
 'Tucumán', 'San Miguel de Tucumán', 'Centro', 'Av. Mate de Luna 800', -26.8083, -65.2176, null),

('Monoambiente amueblado en Barrio Norte',
 E'Monoambiente completo con cocina equipada, baño y balcón. Edificio con seguridad y lavadero compartido. Ideal para estudiantes o profesionales.',
 'alquiler', 'departamento', 'publicada', false, true, 330000, 'ARS',
 0, 1, 0, 32, 30, array['balcon','ascensor','aire_acondicionado','seguridad'],
 'Tucumán', 'San Miguel de Tucumán', 'Barrio Norte', 'Av. Soldati 400', -26.8012, -65.2105, null),

('Casa quinta para temporada en Tafí del Valle',
 E'Casa de montaña con parque, parrilla y calefacción a leña. Tres dormitorios, dos baños y vista a los cerros. Capacidad para 8 personas. Ropa blanca incluida.',
 'alquiler_temporario', 'casa', 'publicada', true, true, 120, 'USD',
 3, 2, 2, 1500, 160, array['patio','parrilla','calefaccion','jardin','quincho'],
 'Tucumán', 'Tafí del Valle', null, 'Ruta 307 km 60', -26.8531, -65.7022, null),

('Local comercial sobre avenida en Tafí Viejo',
 E'Local a la calle de 70 m² con vidriera, baño y depósito. Excelente tránsito peatonal y vehicular. Apto para comercio o servicios.',
 'alquiler', 'local', 'publicada', false, true, 780000, 'ARS',
 null, 1, 0, 80, 70, array['seguridad'],
 'Tucumán', 'Tafí Viejo', 'Centro', 'Av. Alem 500', -26.7325, -65.2597, null),

('Terreno de 450 m² en Concepción',
 E'Lote plano, con calle asfaltada y servicios de agua, luz y cloacas. A pocas cuadras del centro. Escritura inmediata.',
 'venta', 'terreno', 'publicada', false, true, 32000, 'USD',
 null, null, 0, 450, null, array['apto_credito'],
 'Tucumán', 'Concepción', 'Centro', null, -27.3416, -65.5883, null),

('Casa con patio en Simoca',
 E'Casa de 2 dormitorios con patio amplio y galería, cerca de la plaza principal. Ideal para vivienda o para ampliar.',
 'venta', 'casa', 'publicada', false, true, null, 'USD',
 2, 1, 1, 380, 110, array['patio','parrilla'],
 'Tucumán', 'Simoca', 'Centro', null, -27.2625, -65.3589, null),

('Oficina de 90 m² en San Miguel de Tucumán',
 E'Oficina con recepción, tres despachos, sala de reuniones y office. Aire acondicionado central y cableado estructurado. Edificio con vigilancia y dos ascensores.',
 'alquiler', 'oficina', 'reservada', false, true, 1900, 'USD',
 null, 2, 1, 90, 90, array['aire_acondicionado','ascensor','seguridad'],
 'Tucumán', 'San Miguel de Tucumán', 'Centro', 'Av. Sarmiento 600', -26.8226, -65.2041, null),

('Cochera cubierta en edificio céntrico',
 E'Cochera fija cubierta para auto mediano, con acceso por rampa y portón automático. Edificio con vigilancia.',
 'venta', 'cochera', 'vendida_alquilada', false, true, 14500, 'USD',
 null, null, 1, 12, 12, array['seguridad'],
 'Tucumán', 'San Miguel de Tucumán', 'Centro', 'Calle 25 de Mayo 300', -26.8310, -65.2050, null),

('Departamento 2 dormitorios con vista en Salta capital',
 E'Departamento en edificio con amenities, a dos cuadras de la plaza 9 de Julio. Balcón, cochera y baulera.',
 'venta', 'departamento', 'publicada', false, true, 135000, 'USD',
 2, 2, 1, 78, 70, array['balcon','amenities','ascensor','aire_acondicionado'],
 'Salta', 'Salta', 'Centro', 'Calle Mitre 200', -24.7821, -65.4232, null),

('Casa en construcción en Lules (borrador)',
 E'Ficha en preparación. Pendiente cargar fotos y confirmar el precio con el propietario.',
 'venta', 'casa', 'borrador', false, true, null, 'USD',
 3, 2, 1, 420, 150, array['patio','jardin'],
 'Tucumán', 'Lules', null, null, null, null, null);
