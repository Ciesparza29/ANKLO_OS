# Auditoría documental previa al PRD — ANKLO / DISTRIPERNOS

**Versión:** 1.0\
**Fecha:** 12 de julio de 2026\
**Estado:** auditoría de descubrimiento; no constituye PRD, dictamen jurídico, procedimiento aprobado ni especificación de instalación.

## 1. Resumen ejecutivo

La documentación sostiene la necesidad de un ERP multiempresa que conecte la actividad comercial de DISTRIPERNOS con la operación de campo atribuida a ANKLO, pero no determina de forma consistente la naturaleza jurídica de ANKLO ni qué entidad realiza cada acto comercial y operativo. Los documentos de obra identifican a DISTRIPERNOS S.A.S. como contratista o a ANKLO como división de esta; la reunión también habla de escoger entre ambas dentro de una sola aplicación. Esta ambigüedad bloquea el modelo de organizaciones, contratos, inventario, facturación, auditoría y permisos.

La arquitectura v1.1 y los ADR proporcionan una base provisional coherente: monolito modular, aislamiento por `organization_id`, permisos por organización/obra/estado, auditoría append-only, archivos separados y evidencia versionada. No autorizan modelos funcionales ni resuelven los asuntos societarios, contables o técnicos pendientes.

El Manual Maestro v1.1 fija una salvaguarda decisiva: el supervisor no rediseña y ningún procedimiento genérico sustituye normativa aplicable, contrato, plano aprobado, RFI, evaluación o MPII. Por ello, el método “2+2+2”, la selección fija de EPP, el umbral de altura de 1,50 m y el muestreo del 20 % se registran como políticas o prácticas propuestas sujetas a validación, nunca como parámetros universales del producto.

El acuerdo comercial del 1 de febrero de 2026 es específico de Christian Andrade y Juber Valerio. Regula honorario, comisiones, descuentos y penalización sobre ventas efectivamente cobradas; no demuestra una política general para todo vendedor. Además, contradice la reunión en el tratamiento de cobros posteriores a 180 días y deja ambigua la aplicación de tramos y el devengo exacto.

Los dos cierres de obra muestran diferencias entre cantidades cotizadas, ejecutadas, entregadas en custodia y facturables, y documentan absorciones excepcionales de sobrecostos. Son evidencia de casos reales, no autorización para automatizar cortesías ni cambios técnicos. El sistema futuro deberá separar solicitud, evaluación técnica, RFI, cambio comercial, autorización, ejecución y conciliación.

## 2. Alcance y método

Se revisaron completamente los documentos obligatorios disponibles en el repositorio y en `ANKLO_DISTRIPERNOS_PAQUETE DOCUMENTAL`. Se contrastaron afirmaciones por tipo, autoridad, alcance y fecha. Las referencias a normas o fabricantes contenidas en documentos internos se trataron como citas secundarias; esta auditoría no validó su vigencia ni aplicabilidad.

La transcripción de reunión declara haber sido generada automáticamente y ser editable. Sus timestamps sirven para trazabilidad, pero no elevan su autoridad ni garantizan literalidad. Los nombres de archivo, firmas digitalizadas y títulos tampoco se tomaron como prueba autónoma de validez jurídica.

## 3. Fuentes revisadas

