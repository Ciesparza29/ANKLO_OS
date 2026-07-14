# Registro de contradicciones — ANKLO / DISTRIPERNOS

**Versión:** 1.0 — 12 de julio de 2026\
**Uso:** insumo de decisión previo al PRD. “Recomendación” indica cómo evitar una decisión prematura; no resuelve la contradicción.

## C-001 — “2+2+2” universal frente a procedimiento específico

- **Fuentes enfrentadas:** Reglamento, §5, párrs. 23–25; reunión 11-jul-2026, 00:25:07 y 01:25:04; Manual v1.1, §§1, 7 y 27.
- **Resumen fiel:** Reglamento/reunión presentan una secuencia fija; el Manual exige secuencia aprobada por producto, método y condición y dice que la limpieza no es una frase genérica.
- **Impacto técnico:** podría seleccionar ciclos/accesorios incorrectos. **Operativo:** checklist rígido o falso bloqueo. **Legal/comercial:** posible discordancia con contrato, aprobación o MPII.
- **Riesgo de programarlo mal:** crítico; falsa conformidad.
- **Opciones:** (A) regla universal; (B) plantilla orientativa; (C) biblioteca versionada sin valor por defecto.
- **Recomendación:** C; conservar “2+2+2” solo como política/procedimiento de alcance explícito si fuente competente lo aprueba.
- **Autoridad que decide:** responsable técnico/calidad con fuentes aprobadas; fabricante/diseñador/contrato según aplicabilidad.

## C-002 — EPP fijo frente a selección por riesgo/SDS

- **Fuentes enfrentadas:** Reglamento, §3, párrs. 13–18; Manual v1.1, §13.3; reunión, 00:34:21 y 00:38:11.
- **Resumen fiel:** Reglamento fija equipos concretos; Manual exige evaluación de riesgos, SDS y tarea, y advierte que listas/materiales genéricos no bastan.
- **Impactos:** técnico: incompatibilidad o protección insuficiente; operativo: entrega/inspección errónea; legal/SST: declaración de cumplimiento no sustentada.
- **Riesgo:** alto.
- **Opciones:** mínimos internos + requisitos variables; matriz solo variable; lista fija.
- **Recomendación:** mínimos internos versionados, complementados por evaluación/SDS/obra; nunca “cumple” por marcar una lista.
- **Autoridad:** responsable SST y asesoría competente; requisitos de obra y SDS.

## C-003 — Altura desde 1,50 m frente a análisis aplicable

- **Fuentes:** Reglamento §3, párr. 18; Manual v1.1, §§13.1–13.3; contrato/normativa no aportados.
- **Resumen:** Reglamento activa arnés/línea de vida sobre 1,50 m; el Manual exige jerarquía de controles, sistema diseñado y análisis del trabajo.
- **Impactos:** técnico/operativo: control inadecuado; legal: umbral presentado como regla legal sin validación.
- **Riesgo:** alto.
- **Opciones:** umbral fijo; parámetro por política/obra; evaluación por tarea con disparadores configurables.
- **Recomendación:** evaluación por tarea y requisitos versionados; registrar 1,50 m únicamente como política interna pendiente de validación.
- **Autoridad:** SST, cliente/contrato y asesoría legal/regulatoria competente.

## C-004 — ANKLO independiente frente a división de DISTRIPERNOS

- **Fuentes:** Informe 260130, portada y firma (“División…”, “ANKLO | Distripernos S.A.S.”); Planilla 3003-001 (contratista DISTRIPERNOS S.A.S.); reunión 00:08:01/00:13:23 (dos plataformas/selección); Reglamento (ANKLO).
- **Resumen:** se usa ANKLO como identidad operativa/división y también como opción empresarial diferenciada, sin documento constitutivo.
- **Impactos:** afecta tenant, contratos, personal, propiedad, numeración, marca y auditoría; puede atribuir obligaciones al sujeto equivocado.
- **Riesgo:** crítico.
- **Opciones:** marca/unidad de DISTRIPERNOS; entidad separada; estructura mixta con relaciones interempresa.
- **Recomendación:** no modelar hasta contar con decisión documentada y evidencia societaria/fiscal.
- **Autoridad:** Christian/representantes autorizados, contabilidad y asesoría legal.

## C-005 — Quién cotiza, contrata, suministra, instala, factura y cobra

- **Fuentes:** Planilla 3003-001; Informe 260130; reunión 00:08:01–00:13:23; Acuerdo, cláusulas 1, 2 y 5.
- **Resumen:** casos atribuyen varios actos a DISTRIPERNOS/ANKLO/Christian y al gestor, sin RACI ni mandato general.
- **Impactos:** flujos, permisos, inventario, ingresos, impuestos y responsabilidad quedan indeterminados.
- **Riesgo:** crítico.
- **Opciones:** una entidad integral; entidades por función; configuración por contrato/obra.
- **Recomendación:** matriz RACI y entidad legal por acto/documento; permitir variación por contrato solo si está aprobada.
- **Autoridad:** representantes legales, comercial, contabilidad y asesoría jurídica/tributaria.

