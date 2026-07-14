# Formulario de decisiones bloqueantes para el PRD

**Versión:** 1.0\
**Decisiones seleccionadas:** 21\
**Uso:** facilitación con Christian Andrade. Las recomendaciones son técnicas y no equivalen a decisiones aprobadas. Cuando falte autoridad legal, contable, contractual, técnica, SST o privacidad, seleccionar “diferir/escalar” y registrar responsable y fecha.

## Bloque 1 — Estructura legal y relación ANKLO–DISTRIPERNOS

### DEC-01 — Naturaleza de ANKLO

- **Contexto:** ANKLO aparece como división de servicios de DISTRIPERNOS, identidad operativa y opción separada dentro de la aplicación.
- **Evidencia documental:** Auditoría §§1, 5.1 y 8; Registro C-004; Cuestionario 1–4; Informe técnico 260130, portada/firma; Planilla 3003-001, p. 1.
- **Problema:** no puede definirse tenancy, titularidad, numeración ni permisos sin saber si ANKLO es marca/división o entidad legal.
- **Opción A:** ANKLO es marca o división de DISTRIPERNOS S.A.S.; no es organización jurídica separada en el ERP.
- **Opción B:** ANKLO es entidad jurídica separada y será una organización independiente.
- **Opción C:** estructura mixta; ANKLO puede ser marca/unidad y existir otra entidad relacionada, con relaciones interempresa explícitas.
- **Recomendación técnica:** no crear una entidad legal por inferencia; modelar organización y unidad/marca como conceptos distintos y configurar solo tras revisar evidencia societaria/fiscal.
- **Riesgos de cada opción:** A: mezclar operaciones si existe separación real; B: atribuir contratos/datos a una entidad inexistente o distinta; C: mayor complejidad y riesgo de configuración ambigua.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-02 — Entidad responsable por acto comercial y operativo

- **Contexto:** cotización, contratación, suministro, instalación, facturación y cobro aparecen atribuidos de forma variable a DISTRIPERNOS, ANKLO, Christian y gestores.
- **Evidencia documental:** Auditoría §§5.1–5.2; Registro C-005; Cuestionario 5–6; Acuerdo, cláusulas 1, 2 y 5.
- **Problema:** cada acto necesita sujeto responsable, permisos, documentos y trazabilidad.
- **Opción A:** una sola entidad realiza todos los actos.
- **Opción B:** las entidades se reparten funciones mediante una matriz fija.
- **Opción C:** la matriz se configura por contrato/obra, dentro de combinaciones aprobadas.
- **Recomendación técnica:** aprobar una matriz `acto → entidad → autoridad → documento` y permitir variación por contrato solo cuando exista relación interempresa validada.
- **Riesgos de cada opción:** A: no representa operaciones compartidas; B: rigidez ante contratos distintos; C: errores de selección, conciliación e impuestos si no hay controles fuertes.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 2 — Ciclo comercial, contratación, facturación y cobranza

### DEC-03 — Tratamiento de servicios y suministros combinados

- **Contexto:** el acuerdo distingue “Soluciones de Anclaje” de “Suministros”; las obras combinan material, instalación, cambios y custodia.
- **Evidencia documental:** Acuerdo, cláusula 4; Planilla 3003-001; Informe 260130; Matriz REQ-006–008 y REQ-052.
- **Problema:** no está definido si el combo es un rubro único, componentes separados o una oferta compuesta con responsabilidades distintas.
- **Opción A:** rubro comercial único de suministro e instalación.
- **Opción B:** líneas separadas para material y servicio, con totales relacionados.
- **Opción C:** oferta compuesta que admite ambos modelos según contrato.
- **Recomendación técnica:** usar oferta compuesta con componentes trazables, preservando la presentación contractual elegida.
- **Riesgos de cada opción:** A: oculta cantidades/costos/custodia; B: puede no coincidir con la proforma/contrato; C: mayor validación y configuración.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-04 — Cantidades cotizadas, ejecutadas, suministradas, en custodia y facturables

- **Contexto:** el Informe 260130 registra 105 proformadas, 98 ejecutadas y 7 kits en custodia; la Planilla 3003-001 factura 244 unidades con sobrecosto absorbido.
- **Evidencia documental:** Auditoría §§5.2–5.3; Registro C-008; Matriz REQ-017 y REQ-052; Cuestionario 37–39 y 53–57.
- **Problema:** esas cantidades no son equivalentes y la regla facturable depende del contrato y de aprobaciones.
- **Opción A:** facturar lo cotizado/ordenado salvo cambio aprobado.
- **Opción B:** facturar únicamente lo ejecutado y aceptado.
- **Opción C:** fórmula por contrato que distingue ejecutado, suministrado, custodia, devolución y cambio.
- **Recomendación técnica:** mantener magnitudes y eventos separados; calcular el borrador facturable con regla contractual versionada y conciliación previa.
- **Riesgos de cada opción:** A: cobro de trabajo/material no entregado; B: omite suministros/custodia legítimamente facturables; C: complejidad y dependencia de configuración correcta.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-05 — Sistema actual de facturación, cobranza y fuente oficial

