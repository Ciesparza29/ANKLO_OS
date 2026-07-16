# Registro de decisiones de producto ANKLO-OS

**Versión:** 2.0\
**Fecha de consolidación:** 13 de julio de 2026\
**Estado documental:** base funcional para preparar ADR, Bosquejo v2.0 y PRD; no constituye aprobación jurídica, societaria, tributaria, contable, laboral ni técnica.\
**Autoridad disponible:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian cuando se indica.\
**Regla de interpretación:** contrato, planos, especificaciones, evaluaciones, MPII y normativa aplicables prevalecen dentro de su ámbito.

## 1. Propósito y control

Este registro consolida decisiones por significado, conserva identificadores estables y separa decisiones aprobadas, supuestos temporales y asuntos pendientes. No modifica los documentos canónicos v1.1 ni sustituye futuros ADR, el Bosquejo v2.0 o el PRD.

Estados permitidos:

- `APROBADA`: decisión funcional adoptada para orientar los siguientes documentos. No implica aprobación legal cuando la autoridad formal no está documentada.
- `SUPUESTO_TEMPORAL`: hipótesis operable que debe revisarse al obtener evidencia.
- `PENDIENTE`: decisión aún no tomada.
- `SUPERADA`: decisión que dejó de gobernar por otra decisión posterior identificada.

Fuentes relacionadas:

- [Auditoría documental previa](../discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md)
- [Registro de contradicciones v1.0](../discovery/Registro_Contradicciones_v1.0.md)
- [Matriz de fuentes y requisitos v1.0](../discovery/Matriz_Fuentes_Requisitos_v1.0.md)
- [Formulario de decisiones bloqueantes v1.0](../discovery/Formulario_Decisiones_Bloqueantes_v1.0.md)
- [Bosquejo de arquitectura v1.1](../../../ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md)
- [Manual Maestro v1.1](../../../ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md)
- [Resumen Maestro v1.1](../../../ANKLO_Paquete_Documental_v1.0/Resumen_Maestro_Proyecto_ANKLO_v1.1.md)
- [ADR 0001](../../adr/0001-arquitectura-base.md)
- [ADR 0002](../../adr/0002-puertos-y-adaptadores.md)

## 2. Decisiones consolidadas

### PROD-001 — Denominación oficial ANKLO

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** producto, documentación, interfaces, reportes y comunicaciones.
- **Decisión:** la denominación oficial se escribe siempre `ANKLO`.
- **Justificación:** eliminar variantes que fragmentan identidad, búsqueda y trazabilidad.
- **Consecuencias:** catálogos, etiquetas y documentos futuros deberán usar la denominación oficial; las citas históricas se conservan sin convertirlas en nomenclatura vigente.
- **Excepciones:** transcripciones o nombres externos se preservan fielmente cuando su alteración afecte la evidencia.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y notas de reunión.
- **Documentos afectados:** futuro Bosquejo v2.0, PRD, ADR y diseño de interfaz.
- **Requisitos derivados:** validación terminológica en documentación nueva y catálogos controlados.
- **Criterio de revisión futura:** solo una decisión corporativa documentada puede cambiar la denominación.

### PROD-002 — Definición y límite inicial del producto

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** visión de producto y alcance inicial.
- **Decisión:** ANKLO-OS será una plataforma operativa y comercial multiempresa complementaria a Migo; no será inicialmente un ERP contable completo ni sustituirá totalmente a Migo.
- **Justificación:** concentrar el producto en coordinación comercial, inventario operativo, taller y operación de campo sin duplicar capacidades oficiales vigentes.
- **Consecuencias:** quedan fuera de alcance inicial contabilidad propia, facturación electrónica propia, cumplimiento tributario, nómina legal y conciliación bancaria completa.
- **Excepciones:** ANKLO-OS podrá conservar referencias, estados operativos y tareas necesarias para conciliar operaciones que se registren oficialmente en Migo.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** Bosquejo v2.0, Resumen v2.0, ADR futuros, PRD y backlog futuro.
- **Requisitos derivados:** fronteras explícitas por proceso y prohibición de emitir una segunda factura tributaria.
- **Criterio de revisión futura:** revisar al cierre de 2026 o ante una decisión formal de sustitución certificada de Migo.

### PROD-003 — Situación actual y transición futura de ANKLO

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** estructura empresarial y atribución histórica.
- **Decisión:** ANKLO es actualmente una unidad operativa de Distripernos. Se prevé una ANKLO S.A.S. independiente, todavía sin fecha legal ni identificador confirmado. La futura entidad no reemplazará retroactivamente a la unidad actual.
- **Justificación:** evitar atribuir contratos, inventario, personas o evidencia a una entidad inexistente o cambiar su titular histórico.
- **Consecuencias:** la constitución futura deberá crear una nueva entidad con vigencia; las operaciones anteriores conservarán la entidad y unidad con las que ocurrieron.
- **Excepciones:** la transición de operaciones abiertas requerirá una decisión expresa por tipo de operación.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación societaria y documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y discovery societario.
- **Documentos afectados:** ADR organizacional futuro, Bosquejo v2.0, PRD y modelo lógico futuro.
- **Requisitos derivados:** vigencias efectivas, historial no retroactivo y referencias separadas a entidad legal y unidad operativa.
- **Criterio de revisión futura:** revisar al existir documentos constitutivos, identificadores y fecha efectiva de ANKLO S.A.S.

