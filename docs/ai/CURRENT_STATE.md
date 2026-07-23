# Estado Actual (CURRENT STATE)

## Referencia estable

Repositorio: Ciesparza29/ANKLO_OS
Rama estable: origin/main
SHA estable: a84ad3a8b7722b88703860e385a15e025a9966c7

Este es el snapshot técnico de referencia del Issue #12. Debe revalidarse cuando `main` avance.

## Funcionalidad integrada en `main`

La rama `main` contiene solicitudes manuales de corte con:

- creación
- listado
- detalle
- envío
- cancelación
- historial

## Trabajo documental actual

Issue #12: abierto
Rama: docs/12-persistent-agent-context
Estado: no integrada en main
Rama remota: todavía no publicada
PR de la Fase 9: todavía no creado

Este documento solo formará parte del estado estable después de revisión independiente, CI, PR y merge manual autorizado.

## PR #7

Número: #7
Título: feat(product): add product detail read model
Rama: feat/product-increment-c-read-tests
Head SHA: 5433f71f777f37e2662c6010963a220d20be7360
Estado: OPEN
Mergeable: MERGEABLE
Merge state: BEHIND
CI histórica del SHA indicado: SUCCESS
Integración en main: NO

El trabajo del PR #7 está:

- implementado en su rama;
- respaldado por pruebas y CI históricas sobre ese SHA;
- abierto;
- no integrado en main;
- detrás de main;
- pendiente de actualización de base;
- pendiente de auditoría;
- pendiente de decisión.

Aclaraciones:

- MERGEABLE no significa aprobado ni listo para merge.
- La CI histórica no demuestra compatibilidad actual con main.

## Estados documentales

PRD: BORRADOR
ADR 0001: aceptado provisionalmente para la fundación
ADR 0002: aceptado provisionalmente para orientar cortes futuros
ADR 0003–0009: PROPUESTO

## Contexto empresarial estable

Distripernos es la entidad principal y propietaria actual del inventario.
ANKLO es actualmente una unidad o brazo operativo de Distripernos.
La futura ANKLO S.A.S. no se presume constituida.
Migo mantiene durante 2026 la autoridad oficial sobre los procesos contables y tributarios definidos.
ANKLO-OS coordina la operación comercial, inventario operativo, cotización, reservas, corte, campo y conciliación.
PROMET es la denominación vigente.
PROMED es deuda terminológica histórica y no una segunda entidad.

## Decisiones y preguntas pendientes relevantes

Continúan pendientes, entre otras:

- autoridad de atributos del catálogo;
- formatos y capacidades reales de Migo;
- catálogo y unidades reales;
- precisión y reglas de conversión;
- parámetros reales de corte;
- política del optimizador;
- transición futura de ANKLO;
- roles y autoridades concretas;
- tratamiento documentado de PROMET.

Enlace al registro: [Preguntas_Supuestos_Pendientes_v2.0.md](../../docs/product/decisions/Preguntas_Supuestos_Pendientes_v2.0.md)

## Riesgos vigentes

- confundir trabajo abierto con estado estable;
- usar CI histórica como evidencia de compatibilidad actual;
- convertir ADR propuestos en decisiones aceptadas;
- resolver preguntas de negocio mediante inferencia;
- exponer secretos o datos productivos;
- permitir que docs/ai sustituya fuentes canónicas.

## Próxima acción autorizada

La siguiente acción autorizada dentro del Issue #12 es:
corregir y revisar la documentación de Fase 9, ejecutar verificaciones, realizar revisión independiente y preparar un PR solo después de autorización.

No existe autorización para:

- merge;
- despliegue;
- Fase 10;
- corrección del PR #7;
- nueva funcionalidad.