| Código | Fuente                                    | Naturaleza y alcance usado                                 | Autoridad en esta auditoría                                                       |
| ------ | ----------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| F-01   | `README.md` raíz                          | Estado técnico del repositorio y comandos                  | Gobierno técnico vigente                                                          |
| F-02   | `AGENTS.md` raíz                          | Invariantes, fuentes y límites de trabajo                  | Gobierno técnico vigente                                                          |
| F-03   | `ANKLO_Paquete_Documental_v1.0/README.md` | Estado, vigencia y límites documentales                    | Control documental del paquete                                                    |
| F-04   | Manual Maestro v1.1                       | Manual corporativo en borrador sujeto a aprobación         | Orientación técnica fuerte; no sustituye fuentes superiores                       |
| F-05   | Bosquejo de Arquitectura v1.1             | Anteproyecto funcional y técnico                           | Propuesta futura/provisional                                                      |
| F-06   | Resumen Maestro v1.1                      | Contexto coordinado del proyecto                           | Contextual, no decisorio por sí solo                                              |
| F-07   | Glosario v1.1-borrador                    | Terminología con fuentes pendientes                        | Auxiliar no aprobado                                                              |
| F-08   | Notas reunión 11-jul-2026                 | Fuente cruda de discovery; exportación automática editable | Confidencial y no canónica; no constituye aprobación ni requisito por sí sola     |
| F-09   | Planilla SEMAICA 3003-001                 | Cierre comercial de una obra concreta                      | Evidencia contractual/operativa del caso; alcance por confirmar                   |
| F-10   | Acuerdo de Gestión Comercial, 01-feb-2026 | Acuerdo específico Christian–Juber                         | Política contractual específica; validez y vigencia requieren revisión competente |
| F-11   | Informe técnico 260130                    | Cierre de obra EDIACERO/Corporación Favorita               | Evidencia operativa/comercial del caso                                            |
| F-12   | Reglamento Interno y Protocolo Operativo  | Política interna y protocolo propuesto                     | Sujeto a revisión técnica, SST, laboral y corporativa                             |
| F-13   | `docs/architecture/module-boundaries.md`  | Límites modulares futuros                                  | Decisión técnica provisional                                                      |
| F-14   | `docs/decisions/open-questions.md`        | Incertidumbres declaradas                                  | Registro vigente de pendientes                                                    |
| F-15   | `docs/backlog/sprint-0.md`                | Alcance realizado de fundación                             | Registro de ejecución técnica                                                     |
| F-16   | ADR 0001                                  | Arquitectura base                                          | Aceptada provisionalmente                                                         |
| F-17   | ADR 0002                                  | Puertos y adaptadores                                      | Aceptada provisionalmente                                                         |

También se revisaron los recursos citados localmente por las fuentes: los SVG de arquitectura/flujo y las referencias cruzadas entre ADR, Manual, Bosquejo, Resumen y Glosario. No se accedió a los enlaces externos de Google Drive ni se verificaron textos completos de normas, contratos, planos, RFI, evaluaciones o MPII no incorporados al expediente.

### 3.1 Procedencia y tratamiento de F-08

El archivo original `ANKLO_Paquete_Documental_v1.0/NOTAS_REUINION_ADMIN_ANKLO.md` corresponde a una exportación de Google Docs con resumen y transcripción automática editable de Google Meet/Gemini; declara una reunión del 11 de julio de 2026. Su SHA-256 es `65735F4A5FFB236573DA9B07B3A9197CE63DF53632E37DB0A45B1C1EC015DC27`. Las atribuciones de hablantes no son verificables y el contenido presenta al menos una inconsistencia interna de identificación.

La fuente contiene datos personales, laborales, financieros y comerciales; se clasifica como confidencial, no canónica y no apta para versionado ordinario. Los requisitos útiles fueron extraídos y depurados en esta auditoría, las matrices y contradicciones de discovery, el PRD y los ADR. El original se preservó fuera de Git, bajo acceso restringido, en el archivo lógico privado de fuentes crudas de ANKLO-OS. Su retención definitiva permanece pendiente. Esta fuente no debe usarse como aprobación ni requisito por sí sola.

## 4. Jerarquía de autoridad

La jerarquía es contextual, no meramente cronológica:

1. **Legal o regulatoria:** norma vigente y aplicable, determinada por análisis competente. Ningún documento revisado prueba por sí solo la aplicabilidad completa.
2. **Contractual:** contrato, alcance, planos aprobados, especificaciones, RFI y órdenes de cambio aplicables a la obra. Una práctica interna no los modifica.
3. **Especificación técnica externa y fabricante/MPII:** evaluación/aprobación y documentación vigente del sistema específico. Gobiernan variables dependientes del producto dentro de su ámbito.
4. **Manual corporativo aprobado:** organiza la operación sin contradecir niveles superiores. El Manual v1.1 está sujeto a validación corporativa, técnica y jurídica.
5. **Política interna:** puede regir internamente tras aprobación, pero no crea por sí sola cumplimiento legal ni cambia un contrato. Aquí se ubica el Reglamento.
6. **Práctica operativa actual:** evidencia cómo se actuó en casos concretos; no se universaliza.
7. **Requisito solicitado por stakeholder:** insumo para el PRD, sujeto a confirmación, autoridad y criterios de aceptación.
8. **Propuesta futura:** arquitectura, roadmap o funcionalidad aún no aprobada/implementada.
9. **Supuesto:** inferencia sin fuente suficiente; no debe programarse.
10. **Decisión pendiente:** asunto que necesita autoridad identificada antes de convertirse en requisito.

