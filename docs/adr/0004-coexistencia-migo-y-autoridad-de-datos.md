# ADR 0004: coexistencia con Migo y autoridad de datos

- **Identificador:** ADR-0004
- **Estado:** PROPUESTO
- **Fecha:** 13 de julio de 2026
- **Director funcional:** Israel
- **Decisor principal de negocio:** Christian Andrade, pendiente de ratificación documental

> Este ADR contiene una decisión arquitectónica propuesta basada en aprobaciones funcionales provisionales. No constituye aprobación jurídica, societaria, contable, laboral, tributaria ni técnica definitiva.

## Contexto

ANKLO-OS será una plataforma operativa y comercial complementaria a Migo. Durante 2026, Migo continuará como sistema oficial de Distripernos para contabilidad, facturación tributaria, compras y ventas contables, cuentas por cobrar y pagar, documentos tributarios y stock contable.

ANKLO-OS coordinará cotizaciones, reservas, órdenes internas, inventario operativo, taller, campo, tareas pendientes de Migo y conciliación. La integración real no ha sido verificada: se asume temporalmente que no existen API utilizable, webhooks, reserva integrada ni escritura automática. Se conocen referencias a exportaciones XLS y posible kardex, pero sus formatos, permisos y semántica no han sido probados.

## Problema

La coexistencia crea dos ritmos de operación:

- ANKLO-OS confirma eventos internos que pueden afectar disponibilidad y ejecución antes de estar registrados en Migo.
- Migo mantiene documentos y saldos oficiales que pueden incorporarse después mediante intervención manual o importación.

Sin límites explícitos, la aplicación podría emitir un documento tributario duplicado, presentar una proyección como stock oficial, acoplar el dominio a columnas desconocidas, duplicar registros al reintentar o declarar conciliada una operación solo porque recibió un identificador externo.

## Alcance

- Autoridad de datos por proceso.
- Separación entre documentos internos y documentos oficiales de Migo.
- Coexistencia durante 2026.
- Referencias externas e identificadores de correlación.
- Integración inicial manual y por XLS permitido.
- Lotes de importación, snapshots y errores por fila.
- Cola de tareas pendientes de Migo.
- Consistencia eventual, retrasos y conciliación.
- Idempotencia y reintentos.
- Puertos y adaptadores para sustituir el canal de integración.

## Fuera de alcance

- Especificar columnas, hojas, códigos, formatos o frecuencia de XLS.
- Afirmar permisos de exportación/importación no verificados.
- Definir anulaciones o correcciones de Migo.
- Diseñar una API que Migo no haya publicado.
- Implementar un importador, conector o automatización.
- Diseñar tablas o modelos Prisma.
- Sustituir Migo o migrar su historial.
- Definir tratamiento contable, tributario o jurídico.
- Definir el cálculo detallado de ATP, que corresponde al ADR 0005.

## Fuerzas y criterios de decisión

- Una fuente oficial inequívoca por tipo de dato.
- Ausencia de doble facturación tributaria.
- Operación posible bajo integración manual.
- Tolerancia explícita a demoras y reintentos.
- Importaciones reproducibles, auditadas e idempotentes.
- Dominio independiente del formato externo.
- Capacidad de incorporar una API futura sin reescribir reglas.
- Visibilidad del estado de consistencia.
- Preservación de originales y errores.
- Atribución organizacional conforme al ADR 0003.

## Decisión propuesta

### Autoridad por proceso

Migo será durante 2026 el sistema oficial para los procesos contables y tributarios definidos, incluido el stock contable de Distripernos. ANKLO-OS será el sistema operativo para cotización, reserva, pedido, orden de venta interna, orden de corte, despacho, operaciones de campo, inventario proyectado, tareas pendientes y conciliación.

El [mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md) orientará la autoridad por dato. Cuando un atributo permanezca pendiente —por ejemplo, autoridad del catálogo o alcance de precios residentes en Migo— el ADR no lo asignará por inferencia.

### Documentos internos y oficiales

ANKLO-OS podrá generar documentos internos como cotización/proforma, reserva, pedido confirmado, orden de venta interna, orden de corte, despacho y tarea pendiente de Migo. Migo conserva los registros contables de compras y ventas y genera o conserva las facturas, notas de crédito, guías de remisión y demás documentos tributarios o contables que correspondan. Los tipos, nombres, flujos y capacidades exactos requieren verificación; “compra” y “devolución” describen aquí procesos o registros contables y no se presumen como tipos documentales concretos y homogéneos.

