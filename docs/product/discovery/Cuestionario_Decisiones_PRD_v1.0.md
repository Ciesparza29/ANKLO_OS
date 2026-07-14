# Cuestionario de decisiones para el PRD

**Versión:** 1.0 — 12 de julio de 2026\
**Instrucción:** responder con decisión, autoridad, evidencia/fuente, fecha de vigencia y excepciones. “No definido” es una respuesta válida; no sustituirla con una inferencia.

## 1. Estructura societaria

### Bloqueante para arquitectura

1. ¿ANKLO es marca, división/unidad de negocio de DISTRIPERNOS S.A.S., entidad jurídica separada o una combinación? Adjuntar evidencia vigente. Es un brazo operativo, pero al futuro ANKLO se desarrollará como una SAS que pertenezca al mismo grupo empresarial de distripernos. Parde meses Empresaa futuro distante tipo holding que maneje tipo (Promed, Distripernos, ANKLO).
2. ¿Qué organizaciones serán tenants iniciales y qué relaciones interempresa deben representarse?
3. ¿Quién es propietario de clientes, inventarios, activos, documentos, dominios y datos históricos?
   Distripernos es la empresa que importará los productos y hará la parte de inventario, ANKLO cuando sea empresa propia manejará su inventario y comprará a distripernos y ANKLO es la empresa de servicios
4. ¿Una persona puede actuar para varias organizaciones y cómo selecciona/justifica el contexto?

### Bloqueante para PRD

5. Para cada escenario, ¿qué entidad cotiza, contrata, suministra, instala, factura y cobra?
6. ¿Qué numeraciones, sucursales, monedas y centros de costo pertenecen a cada entidad?

## 2. Operación

### Bloqueante para PRD

7. ¿Cuál es el proceso real desde oportunidad hasta cierre de obra, con responsables y evidencia?
8. ¿El registro de anclajes será individual, por lote homogéneo o híbrido, y cuándo debe individualizarse?
9. ¿Qué estados y autoridades liberan, bloquean, corrigen y cierran trabajo?
10. ¿Qué ocurre si el cliente no deja puntos marcados, seguridad lista o frente disponible?
11. ¿Qué cambio puede resolverse operativamente y cuál exige detener/RFI/orden de cambio?
12. ¿Qué documentos son internos, compartibles o entregables obligatorios por contrato?

### Necesaria antes del MVP

13. ¿Cómo se forman cuadrillas y se gestionan sustituciones, múltiples frentes y responsables?
14. ¿Qué registros mínimos forman el parte diario y el dossier?
15. ¿Qué eventos/notificaciones necesitan reconocimiento y escalamiento?
16. ¿Qué cortesías o trabajos adicionales puede autorizar cada rol y con qué límite?

## 3. Técnica

### Bloqueante para PRD

17. ¿Qué productos, sistemas, adhesivos, elementos, sustratos, evaluaciones, MPII, SDS y revisiones se usarán en el piloto?
18. ¿Quién aprueba y publica procedimientos técnicos y quién puede retirarlos?
19. ¿Cómo se resuelve una combinación sin procedimiento aprobado?
20. ¿Qué autoridad aprueba cambios de diámetro, profundidad, método, elemento, adhesivo o ubicación?
21. ¿Qué datos son diseñados/requeridos, aprobados y reales, y cuál prevalece en cada decisión?
22. ¿Qué ITP, Hold/Witness, muestreo y ensayos aplican por obra/sistema?

### Bloqueante para arquitectura

23. ¿La biblioteca debe soportar variantes por fabricante, producto, método, condición, temperatura, orientación y revisión simultáneamente?
24. ¿Cómo se importarán/validarán tablas de trabajo y curado sin codificarlas en software?

### Necesaria antes del MVP

25. ¿Cuál es el flujo NCR–disposición–CAPA–verificación y quién puede cerrar?
26. ¿Qué instrumento, unidad, tolerancia, calibración y evidencia requiere cada inspección?
27. ¿Qué versión de procedimiento debe quedar congelada en un registro histórico?

## 4. Comercial

### Bloqueante para PRD

28. ¿Quién puede crear, revisar, aprobar y enviar cotizaciones y descuentos?
29. ¿Qué constituye aceptación del cliente y cuándo una cotización se vuelve orden/contrato?
30. ¿Cómo se cotizan y aprueban cambios detectados en obra antes de ejecutar?
31. ¿La comisión del acuerdo Christian–Juber continúa vigente y solo para esas partes?
32. ¿Existe política general de comisiones para empleados/gestores o deben modelarse contratos individuales?
33. ¿Cuándo se devenga comisión: factura, cobro aplicado, cobro total, cierre o liquidación?
34. ¿Cómo se tratan cobros parciales, notas de crédito, devoluciones, incobrables y cobros posteriores a 180 días?

### Necesaria antes del MVP

35. ¿Qué campos y etapas mínimas necesita CRM y cuál es su prioridad frente a campo?
36. ¿Qué autoridad aprueba cortesías y cómo afectan margen/comisión?

## 5. Inventario

### Bloqueante para PRD

37. ¿Cómo se distingue propiedad, custodia, posesión, ubicación, reserva, préstamo, consumo y facturación?
38. ¿Qué terceros prestan/reciben mercadería y qué documento respalda cada movimiento?
39. ¿Los 7 kits del Informe 260130 seguían siendo propiedad de quién y qué ocurrió después?
40. ¿“Sale uno, regresa uno” aplica a qué categorías y qué excepciones autorizadas existen?
41. ¿Cómo se gestionan envases/residuos devueltos sin reingresarlos como stock utilizable?

