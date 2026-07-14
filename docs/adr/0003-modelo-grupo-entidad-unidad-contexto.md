# ADR 0003: modelo de grupo, entidad, unidad y contexto de actuación

- **Identificador:** ADR-0003
- **Estado:** PROPUESTO
- **Fecha:** 13 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade, pendiente de ratificación documental

> Este ADR contiene una decisión arquitectónica propuesta basada en aprobaciones funcionales provisionales. No constituye aprobación jurídica, societaria, contable, laboral, tributaria ni técnica definitiva.

## Contexto

ANKLO-OS debe operar para Distripernos, ANKLO y futuras entidades relacionadas sin confundir grupo empresarial, entidad legal y unidad operativa. Actualmente Distripernos es la entidad legal: cotiza, contrata, suministra, factura y cobra. ANKLO es una unidad operativa de Distripernos y ejecuta servicios. Se prevé que ANKLO pueda constituirse como S.A.S. independiente, pero todavía no existen fecha legal, identificador ni relaciones intercompañía confirmados.

La arquitectura base solo anticipa una noción genérica de organización. La reorientación exige un modelo que preserve la atribución histórica, permita a una persona actuar en más de una entidad y no convierta la pertenencia al grupo en autorización implícita.

## Problema

Una entidad genérica `Organization` no distingue adecuadamente:

- el límite superior de tenencia;
- la persona jurídica que emite o responde por un documento;
- la unidad operativa que ejecuta una actividad;
- la pertenencia de una persona;
- la autorización concreta que recibe;
- el contexto bajo el que actúa;
- una delegación temporal;
- la transición de una unidad a una entidad legal futura.

Sin estas diferencias, una operación podría atribuirse a la entidad equivocada, un usuario podría obtener acceso transversal por mera pertenencia al grupo y la futura constitución de ANKLO podría inducir una reescritura histórica inválida.

## Alcance

Este ADR propone límites y relaciones conceptuales para:

- `BusinessGroup`;
- `LegalEntity`;
- `BusinessUnit`;
- `OrganizationMembership`;
- `RoleAssignment`;
- `ActingContext`;
- `TemporaryDelegation`;
- autorización por entidad legal y unidad operativa;
- auditoría de selección y cambio de contexto;
- reportes consolidados de grupo;
- transición futura de ANKLO a una entidad legal independiente;
- preservación del contexto histórico.

## Fuera de alcance

- Diseñar tablas, claves, migraciones o modelos Prisma.
- Determinar la estructura societaria definitiva del grupo.
- Afirmar la constitución o fecha efectiva de ANKLO S.A.S.
- Definir contratos, precios o tratamiento contable intercompañía.
- Determinar responsables jurídicos definitivos de documentos.
- Elegir proveedor de identidad, MFA o política completa de cuentas.
- Definir reglas laborales o tributarias.

## Fuerzas y criterios de decisión

- Aislamiento por defecto dentro de un mismo grupo.
- Atribución legal y operativa inequívoca.
- Mínimo privilegio y denegación por defecto.
- Capacidad de una persona para actuar en varios alcances autorizados.
- Preservación histórica y vigencias efectivas.
- Delegaciones limitadas, revocables y auditables.
- Reportes consolidados sin acceso transversal implícito.
- Compatibilidad con el monolito modular y puertos tecnológicamente neutrales.
- Posibilidad de incorporar futuras entidades sin reescribir dominios operativos.

## Decisión propuesta

### Límite superior de tenencia

`BusinessGroup` será el límite superior de tenant. Agrupa entidades relacionadas bajo un límite de aislamiento técnico, pero no otorga por sí solo acceso a sus datos. La arquitectura debe conservar el identificador de grupo en el contexto de autorización y evitar cruces con otros grupos.

### Entidad legal y unidad operativa

`LegalEntity` representa a la persona jurídica a la que se atribuyen contratos, documentos, propiedad, responsabilidades y registros oficiales cuando corresponda. `BusinessUnit` representa una unidad operativa perteneciente a una entidad legal durante una vigencia determinada.

Actualmente, ANKLO se representará conceptualmente como `BusinessUnit` de la `LegalEntity` Distripernos. Si ANKLO se constituye jurídicamente, se creará una nueva `LegalEntity`; no se transformará retroactivamente la unidad anterior ni se reasignarán automáticamente sus operaciones históricas.