Regla central: el supervisor no rediseña; una conversación verbal no cambia el plano; las variables técnicas por producto provienen de fuentes aprobadas y versionadas; observar las primeras supervisiones puede estandarizar el flujo operativo, no inventar parámetros de instalación.

## 5. Hallazgos por dominio

### 5.1 Estructura empresarial y núcleo multiempresa

- Se requiere una aplicación con selección de empresa/unidad y aislamiento estricto, pero no está definida la relación ANKLO–DISTRIPERNOS ni el titular de clientes, contratos, inventarios, personal y evidencia.
- El modelo debe soportar organizaciones, sucursales/unidades, obras y relaciones interempresa sin compartir datos por defecto.
- No debe implementarse “empresa” como simple etiqueta visual: autorización, numeración, archivos, movimientos y auditoría requieren alcance explícito.

### 5.2 Comercial, facturación, cobranza y comisiones

- La reunión solicita CRM, cotización, recotización, cobranza, rentabilidad e integración contable; el Bosquejo ubica CRM fuera del MVP original. La prioridad debe decidirse en PRD.
- El acuerdo específico calcula comisiones sobre valor neto efectivamente cobrado y exige factura electrónica del gestor; su generalización está prohibida sin política aprobada.
- Deben separarse venta, factura, cobro/aplicación, elegibilidad, devengo, liquidación, penalización, reverso y pago de comisión.
- La facturación local y la integración con SRI/proveedor contable requieren evaluación externa; no se puede inferir una integración por la conversación.

### 5.3 Inventario, propiedad, custodia y préstamos

- El saldo debe derivarse de movimientos. Propiedad, custodio, ubicación, reserva, préstamo, consumo, devolución, merma y ajuste son dimensiones distintas.
- “Sale uno, regresa uno” es política interna propuesta, no regla universal: podría bloquear reposición legítima o confundir devolución de envases/residuos con stock reutilizable.
- Los kits en custodia no equivalen automáticamente a venta, consumo ni cantidad facturable.

### 5.4 Cotizador y optimización de cortes de espárragos

Se requieren cinco estados separados:

1. **Cotización rápida:** estimación no vinculante con supuestos visibles, precios vigentes y disponibilidad indicativa.
2. **Plan de producción aprobado:** solución matemática reproducible, versión de entradas, objetivo de optimización, reservas y aprobador.
3. **Ejecución:** barras/remanentes realmente usados, cortes, operador, equipo, ancho real y pérdidas.
4. **Conciliación real:** plan versus resultado, variaciones, causa, costos y aprobación de ajustes.
5. **Alta/reutilización de remanentes:** identidad, longitud medida, especificación, propiedad, custodia, estado, ubicación, reserva y valor recuperable.

Entradas mínimas: diámetro, norma, grado, material, acabado/recubrimiento, tipo/paso de rosca, longitud comercial y útil, cantidad, tolerancia, ancho real de corte, pérdidas de preparación/acabado, costos de material y corte, tiempo, remanentes, longitud mínima reutilizable, valor recuperable, disponibilidad, propiedad, custodia y reserva. No se deben mezclar materiales incompatibles ni consumir stock ajeno. El motor debe ser determinista (optimización combinatoria/entera o heurística verificable), con resultado y restricciones explicables; la IA generativa no es el motor matemático.

### 5.5 Obras, campo y calidad

- La orden, lote, anclaje, cuadrilla, asistencia, avance, fotografías, GPS, herramientas, consumibles e incidencias deben compartir la obra como contexto, sin invadir internals de otros módulos.
- GPS y fotografía son evidencia complementaria, no prueba autónoma de ubicación, autoría o jornada. Se necesita finalidad, minimización, aviso, acceso, retención y mecanismo alternativo.
- ITP, Hold/Witness, inspección, muestreo, ensayo, NCR, CAPA y RFI son objetos diferentes. Un porcentaje observado en reunión no debe codificarse como muestreo universal.
- Debe existir separación entre registro interno de desviaciones y entregables contractuales al cliente; no se debe ocultar información que el contrato o una obligación aplicable exija revelar.