Un documento interno conserva referencias hacia el documento Migo relacionado, pero la referencia no lo convierte en documento oficial ni prueba conciliación. ANKLO-OS no emitirá una segunda factura tributaria.

### Correlación

Cada operación que deba registrarse en Migo tendrá un identificador de correlación interno estable e idempotente. Cuando exista un identificador externo verificado, se conservará como referencia junto con entidad legal, tipo de operación, periodo y origen. No se definirá su formato antes de conocer evidencia real. Ninguna referencia externa, por sí sola, acredita coincidencia de contenido ni cambia una operación a `CONCILIADO`.

### Cola de tareas Migo

La consistencia seguirá estados operativos explícitos:

`PENDIENTE_MIGO -> EN_REGISTRO -> REGISTRADO_MIGO -> PENDIENTE_CONCILIACION -> CONCILIADO`

- `PENDIENTE_MIGO`: la operación interna fue confirmada y requiere registro externo.
- `EN_REGISTRO`: una persona autorizada inició el proceso; no prueba que Migo lo aceptó.
- `REGISTRADO_MIGO`: existe una referencia externa verificable.
- `PENDIENTE_CONCILIACION`: debe compararse contenido y autoridad, no solo identificadores.
- `CONCILIADO`: existe coincidencia verificada o una diferencia fue resuelta por la autoridad correspondiente.

Los rechazos, cancelaciones o devoluciones a estados previos se definirán después de conocer el proceso real; nunca se simularán como borrado del historial.

### Integración inicial

La integración inicial será manual y mediante exportaciones/importaciones XLS que estén realmente permitidas. Cada archivo recibido se conserva como original asociado a un lote inmutable. El adaptador valida su estructura, traduce registros externos a contratos internos y produce resultados aceptados, rechazados o pendientes de revisión sin filtrar nombres de columnas al dominio.

Una importación repetida no debe duplicar snapshots, referencias, movimientos ni tareas. La idempotencia no dependerá exclusivamente del hash del archivo: usará el contexto y los identificadores externos disponibles una vez verificados.

### Errores, reintentos y retrasos

- Un error de archivo o fila se conserva con motivo y no convierte el lote en éxito completo.
- Un reintento reutiliza la identidad lógica de la operación y no crea un segundo efecto.
- Una demora se representa en el estado de la cola; no se oculta con una confirmación optimista.
- El registro manual de una referencia externa requiere actor, `ActingContext`, fecha y evidencia permitida.
- La conciliación exacta solo podrá automatizarse cuando la coincidencia sea inequívoca según reglas aprobadas.

### Sustitución del adaptador

El dominio dependerá de puertos que expresen capacidades: recibir snapshot, consultar resultado de importación, registrar referencia externa y conciliar. Un adaptador manual/XLS implementará esas capacidades inicialmente. Una futura API oficial podrá sustituirlo si respeta los mismos contratos y añade sus propias garantías de autenticación, idempotencia y manejo de errores.

## Invariantes

- Migo conserva la autoridad oficial definida durante 2026.
- ANKLO-OS no emite una segunda factura tributaria.
- Un documento interno no se presenta como documento tributario.
- `REGISTRADO_MIGO` no equivale a `CONCILIADO`.
- Cada operación externa conserva correlación interna y referencias verificables disponibles.
- Repetir una importación o reintento no duplica efectos.
- Un lote importado y su archivo original no se sobrescriben.
- Los errores de importación permanecen visibles y auditados.
- El dominio no depende de columnas, códigos o SDK de Migo.
- Una capacidad de API, webhook, reserva o escritura no se presume sin prueba.
- La ausencia temporal de sincronización se muestra como consistencia eventual.
- Toda actuación conserva el contexto organizacional definido por ADR 0003.

## Límites de responsabilidad

- Migo controla sus documentos y registros oficiales; ANKLO-OS no corrige internamente el original externo.
- ANKLO-OS controla operaciones internas, correlación, cola y conciliación.
- El adaptador interpreta formatos externos; el dominio expresa conceptos operativos.
- El operador autorizado ejecuta acciones manuales; la aplicación registra su resultado sin atribuir autoridad contable inexistente.
- El ADR 0005 define inventario propio y ATP; este ADR solo define el canal y autoridad externa.
- El ADR 0008 define fuentes externas y préstamos; no se mezclan con Migo ni con stock propio.

## Alternativas consideradas

### Sustituir Migo inmediatamente

Rechazada por alcance, riesgo tributario/contable, ausencia de PRD y falta de módulos funcionales.