### PROD-004 — Modelo empresarial y límite de tenencia

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** identidad organizacional, tenencia y autorización.
- **Decisión:** modelar `BusinessGroup`, `LegalEntity`, `BusinessUnit`, `OrganizationMembership`, `ActingContext`, `RoleAssignment` y `TemporaryDelegation`. `BusinessGroup` será el límite superior de tenencia.
- **Justificación:** representar el grupo, las entidades y las unidades sin tratarlas como sinónimos.
- **Consecuencias:** todo dato de negocio tendrá alcance empresarial explícito; la relación entre grupo, entidad y unidad deberá conservar vigencia e historia.
- **Excepciones:** ningún concepto crea por sí solo permiso de acceso.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR organizacional futuro, mapa de dominios, Bosquejo v2.0 y modelo lógico futuro.
- **Requisitos derivados:** identificadores estables, vigencias y pruebas de aislamiento entre alcances.
- **Criterio de revisión futura:** revisar antes de aprobar el ADR organizacional si aparecen entidades fuera del grupo previsto.

### PROD-005 — Acceso explícito y contexto de actuación

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** permisos, auditoría y reportes consolidados.
- **Decisión:** el acceso no se concede automáticamente a todo el grupo. Se asigna explícitamente por entidad legal, unidad operativa, rol y contexto. El dueño podrá recibir alcance de grupo; los reportes consolidados requerirán permiso explícito; toda acción relevante conservará el `ActingContext`.
- **Justificación:** prevenir acceso cruzado implícito y atribuir cada actuación al contexto usado.
- **Consecuencias:** seleccionar contexto no aumenta privilegios; exportaciones, aprobaciones y reportes deberán registrar actor y contexto.
- **Excepciones:** una `TemporaryDelegation` explícita, vigente, limitada y auditada podrá ampliar una capacidad concreta.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y controles multiempresa previos.
- **Documentos afectados:** ADR organizacional futuro, PRD de identidad y matriz de permisos.
- **Requisitos derivados:** denegación por defecto, permiso de consolidación y pruebas de cambio de contexto.
- **Criterio de revisión futura:** revisar al definir proveedor de identidad y matriz real de roles.

### PROD-006 — Migo como fuente oficial durante 2026

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** Distripernos durante 2026.
- **Decisión:** Migo será el sistema oficial de contabilidad, facturación tributaria, compras y ventas contables, cuentas por cobrar y pagar, documentos tributarios y stock contable de Distripernos.
- **Justificación:** evitar dos fuentes oficiales y una segunda emisión tributaria.
- **Consecuencias:** ANKLO-OS administrará operaciones internas y referencias externas, pero no sustituirá la autoridad de Migo en estos procesos durante el periodo definido.
- **Excepciones:** ninguna excepción operativa convierte un dato de ANKLO-OS en asiento, factura o stock contable oficial.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian y validación contable.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR de coexistencia futuro, Bosquejo v2.0, PRD y mapa de fuentes de verdad.
- **Requisitos derivados:** referencias externas, conciliación, periodo de vigencia y etiquetas inequívocas de autoridad.
- **Criterio de revisión futura:** revisar al finalizar 2026 o ante cambio formal del sistema contable oficial.

### PROD-007 — Tres perspectivas de inventario

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** inventario de Distripernos y proyecciones operativas relacionadas.
- **Decisión:** distinguir stock contable de Migo, stock operativo proyectado de ANKLO-OS y stock físico contado como perspectivas independientes y conciliables.
- **Justificación:** cada perspectiva responde a un evento y una autoridad diferentes.
- **Consecuencias:** ninguna pantalla o informe deberá presentar una perspectiva como si fuera otra; toda diferencia tendrá fecha de corte y estado de conciliación.
- **Excepciones:** una coincidencia exacta no fusiona los registros fuente.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR de inventario futuro, PRD, contratos de importación e informes.
- **Requisitos derivados:** snapshots, movimientos, conteos, tiempos de vigencia y reconciliaciones identificables.
- **Criterio de revisión futura:** revisar al conocer la granularidad real de almacenes y exportaciones de Migo.

### PROD-008 — Ausencia inicial de integración transaccional

- **Estado:** SUPUESTO_TEMPORAL
- **Fecha:** 13 de julio de 2026
- **Alcance:** integración inicial con Migo.
- **Decisión:** asumir inicialmente que Migo no ofrece API utilizable, webhooks, reservas externas ni escritura transaccional automática.
- **Justificación:** diseñar un primer flujo que no dependa de capacidades aún no verificadas.
- **Consecuencias:** la consistencia con Migo será eventual y requerirá intervención y conciliación.
- **Excepciones:** una capacidad futura solo se usará tras discovery técnico, autorización y prueba controlada.
- **Responsable o aprobador:** supuesto funcional aprobado por Israel; pendiente de verificación con Migo o su documentación contractual/técnica.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR de coexistencia futuro, contrato de integración y preguntas pendientes.
- **Requisitos derivados:** adaptadores sustituibles, estados visibles y ausencia de confirmaciones falsas.
- **Criterio de revisión futura:** revisar al obtener documentación, credenciales de prueba o respuesta formal de Migo.

### PROD-009 — Integración inicial por importación y adaptadores

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** entradas y salidas permitidas entre Migo y ANKLO-OS.
- **Decisión:** la integración inicial usará XLS, carga manual e importaciones permitidas. El dominio se aislará mediante puertos y adaptadores para incorporar una API futura sin reescribir reglas de negocio.
- **Justificación:** permitir operación verificable bajo el peor escenario de integración.
- **Consecuencias:** formatos externos no deberán filtrarse como entidades de dominio; cada importación conservará origen y versión del mapeo.
- **Excepciones:** no se autoriza automatización de escritura en Migo por esta decisión.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y ADR 0002.
- **Documentos afectados:** ADR de coexistencia futuro, contratos de importación y modelo de adaptadores.
- **Requisitos derivados:** puerto de importación, mapeo versionado, validación servidor y manejo de rechazos.
- **Criterio de revisión futura:** revisar al cambiar el canal autorizado de integración.