### Pertenencia, rol y autorización

`OrganizationMembership` registra la relación de una identidad con un grupo, entidad o unidad dentro de una vigencia. La pertenencia no equivale a autorización.

`RoleAssignment` concede capacidades explícitas para un alcance organizacional y temporal. Los permisos efectivos resultan de la intersección entre identidad autenticada, membresía vigente, asignación vigente, entidad legal, unidad operativa, acción, condición del registro y, cuando aplique, delegación.

### Contexto de actuación

`ActingContext` identifica, como mínimo conceptual, el grupo, entidad legal, unidad operativa y rol bajo los que una persona ejecuta una acción. Debe seleccionarse o resolverse explícitamente antes de una operación relevante. Cambiar de contexto no amplía permisos y debe dejar auditoría.

Toda operación de negocio conserva el contexto con el que se creó, aunque después cambien membresías, roles, denominaciones o estructura organizacional.

### Delegación temporal

`TemporaryDelegation` amplía una capacidad concreta de forma excepcional. Debe registrar otorgante, receptor, alcance, motivo, inicio, vencimiento, estado y revocación. Nunca implica acceso general al grupo y no puede exceder la autoridad delegable del otorgante.

### Consolidación

El dueño podrá recibir un rol con alcance de grupo. Los reportes consolidados requieren permiso explícito y conservan el contexto de consulta, filtros organizacionales, actor y finalidad. No se implementará consolidación mediante omisión de filtros de entidad.

### Transición futura de ANKLO

La futura `LegalEntity` ANKLO tendrá un identificador y vigencia nuevos. Los documentos emitidos por Distripernos y las operaciones ejecutadas bajo su unidad ANKLO conservan ese contexto. Operaciones abiertas solo podrán transferirse mediante una decisión registrada por tipo de operación, con referencias entre origen y destino; no mediante actualización masiva silenciosa.

Las futuras relaciones comerciales Distripernos–ANKLO se representarán como relaciones entre entidades y operaciones documentadas, no como acceso directo de un módulo a tablas de otra entidad.

## Invariantes

- Pertenecer a `BusinessGroup` no concede acceso automático a todas sus entidades.
- Toda operación conserva la `LegalEntity` y `BusinessUnit` bajo las que fue creada.
- `ActingContext` es explícito, válido para la acción y auditable.
- Cambiar de contexto no eleva privilegios.
- Una membresía no sustituye una asignación de rol.
- Un reporte consolidado requiere permiso de grupo explícito.
- Una delegación registra otorgante, receptor, alcance, motivo, inicio, vencimiento y revocación.
- Una delegación vencida o revocada no autoriza nuevas acciones.
- La futura ANKLO S.A.S. no modifica la identidad organizacional histórica de operaciones anteriores.
- Un documento conserva la entidad emisora original aunque cambie la estructura del grupo.
- Las correcciones de contexto crean revisión o evento; no sobrescriben silenciosamente registros aprobados.

## Límites de responsabilidad

- El dominio organizacional controla relaciones, vigencias y contexto; no autentica credenciales.
- Identidad y acceso autentica la persona y evalúa capacidades mediante contratos públicos del dominio organizacional.
- Cada dominio operativo valida el `ActingContext` recibido y conserva su referencia; no infiere entidad por la sesión, la URL o el cliente.
- Auditoría registra cambios y acciones relevantes, pero no concede permisos.
- Reportes consumen proyecciones autorizadas; no evitan controles de entidad mediante acceso directo a persistencia.
- El sistema no determina por sí mismo personalidad jurídica, representación legal ni efecto contractual.

## Alternativas consideradas

### Una sola entidad `Organization`

Rechazada porque mezcla tenant, persona jurídica, unidad operativa y alcance de autorización, y dificulta la transición histórica de ANKLO.

### Un tenant por cada entidad legal

Rechazada como regla general porque impediría relaciones y consolidación controladas dentro del grupo, duplicaría identidades y trasladaría complejidad interempresa a integraciones artificiales. Podría revisarse para una entidad que exija aislamiento independiente.

### Roles globales sin contexto de actuación

