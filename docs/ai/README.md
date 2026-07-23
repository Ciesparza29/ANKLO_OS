# Contexto de Agentes para ANKLO-OS

Este directorio (`docs/ai/`) contiene la documentación para orientar y limitar a los agentes de inteligencia artificial que trabajan en ANKLO-OS.

## Jerarquía de Fuentes de Verdad

Ninguna fuente prevalece universalmente fuera de su ámbito. En su lugar, se aplica la siguiente matriz por ámbito:

- **Estado técnico integrado:** Git y GitHub.
- **Requisitos funcionales:** PRD, registro de decisiones y fuentes funcionales, respetando su estado.
- **Arquitectura:** ADR aplicable, respetando su estado.
- **Operación y anclajes:** manuales y documentos operativos aplicables.
- **Requisitos técnicos de obra:** normativa, contrato, planos, especificaciones, evaluaciones y MPII aplicables.
- **Preguntas y supuestos:** registros de pendientes.
- **`docs/ai`:** orientación, navegación y estado; nunca autoridad sustitutiva.

## Resolución de Contradicciones

Ante una contradicción entre fuentes, el agente debe:

1. detener el trabajo;
2. identificar las fuentes, versiones y estados;
3. registrar la contradicción;
4. escalar a Israel o a la autoridad competente;
5. no resolver por inferencia.

## Enlaces a Fuentes de Verdad

- [0001-arquitectura-base.md (aceptado provisionalmente)](../../docs/adr/0001-arquitectura-base.md)
- [0002-puertos-y-adaptadores.md (aceptado provisionalmente)](../../docs/adr/0002-puertos-y-adaptadores.md)
- [0003-modelo-grupo-entidad-unidad-contexto.md (PROPUESTO)](../../docs/adr/0003-modelo-grupo-entidad-unidad-contexto.md)
- [0004-coexistencia-migo-y-autoridad-de-datos.md (PROPUESTO)](../../docs/adr/0004-coexistencia-migo-y-autoridad-de-datos.md)
- [0005-inventario-operativo-atp-y-conciliacion.md (PROPUESTO)](../../docs/adr/0005-inventario-operativo-atp-y-conciliacion.md)
- [0006-cotizaciones-precios-abastecimiento-y-reservas.md (PROPUESTO)](../../docs/adr/0006-cotizaciones-precios-abastecimiento-y-reservas.md)
- [0007-piezas-remanentes-y-optimizacion-de-cortes.md (PROPUESTO)](../../docs/adr/0007-piezas-remanentes-y-optimizacion-de-cortes.md)
- [0008-inventario-externo-servipernos-y-prestamos.md (PROPUESTO)](../../docs/adr/0008-inventario-externo-servipernos-y-prestamos.md)
- [0009-manufactura-corte-subcontratado-propiedad-y-custodia.md (PROPUESTO)](../../docs/adr/0009-manufactura-corte-subcontratado-propiedad-y-custodia.md)
- [open-questions.md](../../docs/decisions/open-questions.md)