### PROD-010 — Gobierno de lotes XLS

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** importaciones desde Migo y otras fuentes autorizadas.
- **Decisión:** cada lote XLS será inmutable, auditado, idempotente y conciliable. Repetir una importación no duplicará snapshots, movimientos ni tareas.
- **Justificación:** preservar evidencia de origen y tolerar reintentos sin efectos dobles.
- **Consecuencias:** las correcciones crearán un nuevo lote o evento relacionado; no se sobrescribirá el archivo ni el resultado histórico.
- **Excepciones:** un hash puede apoyar coincidencia o integridad, pero no sustituye identificadores externos, contexto ni validación semántica.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y reglas de auditoría vigentes.
- **Documentos afectados:** ADR de inventario futuro, diccionario XLS y contratos de importación.
- **Requisitos derivados:** identificador de lote, fuente, tipo, periodo, archivo original, mapeo, resultado por fila y clave idempotente.
- **Criterio de revisión futura:** revisar después de analizar muestras reales y semántica de correcciones/anulaciones.

### PROD-011 — Inventario derivado de movimientos y correcciones por reverso

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** stock operativo y ajustes registrados por ANKLO-OS.
- **Decisión:** el saldo no se edita directamente; todo cambio procede de movimientos. Un error se corrige mediante reverso y nuevo movimiento, conservando el original.
- **Justificación:** permitir reconstrucción, explicación y auditoría del saldo.
- **Consecuencias:** los ajustes sensibles requerirán motivo, relación con el movimiento corregido y autorización.
- **Excepciones:** la reconstrucción técnica de una proyección no crea por sí sola un movimiento contable en Migo.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y Bosquejo v1.1.
- **Documentos afectados:** ADR de inventario futuro, PRD y pruebas de dominio.
- **Requisitos derivados:** tipos de movimiento balanceados, reversos enlazados e interfaz sin edición directa de saldo.
- **Criterio de revisión futura:** revisar si aparecen movimientos compuestos o transferencias interempresa.

### PROD-012 — Disponibilidad para prometer

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** disponibilidad comercial operativa de Distripernos.
- **Decisión:** calcular disponibilidad para prometer como `snapshot Migo - reservas activas - salidas confirmadas pendientes de Migo + ingresos aprobados pendientes de Migo - cuarentena - bloqueos`.
- **Justificación:** proteger promesas comerciales frente a compromisos todavía no reflejados en el stock contable.
- **Consecuencias:** el resultado deberá mostrar snapshot, fecha, componentes y vigencia; no se presentará como saldo contable.
- **Excepciones:** inventario externo no confirmado y stock de Servipernos no se suman como stock propio.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR de inventario futuro, PRD comercial y contratos de consulta.
- **Requisitos derivados:** cálculo determinista, manejo de snapshot vencido, concurrencia de reservas y explicación del resultado.
- **Criterio de revisión futura:** revisar si Migo incorpora reservas o cambia la semántica del snapshot.

### PROD-013 — Segregación en conciliación y ajustes

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** importación, conteo físico, diferencias y ajustes sensibles.
- **Decisión:** el bodeguero u operador de integración importa XLS; la conciliación exacta puede ser automática; el bodeguero revisa diferencias; el supervisor valida conteos; el dueño aprueba ajustes; el bodeguero autorizado puede cerrar sin diferencias y el dueño cierra diferencias materiales.
- **Justificación:** separar captura, validación y aprobación de cambios sensibles.
- **Consecuencias:** una misma persona no creará y aprobará un ajuste sensible salvo excepción expresa del dueño, auditada y justificada.
- **Excepciones:** la coincidencia inequívoca automática no autoriza un ajuste; solo vincula registros equivalentes.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD, matriz de roles, ADR de inventario futuro y procedimientos operativos.
- **Requisitos derivados:** segregación de funciones, umbral configurable de materialidad, historial de excepción y auditoría.
- **Criterio de revisión futura:** revisar al aprobar la matriz real de roles y materialidad.

### PROD-014 — Documentos internos, documentos Migo y cola de registro

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** ciclo comercial y registro externo.
- **Decisión:** ANKLO-OS generará cotización/proforma, reserva, pedido confirmado, orden de venta interna, orden de corte, despacho y tarea pendiente de Migo. Migo generará factura, nota de crédito, guía de remisión, compra, devolución y demás documentos tributarios o contables. Ambos se relacionarán por referencias externas.
- **Justificación:** coordinar la operación sin emitir documentos tributarios duplicados.
- **Consecuencias:** la cola seguirá `PENDIENTE_MIGO -> EN_REGISTRO -> REGISTRADO_MIGO -> PENDIENTE_CONCILIACION -> CONCILIADO`; cada transición conservará actor, contexto y referencia.
- **Excepciones:** marcar `REGISTRADO_MIGO` no equivale a `CONCILIADO`.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian y validación contable.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR de coexistencia futuro, PRD y mapa de fuentes de verdad.
- **Requisitos derivados:** máquina de estados, idempotencia, referencias múltiples y reconciliación visible.
- **Criterio de revisión futura:** revisar al conocer campos y estados reales de documentos Migo.

### PROD-015 — Visibilidad comercial de stock, costos y márgenes

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** interfaz, API, reportes y exportaciones comerciales.
- **Decisión:** el vendedor verá disponibilidad para prometer, pero no costos ni márgenes. La precisión de cantidades será configurable por el superadministrador. Dueño y supervisor podrán ver costos solo según permiso explícito.
- **Justificación:** ofrecer información operativa suficiente sin exponer información económica restringida.
- **Consecuencias:** la protección deberá aplicarse en servidor, DTO, exportaciones y auditoría, no solo ocultarse en pantalla.
- **Excepciones:** no existen permisos implícitos por pertenecer al grupo o por cambiar el contexto.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD, matriz de roles y contratos de consulta.
- **Requisitos derivados:** autorización por campo, políticas de redondeo/visibilidad y pruebas negativas.
- **Criterio de revisión futura:** revisar al definir roles reales y clasificación de reportes.