- **Contexto:** se menciona Migo, posible ERP externo e integración con SRI, pero no se ha inventariado el proceso real.
- **Evidencia documental:** Auditoría §§5.9 y 8; Registro C-015; Cuestionario 47–57; reunión 01:08:43–01:13:06.
- **Problema:** el PRD no puede asignar emisión, cobro o saldo oficial sin identificar sistema, entidad, proveedor y periodo.
- **Opción A:** sistema actual continúa como fuente oficial; ANKLO-OS solo intercambia datos/consulta.
- **Opción B:** ANKLO-OS sustituye facturación/cobranza tras certificación y corte formal.
- **Opción C:** coexistencia por fases con fuente oficial definida por proceso y periodo.
- **Recomendación técnica:** elegir A o C inicialmente hasta completar evaluación contable, tributaria, API y reconciliación.
- **Riesgos de cada opción:** A: duplicidad operativa e integración limitada; B: alto riesgo regulatorio/contable y de continuidad; C: doble captura y divergencia sin conciliación.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 3 — Inventario, propiedad, custodia y préstamos

### DEC-06 — Inventario compartido o separado

- **Contexto:** se solicita una aplicación para ambas operaciones y préstamos entre terceros/DISTRIPERNOS; el gobierno exige aislamiento por organización.
- **Evidencia documental:** Auditoría §§5.1 y 5.3; Registro C-004/C-005; Matriz REQ-013–016; reunión 00:13:23.
- **Problema:** “compartido” puede significar catálogo común, visibilidad, propiedad o stock físico; no son equivalentes.
- **Opción A:** inventarios totalmente separados por organización.
- **Opción B:** catálogo común, pero existencias, costos y propiedad separados.
- **Opción C:** stock compartido mediante propiedad fraccionada/relaciones interempresa y movimientos autorizados.
- **Recomendación técnica:** B como base; representar préstamos/transferencias explícitas sin saldo global editable.
- **Riesgos de cada opción:** A: duplicación y menor visibilidad; B: requiere conciliación interempresa; C: alto riesgo de mezcla de propiedad, costo y autorización.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-07 — Propiedad, custodia, préstamos y devoluciones

- **Contexto:** kits pueden quedar en custodia y existen préstamos de mercadería; el Reglamento propone “sale uno, regresa uno”.
- **Evidencia documental:** Auditoría §5.3; Registro C-008/C-012; Matriz REQ-015–018; Informe 260130 p. 2; Reglamento §4.
- **Problema:** posesión, custodia, propiedad, ubicación, reserva, consumo y devolución deben cambiarse mediante eventos distintos.
- **Opción A:** flujo único de préstamo/devolución para todo material.
- **Opción B:** flujos por categoría: mercadería reutilizable, consumible, residuo/envase y kit en custodia.
- **Opción C:** gestionar solo entradas/salidas en MVP y diferir propiedad/custodia.
- **Recomendación técnica:** B; un movimiento nunca debe transferir propiedad o convertir residuo en stock útil de manera implícita.
- **Riesgos de cada opción:** A: estados contables y físicos incorrectos; B: más catálogo y capacitación; C: impide conciliación confiable y facturación de custodia.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 4 — Obras, cambios técnicos, RFI y órdenes de cambio

### DEC-08 — Autoridad técnica y comercial para cambios en obra

- **Contexto:** se observaron profundidades/longitudes distintas y aprobaciones de campo; el Manual establece que el supervisor no rediseña.
- **Evidencia documental:** Manual §§1, 3 y 12; Auditoría §5.5; Registro C-009/C-011; Planilla 3003-001; Informe 260130.
- **Problema:** una misma solicitud puede necesitar aprobación técnica, contractual y económica de autoridades diferentes.
- **Opción A:** supervisor de obra puede autorizar y ejecutar cambios dentro de límites definidos.
- **Opción B:** todo cambio técnico detiene ejecución hasta aprobación formal de autoridad competente y ajuste comercial cuando aplique.
- **Opción C:** matriz por clase de cambio/impacto, con cambios menores preautorizados y escalamiento del resto.
- **Recomendación técnica:** C únicamente si los límites están aprobados; por defecto, B para parámetros de diseño/producto.
- **Riesgos de cada opción:** A: rediseño o trabajo no autorizado; B: demoras incluso en casos operativos; C: clasificación errónea o límites ambiguos.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-09 — Evidencia mínima: comunicación, RFI y orden de cambio