Rechazada porque una persona que trabaja para varias entidades no podría demostrar bajo cuál actuó y aumentaría el riesgo de permisos transversales.

### Convertir la unidad ANKLO en entidad legal sobre el mismo identificador

Rechazada porque reatribuiría operaciones históricas y borraría la diferencia entre la unidad anterior y la persona jurídica futura.

### Copiar usuarios y datos al constituir la nueva entidad

Rechazada como transición predeterminada. La transferencia requiere decisión, autoridad, trazabilidad y alcance por operación.

## Consecuencias positivas

- Atribución consistente de acciones y documentos.
- Aislamiento explícito dentro del grupo.
- Soporte para personas con múltiples responsabilidades sin cuentas duplicadas.
- Delegaciones limitadas y revisables.
- Consolidación controlada para el dueño.
- Transición societaria sin reescritura histórica.
- Base común para inventario, ventas, corte, campo, gastos y reportes.

## Consecuencias negativas

- Mayor complejidad que un campo genérico de organización.
- Más casos de autorización y pruebas de acceso cruzado.
- La interfaz deberá hacer visible el contexto activo sin inducir errores.
- Las consultas y eventos deberán transportar referencias organizacionales coherentes.
- Las operaciones abiertas durante la constitución futura requerirán tratamiento explícito.

## Riesgos

- Confundir `BusinessGroup` con autorización de grupo.
- Permitir que el contexto enviado por el cliente sustituya la autorización del servidor.
- Crear delegaciones amplias o sin vencimiento.
- Cambiar una unidad por una entidad mediante actualización retroactiva.
- Exponer información consolidada sin finalidad o permiso suficiente.
- Mantener membresías o roles después de terminar su vigencia.
- Atribuir efectos jurídicos a una estructura conceptual no ratificada.

## Preguntas abiertas

| Clasificación                       | Pregunta                                                                                                           | Impacto                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Pregunta bloqueante para aceptación | ¿Qué identificador y denominación tendrá el `BusinessGroup` y qué entidades iniciales pertenecen formalmente a él? | Impide ratificar la población organizacional inicial.                         |
| Evidencia requerida                 | ¿Qué documentos confirman que Distripernos es la entidad legal actual y ANKLO su unidad operativa?                 | Sustenta la configuración inicial sin afirmar estructura jurídica no probada. |
| Evidencia requerida                 | ¿Cuándo y con qué identificadores se constituirá ANKLO S.A.S.?                                                     | Necesario para crear la entidad futura, no para proponer el patrón.           |
| Decisión futura no bloqueante       | ¿Qué operaciones abiertas se transferirán a la futura entidad?                                                     | Bloquea la transición, no la aceptación del modelo histórico.                 |
| Pregunta bloqueante para aceptación | ¿Qué matriz acto–entidad–unidad–documento ratificará Christian para el estado actual?                              | Define atribución mínima verificable.                                         |
| Decisión futura no bloqueante       | ¿Qué contratos, precios y responsabilidades intercompañía se aplicarán?                                            | Pertenece a gobierno comercial, contable y jurídico posterior.                |
| Pregunta de implementación          | ¿Qué proveedor de identidad y MFA se utilizarán?                                                                   | Bloquea implementación de acceso, no el límite conceptual.                    |

## Supuestos

- ANKLO sigue siendo una unidad operativa de Distripernos hasta que exista evidencia legal de una nueva entidad.
- No existe todavía una fecha legal ni un identificador confirmado para ANKLO S.A.S.
- Una persona podrá requerir actuación en más de una entidad o unidad.
- El dueño necesita consolidación de grupo, pero esa necesidad no implica acceso para los demás miembros.

## Decisiones configurables

- Roles y capacidades asignables por entidad y unidad.
- Precisión y audiencia de reportes consolidados.
- Duración, alcance delegable y condiciones de revocación.
- Contexto predeterminado de interfaz, sin omitir validación explícita.
- Políticas de inactividad o selección de contexto.

Estas configuraciones no pueden eliminar las invariantes de aislamiento, vigencia y trazabilidad.

## Impacto sobre otros dominios