### PROD-016 — Autoridad comercial y abastecimiento

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** cotización, abastecimiento y aprobación de precios.
- **Decisión:** el vendedor crea cotizaciones y solicitudes de abastecimiento. Jefe de ventas, supervisor autorizado o dueño puede consultar fuentes y registrar ofertas según permiso. Solo el dueño aprueba precios, salvo `TemporaryDelegation` explícita.
- **Justificación:** segregar preparación, abastecimiento y autorización económica.
- **Consecuencias:** toda delegación tendrá alcance, vigencia, otorgante, receptor y revocación; aprobar conservará la versión evaluada.
- **Excepciones:** registrar una oferta no aprueba su precio ni su modalidad de suministro.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD comercial, matriz de roles y ADR de precios futuro.
- **Requisitos derivados:** solicitudes, ofertas, autorización versionada y prueba de delegación vencida.
- **Criterio de revisión futura:** revisar si se aprueba una matriz permanente de autoridades distinta.

### PROD-017 — Escenarios y cálculo versionado de precios

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** precios comerciales y de reposición.
- **Decisión:** P1, P2, P3 y P4 serán listas o escenarios configurables, no significados rígidos. El precio podrá calcularse por margen, recargo, tabla, valor manual o combinación. Costos, precios, reglas, aprobaciones, vigencias y redondeo serán versionados.
- **Justificación:** permitir políticas cambiantes sin alterar el historial comercial.
- **Consecuencias:** cada cálculo explicará entradas, regla y versión. Ante faltante, el valor predeterminado se aplica a toda la línea; el dueño puede autorizar aplicarlo solo a la cantidad faltante.
- **Excepciones:** un valor manual requiere motivo y aprobación; no reescribe cotizaciones ya enviadas.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** ADR de precios futuro, PRD y modelo lógico futuro.
- **Requisitos derivados:** políticas componibles, vigencias sin solapamiento ambiguo y explicación auditable.
- **Criterio de revisión futura:** revisar al aprobar reglas iniciales de margen, recargo, tablas y redondeo.

### PROD-018 — Inmutabilidad comercial de la cotización

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** cotizaciones enviadas y aceptadas.
- **Decisión:** una cotización enviada no se recalcula silenciosamente. Una cotización aceptada conserva el precio aprobado aunque cambien después costos, disponibilidad o reglas.
- **Justificación:** preservar la oferta conocida por el cliente y la decisión comercial autorizada.
- **Consecuencias:** cambios posteriores crearán una revisión o nueva cotización relacionada; la aceptación identificará una versión exacta.
- **Excepciones:** una corrección explícita debe seguir el flujo de revisión y autorización, sin mutar el original.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD comercial, ADR de precios futuro y contratos de cotización.
- **Requisitos derivados:** snapshots de líneas, aceptación versionada, vigencia y trazabilidad de revisiones.
- **Criterio de revisión futura:** revisar si se incorporan contratos marco con mecanismos de reajuste explícitos.

### PROD-019 — Política inicial de reservas

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** reservas comerciales y operativas.
- **Decisión:** valores iniciales: aprobación interna 45 minutos; reserva blanda posterior a proforma 24 horas; máximo ordinario 48 horas; reserva firme hasta despacho, cancelación o vencimiento acordado. Todos serán configurables y versionados.
- **Justificación:** limitar compromisos de stock sin codificar plazos permanentes.
- **Consecuencias:** cada reserva tendrá tipo, inicio, expiración, política aplicada, cantidad, alcance y liberación auditable.
- **Excepciones:** una ampliación fuera del máximo ordinario requiere autoridad y motivo; una reserva externa no confirmada no bloquea stock propio como si fuera interno.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD, ADR de inventario/precios futuro y modelo lógico futuro.
- **Requisitos derivados:** expiración idempotente, concurrencia y no recálculo retroactivo al cambiar la política.
- **Criterio de revisión futura:** revisar con métricas de conversión, vencimiento y sobrepromesa.

### PROD-020 — Producto base, piezas, remanentes y optimización de corte

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** corte comercial de barras y espárragos.
- **Decisión:** no crear un SKU permanente por cada corte ocasional. Modelar producto base, barra completa, pieza, remanente, merma, especificación de corte, patrón y orden de corte.
- **Justificación:** conservar trazabilidad física sin inflar el catálogo comercial.
- **Consecuencias:** el optimizador considerará longitudes comerciales y remanentes, cantidades, ancho de corte, pérdidas, remanente mínimo, prioridad, costo, desperdicio, número de barras y patrones.
- **Excepciones:** un producto comercial permanente solo se crea mediante gobierno de catálogo; una pieza ocasional no lo crea automáticamente.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y discovery de cortes.
- **Documentos afectados:** ADR de corte futuro, PRD de taller y modelo lógico futuro.
- **Requisitos derivados:** algoritmo determinista, identidad de piezas, balance de longitudes y conciliación plan-real.
- **Criterio de revisión futura:** revisar al obtener catálogo, máquinas, ancho de corte, pérdidas y remanente mínimo reales.

### PROD-021 — Separación entre corte comercial y parámetros técnicos de anclajes

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** taller, cotización y operación en obra.
- **Decisión:** las medidas de corte comercial no pueden alterar longitudes, embebidos, diámetros, grados ni otras especificaciones técnicas aprobadas para anclajes en obra.
- **Justificación:** evitar que una optimización de material se convierta en rediseño estructural.
- **Consecuencias:** los contextos y permisos serán separados; una incompatibilidad genera bloqueo o consulta técnica, no ajuste automático.
- **Excepciones:** solo una revisión aprobada por la autoridad competente puede cambiar parámetros técnicos.
- **Responsable o aprobador:** salvaguarda funcional aprobada por Israel; la autoridad técnica concreta depende de contrato, diseñador, evaluación y MPII aplicables.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y Manual Maestro v1.1.
- **Documentos afectados:** ADR de corte futuro, PRD de taller y documentación de campo.
- **Requisitos derivados:** vocabulario separado, validaciones de compatibilidad y ausencia de propagación automática.
- **Criterio de revisión futura:** revisar ante nuevos tipos de producto o procesos de taller.

