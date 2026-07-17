# Nota técnica — Incremento 1B: trazabilidad visible y completitud del detalle

**Estado:** propuesta técnica para revisión de Israel
**Tipo de incremento:** lectura y visualización exclusivamente
**Dependencia:** Incremento 1A de solicitudes manuales de corte

## 1. Propósito

Especificar, antes de implementar, cómo completar el detalle de una solicitud de
corte con su historial visible y el motivo de cancelación, sin añadir comandos,
estados, efectos operativos ni cambios de persistencia previstos.

La aprobación funcional de Israel cubre el alcance de este incremento. No
equivale todavía a aprobación formal de esta nota, del PRD o de los ADR 0007 y
0009, que conservan su estado **PROPUESTO**.

## 2. Contexto

El Incremento 1A permite crear, listar, consultar, enviar y cancelar solicitudes
con estados `DRAFT`, `SUBMITTED` y `CANCELLED`. Creación y transiciones producen
`AuditEvent` append-only dentro de la misma transacción. El motivo de cancelación
ya se guarda en el evento, pero el servicio de lectura, el API y el detalle no
exponen historial ni motivo.

La identidad actual de desarrollo se obtiene de variables ficticias. Producción
falla cerrada porque todavía no existe integración de identidad real.

## 3. Alcance

- contratos mínimos de salida para historial;
- capacidad separada `cut_request:read_history`;
- puerto de dominio para leer eventos de una solicitud;
- consulta del adaptador PostgreSQL/Prisma bajo tenant;
- autorización de lectura básica e historial;
- API de lectura de historial;
- sección de historial en el detalle;
- pruebas de contrato, autorización, aislamiento, persistencia, API e interfaz;
- documentación final del incremento implementado.

## 4. Decisiones aprobadas

- `cut_request:read` permite leer la solicitud básica.
- `cut_request:read_history` permite leer historial y motivo de cancelación, pero
  no sustituye `cut_request:read`; para historial se requieren ambas.
- `actorReference` se proyecta desde la referencia técnica ya persistida; es una
  referencia controlada, no una identidad humana verificada.
- No se inventan nombres ni se muestra el UUID completo como elemento principal.
- No se exponen snapshots `before`/`after` completos.
- No se agregan estados, transiciones ni comandos de escritura.
- El alcance es informativo, sin inventario u otros efectos físicos.
- No se prevé migración porque los datos requeridos ya existen.
- Producción continúa bloqueada sin identidad real.

## 5. Estado actual

`AuditEvent` conserva `organization_id`, `actor_id`, tipo e identificador de
entidad, acción, fecha de ocurrencia, `before`, `after`, `reason` y
`correlation_id`. La tabla activa y fuerza RLS, filtra por el contexto local de
organización y bloquea actualización y borrado ordinarios mediante reglas
PostgreSQL.

El puerto actual de solicitudes solo crea, busca, lista, busca resultados
idempotentes y transiciona. El DTO de solicitud no contiene historial. El
endpoint de detalle devuelve únicamente la solicitud y la interfaz solo muestra
cabecera, líneas y acciones vigentes. La cancelación registra motivo en
persistencia, pero este no vuelve por el camino de lectura.

## 6. Arquitectura propuesta

La dirección permanece `web -> {domain, db, contracts}`,
`db -> {domain, contracts}` y `domain -> contracts`.

- `contracts` define el esquema mínimo y los tipos de lectura del historial.
- `domain` define el puerto de historial y aplica autorización/orquestación.
- `db` consulta `AuditEvent` bajo el tenant activo y proyecta solo los campos
  permitidos.
- `apps/web` compone dependencias, expone HTTP y presenta el resultado.

La proyección debe ocurrir antes de cruzar la frontera pública; el consumidor no
recibe el modelo Prisma ni JSON de snapshots. La lectura no genera eventos de
auditoría adicionales ni cambia la versión de la solicitud.

## 7. Contratos previstos

El contrato público previsto representa una colección ordenada de entradas de
historial. Cada entrada contiene como máximo:

- identificador técnico del evento, si se requiere para clave estable;
- acción del conjunto vigente del Incremento 1A;
- fecha de ocurrencia en formato inequívoco;
- `actorReference` controlada;
- motivo únicamente cuando la acción y autorización lo permiten.

El esquema debe ser estricto. `actorReference` se proyecta desde la referencia
técnica ya persistida y no constituye nombre, identidad civil, identidad humana
verificada ni confirmación de autoría humana. No se inventan nombres ni se
enriquece mediante una identidad inexistente. El contrato no incluye `actorId`
crudo como identidad humana, `before`, `after`, `correlationId`, organización u
otros internals salvo decisión posterior documentada. Los nombres finales del
DTO y la forma exacta de representación pública quedan pendientes del diseño de
implementación y deben respetar la minimización y el contrato aprobado sin
ampliar esta semántica.

## 8. Lectura de auditoría

El puerto previsto recibe organización e identificador de solicitud y devuelve
los eventos de `entity_type = CUT_REQUEST` y `entity_id` correspondiente. La
consulta debe incluir explícitamente `organization_id`, ejecutarse dentro de la
transacción corta que establece `app.organization_id` y ordenar por
`occurred_at` con un desempate estable, por ejemplo el identificador del evento.

Para una solicitud creada mediante el flujo transaccional del Incremento 1A, la
ausencia total de eventos contradice el invariante documentado de persistencia
atómica entre la solicitud y su evento de creación. Debe detectarse y tratarse
como una inconsistencia controlada, sin exposición de datos internos. No se
reconstruyen eventos desde el estado actual. El motivo se toma del evento; no se
deriva de `after`, notas u observaciones.