- **Contexto:** la reunión propone correo; casos de obra mencionan aprobación/requerimiento; el Manual dice que una conversación verbal no cambia el plano.
- **Evidencia documental:** Registro C-009; reunión 00:44:37–00:50:43; Manual §3; Matriz REQ-007/REQ-037/REQ-038.
- **Problema:** no toda autorización por correo tiene la misma autoridad o efecto que una RFI u orden de cambio.
- **Opción A:** correo de persona autorizada basta para todo cambio.
- **Opción B:** RFI técnica y orden de cambio comercial separadas cuando correspondan.
- **Opción C:** flujo configurable por contrato con matriz de autoridad y ratificación de emergencias.
- **Recomendación técnica:** C, preservando solicitud, autoridad, respuesta, revisión afectada, costo y ratificación; nunca asumir equivalencia jurídica.
- **Riesgos de cada opción:** A: autoridad/alcance insuficientes; B: burocracia y retrasos; C: configuración contractual incompleta.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 5 — Comisiones y descuentos

### DEC-10 — Política general de comisiones y devengo

- **Contexto:** existe un acuerdo específico Christian–Juber y una explicación de reunión con diferencias después de 180 días.
- **Evidencia documental:** Acuerdo, cláusulas 2–4; Auditoría §5.2; Registro C-006/C-007; Matriz REQ-009–012.
- **Problema:** no se sabe si existe política general, a quién aplica, cuándo se devenga ni cómo tratar parciales/reversos/mora.
- **Opción A:** modelar únicamente acuerdos individuales versionados.
- **Opción B:** aprobar una política corporativa general con anexos/excepciones.
- **Opción C:** política base más contratos individuales, con precedencia explícita.
- **Recomendación técnica:** C si revisión laboral/comercial/contable la valida; hasta entonces, A y sin generalizar el acuerdo existente.
- **Riesgos de cada opción:** A: administración manual y desigualdad; B: puede contradecir contratos; C: conflictos de precedencia y mayor complejidad.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-11 — Descuentos y cortesías comerciales

- **Contexto:** el acuerdo permite hasta 10 % de descuento; dos obras absorbieron sobrecostos como cortesía inicial.
- **Evidencia documental:** Acuerdo, cláusula 6; Planilla 3003-001; Informe 260130; Registro C-010; Matriz REQ-048/REQ-064.
- **Problema:** descuentos y cortesías afectan precio, margen, comisión y precedente, pero no existe política general confirmada.
- **Opción A:** límites fijos por rol y prohibición fuera de límite.
- **Opción B:** aprobación caso por caso sin límites predefinidos.
- **Opción C:** límites versionados por rol/empresa más escalamiento y motivo obligatorio.
- **Recomendación técnica:** C; registrar valor absorbido, autorizador, motivo, alcance y efecto sobre comisión/margen.
- **Riesgos de cada opción:** A: rigidez comercial; B: inconsistencia y demora; C: mala configuración o fraccionamiento para eludir límites.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 6 — Procedimientos técnicos, calidad y SST

### DEC-12 — Productos iniciales y aprobación de procedimientos

- **Contexto:** no se han incorporado todos los productos, evaluaciones, MPII y SDS reales; “2+2+2” no es universal.
- **Evidencia documental:** Manual §§1, 3, 7 y 27; Auditoría §5.6; Registro C-001; Matriz REQ-033–035.
- **Problema:** el MVP no puede validar pasos, ciclos, purga, curado o inspección sin corpus y aprobadores definidos.
- **Opción A:** piloto con lista cerrada de productos/sistemas y documentos aprobados.
- **Opción B:** biblioteca amplia antes del piloto.
- **Opción C:** formularios genéricos sin parámetros técnicos hasta completar biblioteca.
- **Recomendación técnica:** A; fallar de forma segura cuando no exista combinación aprobada y versionada.
- **Riesgos de cada opción:** A: cobertura inicial limitada; B: retraso y errores de carga; C: baja capacidad de bloqueo y falsa sensación de control.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-13 — Gobierno de calidad, ITP, muestreo y NCR