## C-006 — Comisiones de reunión frente a acuerdo firmado

- **Fuentes:** reunión 01:27:54–01:30:57; Acuerdo, cláusulas 2–4 y 6.
- **Resumen:** coinciden parcialmente en 10 % + 2 % y escalera; la reunión la describe como oferta a empleados y omite/varía términos del acuerdo específico.
- **Impactos:** cálculo y elegibilidad; disputas de pago/laborales.
- **Riesgo:** alto.
- **Opciones:** acuerdo como regla global; políticas individuales versionadas; nueva política corporativa.
- **Recomendación:** políticas/contratos por persona, rol, vigencia y empresa; no generalizar el acuerdo Christian–Juber.
- **Autoridad:** partes del acuerdo y responsables laboral/comercial/legal.

## C-007 — Penalización por cobranza y devengo

- **Fuentes:** Acuerdo, párrs. 14 y 29–32; reunión 01:30:57.
- **Resumen:** acuerdo paga sobre cobrado y reduce a 50 % después de 90 días sin límite final; reunión agrega 91–180 al 50 % y cero después de 180. No define cobros parciales, mora imputable, reversos ni fecha base.
- **Impactos:** liquidaciones, provisiones, reclamos y auditoría.
- **Riesgo:** alto.
- **Opciones:** regla del acuerdo; regla de reunión; política parametrizada por contrato.
- **Recomendación:** parametrización versionada y definición de eventos de devengo/aplicación; decisión humana para casos históricos.
- **Autoridad:** partes/empresa con revisión contable, laboral y legal.

## C-008 — Proformado, ejecutado, custodia y facturable

- **Fuentes:** Informe 260130, p. 2 (105 proformadas, 98 ejecutadas, 7 kits en custodia); Planilla 3003-001, p. 1 (244 y total facturable).
- **Resumen:** una obra reconcilia ejecución y custodia; otra factura cantidades planilladas con profundidad adicional absorbida. No hay regla común.
- **Impactos:** saldo, ingresos, consumo, obligaciones y conciliación de cliente.
- **Riesgo:** crítico.
- **Opciones:** facturar proforma; ejecutar; entregar; combinación contractual.
- **Recomendación:** cantidades y eventos separados; fórmula facturable determinada por contrato/orden/cambio aprobado.
- **Autoridad:** contrato/cliente autorizado, comercial, operaciones y contabilidad.

## C-009 — Cambio en obra: verbal, escrito, RFI y orden de cambio

- **Fuentes:** Manual v1.1 §§3 y 12 (“conversación verbal no cambia el plano”); reunión 00:44:37–00:50:43; Informe 260130 p. 1 (“aprobación del Ing. Gabriel”); Planilla p. 1 (“requerimiento… de supervisión”).
- **Resumen:** la práctica registra aprobaciones/requerimientos de campo, mientras Manual/reunión demandan consulta/autorización formal para cambios.
- **Impactos:** posible rediseño, trabajo no autorizado y dificultad de cobro.
- **Riesgo:** crítico.
- **Opciones:** verbal con ratificación; correo; RFI/orden formal según matriz de autoridad.
- **Recomendación:** flujo configurable por tipo/impacto; detener cambios técnicos hasta autoridad válida; preservar solicitud y ratificación.
- **Autoridad:** diseñador/cliente/contrato y responsables técnico-comerciales.

## C-010 — Cortesías y absorción de sobrecostos

- **Fuentes:** Informe 260130 pp. 1–2; Planilla 3003-001 p. 1; reunión 00:44:37–00:50:43.
- **Resumen:** dos primeras obras absorben material/mano de obra como cortesía; la reunión dice que cambios futuros deben recotizarse.
- **Impactos:** margen, comisión, facturación y precedente comercial.
- **Riesgo:** alto si se automatiza.
- **Opciones:** absorber siempre; nunca; aprobación caso por caso con límites.
- **Recomendación:** decisión explícita con autorizador, motivo, valor y efecto; no inferir política de dos casos.
- **Autoridad:** gerencia comercial/financiera de la entidad contratante.

## C-011 — Profundidades reales mayores a cotizadas

- **Fuentes:** Planilla 3003-001 p. 1 (+2,5 cm); reunión 00:44:37–00:50:43; Manual v1.1 §§1, 3, 6 y 12.
- **Resumen:** ocurrió y se absorbió comercialmente, pero el supervisor no puede cambiar profundidad por criterio propio.
- **Impactos:** diseño, consumo, tiempo, costo y trazabilidad.
- **Riesgo:** crítico.
- **Opciones:** permitir aumento en campo; bloquear; permitir solo con revisión técnica y cambio aprobado.
- **Recomendación:** tercera opción; registrar requerida/cotizada/aprobada/real por separado.
- **Autoridad:** diseñador/autoridad técnica y autoridad comercial contractual.