Una solicitud inexistente, una solicitud de otra organización o un actor sin
autorización conservan un comportamiento no revelador. Esos casos no se
confunden con la inconsistencia de integridad de una solicitud válida dentro de
la organización y el alcance autorizados.

## 9. Seguridad

La autorización se valida en servidor:

1. `cut_request:read` para acceder a la solicitud;
2. `cut_request:read_history` adicional para acceder a historial y motivo.

La interfaz puede ocultar la sección cuando falta la capacidad, pero esa conducta
no sustituye la denegación del servidor. Los errores no deben revelar existencia,
acciones, actor o motivo de solicitudes fuera del alcance. El contrato aplica
minimización y no entrega snapshots completos.

`actorReference` debe presentarse con lenguaje que indique referencia técnica y
no como autor humano confirmado. Un mapeo futuro a persona o cuenta verificadas
dependerá del proveedor de identidad, finalidad, permisos y decisión
documentada; no se resuelve en 1B. La forma visual exacta permanece como decisión
de implementación pendiente y debe respetar la minimización y el contrato
aprobado.

## 10. Aislamiento

Servicio y adaptador mantienen `organization_id` en todas las firmas y filtros.
RLS continúa como segunda barrera y la consulta usa el mismo contexto local por
transacción del Incremento 1A. Las pruebas negativas deben cubrir solicitud de
otra organización, evento de otra organización con igual tipo y errores sin
filtración de existencia.

## 11. Ausencia de migración prevista

No se prevé modificar `schema.prisma` ni crear migración. La inspección confirma
que `AuditEvent` contiene acción, fecha, actor técnico y motivo, además de claves
de entidad y organización. Si durante implementación aparece una necesidad de
dato no disponible, el incremento se detiene para revisión documental; no se
añade una columna ni se cambia una invariante por inferencia.

## 12. API prevista

La API debe mantener separadas la lectura básica y la lectura protegida de
historial, ya sea mediante un recurso de historial dedicado o una composición
equivalente que permita aplicar autorización y contratos independientes. La
elección de ruta concreta se cierra durante diseño de implementación.

La respuesta de historial será mínima, validada y sin snapshots. Debe distinguir
denegación, ausencia dentro del propio tenant y fallos internos sin revelar datos
de otras organizaciones. Solo se admiten métodos de lectura para el nuevo
recurso; no se añaden endpoints de revisión, aprobación, rechazo o reapertura.

## 13. Interfaz prevista

El detalle mantiene cabecera y líneas actuales. Para actores autorizados añade
una sección de historial accesible y legible con acción, fecha, referencia
técnica del actor y motivo de cancelación cuando corresponda.

La referencia del actor será secundaria y rotulada como técnica. No se inventan
nombres y el UUID completo no se convierte en título o dato principal. Para un
actor sin `cut_request:read_history`, historial y motivo no se renderizan ni se
obtienen mediante una respuesta básica sobreincluyente. La interfaz no añade
acciones operativas.

## 14. Pruebas previstas

- contratos estrictos y rechazo de campos inesperados;
- lectura básica sin campos restringidos;
- autorización con ambas capacidades y combinaciones negativas;
- motivo visible solo con autorización de historial;
- orden cronológico estable y ausencia de duplicados;
- proyección sin `before`/`after` completos;
- referencia técnica sin afirmación de identidad humana;
- ausencia total de eventos en una solicitud válida tratada como inconsistencia
  controlada sin exposición de datos internos;
- aislamiento de organización en servicio, consulta y RLS;
- lectura sin cambios de estado, versión, operaciones o auditoría;
- API para éxito, denegación, ausencia y error controlado;
- interfaz accesible con historial, motivo y estado de carga/error;
- comprobación de que no hay migración, nuevos estados ni comandos.

Los criterios gobernantes son `AC-CUT-1B-001`–`AC-CUT-1B-012`.

## 15. Riesgos

- Exponer snapshots puede filtrar datos no necesarios o futuros campos sensibles.
- Presentar `actorId` como persona puede crear atribución falsa.
- Autorizar historial solo desde la interfaz puede permitir acceso directo al API.
- Una consulta sin organización o sin RLS puede mezclar tenants.
- Acoplar el DTO a Prisma puede convertir internals en contrato estable.
- Registrar auditoría por cada lectura puede crear ruido y crecimiento no
  aprobado; 1B no lo requiere.
- Las referencias técnicas ficticias no permiten atribución productiva real.

## 16. Fuera de alcance

- nuevos estados o transiciones posteriores a `SUBMITTED`;
- revisión, aprobación, rechazo, bloqueo o reapertura;
- asignación, planificación o ejecución;
- reservas, inventario, movimientos o efectos físicos;
- costos, conciliación o integración con Migo;
- optimizador de cortes;
- `committedAt` o cambios al significado de `requiredAt`;
- catálogos productivos, precisión, escala, conversión o redondeo;
- cambios a Prisma o migraciones;
- identidad productiva o verificación de identidad humana.

`MM` permanece como configuración temporal ficticia y prioridad como texto.

## 17. Criterios de cierre

- Israel revisa el entregable sin que esa revisión se atribuya anticipadamente.
- Se cumplen `AC-CUT-1B-001`–`AC-CUT-1B-012` con evidencia.
- `cut_request:read` y `cut_request:read_history` permanecen separadas.
- El historial y el motivo solo se entregan con ambas capacidades.
- La proyección no expone snapshots completos ni afirma identidad humana.
- Las consultas conservan aislamiento por organización y compatibilidad con RLS.
- No se agregan estados, transiciones, comandos o efectos operativos.
- No se modifica Prisma ni se crea migración.
- Producción sigue fallando cerrada mientras falte identidad real.
- Documentación, pruebas y verificación del repositorio quedan actualizadas en el
  futuro incremento de implementación.