### Integración bidireccional automática desde el inicio

Rechazada porque las capacidades no están verificadas y podría duplicar o corromper documentos oficiales.

### Acceso directo a la base de datos de Migo

Rechazado por acoplamiento, seguridad, falta de autorización y dependencia de internals del proveedor.

### Copiar columnas XLS al dominio

Rechazada porque convierte un formato no verificado en modelo permanente y dificulta cambiar a una API.

### Operación manual sin cola ni conciliación

Rechazada porque oculta omisiones, duplicados y retrasos y no permite explicar divergencias.

### Considerar registrada una operación al introducir un número Migo

Rechazada porque una referencia no demuestra coincidencia de entidad, líneas, cantidades, importes o periodo.

## Consecuencias positivas

- Límites claros entre operación y autoridad oficial.
- Ausencia de duplicación tributaria por diseño.
- Funcionamiento inicial sin depender de una API.
- Reintentos e importaciones controlados.
- Evolución hacia integración oficial mediante adaptadores.
- Diferencias visibles hasta su conciliación.
- Menor contaminación del dominio con formatos externos.

## Consecuencias negativas

- Doble captura o intervención manual durante la coexistencia.
- Consistencia eventual y necesidad de seguimiento operativo.
- Coste de mantener correlaciones, lotes, errores y conciliaciones.
- Dependencia de la calidad y frecuencia de exportaciones disponibles.
- La automatización futura seguirá requiriendo reconciliación y observabilidad.

## Riesgos

- Sobreestimar capacidades de XLS o API no verificadas.
- Crear duplicados por claves externas insuficientes.
- Importar una corrección como una operación nueva.
- Declarar conciliación por coincidencia parcial.
- Registrar una operación bajo entidad o periodo incorrectos.
- Exponer datos contables mediante archivos no protegidos.
- Acumular tareas pendientes sin responsables ni escalamiento.
- Convertir un retraso operativo en promesa comercial incorrecta.

## Preguntas abiertas

| Clasificación                       | Pregunta                                                                                  | Impacto                                                                                  |
| ----------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Pregunta bloqueante para aceptación | ¿Qué exportaciones XLS existen realmente y están permitidas?                              | Debe existir al menos un canal de lectura comprobado para aceptar la estrategia inicial. |
| Evidencia requerida                 | ¿Cuál es la estructura, semántica y fecha de autoridad de cada archivo?                   | Bloquea contratos de adaptador y modelo lógico, no se decide aquí.                       |
| Pregunta bloqueante para aceptación | ¿Qué procesos de Migo ratifican Christian y contabilidad como oficiales durante 2026?     | Confirma la frontera de autoridad propuesta.                                             |
| Evidencia requerida                 | ¿Migo ofrece kardex, importaciones u otras capacidades?                                   | Requiere prueba real; no se presume.                                                     |
| Pregunta de implementación          | ¿Qué identificadores estables existen para documento, línea, producto, almacén y tercero? | Bloquea idempotencia concreta.                                                           |
| Pregunta de implementación          | ¿Cómo representa Migo anulaciones, correcciones y reemisiones?                            | Bloquea reglas de reimportación y conciliación.                                          |
| Decisión futura no bloqueante       | ¿Se reemplazará el adaptador XLS por una API?                                             | Solo se decide al existir API oficial y caso medible.                                    |
| Pregunta de implementación          | ¿Qué coincidencia es inequívoca para conciliación automática?                             | Bloquea automatización, no la conciliación humana.                                       |

## Supuestos

- No existe API utilizable verificada.
- No existen webhooks verificados.
- No existe escritura automática verificada.
- No existe reserva integrada verificada.
- Existen exportaciones XLS, pendientes de inspección real.
- Puede existir kardex, pendiente de prueba.
- Pueden existir importaciones, pero no se consideran disponibles hasta verificarlas y autorizarlas.

## Decisiones configurables

- Frecuencia operativa de carga, una vez conocida y autorizada.
- Reglas de reintento y escalamiento.
- Umbrales de antigüedad o alerta por tipo de importación.
- Asignación de operadores autorizados.
- Tolerancias de conciliación únicamente cuando sean aprobadas.
- Canales de notificación de tareas pendientes.

Ninguna configuración puede cambiar qué sistema es oficial sin una nueva decisión.

## Impacto sobre otros dominios