### PROD-022 — Servipernos como fuente externa de inventario

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** disponibilidad y operaciones con Servipernos.
- **Decisión:** Servipernos será contraparte y fuente externa. Su stock nunca se presentará como stock propio de Distripernos. Se distinguirán los estados observado, confirmado, reservado, entregado y vencido.
- **Justificación:** separar disponibilidad informada de propiedad y posesión reales.
- **Consecuencias:** el origen, fecha de observación/confirmación y vigencia serán visibles; el ATP propio no sumará stock externo como propio.
- **Excepciones:** una entrega no se clasifica automáticamente como préstamo o compra; cada operación declara modalidad y respaldo.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian y soporte contractual con Servipernos.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026 y notas de reunión.
- **Documentos afectados:** PRD de abastecimiento, ADR de inventario futuro y mapa de fuentes de verdad.
- **Requisitos derivados:** contraparte, almacén externo, confirmaciones con vencimiento y propiedad explícita.
- **Criterio de revisión futura:** revisar al obtener acuerdos, formatos de confirmación e integración de Servipernos.

### PROD-023 — Modo híbrido inicial para Servipernos

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** captura inicial de disponibilidad externa.
- **Decisión:** operar inicialmente mediante registro manual verificado, XLS y confirmación de disponibilidad, dejando una integración futura detrás de adaptadores.
- **Justificación:** permitir control sin asumir una API o acceso automatizado.
- **Consecuencias:** una observación no será confirmación y toda confirmación tendrá fuente, actor y vencimiento.
- **Excepciones:** una integración futura no cambia retroactivamente la autoridad de registros históricos.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian y validación con Servipernos.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD de abastecimiento, contratos de integración y preguntas pendientes.
- **Requisitos derivados:** importación separada de Migo, estado de confianza y caducidad.
- **Criterio de revisión futura:** revisar al acordar formato, frecuencia y autoridad de confirmación.

### PROD-024 — Préstamos inmutables y liquidaciones explícitas

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** préstamos de inventario con terceros o entre entidades autorizadas.
- **Decisión:** el préstamo original nunca se sobrescribe. Puede liquidarse por devolución total, devolución parcial, compra, venta, compensación o liquidación mixta.
- **Justificación:** preservar la modalidad original y explicar cada cambio posterior.
- **Consecuencias:** las liquidaciones serán eventos relacionados con cantidades, valores, documentos y saldos pendientes; cualquier efecto contable se conciliará con Migo.
- **Excepciones:** entregar mercancía no crea préstamo automáticamente; la modalidad y el respaldo son obligatorios.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian y validación contable/contractual.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD de inventario, ADR futuro y mapa de fuentes de verdad.
- **Requisitos derivados:** ledger de préstamo, liquidaciones parciales, no negatividad y referencias a documentos Migo cuando apliquen.
- **Criterio de revisión futura:** revisar al disponer de contratos y casos reales de préstamo/liquidación.

### PROD-025 — Dirección de experiencia administrativa y móvil

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** diseño de interacción.
- **Decisión:** la interfaz administrativa priorizará funcionalidad y densidad mediante menú lateral, pestañas, tablas, filtros, barra de acciones, formularios compactos y pocas animaciones. La interfaz móvil de técnicos será sencilla y orientada a tareas.
- **Justificación:** adaptar la interfaz a operación administrativa intensiva y captura de campo.
- **Consecuencias:** administración y móvil podrán compartir contratos, pero no necesariamente la misma composición visual.
- **Excepciones:** la referencia conceptual a Migo no autoriza copiar activos, interfaz protegida o limitaciones técnicas.
- **Responsable o aprobador:** aprobación funcional de Israel con base en reuniones con Christian; pendiente de ratificación documental de Christian.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026.
- **Documentos afectados:** PRD, sistema de diseño futuro y prototipos.
- **Requisitos derivados:** accesibilidad, estados visibles, densidad configurable y pruebas con usuarios.
- **Criterio de revisión futura:** revisar con prototipos y pruebas de tareas reales.

### PROD-026 — Arquitectura base y criterio para distribución

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** arquitectura de software.
- **Decisión:** mantener TypeScript, Next.js, PostgreSQL, Prisma, Zod, monolito modular, puertos y adaptadores, validación en servidor, auditoría y pruebas automatizadas. No introducir microservicios sin una razón medible.
- **Justificación:** la fundación actual soporta la reorientación sin complejidad distribuida prematura.
- **Consecuencias:** los nuevos dominios respetarán la dirección de dependencias ya aprobada; la composición permanecerá en la aplicación.
- **Excepciones:** extraer un servicio requerirá métrica de carga, seguridad, aislamiento, equipo o integración y un ADR específico.
- **Responsable o aprobador:** decisión técnica aprobada provisionalmente por ADR 0001/0002 y ratificada funcionalmente en la instrucción de reorientación.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026, ADR 0001 y ADR 0002.
- **Documentos afectados:** futuros ADR, Bosquejo v2.0 y criterios de arquitectura.
- **Requisitos derivados:** protección de límites, contratos tecnológicos neutrales y pruebas de arquitectura.
- **Criterio de revisión futura:** revisar solo ante evidencia medible o cambio sustantivo de restricciones.

### PROD-027 — Autoridad técnica y uso asistivo de IA