### Bloqueante para arquitectura

42. ¿Qué especificaciones hacen compatibles dos barras/remanentes y qué datos de lote/origen deben conservarse?
43. ¿Qué objetivo optimiza el plan de corte: costo, desperdicio, tiempo, consumo de remanentes o combinación ponderada?
44. ¿Cuáles son ancho de corte, tolerancias, pérdidas, longitud mínima reutilizable y reglas de preparación por proceso aprobado?

### Necesaria antes del MVP

45. ¿Quién aprueba plan de corte y quién concilia plan versus ejecución?
46. ¿Cómo se valoran remanentes y quién autoriza baja, ajuste o transferencia?

## 6. Contabilidad

### Bloqueante para arquitectura

47. ¿Cuál es el sistema contable oficial actual, qué API/exportaciones ofrece y qué derechos existen sobre los datos?
48. ¿Se requiere integración, coexistencia, migración selectiva o migración completa?
49. ¿Cuál será la fuente oficial por periodo y cómo se evita doble contabilización?

### Bloqueante para PRD

50. ¿Qué catálogo de cuentas, centros de costo, impuestos, retenciones, monedas y dimensiones se requieren por empresa?
51. ¿Qué datos históricos deben conservarse: maestros, asientos, auxiliares, facturas, cobros, inventario, adjuntos y auditoría?

### Puede diferirse

52. ¿Se requiere BI de solo lectura, data warehouse o reportes desde el sistema contable?

## 7. Facturación

### Bloqueante para PRD

53. ¿La cantidad facturable se basa en proforma, ejecutado, entregado/custodiado, planilla aprobada o combinación contractual?
54. ¿Quién emite factura por cada tipo de venta/servicio y quién aplica cobros?
55. ¿Qué integración y certificación exige la facturación electrónica/SRI y qué proveedor se evaluará?
56. ¿Cómo se facturan cambios, cortesías, anticipos, retenciones y notas de crédito?

### Necesaria antes del MVP

57. ¿Qué aprobaciones y conciliación preceden a la emisión?

## 8. Personal

### Bloqueante para PRD

58. ¿Qué relación laboral/comercial tiene cada actor y qué entidad es responsable?
59. ¿Qué roles, competencias, certificados y vencimientos son obligatorios por tarea/obra?
60. ¿Quién puede ver/editar documentación laboral, asistencia, desempeño y comisiones?

### Necesaria antes del MVP

61. ¿Qué constituye inicio/fin de jornada y cómo se corrigen registros?
62. ¿Cómo se evita que métricas de productividad produzcan decisiones exclusivamente automatizadas?
63. ¿Qué viáticos, anticipos, comprobantes y aprobaciones se necesitan?

## 9. Seguridad

### Bloqueante para PRD

64. ¿Quién aprueba matriz de riesgos, EPP, permisos y controles por obra/tarea?
65. ¿Cuál es el tratamiento aprobado para trabajo en altura y cómo se interpreta el umbral interno de 1,50 m?
66. ¿Qué incidentes activan preservación extraordinaria y quién define su alcance/cierre?

### Bloqueante para arquitectura

67. ¿Qué proveedor de identidad, MFA y política de cuentas se aprobarán?
68. ¿Qué roles son críticos y requieren segregación de funciones/MFA?

### Necesaria antes del MVP

69. ¿Qué controles de carga, cuarentena, exportación, sesión y acceso entre organizaciones se aceptarán?

## 10. Privacidad

### Bloqueante para arquitectura

70. ¿Qué finalidad y alcance justifican GPS, fotografías, firmas y datos laborales?
71. ¿Qué categorías son personales/sensibles, quién actúa como responsable/encargado y qué terceros intervienen?
72. ¿Qué retención, eliminación y preservación se aplica por tipo documental?

### Bloqueante para PRD

73. ¿Cuándo GPS/foto es obligatorio, qué alternativa existe y quién accede?
74. ¿Cómo se minimizan terceros visibles, metadatos y reutilización de imágenes?
75. ¿Qué modalidad —aprobación autenticada, firma digitalizada o firma electrónica— corresponde a cada documento?

## 11. Infraestructura

### Bloqueante para arquitectura

76. ¿Qué dispositivos, navegadores, escenarios offline y volumen de fotos soportará el MVP?
77. ¿Dónde se alojará producción, en qué región y bajo qué dominios/correo?
78. ¿Cuáles son RTO/RPO, respaldo, restauración y continuidad requeridos?
79. ¿Qué aislamiento de archivos, cifrado, gestión de secretos, logs y monitoreo se exige?

### Necesaria antes del MVP

80. ¿Cómo se resuelven conflictos offline y qué operaciones administrativas exigirán conexión?
81. ¿Qué ambientes, datos ficticios y proceso de soporte/incidentes se habilitarán?

### Puede diferirse

82. ¿Cuándo se justifican worker/colas, BI, portal de cliente y RAG?

## Registro de respuesta recomendado

Para cada pregunta: `ID | decisión | autoridad | fuente/evidencia | vigencia | excepciones | impacto PRD | impacto arquitectura | responsable de seguimiento`.
