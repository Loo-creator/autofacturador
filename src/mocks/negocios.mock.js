export const negociosSeed = [
  {
    id: 'neg-1',
    nombre: 'Negocio 1',
    rfc: 'CFA210101AA1',
    regimen: '626',
    cp: '44100',
    serie: 'CAF',
    folio: 1001,
    csd: 'CSD-MOCK-CAF-01',
    // Certificado digital (3 elementos: .cer, .key y su contraseña)
    certificado: {
      numero: '300190000A2025010100000001',
      emisor: 'CFA210101AA1',
      archivoCer: 'CFA210101AA1.cer',
      archivoKey: 'CFA210101AA1.key',
      passwordDefinida: true,
      inicio: '2025-01-01',
      fin: '2029-01-01',
      estado: 'activa',
    },
    activo: true,
    // Política de facturación de tickets: 30 días naturales, sin exigir el mismo mes de compra.
    politicaFacturacion: { dias: 30, exigeMismoMes: false },
    branding: { logo: '1', nombreComercial: 'Negocio Uno' },
    createdAt: '2025-01-10'
  },
  {
    id: 'neg-2',
    nombre: 'Negocio 2',
    rfc: 'PEL190615BB2',
    regimen: '612',
    cp: '64000',
    serie: 'PAP',
    folio: 2001,
    csd: 'CSD-MOCK-PAP-01',
    certificado: {
      numero: '300190000A2025020500000002',
      emisor: 'PEL190615BB2',
      archivoCer: 'PEL190615BB2.cer',
      archivoKey: 'PEL190615BB2.key',
      passwordDefinida: true,
      inicio: '2025-02-05',
      fin: '2027-06-30',
      estado: 'activa',
    },
    activo: true,
    // Al cierre del mes las ventas se consolidan en factura global y el folio se bloquea.
    politicaFacturacion: { dias: 30, exigeMismoMes: true },
    branding: { logo: '2', nombreComercial: 'Negocio Dos' },
    createdAt: '2025-02-05'
  },
  {
    id: 'neg-3',
    nombre: 'Negocio 3',
    rfc: 'SMS180320CC3',
    regimen: '601',
    cp: '01000',
    serie: 'MED',
    folio: 3001,
    csd: 'CSD-MOCK-MED-01',
    certificado: {
      numero: '300190000A2025031200000003',
      emisor: 'SMS180320CC3',
      archivoCer: 'SMS180320CC3.cer',
      archivoKey: 'SMS180320CC3.key',
      passwordDefinida: false,
      inicio: '2025-03-12',
      fin: '2026-12-01',
      estado: 'activa',
    },
    activo: true,
    politicaFacturacion: { dias: 30, exigeMismoMes: false },
    branding: { logo: '3', nombreComercial: 'Negocio Tres' },
    createdAt: '2025-03-12'
  }
]
