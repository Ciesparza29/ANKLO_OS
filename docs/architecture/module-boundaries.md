# Límites modulares

Los módulos son límites lógicos del monolito; no implican microservicios. Ningún módulo accede directamente a tablas privadas de otro.

| Módulo             | Responsabilidad y datos controlados            | Operaciones principales                 | Dependencias permitidas         | Dependencias prohibidas                    |
| ------------------ | ---------------------------------------------- | --------------------------------------- | ------------------------------- | ------------------------------------------ |
| Identidad y acceso | Identidades, sesiones y asignaciones de acceso | autenticar, autorizar, revocar          | organizaciones, auditoría       | reglas técnicas de campo                   |
| Organizaciones     | empresas, alcance y configuración              | alta, configuración, aislamiento        | identidad, auditoría            | datos privados de otras organizaciones     |
| Obras              | proyectos, frentes y ubicaciones               | planificar, asignar, cerrar             | organizaciones, documentos      | identidad interna o binarios               |
| Documentos         | metadatos, revisiones y estados                | versionar, aprobar, obsoletar           | obras, archivos, auditoría      | sobrescribir aprobados                     |
| Campo y anclajes   | órdenes, lotes y ejecución futura              | registrar, bloquear, inspeccionar       | obras, documentos, calidad      | inventar parámetros técnicos               |
| Calidad            | ITP, inspecciones, ensayos y NCR               | evaluar, disponer, verificar            | campo, documentos, auditoría    | aprobar sin autoridad definida             |
| SST                | riesgos, permisos e incidentes                 | registrar, escalar, preservar           | obras, personal, documentos     | decisiones médicas automatizadas           |
| Inventario         | productos, lotes y movimientos                 | recibir, transferir, consumir           | obras, auditoría                | editar saldos sin movimiento               |
| Activos            | herramientas, custodia y calibración           | asignar, inspeccionar, mantener         | obras, personal                 | modificar inventario directamente          |
| Personal           | perfiles mínimos y competencia                 | asignar, acreditar, restringir          | organizaciones, obras           | exponer datos sensibles                    |
| Gastos             | solicitudes, comprobantes y centros            | registrar, aprobar, revertir            | obras, personal, auditoría      | calcular obligaciones legales rígidas      |
| Reportes           | proyecciones y documentos derivados            | consultar, generar, exportar            | APIs públicas de módulos        | mutar datos fuente                         |
| Notificaciones     | entregas, reconocimiento y escalamiento        | encolar, entregar, reintentar           | eventos públicos                | imponer proveedor o canal                  |
| Auditoría          | `AuditEvent` append-only                       | agregar, consultar, correlacionar       | eventos autorizados de todos    | actualizar o borrar eventos ordinariamente |
| Archivos           | objetos, metadatos y derivados                 | cargar, aislar, preservar               | organizaciones, documentos      | buckets públicos o sobrescribir originales |
| IA futura          | interacciones y revisiones humanas             | recuperar, proponer, registrar revisión | documentos aprobados, auditoría | aprobar o decidir ámbitos críticos         |

Las dependencias concretas se incorporarán por entregas verticales aprobadas; esta tabla no diseña tablas completas.