- [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md) determina la entidad y el contexto de cada importación, documento y tarea.
- [ADR 0005](0005-inventario-operativo-atp-y-conciliacion.md) usa snapshots Migo y tareas pendientes para proyectar ATP.
- [ADR 0006](0006-cotizaciones-precios-abastecimiento-y-reservas.md) crea documentos comerciales internos y consume disponibilidad.
- [ADR 0007](0007-piezas-remanentes-y-optimizacion-de-cortes.md) puede originar movimientos y merma que requieran tarea Migo.
- [ADR 0008](0008-inventario-externo-servipernos-y-prestamos.md) conserva contraparte y obligaciones separadas, aunque ciertos efectos deban registrarse en Migo.
- Reportes deben etiquetar fuente, fecha y estado de consistencia.

## Impacto de seguridad y auditoría

- Cargas XLS requieren autorización, validación de tipo/tamaño y tratamiento como entrada no confiable.
- Archivos originales se almacenan fuera de la base relacional con aislamiento por organización.
- Cada lote registra actor, `ActingContext`, origen, tipo, tiempo, resultado y correlación.
- Las credenciales o secretos de una futura API permanecen fuera del repositorio.
- Exportaciones e importaciones sensibles quedan auditadas.
- Reintentos, cambios de estado y conciliaciones generan eventos append-only.
- Los archivos de desarrollo deben contener datos ficticios o anonimizados autorizados.

## Estrategia de transición

1. Confirmar por escrito la frontera oficial Migo–ANKLO-OS durante 2026.
2. Inventariar exportaciones/importaciones y permisos sin automatizar escritura.
3. Obtener muestras originales permitidas y documentar su semántica.
4. Definir contratos tecnológicos neutrales y reglas de correlación antes del modelo lógico.
5. Diseñar el adaptador manual/XLS y la cola con estados visibles.
6. Ejecutar pruebas de duplicado, error parcial, reintento y conciliación con datos ficticios derivados de muestras autorizadas.
7. Evaluar una API futura como sustitución de adaptador, no como cambio del dominio.

Este ADR no autoriza implementar esos pasos ni usar datos productivos.

## Condiciones para pasar a ACEPTADO

- Israel confirma funcionalmente la separación entre documentos internos, tareas y documentos oficiales.
- Christian y el responsable contable ratifican por escrito los procesos para los que Migo será sistema oficial durante 2026.
- Se incorpora un inventario de capacidades Migo con estado `verificada`, `no disponible` o `desconocida`, sustentado por documentación o prueba permitida.
- Se obtiene al menos una muestra XLS original, permitida y anonimizada, con explicación de su fecha y propósito; su estructura no se incorpora como invariante del dominio.
- Se cierra la pregunta sobre la existencia de un canal de exportación permitido y se mantiene separada la pregunta sobre importación/escritura.
- Se ejecuta y documenta una prueba de diseño con: reimportación idéntica sin duplicado; error de una fila sin pérdida del lote; reintento de tarea sin segundo efecto; referencia externa que permanece `PENDIENTE_CONCILIACION`; retraso visible sin falsa confirmación.
- Se incorpora una matriz `proceso/dato -> sistema oficial -> sistema operativo -> evento de conciliación -> autoridad de cierre` revisada por Israel y contabilidad.
- Se documenta que API, webhooks, anulaciones, correcciones, columnas y códigos continúan pendientes mientras no exista evidencia.

## Fuentes internas consultadas

- [Registro de decisiones de producto v2.0](../product/decisions/Registro_Decisiones_Producto_v2.0.md), `PROD-002`, `PROD-006`, `PROD-008`, `PROD-009`, `PROD-010` y `PROD-014`.
- [Mapa de fuentes de verdad](../architecture/mapa-fuentes-de-verdad-v1.0.md).
- [Preguntas y supuestos pendientes v2.0](../product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md), `ADR-Q-002`–`ADR-Q-004`, `LOG-Q-001`–`LOG-Q-006` e `IMP-Q-001`, `IMP-Q-009`, `IMP-Q-010`.
- [ADR 0001](0001-arquitectura-base.md).
- [ADR 0002](0002-puertos-y-adaptadores.md).
- [Auditoría documental previa](../product/discovery/Auditoria_Documental_ANKLO_DISTRIPERNOS_v1.0.md).

## Relaciones con otros ADR

- Depende de [ADR 0003](0003-modelo-grupo-entidad-unidad-contexto.md).
- Aplica la arquitectura de puertos y adaptadores del [ADR 0002](0002-puertos-y-adaptadores.md).
- Proporciona autoridad externa y estados de consistencia al ADR 0005–0008.
- No decide fórmulas de inventario, pricing, corte ni modalidades de préstamo.