### 5.6 Biblioteca de procedimientos técnicos versionados

La biblioteca conceptual debe relacionar sistema de anclaje, adhesivo, elemento, sustrato, condición del orificio, perforación, orientación, diámetro, profundidad, temperatura, accesorios, pasos ordenados, ciclos, purga, inyección, tiempo de trabajo, curado, inspección, evidencia, documentos fuente, revisión, aprobador y vigencia. Una versión publicada es inmutable; una modificación crea otra revisión y preserva qué versión gobernó cada ejecución.

Los artefactos no son equivalentes:

- **Manual de Operaciones:** marco corporativo, roles, principios y procesos transversales.
- **POE/SOP:** flujo repetible aprobado para una actividad y su control organizacional.
- **Procedimiento técnico por producto:** parámetros y secuencia condicionados por sistema, aprobación, MPII, método y entorno.
- **Checklist digital:** interfaz/validación derivada de una versión aprobada; no es fuente primaria.
- **Registro de ejecución:** evidencia de qué ocurrió realmente, incluidas desviaciones y versión aplicable.

La selección de un procedimiento debe fallar de forma segura cuando no exista combinación aprobada. No debe recurrir a “2+2+2” como valor por defecto.

### 5.7 SST, personal y documentos laborales

- Los requisitos de EPP se derivan de evaluación de riesgos, SDS, tarea y obra; el Reglamento puede aportar mínimos internos solo tras revisión competente.
- El umbral de 1,50 m no debe accionar por sí solo una conclusión legal. El sistema debe registrar análisis, controles, permiso y plan de rescate cuando aplique.
- Documentación laboral, competencia, asistencia y geolocalización contienen datos personales potencialmente sensibles; necesitan acceso restringido y políticas de retención.
- Productividad individual no debe convertirse en decisión automatizada disciplinaria, laboral o de aptitud.

### 5.8 Costos, viáticos, rentabilidad e informes

- Se requiere costeo por obra de material, mano de obra, herramientas, mantenimiento, transporte, EPP, viáticos y sobrecostos, con comparación contra cotización y cambio aprobado.
- Cortesías y absorciones deben ser decisiones autorizadas, con motivo, importe, alcance y efecto en margen; nunca una automatización derivada de precedentes.
- Los informes se generan desde datos aprobados y distinguen originales/derivados. El hash apoya integridad, no prueba autoría, fecha, ubicación o validez.

### 5.9 Contabilidad y migración histórica

- El objetivo declarado es conservar historial al cambiar de sistema, pero no hay inventario de datos, derechos de exportación, calidad, formato, periodo ni estrategia de conciliación.
- Debe decidirse entre integración, coexistencia, importación de saldos/documentos y migración histórica completa. El ERP contable anterior continúa siendo fuente hasta un corte formal.

### 5.10 Seguridad, offline e IA

- La propuesta exige validación servidor, aislamiento multiempresa, MFA para roles críticos, secretos externos, archivos no públicos, URLs temporales, antimalware, auditoría de exportaciones y pruebas de acceso cruzado.
- Offline debe usar operaciones idempotentes, estados visibles y resolución humana de conflictos críticos. El alcance real de dispositivos/conectividad sigue bloqueante.
- IA solo asiste sobre fuentes aprobadas, cita documento/revisión y registra `AIInteraction` separado de `HumanReviewDecision`. No decide seguridad, conformidad, personal, pagos ni derechos y no inventa parámetros.

## 6. Contradicciones principales

Las quince contradicciones obligatorias se desarrollan en `Registro_Contradicciones_v1.0.md`. Las de mayor riesgo son: identidad jurídica y roles de cada entidad; autoridad de cambios en obra; procedimiento técnico genérico frente a MPII; devengo/penalización de comisiones; cantidad facturable frente a ejecución/custodia; y separación entre evidencia interna y entregable contractual.

## 7. Riesgos