- **Contexto:** la reunión menciona 20 % como ejemplo y NCR internas; el Manual exige ITP/muestreo aprobados y trazabilidad.
- **Evidencia documental:** Manual §§11–12; Registro C-013/C-016; Matriz REQ-039–042; reunión 00:19:26 y 01:32:34.
- **Problema:** se necesitan autoridad, reglas por obra y clasificación de documentos internos/cliente.
- **Opción A:** reglas corporativas fijas y NCR internas.
- **Opción B:** ITP/muestreo/audiencia configurados por contrato/obra.
- **Opción C:** base corporativa con requisitos contractuales superiores y revisión de divulgación.
- **Recomendación técnica:** C; preservar el registro fuente y no fijar 20 % ni ocultar información por defecto.
- **Riesgos de cada opción:** A: contradicción contractual/técnica; B: variabilidad y carga administrativa; C: conflictos de precedencia y necesidad de revisión competente.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-14 — Gobierno de EPP y trabajo en altura

- **Contexto:** el Reglamento fija EPP y 1,50 m; el Manual exige evaluación de riesgos, SDS y requisitos de obra.
- **Evidencia documental:** Manual §13; Reglamento §3; Registro C-002/C-003; Matriz REQ-044/REQ-045.
- **Problema:** una lista fija no demuestra cumplimiento ni sustituye controles por tarea.
- **Opción A:** convertir el Reglamento en regla fija del sistema.
- **Opción B:** requisitos definidos exclusivamente por evaluación/SDS/obra.
- **Opción C:** mínimos internos versionados más evaluación/SDS/obra, aplicando el requisito superior/específico.
- **Recomendación técnica:** C tras revisión SST; 1,50 m se registra como política pendiente, no como conclusión legal universal.
- **Riesgos de cada opción:** A: protección incorrecta/declaración legal no sustentada; B: omitir mínimos corporativos útiles; C: conflicto de fuentes si no hay precedencia y aprobador.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 7 — Contabilidad, migración e historial

### DEC-15 — Estrategia de integración contable

- **Contexto:** se desea centralizar información, pero el Bosquejo difiere integraciones y la fuente oficial actual no está documentada.
- **Evidencia documental:** Auditoría §§5.9 y 8; Registro C-015/C-017; Matriz REQ-053; Cuestionario 47–51.
- **Problema:** elegir integración, coexistencia o sustitución cambia arquitectura, alcance y riesgo del MVP.
- **Opción A:** integración unidireccional hacia/desde el sistema contable oficial.
- **Opción B:** integración bidireccional con conciliación e idempotencia.
- **Opción C:** sin integración en MVP; exportaciones controladas y proceso manual.
- **Recomendación técnica:** realizar discovery/API antes de aprobar; C o A suelen reducir riesgo inicial, sin decidirlo sin contabilidad.
- **Riesgos de cada opción:** A: datos desactualizados o limitados; B: duplicados, conflictos y alto costo; C: doble trabajo y errores manuales.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-16 — Alcance de migración histórica

- **Contexto:** Christian desea conservar historial al cambiar de sistema; no existe inventario de datos ni prueba de exportación.
- **Evidencia documental:** reunión 01:08:43 y transcripción sobre históricos; Auditoría §5.9; Registro C-015; Matriz REQ-054.
- **Problema:** “conservar historial” puede significar acceso, documentos, saldos, asientos o migración completa.
- **Opción A:** conservar sistema anterior en modo consulta y migrar saldos/maestros.
- **Opción B:** migración selectiva de periodos y entidades acordadas.
- **Opción C:** migración histórica completa con anexos y auditoría.
- **Recomendación técnica:** inventariar/exportar y hacer prueba de reconciliación antes de seleccionar; mantener fuente anterior accesible durante transición.
- **Riesgos de cada opción:** A: dependencia del proveedor anterior; B: historia fragmentada; C: costo, calidad deficiente y falsa completitud.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 8 — GPS, fotografías y documentos personales

### DEC-17 — Finalidad y obligatoriedad de GPS/fotografías

- **Contexto:** se solicita verificar asistencia/obra mediante GPS o foto; Manual y Bosquejo los tratan como evidencia complementaria y mínima.
- **Evidencia documental:** Manual §§20–21; Bosquejo §§5.5 y 9; Matriz REQ-030/REQ-031; Cuestionario 70–74.
- **Problema:** falta definir finalidad, precisión, obligatoriedad, alternativa, acceso y retención.
- **Opción A:** GPS y fotografía obligatorios para asistencia y ejecución.
- **Opción B:** uno de los mecanismos, con alternativa documentada.
- **Opción C:** uso por obra/tarea cuando exista finalidad y política aprobadas.
- **Recomendación técnica:** C; separar asistencia de evidencia técnica, minimizar terceros/metadatos y no tratar captura como prueba autónoma.
- **Riesgos de cada opción:** A: vigilancia excesiva, exclusión y falsa certeza; B: evidencia inconsistente; C: configuración y capacitación por contexto.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-18 — Documentos laborales: acceso, retención y responsable