- **Estado:** APROBADA
- **Fecha:** 13 de julio de 2026
- **Alcance:** campo, calidad, SST, comercial, laboral, legal e IA.
- **Decisión:** ninguna función reemplazará contrato, planos, especificaciones, MPII, evaluaciones del sistema, criterio del diseñador o normativa aplicable. La IA solo propondrá borradores o detectará incoherencias; una persona competente aprobará decisiones técnicas, comerciales, laborales y legales.
- **Justificación:** evitar automatización fuera de autoridad y preservar la jerarquía documental.
- **Consecuencias:** salidas de IA y decisiones humanas serán registros separados; el sistema se abstendrá de inventar parámetros o aprobar ámbitos críticos.
- **Excepciones:** automatizaciones deterministas podrán ejecutar validaciones o coincidencias inequívocas sin sustituir la autoridad material requerida.
- **Responsable o aprobador:** salvaguarda funcional aprobada por Israel; la autoridad formal corresponde a cada ámbito y debe documentarse.
- **Fuente:** instrucción de reorientación del 13 de julio de 2026, Manual Maestro v1.1 y reglas del repositorio.
- **Documentos afectados:** Bosquejo v2.0, PRD, ADR futuros y políticas de IA.
- **Requisitos derivados:** revisión humana, fuentes versionadas, abstención y auditoría de la decisión.
- **Criterio de revisión futura:** no se elimina; solo se precisa por tipo de decisión y autoridad aplicable.

### PROD-028 — Corte como transformación física y modalidad de ejecución

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** manufactura y corte de barras, segmentos y piezas.
- **Decisión:** el corte es un proceso operativo de transformación física que consume materia prima y produce piezas o productos terminados, remanentes reutilizables y merma o residuos. Cada orden o ejecución declara modalidad `INTERNAL` o `EXTERNAL`; la modalidad queda auditada y no cambia retroactivamente después del cierre.
- **Justificación:** separar la naturaleza del proceso de la organización que lo ejecuta.
- **Consecuencias:** una unidad autorizada puede ejecutar internamente y un proveedor o subcontratista puede ejecutar externamente bajo el mismo modelo de trazabilidad.
- **Excepciones:** una corrección cerrada requiere revisión, reverso o evento compensatorio.
- **Responsable o aprobador:** aprobación funcional de Israel; no constituye validación jurídica, contractual, contable ni tributaria.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0005–0007, ADR 0009, mapa de fuentes de verdad y PRD futuro.
- **Requisitos derivados:** modalidad explícita, contexto, genealogía, balance y auditoría.
- **Criterio de revisión futura:** revisar al incorporar procesos internos adicionales o nuevos proveedores.

### PROD-029 — Separación entre proceso, servicio y producto fabricado

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** catálogo, manufactura, inventario y comercio.
- **Decisión:** el proceso de corte, el servicio comercial de corte y el producto físico fabricado son conceptos relacionados pero distintos. El servicio comprado o vendido no mantiene inventario físico; el producto fabricado puede mantener inventario, costo y genealogía.
- **Justificación:** impedir que una identidad alterne libremente entre bien, servicio y transformación.
- **Consecuencias:** una ejecución puede consumir barras, generar productos, remanentes y merma y relacionarse con un servicio comprado sin fusionarlos.
- **Excepciones:** un producto comercial permanente requiere gobierno de catálogo.
- **Responsable o aprobador:** aprobación funcional de Israel; no constituye clasificación contable o tributaria.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0006, ADR 0007, ADR 0009 y mapa de fuentes de verdad.
- **Requisitos derivados:** relaciones explícitas entre ejecución, `CutService` y `ManufacturedProduct`.
- **Criterio de revisión futura:** revisar con catálogo y tratamiento oficial en Migo.

### PROD-030 — PROMED como proveedor externo de corte

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** operación actual de corte subcontratado.
- **Decisión:** PROMED es una empresa externa a Distripernos que vende y ejecuta el servicio de corte. No compra las barras, no adquiere propiedad, no gobierna el inventario y devuelve o entrega productos terminados, remanentes e información de merma.
- **Justificación:** representar al ejecutor sin atribuirle propiedad o autoridad de inventario.
- **Consecuencias:** entrega a ejecución, material, cantidades, resultados y recepción se registran aunque las partes compartan espacios físicos o contiguos.
- **Excepciones:** la transición puede ser un cambio de estado o custodia operacional; no se inventa transporte físico.
- **Responsable o aprobador:** aprobación funcional de Israel; los efectos comerciales, contractuales, contables y tributarios requieren evidencia y autoridades competentes.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0006, ADR 0009 y mapa de fuentes de verdad.
- **Requisitos derivados:** proveedor, custodia temporal, recepción y futura referencia documental.
- **Criterio de revisión futura:** revisar al obtener el documento comercial y acuerdo vigentes.

### PROD-031 — Propiedad y custodia actuales

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** barras, productos terminados y remanentes actuales.
- **Decisión:** Distripernos conserva su propiedad y administra el inventario físico. PROMED recibe material solo para ejecución temporal y no se convierte en propietario ni responsable del inventario contable.
- **Justificación:** separar propiedad, custodia operacional y ejecución.
- **Consecuencias:** propietario, custodio, solicitante, planificador, aprobador, ejecutor y receptor se registran independientemente.
- **Excepciones:** custodia temporal no transfiere propiedad.
- **Responsable o aprobador:** aprobación funcional de Israel; no constituye dictamen jurídico o validación contable.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0005, ADR 0009 y mapa de fuentes de verdad.
- **Requisitos derivados:** `OwnershipContext`, `CustodyEvent` y preservación histórica.
- **Criterio de revisión futura:** revisar con acuerdos y documentos reales.

