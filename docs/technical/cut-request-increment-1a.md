# Nota técnica — Solicitud manual de corte, Incremento 1A

**Alcance:** registro, listado, detalle, envío y cancelación de solicitudes. No
incluye planificación, ejecución, reservas, movimientos, remanentes, merma,
costos, conciliación, Migo ni optimización.

## Diseño

- `contracts` publica los contratos Zod y DTO; `domain` protege invariantes y
  expone puertos de aplicación; `db` implementa el puerto mediante Prisma;
  `web` compone identidad, capacidades, persistencia y HTTP.
- Los únicos estados son `DRAFT`, `SUBMITTED` y `CANCELLED`. Enviar y cancelar
  usan versión esperada y condición de estado dentro de una transacción.
- `client_operation_id` es único por organización. Una repetición devuelve el
  resultado ya asociado sin crear una segunda transición o auditoría.
- Creación, transición, registro de operación y `AuditEvent` ocurren en la misma
  transacción. `AuditEvent` no tiene interfaces ordinarias de actualización o
  borrado y la migración bloquea esas operaciones mediante reglas PostgreSQL.
- Todas las consultas filtran por `organization_id`; las cuatro tablas activan
  y fuerzan RLS. Cada transacción establece `app.organization_id` localmente.
- Prisma 7.8.0 usa `@prisma/adapter-pg` 7.8.0 y `pg` 8.16.3. El singleton se
  reutiliza durante recarga de desarrollo. En producción se construye una
  instancia por proceso; el ciclo de vida del proceso debe desconectarla al
  cerrar. No se fijaron tamaños ni timeouts del pool.

## Configuración temporal

No existe todavía identidad ni catálogo de unidades aprobados. Para desarrollo,
el servidor obtiene un actor ficticio, tenant, capacidades y unidades desde las
variables `ANKLO_DEV_*` y `ANKLO_CUT_REQUEST_UNITS`. Producción falla cerrada
mientras no exista integración de identidad. La tolerancia queda deshabilitada.
Los códigos configurados son una abstracción temporal y no un catálogo maestro.

`DATABASE_URL` es obligatoria, se valida por protocolo y nunca se devuelve al
cliente ni se registra. `.env.example` contiene exclusivamente credenciales y
datos ficticios de desarrollo local.

## Trazabilidad

La entrega cubre `FR-CUT-004` y los aspectos aplicables de `FR-CUT-010`, además
de `AC-MC-001`, `AC-MC-002`, `AC-MC-003`, `AC-MC-020`, `AC-MC-022`,
`AC-MC-023`, `AC-MC-024` y `AC-MC-027`. No declara cubiertos criterios que
dependen de planificación, ejecución, recepción o conciliación.

## Pendientes y riesgos

- aprobar proveedor de identidad, membresías y contexto de actuación;
- aprobar catálogo, autoridad, precisión, escala y redondeo de unidades;
- ejecutar la aplicación con un rol PostgreSQL sin privilegio `BYPASSRLS`;
- definir pool, timeouts y cierre ordenado según el despliegue;
- sustituir el contexto ficticio de desarrollo antes de producción.
