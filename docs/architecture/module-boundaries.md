# Límites modulares

Los módulos son límites lógicos futuros del monolito; esta descripción no los implementa. La interacción inversa nunca crea una dependencia directa: utiliza contratos, puertos definidos por el consumidor, eventos o servicios públicos. Auditoría y notificaciones consumen eventos; los módulos de origen no dependen de sus consumidores.

## Dirección

`web (composición) -> adaptadores -> puertos de dominio -> contratos`

Los módulos de negocio futuros dependen de núcleos estables (`organizaciones`, `obras`) o de contratos públicos, nunca mutuamente. Archivos y auditoría son adaptadores transversales invocados desde la composición.

| Módulo             | Responsabilidad y datos controlados     | Dependencias directas permitidas                              | Interacción inversa sin ciclo                                   | Prohibido                           |
| ------------------ | --------------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------- |
| Identidad y acceso | identidades, sesiones y credenciales    | contratos de organizaciones                                   | la aplicación consulta alcance mediante puerto                  | depender de módulos operativos      |
| Organizaciones     | empresas, alcance y configuración       | ninguna de negocio                                            | identidad recibe identificadores y políticas públicas           | depender de identidad               |
| Obras              | proyectos, frentes y ubicaciones        | organizaciones                                                | documentos referencia `projectId`; obras no consulta documentos | depender de documentos              |
| Documentos         | metadatos, revisiones y estados         | organizaciones, obras, puerto de archivos                     | publica eventos de revisión                                     | depender de campo o calidad         |
| Campo y anclajes   | órdenes, lotes y ejecución futura       | organizaciones, obras, contratos documentales                 | calidad consume eventos/servicios públicos de campo             | depender de calidad                 |
| Calidad            | ITP, inspecciones, ensayos y NCR        | organizaciones, obras, contratos públicos de campo/documentos | emite disposiciones como eventos; campo no importa calidad      | acceder a internals de campo        |
| SST                | riesgos, permisos e incidentes          | organizaciones, obras, contratos de personal/documentos       | preservación se solicita por puerto                             | decisiones médicas automatizadas    |
| Inventario         | productos, lotes y movimientos          | organizaciones, obras                                         | campo solicita consumo mediante servicio público                | editar saldos sin movimiento        |
| Activos            | herramientas, custodia y calibración    | organizaciones, obras, contratos de personal                  | módulos consultan disponibilidad por puerto                     | modificar inventario directamente   |
| Personal           | perfiles mínimos y competencia          | organizaciones                                                | obras conserva referencias, no internals personales             | exponer datos sensibles             |
| Gastos             | solicitudes, comprobantes y centros     | organizaciones, obras, contratos de personal                  | reportes consumen proyecciones                                  | reglas laborales inferidas          |
| Reportes           | proyecciones y derivados                | APIs públicas de módulos                                      | solo lectura; no recibe llamadas de dominio                     | mutar datos fuente                  |
| Notificaciones     | entrega, reconocimiento y escalamiento  | contratos de eventos                                          | consume eventos publicados                                      | dependencia desde módulos emisores  |
| Auditoría          | `AuditEvent` append-only                | contratos de eventos                                          | consume eventos desde composición                               | dependencia desde módulos auditados |
| Archivos           | objetos, metadatos técnicos y derivados | organizaciones                                                | documentos usa un puerto; adaptador se inyecta en web           | depender de documentos              |
| IA futura          | interacciones y revisiones humanas      | contratos documentales aprobados                              | resultados vuelven mediante revisión humana registrada          | aprobar o decidir ámbitos críticos  |

## Justificación de cambios

- Identidad y organizaciones dejan de depender mutuamente: organizaciones es núcleo y la aplicación compone autorización.
- Obras no depende de documentos; documentos referencia la obra y publica cambios.
- Campo no depende de calidad; calidad observa y dispone mediante contratos y eventos.
- Documentos define el puerto de almacenamiento; archivos lo implementa sin importar documentos.
- Auditoría y notificaciones consumen eventos, evitando dependencias desde cada módulo hacia servicios transversales.
