// Catálogos compartidos entre formularios, filtros y validaciones.

export const OPERATIONS = { venta: 'Venta', alquiler: 'Alquiler', alquiler_temporario: 'Alquiler temporario' } as const
export const TYPES = { casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno', local: 'Local', oficina: 'Oficina', cochera: 'Cochera' } as const
export const STATUSES = { borrador: 'Borrador', publicada: 'Publicada', reservada: 'Reservada', vendida_alquilada: 'Vendida / alquilada' } as const
export const FEATURES = {
  pileta: 'Pileta', patio: 'Patio', jardin: 'Jardín', parrilla: 'Parrilla', quincho: 'Quincho', balcon: 'Balcón',
  amenities: 'Amenities', ascensor: 'Ascensor', seguridad: 'Seguridad', aire_acondicionado: 'Aire acondicionado',
  calefaccion: 'Calefacción', apto_credito: 'Apto crédito',
} as const
export const CURRENCIES = ['ARS', 'USD'] as const

export const PROVINCES = [
  'Buenos Aires', 'Ciudad Autónoma de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
] as const

type Keys<T> = [keyof T, ...(keyof T)[]]
export const OPERATION_KEYS = Object.keys(OPERATIONS) as Keys<typeof OPERATIONS>
export const TYPE_KEYS = Object.keys(TYPES) as Keys<typeof TYPES>
export const STATUS_KEYS = Object.keys(STATUSES) as Keys<typeof STATUSES>
export const FEATURE_KEYS = Object.keys(FEATURES) as Keys<typeof FEATURES>

/** Norte argentino: estas provincias siempre se ofrecen primero (en el panel y en los filtros del sitio). */
export const PRIORITY_PROVINCES = [
  'Tucumán', 'Salta', 'Jujuy', 'Catamarca', 'Santiago del Estero', 'La Rioja', 'Chaco', 'Formosa', 'Corrientes', 'Misiones',
] as const

/**
 * Ciudades por provincia para el menú desplegable del formulario (la primera es la capital).
 * Siempre existe la opción "Otra ciudad…" para las que no figuren. Se puede ampliar editando esta lista.
 */
export const CITIES: Record<string, string[]> = {
  'Tucumán': [
    'San Miguel de Tucumán', 'Yerba Buena', 'Tafí Viejo', 'Banda del Río Salí', 'Alderetes', 'Las Talitas', 'Concepción',
    'Monteros', 'Aguilares', 'Famaillá', 'Simoca', 'Lules', 'Bella Vista', 'Juan Bautista Alberdi', 'Graneros', 'La Cocha',
    'Trancas', 'Burruyacú', 'Tafí del Valle', 'Amaicha del Valle', 'San Pedro de Colalao', 'Colombres', 'Santa Ana', 'Leales',
    'Cevil Redondo', 'El Manantial', 'San Pablo', 'Raco', 'El Cadillal', 'Los Nogales', 'Delfín Gallo',
  ],
  'Salta': ['Salta', 'San Ramón de la Nueva Orán', 'Tartagal', 'General Güemes', 'Cafayate', 'Metán', 'Rosario de la Frontera', 'Embarcación', 'Cerrillos', 'San Lorenzo', 'Rosario de Lerma', 'Joaquín V. González', 'Salvador Mazza'],
  'Jujuy': ['San Salvador de Jujuy', 'Palpalá', 'San Pedro de Jujuy', 'Libertador General San Martín', 'Perico', 'El Carmen', 'Humahuaca', 'Tilcara', 'Purmamarca', 'La Quiaca', 'Monterrico', 'Abra Pampa'],
  'Catamarca': ['San Fernando del Valle de Catamarca', 'Valle Viejo', 'Fray Mamerto Esquiú', 'Andalgalá', 'Belén', 'Tinogasta', 'Santa María', 'Recreo', 'Fiambalá'],
  'Santiago del Estero': ['Santiago del Estero', 'La Banda', 'Termas de Río Hondo', 'Frías', 'Añatuya', 'Fernández', 'Monte Quemado', 'Loreto', 'Clodomira'],
  'La Rioja': ['La Rioja', 'Chilecito', 'Aimogasta', 'Chamical', 'Chepes'],
  'Chaco': ['Resistencia', 'Barranqueras', 'Presidencia Roque Sáenz Peña', 'Villa Ángela'],
  'Formosa': ['Formosa', 'Clorinda', 'Pirané'],
  'Corrientes': ['Corrientes', 'Goya', 'Paso de los Libres', 'Curuzú Cuatiá'],
  'Misiones': ['Posadas', 'Oberá', 'Eldorado', 'Puerto Iguazú'],
  'Ciudad Autónoma de Buenos Aires': ['Ciudad Autónoma de Buenos Aires'],
  'Buenos Aires': ['La Plata', 'Mar del Plata', 'Bahía Blanca', 'Tandil', 'Pilar', 'San Isidro', 'Tigre'],
  'Córdoba': ['Córdoba', 'Villa Carlos Paz', 'Río Cuarto', 'Villa María', 'Alta Gracia', 'Cosquín', 'Mina Clavero'],
  'Santa Fe': ['Santa Fe', 'Rosario', 'Rafaela', 'Venado Tuerto', 'Reconquista'],
  'Mendoza': ['Mendoza', 'Godoy Cruz', 'Guaymallén', 'Las Heras', 'Luján de Cuyo', 'Maipú', 'San Rafael'],
  'Entre Ríos': ['Paraná', 'Concordia', 'Gualeguaychú', 'Concepción del Uruguay'],
  'San Juan': ['San Juan', 'Rawson', 'Rivadavia'],
  'San Luis': ['San Luis', 'Villa Mercedes', 'Merlo'],
  'Neuquén': ['Neuquén', 'San Martín de los Andes', 'Plottier', 'Cutral Có'],
  'Río Negro': ['Viedma', 'San Carlos de Bariloche', 'General Roca', 'Cipolletti'],
  'Chubut': ['Rawson', 'Comodoro Rivadavia', 'Trelew', 'Puerto Madryn', 'Esquel'],
  'Santa Cruz': ['Río Gallegos', 'Caleta Olivia', 'El Calafate'],
  'Tierra del Fuego': ['Ushuaia', 'Río Grande'],
  'La Pampa': ['Santa Rosa', 'General Pico'],
}

export const MAX_PHOTOS = 30
