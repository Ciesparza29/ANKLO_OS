# Guía de edición documental de ANKLO-OS

## 1. Propósito

Establecer criterios comunes para editar documentos de ANKLO-OS con alcance limitado, trazabilidad y respeto por la autoridad de cada fuente.

Esta guía desarrolla prácticas editoriales. El `AGENTS.md` raíz contiene las instrucciones ejecutables superiores para agentes y prevalece ante cualquier contradicción.

## 2. Alcance

Aplica a documentación técnica, funcional, operativa, de producto, arquitectura, decisiones, discovery y gobierno del repositorio. No sustituye contratos, normativa aplicable, planos, RFI, evaluaciones, MPII ni políticas aprobadas.

## 3. Jerarquía de instrucciones y fuentes

1. Instrucciones vigentes aplicables al repositorio y al alcance concreto.
2. Normativa cuya aplicabilidad haya sido determinada por autoridad competente.
3. Contrato, especificaciones, planos, RFI y órdenes de cambio aplicables.
4. Instrucciones de fabricante, evaluaciones y MPII vigentes para el sistema concreto.
5. Documentos internos aprobados dentro de su alcance.
6. Documentos propuestos o en borrador.
7. Prácticas internas, fuentes crudas, transcripciones y salidas de IA.

La ubicación, el título o la fecha de un archivo no prueban por sí solos su autoridad.

## 4. Clasificación documental

- **Canónico:** fuente designada para gobernar un ámbito concreto; puede requerir todavía aprobación especializada.
- **Aprobado:** revisado y aceptado por la autoridad competente dentro de un alcance y vigencia identificados.
- **Propuesto:** decisión o solución presentada para evaluación, todavía no aceptada.
- **Borrador:** contenido de trabajo sujeto a revisión y cambios.
- **Histórico:** versión o artefacto conservado para trazabilidad, no para uso vigente.
- **Fuente cruda:** material original sin depuración editorial, como notas, grabaciones, formularios o exportaciones.
- **Salida de IA:** contenido generado o transformado por un sistema de IA; no es autoridad por sí solo.
- **Obsoleto:** contenido sustituido o incompatible con una fuente vigente; se conserva solo cuando exista una razón de trazabilidad.

La clasificación debe indicar alcance, estado, versión o fecha cuando sean conocidos. No se presume aprobación por ausencia de una etiqueta.

## 5. Intervención mínima

- Editar solo los archivos y asuntos autorizados.
- Preferir la modificación localizada frente a la reescritura extensa.
- No corregir asuntos oportunistas fuera del alcance.
- Conservar contenido válido y evitar duplicar requisitos existentes.
- Mantener la terminología vigente salvo que el cambio terminológico sea parte del encargo.

## 6. Trazabilidad y justificación

Cada cambio sustantivo debe poder relacionarse con una solicitud, fuente o decisión identificable. Cuando corresponda, registrar motivo, autoridad, alcance, fecha, estado, dependencias y documentos afectados.

Una corrección de un documento aprobado crea la revisión, evento o mecanismo de cambio que corresponda; no debe ocultar silenciosamente el contenido anterior.

## 7. Tratamiento técnico y normativo

- Distinguir una norma aplicable de una mera referencia normativa.
- Separar requisitos contractuales, instrucciones de fabricante, políticas internas y prácticas observadas.
- No inventar parámetros, permisos, obligaciones, aprobaciones o criterios de aceptación.
- No convertir ejemplos o valores observados en reglas universales.
- Escalar los asuntos que requieran validación técnica, jurídica, laboral, contable, de SST o de privacidad.

## 8. Redacción condicionada

Cuando falte evidencia o autoridad suficiente, usar formulaciones que indiquen la condición pendiente, el alcance conocido y la validación requerida. Evitar afirmar cumplimiento, vigencia, obligatoriedad o aprobación sin respaldo verificable.

## 9. Formato

- Conservar títulos, numeración, anclas y estructura salvo razón aprobada.
- Mantener enlaces y referencias relativos cuando favorezcan la portabilidad.
- Preservar front matter y sus campos no afectados.
- Usar Markdown limpio, legible y compatible con las herramientas del repositorio.
- Evitar HTML innecesario y formatos dependientes de un sistema operativo.
- Conservar la codificación y los finales de línea; no realizar conversiones masivas sin alcance explícito.

## 10. Fuentes crudas y transcripciones

- No se convierten automáticamente en requisitos, decisiones o hechos aprobados.
- Las atribuciones pueden ser incompletas o incorrectas y deben marcarse como no verificadas cuando corresponda.
- Los datos personales o sensibles se minimizan y no se reproducen sin necesidad y autorización.
- No se versionan ordinariamente cuando su sensibilidad, volumen o falta de depuración lo desaconsejen.
- Cuando deban preservarse, registrar procedencia, hash, clasificación, limitaciones, acceso y destino de la extracción depurada.
- La extracción debe distinguir texto registrado, resumen editorial, propuesta, pregunta, supuesto y decisión confirmada por otra fuente.

## 11. Salidas de IA

- No constituyen autoridad ni aprobación.
- Deben relacionarse con fuentes verificables y conservar sus limitaciones.
- Requieren revisión humana antes de incorporarse a documentación gobernante.
- No deben mezclarse con decisiones aprobadas ni presentarse como evidencia primaria.
- Una transformación mediante IA crea un derivado; no reemplaza silenciosamente el original.

## 12. Duplicados, históricos y obsolescencia

Antes de crear contenido, buscar equivalentes y determinar cuál gobierna. Un duplicado sustituido puede eliminarse del working tree cuando su historia esté preservada y exista autorización. Los documentos históricos u obsoletos deben identificarse claramente y no enlazarse como vigentes.

## 13. Criterios de detención

Detener la edición y solicitar decisión cuando:

- exista una contradicción material entre instrucciones o fuentes gobernantes;
- el cambio pueda alterar una regla técnica, contractual o normativa sin respaldo;
- se requiera una atribución, aprobación o permiso no verificable;
- aparezcan secretos, credenciales o datos sensibles fuera del tratamiento autorizado;
- el alcance exija reestructurar documentos o decisiones no autorizados;
- no pueda preservarse la fuente, trazabilidad o formato exigidos.

## 14. Verificaciones mínimas

- Revisar el diff completo y su alcance.
- Ejecutar `git diff --check` y los verificadores exigidos por el `AGENTS.md` raíz.
- Comprobar enlaces y referencias modificados dentro de un alcance razonable.
- Confirmar que estados, versiones y aprobaciones no cambiaron accidentalmente.
- Buscar secretos, datos sensibles y rutas personales introducidas.
- Verificar que no se alteraron codificación o finales de línea de forma masiva.

## 15. Lista de comprobación final

- [ ] El cambio responde únicamente al alcance autorizado.
- [ ] La fuente y la autoridad están identificadas.
- [ ] Los estados documental y decisorio son correctos.
- [ ] Las incertidumbres permanecen explícitas y condicionadas.
- [ ] No se incorporaron fuentes crudas o salidas de IA como autoridad.
- [ ] Se preservaron estructura, enlaces, front matter y formato no afectados.
- [ ] No se añadieron datos sensibles, secretos ni rutas personales innecesarias.
- [ ] El diff y las verificaciones aplicables fueron revisados.