### PROD-032 — ANKLO actual como brazo operativo

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** situación organizacional actual.
- **Decisión:** ANKLO ejecuta actualmente servicios de instalación vendidos o administrados por Distripernos, utiliza materiales administrados por Distripernos y no sustituye su responsabilidad física de inventario.
- **Justificación:** evitar presentar a ANKLO actual como empresa contable independiente sin respaldo.
- **Consecuencias:** las operaciones conservan entidad legal y unidad operativa aplicables conforme a ADR 0003.
- **Excepciones:** una denominación operativa no crea personalidad jurídica, propiedad o autoridad contable.
- **Responsable o aprobador:** aprobación funcional de Israel; pendiente de evidencia societaria/fiscal aplicable.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026 y `PROD-003`.
- **Documentos afectados:** ADR 0009 y mapa de fuentes de verdad.
- **Requisitos derivados:** contexto explícito y no reatribución histórica.
- **Criterio de revisión futura:** revisar al existir evidencia de entidad independiente.

### PROD-033 — Escenario futuro de ANKLO independiente

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** capacidad futura, no operación actual.
- **Decisión:** el modelo permitirá que una futura ANKLO independiente compre barras, sea propietaria y solicitante, mantenga custodia física/logística en Distripernos, solicite corte a PROMED y reciba productos terminados propios.
- **Justificación:** separar propiedad económica, custodia física, solicitante, ejecutor y proveedor sin implementar contabilidad multiempresa.
- **Consecuencias:** la entidad futura tendrá identidad y vigencia nuevas y no reatribuirá historia.
- **Excepciones:** no afirma que ANKLO independiente exista hoy ni define contratos, precios, impuestos o contabilidad.
- **Responsable o aprobador:** aprobación funcional de Israel; la materialización requiere evidencia y validaciones competentes.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026 y `PROD-003`.
- **Documentos afectados:** ADR 0005, ADR 0009 y mapa de fuentes de verdad.
- **Requisitos derivados:** propiedad y custodia independientes y vigencias por entidad.
- **Criterio de revisión futura:** revisar al existir documentos constitutivos y acuerdos intercompañía.

### PROD-034 — Responsabilidades separadas de corte

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** solicitudes, planes y ejecuciones.
- **Decisión:** solicitante, planificador, aprobador y ejecutor son responsabilidades separadas. Actualmente Distripernos solicita, planifica y aprueba mediante roles autorizados y PROMED ejecuta; ejecutar no concede diseño o aprobación del patrón.
- **Justificación:** preservar autoridad y segregación.
- **Consecuencias:** las asignaciones se resuelven por rol, contexto y vigencia; una futura ANKLO podrá ser solicitante y propietaria.
- **Excepciones:** responsabilidades coincidentes requieren matriz vigente y auditoría.
- **Responsable o aprobador:** aprobación funcional de Israel; usuarios concretos pendientes.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0007, ADR 0009 y registro de pendientes.
- **Requisitos derivados:** capacidades separadas y auditoría por etapa.
- **Criterio de revisión futura:** revisar con la matriz real de roles.

### PROD-035 — Identificación física híbrida

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** barras, piezas, productos y remanentes.
- **Decisión:** identificar individualmente barras asignadas, remanentes, piezas especiales o de alto valor, material de terceros u otra empresa y casos exigidos; permitir lotes para productos homogéneos con especificación, longitud, material, norma, acabado, orden, propietario y ejecución equivalentes.
- **Justificación:** equilibrar trazabilidad y operación repetitiva.
- **Consecuencias:** el lote no elimina genealogía de barras o segmentos de origen.
- **Excepciones:** la política puede variar por familia y vigencia sin cambiar historia.
- **Responsable o aprobador:** aprobación funcional de Israel.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0005, ADR 0007 y ADR 0009.
- **Requisitos derivados:** política versionada, identidad individual o lote y genealogía.
- **Criterio de revisión futura:** revisar con catálogo, valor y riesgos reales.

### PROD-036 — Umbral temporal de remanente

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** candidato inicial a remanente reutilizable.
- **Decisión:** un segmento de al menos 2 pulgadas puede ser candidato a remanente reutilizable. Es una política temporal, configurable, versionada, asociada a organización o política, con unidad y vigencia; no declara reutilización automática.
- **Justificación:** disponer de criterio inicial sin crear constante universal.
- **Consecuencias:** compatibilidad, estado, daño, contaminación y pedido determinan la clasificación; excepciones requieren aprobación y auditoría.
- **Excepciones:** otra política puede aplicar prospectivamente sin alterar historia.
- **Responsable o aprobador:** aprobación funcional de Israel; no constituye parámetro técnico universal.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0007, ADR 0009 y registro de configuraciones.
- **Requisitos derivados:** unidad, versión, vigencia, excepción y evaluación final.
- **Criterio de revisión futura:** revisar con casos reales y familia de producto.

### PROD-037 — Clases de salida del corte

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** resultados y balance físico.
- **Decisión:** distinguir `ManufacturedProduct`, `ReusableRemnant`, `NormalLoss`, `ExtraordinaryLoss` y `RecoverableWaste`. Un remanente no es merma y la merma no se oculta en ajustes genéricos.
- **Justificación:** explicar destino del material y diferencias plan–real.
- **Consecuencias:** la merma normal corresponde a pérdidas inherentes configuradas; la extraordinaria a error, corte incorrecto, daño, rechazo, pérdida, diferencia no explicada, retrabajo o incidente.
- **Excepciones:** causa y clasificación conservan evidencia; límites técnicos siguen pendientes.
- **Responsable o aprobador:** aprobación funcional de Israel; no constituye clasificación ambiental, contable o tributaria definitiva.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0005, ADR 0007, ADR 0009 y mapa de fuentes.
- **Requisitos derivados:** categorías, causa, balance y movimientos explícitos.
- **Criterio de revisión futura:** revisar con tolerancias y tratamiento de residuos aprobados.