- Todos los ADR posteriores consumen `ActingContext` y referencias organizacionales.
- [ADR 0004](0004-coexistencia-migo-y-autoridad-de-datos.md) atribuye fuentes oficiales y tareas Migo a la entidad correspondiente.
- [ADR 0005](0005-inventario-operativo-atp-y-conciliacion.md) separa stock por entidad y contexto.
- [ADR 0006](0006-cotizaciones-precios-abastecimiento-y-reservas.md) evalúa visibilidad, precio y aprobación dentro del contexto.
- [ADR 0007](0007-piezas-remanentes-y-optimizacion-de-cortes.md) conserva propiedad y unidad operativa de piezas.
- [ADR 0008](0008-inventario-externo-servipernos-y-prestamos.md) distingue contraparte, propiedad externa y entidad participante.
- Obras, personal, gastos, calidad y SST deberán conservar entidad y unidad sin depender de internals organizacionales.

## Impacto de seguridad y auditoría

- Autorización del servidor con denegación por defecto.
- Pruebas negativas entre grupos, entidades, unidades y contextos.
- Registro de actor, `ActingContext`, acción, objeto, resultado y correlación.
- Auditoría de inicio, cambio y cierre de contexto en acciones sensibles.
- Auditoría de creación, uso, revocación y vencimiento de delegaciones.
- Protección de reportes y exportaciones consolidados como operaciones sensibles.
- No confiar en identificadores organizacionales enviados por el cliente sin comprobar membresía y rol.

## Estrategia de transición

1. Ratificar el mapa organizacional actual sin crear aún la entidad futura.
2. Definir la matriz mínima de actos, documentos, entidad y unidad actuales.
3. Diseñar contratos conceptuales de contexto y autorización antes del modelo lógico.
4. Incorporar la nueva `LegalEntity` únicamente al existir evidencia constitutiva y fecha efectiva.
5. Clasificar operaciones abiertas por tipo y decidir si permanecen, se cierran o se relacionan con una nueva operación.
6. Mantener documentos y operaciones históricas bajo su contexto original.

Esta estrategia no autoriza migraciones ni cambios de datos en la etapa actual.

## Condiciones para pasar a ACEPTADO

- Israel revisa y aprueba funcionalmente los límites `BusinessGroup`, `LegalEntity`, `BusinessUnit`, membresía, rol, contexto y delegación.
- Christian ratifica documentalmente que ANKLO es actualmente una unidad de Distripernos y que una futura entidad no reemplazará operaciones históricas.
- Se incorpora evidencia societaria/fiscal disponible que identifica a Distripernos y documenta el carácter actual de ANKLO, sin exigir aún documentos de una entidad futura inexistente.
- Se cierra la pregunta `ADR-Q-001` del registro de pendientes mediante una lista ratificada de grupo y entidades iniciales.
- Se incorpora una matriz actual `acto -> entidad legal -> unidad -> documento -> autoridad` para cotizar, contratar, suministrar, ejecutar, facturar y cobrar.
- Se ejecuta y documenta una revisión de escenarios que demuestre: acceso denegado por mera pertenencia al grupo; cambio de contexto sin elevación; delegación vencida rechazada; reporte consolidado sin permiso rechazado; documento histórico no reatribuido.
- Se documenta qué preguntas quedan deliberadamente abiertas para la futura constitución y por qué no alteran la decisión propuesta.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-003`, `PROD-004` y `PROD-005`.
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md), `ADR-Q-001`, `LOG-Q-007`, `LOG-Q-008`, `IMP-Q-004` e `IMP-Q-005`.
- [Mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md).
- [ADR 0001](0001-arquitectura-base.md).
- [ADR 0002](0002-puertos-y-adaptadores.md).
- [Límites modulares](../architecture/module-boundaries.md).
- [Auditoría documental previa](../product/discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md).

## Relaciones con otros ADR

- Complementa [ADR 0001](0001-arquitectura-base.md) al precisar el significado organizacional que no debe quedar reducido a `organization_id`.
- Aplica [ADR 0002](0002-puertos-y-adaptadores.md): los consumidores acceden a contexto y autorización mediante contratos públicos, no internals.
- Es fundacional para ADR 0004–0008.
- No acepta ni reemplaza ninguna decisión de esos ADR mientras permanezcan propuestos.