## C-012 — Espárragos, remanentes y cortes

- **Fuentes:** reunión 00:08:01, 00:51:50 y 01:21:13; Informe 260130 p. 1 (cambio a 13 cm); documentos técnicos no aportados.
- **Resumen:** se busca optimizar material y se observan cortes por interferencia, pero no hay política de identificación, reutilización, propiedad ni tolerancias.
- **Impactos:** conformidad del elemento, inventario, costo y desperdicio.
- **Riesgo:** alto.
- **Opciones:** remanente genérico; trazabilidad por especificación/lote; descarte total.
- **Recomendación:** identidad y compatibilidad completas; plan determinista; reutilización solo si supera mínimos aprobados y conserva trazabilidad.
- **Autoridad:** taller/inventario, responsable técnico y propietario del material.

## C-013 — Documentos internos frente a entregables al cliente

- **Fuentes:** reunión 01:32:34–01:33:40; Manual v1.1 §§12, 20, 24–25; contrato no aportado.
- **Resumen:** reunión propone NCR/eventualidades internas y no compartir ciertos errores; Manual exige trazabilidad, pero no determina audiencia contractual de cada registro.
- **Impactos:** transparencia, mejora, privilegios de acceso y dossier.
- **Riesgo:** alto: ocultamiento indebido o divulgación excesiva.
- **Opciones:** todo interno; todo cliente; clasificación por tipo/contrato/obligación.
- **Recomendación:** clasificación versionada con revisión de calidad/legal; nunca borrar ni falsear el registro fuente.
- **Autoridad:** contrato, calidad, gerencia y asesoría legal.

## C-014 — Firma digitalizada, aprobación autenticada y firma electrónica

- **Fuentes:** reunión 00:40:39–00:43:12; Informe/Planilla con representaciones de firma; Manual v1.1 §23 y AGENTS.md.
- **Resumen:** reunión usa “firma digital/electrónica” de forma coloquial; gobierno documental distingue tres mecanismos y sus efectos dependen del contexto.
- **Impactos:** diseño de identidad, evidencia y validez del documento.
- **Riesgo:** alto si la interfaz promete equivalencia jurídica.
- **Opciones:** imagen; aprobación autenticada; proveedor de firma electrónica por tipo documental.
- **Recomendación:** matriz de modalidad por documento; etiquetas exactas y sin afirmar validez automática.
- **Autoridad:** negocio/contrato y asesoría jurídica; proveedor cuando corresponda.

## C-015 — Historial del sistema contable anterior

- **Fuentes:** reunión 01:08:43–01:11:31 y transcripción 01:20 aprox.; Bosquejo v1.1, roadmap de integraciones; sprint 0 (sin módulos).
- **Resumen:** stakeholder quiere conservar historia y quizá contratar solo contabilidad externa; no decide migración, coexistencia ni fuente oficial.
- **Impactos:** arquitectura, costo, conciliación, retención y auditoría.
- **Riesgo:** crítico para corte contable.
- **Opciones:** consulta histórica; migración selectiva; migración completa; integración/coexistencia.
- **Recomendación:** discovery de datos y prueba de exportación antes del PRD contable; definir acta de corte y reconciliación.
- **Autoridad:** gerencia, contabilidad/auditoría y proveedor con asesoría tributaria.

## C-016 — Muestreo fijo del 20 % frente a ITP aprobado

- **Fuentes:** reunión 00:19:26; Manual v1.1 §11.4.
- **Resumen:** la reunión ofrece 20 % como ejemplo/práctica; el Manual remite a ITP, contrato, riesgo y autoridad.
- **Impactos:** inspección insuficiente/excesiva y falsas métricas.
- **Riesgo:** alto.
- **Opciones:** 20 % fijo; reglas configurables; plan de muestreo versionado por obra/lote.
- **Recomendación:** plan versionado; “20 %” solo como dato histórico no normativo.
- **Autoridad:** calidad/diseñador/contrato.

## C-017 — Prioridad funcional del CRM/contabilidad frente al roadmap

- **Fuentes:** reunión 00:08:01–00:13:23 y 01:08:43; Bosquejo v1.1 §§5.2 y 12.
- **Resumen:** la reunión pide integración comercial/contable temprana; el Bosquejo deja CRM fuera del MVP y compras/integraciones para fases posteriores.
- **Impactos:** presupuesto, dependencias, alcance y fecha de MVP.
- **Riesgo:** medio/alto por expansión de alcance.
- **Opciones:** MVP de campo; MVP comercial; corte transversal mínimo; fases paralelas.
- **Recomendación:** decidir resultados y usuarios del MVP antes del PRD; no asumir que “integral” significa entrega inicial completa.
- **Autoridad:** Christian e Israel con sponsor/presupuesto.