### PROD-038 — Aprobación de merma extraordinaria

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** registro, verificación y aprobación.
- **Decisión:** supervisor operativo registra y justifica; inventario verifica; un aprobador operativo podrá aprobar dentro de un límite configurado y dirección por encima o en casos críticos. Sin límite ratificado, toda merma extraordinaria requiere dirección.
- **Justificación:** mantener segregación sin inventar montos o porcentajes.
- **Consecuencias:** capacidades por rol, contexto y vigencia, nunca por nombre personal.
- **Excepciones:** toda excepción requiere motivo, autoridad y auditoría.
- **Responsable o aprobador:** aprobación funcional de Israel; límites y usuarios concretos pendientes.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0005, ADR 0009 y registro de pendientes.
- **Requisitos derivados:** flujo segregado, límite versionado y escalamiento.
- **Criterio de revisión futura:** revisar con matriz y límites aprobados.

### PROD-039 — Costos operativos básicos

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** primer alcance de manufactura.
- **Decisión:** `CostEstimate` incluye solo valor estimado del material y precio estimado/cotizado del servicio; `ActualCost` incluye solo valor del material consumido y valor real cobrado por el servicio.
- **Justificación:** comparar plan y ejecución sin anticipar costeo completo.
- **Consecuencias:** costos indirectos, depreciación, energía, transporte, mano de obra indirecta, distribución contable, impuestos y costeo estatutario quedan fuera.
- **Excepciones:** Migo conserva registros contables y tributarios oficiales en 2026; ANKLO-OS mantiene costos operativos conciliables.
- **Responsable o aprobador:** aprobación funcional de Israel; cualquier efecto oficial requiere validación contable.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0006, ADR 0009 y mapa de fuentes.
- **Requisitos derivados:** fuente, revisión, estimado, real y tarea futura de conciliación.
- **Criterio de revisión futura:** revisar antes de añadir costos indirectos.

### PROD-040 — Primer incremento manual determinista

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** primer desarrollo futuro.
- **Decisión:** comenzar con planificación y ejecución manual controlada: patrón manual, kerf de configuración aprobada, cálculo determinista previsto, registro real, comparación, costos básicos, auditoría y conciliación Migo pendiente.
- **Justificación:** validar proceso e invariantes antes de optimización o integración.
- **Consecuencias:** solicitud, material, entrega, modalidad, recepción, productos, remanentes y mermas quedan conceptualmente cubiertos.
- **Excepciones:** no incluye optimizador, IA de patrones, transmisión Migo, contabilidad, facturación, conciliación automática, costos indirectos ni decisiones automáticas de conformidad.
- **Responsable o aprobador:** aprobación funcional de Israel; implementación no autorizada en esta fase.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0007, ADR 0009 y PRD/backlog futuros.
- **Requisitos derivados:** estados revisables, entradas aprobadas y pruebas de balance.
- **Criterio de revisión futura:** revisar tras casos reales y antes del optimizador.

### PROD-041 — Configuración sin ruptura de invariantes

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** políticas de manufactura, inventario, costos y autoridad.
- **Decisión:** modalidad, proveedor, solicitante, propietario, custodio, roles, identificación, remanente mínimo, reglas, costos, límites, vigencias y tarifa/cotización son políticas versionables; no pueden romper integridad.
- **Justificación:** permitir variación sin hacer opcionales la historia o el balance.
- **Consecuencias:** no son configurables libremente doble consumo, stock creado por plan, genealogía, historia de propiedad/custodia, cierre, correcciones, cotización aceptada, autoridad Migo o suma de inventario ajeno al ATP.
- **Excepciones:** una nueva política actúa desde su vigencia y no reescribe historia.
- **Responsable o aprobador:** aprobación funcional de Israel.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0005–0007, ADR 0009 y configuraciones.
- **Requisitos derivados:** versión, vigencia, organización, autoridad, auditoría y pruebas negativas.
- **Criterio de revisión futura:** revisar cuando se proponga configurar una invariante.

### PROD-042 — Estados conceptuales de manufactura y corte

- **Estado:** APROBADA
- **Fecha:** 16 de julio de 2026
- **Alcance:** propuesta documental para solicitud, plan y ejecución.
- **Decisión:** adoptar como propuesta revisable los estados mínimos de ADR 0009, separando aprobación, ejecución, recepción, conciliación, bloqueo y cancelación.
- **Justificación:** impedir que aprobar cree stock o que una ejecución cierre antes de recepción/conciliación.
- **Consecuencias:** nombres y transiciones requieren casos reales antes de implementación.
- **Excepciones:** valida separación conceptual, no enums, tablas o flujo definitivo.
- **Responsable o aprobador:** aprobación funcional de Israel; detalle sujeto a revisión operativa y contable.
- **Fuente:** decisión funcional de Israel del 16 de julio de 2026.
- **Documentos afectados:** ADR 0009 y PRD futuro.
- **Requisitos derivados:** criterios de transición, autoridad y casos negativos.
- **Criterio de revisión futura:** revisar con taller, inventario, compras y contabilidad.

## 3. Trazabilidad y revisión

Este registro deberá revisarse antes de redactar cada ADR y antes de publicar el Bosquejo v2.0. Una revisión futura no modifica silenciosamente decisiones anteriores: crea una nueva versión y marca la decisión afectada como `SUPERADA`, indicando el identificador sustituto.

Los asuntos todavía no resueltos se mantienen en [Preguntas y supuestos pendientes v2.0](./Preguntas_Supuestos_Pendientes_v2.0.md). La asignación de fuentes oficiales y operativas se desarrolla en el [mapa de fuentes de verdad](../../architecture/mapa-fuentes-de-verdad-v1.0.md).