- **Contexto:** se quiere que técnicos consulten certificados desde el teléfono; contienen datos personales y vencimientos.
- **Evidencia documental:** reunión 00:15:07/00:39:25; Bosquejo §§5.11 y 9; Matriz REQ-032; Cuestionario 58–60 y 70–72.
- **Problema:** no están definidos entidad responsable, categorías, visibilidad a cliente/obra, retención ni preservación.
- **Opción A:** repositorio central de todos los documentos por organización.
- **Opción B:** conservar solo metadatos/vigencia y enlace al custodio oficial.
- **Opción C:** modelo mixto por tipo documental, finalidad y necesidad de acceso.
- **Recomendación técnica:** C, con mínimo necesario, acceso por rol/obra, registro de visualización/exportación y política de retención.
- **Riesgos de cada opción:** A: sobrecolección y exposición; B: indisponibilidad en obra y enlaces rotos; C: clasificación y gobierno más complejos.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Bloque 9 — Infraestructura y seguridad

### DEC-19 — Identidad, cuentas y segregación de funciones

- **Contexto:** la arquitectura exige aislamiento; el proveedor de identidad y los roles críticos siguen abiertos.
- **Evidencia documental:** Bosquejo §§4, 6.3 y 9; `docs/decisions/open-questions.md`; Matriz REQ-003/REQ-004/REQ-056.
- **Problema:** autenticación, MFA, altas/bajas y aprobación crítica afectan toda la arquitectura.
- **Opción A:** proveedor OIDC gestionado con MFA y cuentas individuales.
- **Opción B:** identidad propia en la aplicación.
- **Opción C:** federación/varios proveedores por organización.
- **Recomendación técnica:** A salvo requisito probado; nunca cuentas compartidas y MFA para administradores/aprobadores críticos.
- **Riesgos de cada opción:** A: dependencia/costo del proveedor; B: alta carga y riesgo de seguridad; C: complejidad de federación y soporte.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-20 — Alcance offline y dispositivos del MVP

- **Contexto:** el Bosquejo propone PWA offline, pero dispositivos, conectividad, formularios y volumen de fotos no están confirmados.
- **Evidencia documental:** Bosquejo §8; `docs/decisions/open-questions.md`; Matriz REQ-058/REQ-059; Cuestionario 76 y 80.
- **Problema:** el alcance offline determina almacenamiento local, sincronización, conflictos, pruebas y seguridad.
- **Opción A:** offline completo para campo, incluidos archivos/fotos en cola.
- **Opción B:** offline limitado a tareas, catálogos y formularios esenciales; funciones críticas conectadas.
- **Opción C:** MVP solo conectado con piloto de conectividad.
- **Recomendación técnica:** B si los escenarios reales lo confirman; probar almacenamiento lleno, reintentos, duplicados y conflictos.
- **Riesgos de cada opción:** A: gran complejidad y exposición local; B: límites operativos en zonas sin red; C: falla del producto en campo desconectado.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

### DEC-21 — Alojamiento, región, respaldo y continuidad

- **Contexto:** la reunión menciona hosting vigente hasta 2030 y VPS/Java, pero el stack aprobado es Next.js/PostgreSQL y no hay decisión de producción, RTO o RPO.
- **Evidencia documental:** reunión 00:11:58; Bosquejo §§2, 9 y 13; Auditoría §8; Cuestionario 77–79.
- **Problema:** una suscripción existente no demuestra capacidad, región, seguridad, respaldo ni recuperación adecuados.
- **Opción A:** usar el hosting existente si una evaluación técnica y contractual lo aprueba.
- **Opción B:** proveedor gestionado de aplicación, base de datos y objetos.
- **Opción C:** VPS/autogestión con responsabilidades operativas explícitas.
- **Recomendación técnica:** realizar evaluación de requisitos y prueba de restauración antes de seleccionar; definir región, secretos, observabilidad, RTO/RPO y responsables.
- **Riesgos de cada opción:** A: capacidades/condiciones insuficientes; B: costo y dependencia; C: carga operativa, parches y recuperación deficientes.
- **Decisión seleccionada:**
- **Observaciones:**
- **Aprobador:**
- **Fecha:**

## Control de cierre del formulario

- **Decisiones seleccionadas en la reunión:**
- **Decisiones diferidas:**
- **Decisiones que requieren autoridad externa:**
- **Responsable de consolidar el registro:**
- **Fecha objetivo de revisión:**