| Riesgo                                  | Consecuencia                                                | Control recomendado                                             |
| --------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| Modelar ANKLO como entidad sin decisión | Facturas, contratos y datos atribuidos al sujeto equivocado | RACI societario/comercial aprobado antes del modelo funcional   |
| Parametrizar “2+2+2” universal          | Instalación contraria al sistema aprobado                   | Biblioteca versionada y selección cerrada por combinación       |
| EPP/altura fijos sin evaluación         | Control insuficiente o declaración legal incorrecta         | Matriz de riesgos, SDS y requisitos de obra versionados         |
| Ejecutar cambios por aprobación verbal  | Trabajo no autorizado y disputa comercial/técnica           | Flujo RFI/cambio con autoridad y evidencia definida             |
| Confundir custodia con venta            | Inventario, ingresos e impuestos erróneos                   | Estados separados de propiedad, posesión, consumo y facturación |
| Generalizar acuerdo comercial           | Liquidaciones laborales/comerciales incorrectas             | Políticas por contrato, vigencia, persona y versión             |
| Ocultar NCR internas                    | Incumplimiento contractual o pérdida de trazabilidad        | Clasificación de divulgación con revisión de calidad/legal      |
| Migración sin conciliación              | Pérdida de historial o doble contabilización                | Inventario, mapeo, pruebas, reconciliación y acta de corte      |
| GPS/fotos excesivos                     | Riesgo de privacidad y vigilancia                           | Finalidad, minimización, acceso, retención y alternativa        |
| IA como decisor o calculador técnico    | Resultado no reproducible o peligroso                       | Motor determinista; revisión humana y fuentes aprobadas         |

## 8. Vacíos de información

- Documentos constitutivos, RUC, nombres comerciales y acuerdos interempresa.
- Contratos completos, proformas, órdenes de compra, planos, RFI y órdenes de cambio de los casos revisados.
- Catálogo real de productos, MPII/SDS/evaluaciones vigentes y matriz de riesgos por tarea.
- Política aprobada de descuentos, cortesías, crédito, cobranza y comisiones fuera del acuerdo específico.
- Reglas tributarias/contables, proveedor, API, catálogo contable y alcance de SRI.
- Inventario maestro, unidades, lotes, propiedad, saldos, remanentes y préstamos actuales.
- Método de optimización, objetivos/prioridades y tolerancias del taller.
- RACI de aprobación técnica, comercial, calidad, SST y documental.
- Plantillas contractuales de entregables, clasificación interno/cliente y reglas de firma.
- Dispositivos, conectividad, infraestructura, RTO/RPO, respaldo y recuperación.
- Finalidad/base aplicable, retención y acceso para GPS, fotos y datos laborales.

## 9. Recomendaciones

1. Resolver primero identidad/relaciones empresariales y elaborar un RACI de “cotiza–contrata–suministra–instala–factura–cobra”.
2. Levantar tres talleres: comercial-contable, inventario/taller y operación-calidad-SST, usando el cuestionario adjunto.
3. Recopilar fuentes primarias por producto y obra; no aprobar procedimientos sin MPII/evaluación/planos aplicables.
4. Prototipar los estados y conciliaciones antes de diseñar tablas: cotización→cambio→ejecución→facturación; propiedad→custodia→consumo; plan de corte→real.
5. Definir catálogo de tipos documentales, autoridad, audiencia, firma/aprobación, retención y preservación.
6. Mantener CRM/contabilidad/facturación como alcance condicionado hasta decidir MVP e integración.
7. Añadir las decisiones confirmadas a `docs/decisions/open-questions.md` en una fase posterior autorizada; este encargo no permite modificarlo.

## 10. Decisiones para Christian e Israel

Christian debe confirmar la operación real, autoridades, políticas comerciales, alcance de documentos al cliente, catálogo de productos y excepciones aceptables. Israel debe convertir decisiones aprobadas en requisitos verificables y señalar impactos de arquitectura, seguridad, datos e integración. Ambos deben aprobar conjuntamente: estructura multiempresa, MVP, RACI, estados de cambios/custodia/facturación, estrategia contable-histórica, privacidad de evidencia y gobierno documental. Ninguno debe decidir unilateralmente aplicabilidad jurídica o parámetros técnicos que correspondan a profesional/autoridad competente, contrato o fabricante.

## 11. Alcance excluido

No se redactó PRD, no se emitió dictamen legal/técnico, no se validó cumplimiento normativo, no se diseñó esquema Prisma, no se codificaron parámetros, no se eligió proveedor y no se modificaron documentos existentes.
