---
title: "Resumen Maestro del Proyecto ANKLO - Supervisión de Anclajes y ERP"
author: "Documento de continuidad para Israel"
date: "Versión 1.1 - 10 de julio de 2026"
revision: "Fecha de revisión v1.1: 10 de julio de 2026"
lang: es
---

# Resumen Maestro del Proyecto ANKLO

## 1. Contexto

Israel es ingeniero biotecnólogo y asumirá funciones de supervisión de instalación de anclajes. Su formación aporta disciplina de protocolos, control de variables, trazabilidad, estadística y mejora de procesos, pero requiere una guía específica para lectura de planos, ejecución de anclajes, seguridad de construcción, liderazgo de cuadrilla y gestión de obra.

Se revisaron cuatro documentos iniciales:

1. **Manual de Claude:** base principal por su prudencia normativa, estructura, estadística y enfoque de supervisión.
2. **Gemini:** aporte principal a la visión de sistema modular tipo ERP.
3. **Manual operativo de Perplexity:** formularios, administración y alternativas digitales.
4. **Guía de Perplexity:** síntesis útil, con alta duplicación.

La integración orientativa fue 50/25/15/10, subordinada a la veracidad. Se eliminó como norma vigente el Acuerdo Ministerial 174 y se adoptó el MDT-2025-122 como reglamento sectorial actual, junto con el Decreto Ejecutivo 255.

## 2. Objetivo general

Crear un sistema completo que permita a Israel ejecutar y supervisar trabajos de anclaje con seguridad, calidad, trazabilidad y criterio de parada, y convertir la información de campo en control gerencial mediante un ERP especializado.

## 3. Entregables del proyecto

- Manual Maestro de Supervisión e Instalación de Anclajes.
- Resumen Maestro de contexto y decisiones.
- Bosquejo funcional y arquitectura del ERP “ANKLO-OS”.
- En fases futuras: SOP por producto, formularios editables, base de datos, prototipo PWA, dashboards e informes automáticos.

## 4. Principios no negociables

1. El supervisor ejecuta el diseño; no lo sustituye.
2. Toda variable dependiente del producto proviene de la aprobación y MPII vigentes.
3. Una desviación se detiene, registra y resuelve por autoridad competente.
4. La seguridad sigue jerarquía de controles; EPP es la última barrera.
5. Un anclaje sin trazabilidad completa no se considera cerrado.
6. Los KPIs no pueden incentivar velocidad a costa de calidad o seguridad.
7. La aplicación debe operar con conectividad limitada y conservar auditoría e evidencia trazable, íntegra, atribuible y preservable.
8. Los datos personales se protegen desde el diseño y por defecto.

## 5. Alcance funcional del manual

- Marco legal/técnico y jerarquía documental.
- Tipos y modos de falla de anclajes.
- Lectura de planos y control de revisión.
- Liberación de frente, escaneo, replanteo y perforación.
- Limpieza, inyección, inserción, curado y montaje.
- Anclajes mecánicos y mampostería dentro de sistemas aprobados.
- Inspección, ensayos, ITP y no conformidades.
- SST, químicos, sílice, altura, herramientas y vehículos.
- Calidad, calibración, Lean, estadística y KPIs.
- Liderazgo, competencia, asistencia, viáticos, inventario y reportes.
- Plan personal de 30-60-90 días.

## 6. Visión del ERP

ANKLO-OS será una PWA web para Windows, macOS y móviles. Su unidad central de información será el **anclaje identificado**, relacionado con obra, plano, ubicación, sistema, personal, lote, herramientas, inspección, ensayo, fotos, NCR y costos. El sistema será modular, con permisos por rol y alcance de obra, registro de auditoría e inventario basado en movimientos.

## 7. Decisiones tecnológicas base

- TypeScript de extremo a extremo.
- Next.js para interfaz PWA y capa web.
- PostgreSQL como base transaccional.
- Monolito modular inicialmente; no microservicios prematuros.
- Almacenamiento S3 compatible para documentos/fotos.
- Modo offline con IndexedDB, cola idempotente y sincronización.
- Generación de PDF en trabajos asíncronos.
- Arquitectura multiempresa/multiobra preparada desde el esquema.
- Contenedores Docker, ambientes separados y copias de seguridad verificadas.

## 8. Fases de trabajo recomendadas

### Fase 0 - Descubrimiento

Mapear procesos actuales, productos, formularios, roles y restricciones legales. Incluir como asunto pendiente el análisis de aplicabilidad de la Ley Orgánica para el Fortalecimiento de la Ciberseguridad y sus normas secundarias, sin presumir que ANKLO sea infraestructura crítica. Elaborar el inventario de actividades de tratamiento de datos y, cuando corresponda, aplicar y documentar el modelo de tratamiento a gran escala; realizar la evaluación de impacto y determinar la designación de DPD únicamente si se configura el supuesto legal. No programar hasta definir un flujo piloto.

### Fase 1 - MVP de campo

Obras, personal, planos, anclajes, checklist, fotos, lotes, curado, NCR, parte diario y modo offline básico.

### Fase 2 - Operaciones

Inventario, herramientas, vehículos, asistencia, viáticos, certificados y reportes.

### Fase 3 - Gestión

KPIs, costos, mantenimiento, compras, portal de cliente, aprobaciones y BI.

### Fase 4 - IA controlada

RAG sobre documentación aprobada, borradores de informes, detección de inconsistencias y pronósticos. La IA documental prepara, recupera o contrasta información; se distingue de cualquier decisión automatizada que produzca efectos sobre personas, la cual requiere análisis separado y controles humanos. La IA no aprueba anclajes ni reemplaza al ingeniero.

## 9. Riesgos principales

- Digitalizar un proceso incorrecto.
- Usar campos libres donde se requiere dato controlado.
- Metas de productividad que fomenten omisiones.
- Dependencia de internet en obra.
- Acceso cruzado entre organizaciones.
- Almacenamiento local excesivo y conflictos de sincronización.
- Dependencia de servicios externos.
- Falta de continuidad operacional.
- Permisos excesivos o fuga de documentos personales.
- Cálculo laboral rígido sin actualización legal.
- IA que invente valores técnicos.
- Alcance demasiado grande para un primer MVP.

## 10. Documento de arranque para futuros chats

> Estoy desarrollando con ChatGPT el proyecto ANKLO: un Manual Maestro y un ERP/PWA para supervisión de instalación de anclajes en Ecuador. Soy Israel, ingeniero biotecnólogo. El sistema debe basarse en normativa ecuatoriana vigente, ACI/ASTM/ICC-ES, MPII/SDS/ESR de fabricantes y fuentes primarias. Nunca debe inventar diámetros, profundidades, tiempos, torques, cargas de prueba o ciclos de limpieza; esos valores dependen del diseño y producto aprobado. El supervisor no rediseña. La arquitectura acordada es TypeScript + Next.js + PostgreSQL, monolito modular, PWA offline, archivos S3, auditoría, RBAC y futura IA con RAG. Antes de continuar, revisar los archivos Manual Maestro, Resumen Maestro y Bosquejo ERP vigentes.

## 11. Control de continuidad

La memoria permanente del proyecto está deshabilitada. Este archivo es la fuente de continuidad: debe conservarse en el proyecto, versionarse y cargarse al iniciar una conversación nueva. Cada cambio relevante se agrega a un registro de decisiones con fecha, autor, motivo e impacto.

## Referencias verificables principales

> Las normas completas suelen estar protegidas por derechos de autor. Este manual resume su función y remite a la edición aplicable; no reproduce su texto. Antes de una obra se debe confirmar la edición contractual y adquirir o consultar legalmente los documentos necesarios.

- **[EC-01]** Ministerio del Trabajo del Ecuador. *Decreto Ejecutivo Nro. 255 - Reglamento de Seguridad y Salud en el Trabajo* (2024). https://www.trabajo.gob.ec/wp-content/uploads/2024/01/DECRETO-EJECUTIVO-255-REGLAMENTO-DE-SEGURIDAD-Y-SALUD-DE-LOS-TRABAJADORES.pdf
- **[EC-02]** Ministerio del Trabajo del Ecuador. *Acuerdo Ministerial Nro. MDT-2025-122 - Reglamento de seguridad en el trabajo y prevención de riesgos laborales para la construcción y obras públicas y privadas* (2025). https://www.trabajo.gob.ec/wp-content/uploads/2025/09/Acuerdo-Ministerial-Nro.-MDT-2025-122-signed.pdf
- **[EC-03]** Ministerio del Trabajo del Ecuador. *Norma Técnica de Seguridad e Higiene del Trabajo - Anexo 3* (2024). https://www.trabajo.gob.ec/wp-content/uploads/2024/11/Anexo-3_Norma-Tecnica-de-Seguridad-e-Higiene-del-Trabajo-signed-signed-signed-signed.pdf
- **[EC-04]** Ministerio de Infraestructura y Transporte. *Norma Ecuatoriana de la Construcción (portal oficial)*. https://www.mit.gob.ec/norma-ecuatoriana-de-la-construccion/
- **[EC-05]** Superintendencia de Protección de Datos Personales. *Guía de protección de datos desde el diseño y por defecto* (2025). https://spdp.gob.ec/wp-content/uploads/2025/10/40.02-Guia-de-Proteccion-de-Datos-desde-el-Diseno-y-por-Defecto.pdf
- **[EC-06]** Ministerio de Telecomunicaciones. *Ley y Reglamento de la Ley Orgánica de Protección de Datos Personales*. https://www.telecomunicaciones.gob.ec/ley-y-reglamento-de-la-ley-de-proteccion-de-datos-personales/
- **[ACI-01]** American Concrete Institute. *ACI CODE-318-25: Building Code for Structural Concrete*. https://www.concrete.org/store/productdetail.aspx?Format=PROTECTED_PDF&ItemID=318U25&Language=English&Units=US_Units
- **[ACI-02]** American Concrete Institute. *ACI CODE-355.4-24: Post-Installed Adhesive Anchors in Concrete - Qualification Requirements and Commentary*. https://www.concrete.org/Portals/0/Files/PDF/Previews/355.4-24_preview.pdf
- **[ACI-03]** American Concrete Institute. *Anchorage to Concrete - educational webinar*. https://www.concrete.org/portals/0/files/pdf/webinars/ws_F23_Matthew%20Senecal.pdf
- **[ASTM-01]** ASTM International. *ASTM E488/E488M-22 - Standard Test Methods for Strength of Anchors in Concrete Elements*. https://store.astm.org/e0488_e0488m-22.html
- **[ASTM-02]** ASTM International. *ASTM E1512-01(2023) - Standard Test Methods for Testing Bond Performance of Bonded Anchors*. https://www.astm.org/membership-participation/technical-committees/committee-e06/subcommittee-e06/jurisdiction-e0613
- **[ASTM-03]** ASTM International. *ASTM E3121/E3121M - Field Testing of Anchors in Concrete or Masonry*. https://store.astm.org/e3121_e3121m-17.html
- **[ICC-01]** ICC Evaluation Service. *AC308 - Acceptance Criteria for Post-Installed Adhesive Anchors in Concrete Elements* (context and revisions). https://cdn-v2.icc-es.org/wp-content/uploads/2018/09/AC308Revisions.pdf
- **[ICC-02]** ICC Evaluation Service. *ESR-3814 - Hilti HIT-RE 500 V3*. https://icc-es.org/wp-content/uploads/report-directory/ESR-3814.pdf
- **[MFG-01]** Hilti. *Anchor Installation / SafeSet*. https://www.hilti.com/content/hilti/W1/US/en/business/business/productivity/anchor-installation.html
- **[MFG-02]** Hilti. *Adhesive Anchor Volume Calculator*. https://www.hilti.com/content/hilti/W1/US/en/business/business/engineering/anchors/volume-calculator.html
- **[MFG-03]** Simpson Strong-Tie. *Adhesive Anchoring Installation Instructions*. https://www.strongtie.com/products/anchoring-systems/technical-notes/anchoring-adhesives/installation-instructions
- **[MFG-04]** Simpson Strong-Tie. *3G Adhesive Products and Applications*. https://www.strongtie.com/products/anchoring-systems/3g-adhesives-family
- **[ISO-01]** ISO. *ISO 9001:2015 - Quality management systems*. https://www.iso.org/standard/62085.html
- **[ISO-02]** ISO. *ISO 45001:2018 - Occupational health and safety management systems*. https://www.iso.org/standard/63787.html
- **[ISO-03]** ISO. *ISO 31000:2018 - Risk management - Guidelines*. https://www.iso.org/standard/65694.html
- **[OSHA-01]** OSHA. *29 CFR 1926.1153 - Respirable crystalline silica*. https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1153
- **[PAPER-01]** González et al. *Influence of construction conditions on strength of post-installed bonded anchors*. Construction and Building Materials (2018). https://www.sciencedirect.com/science/article/abs/pii/S0950061817325497
- **[PAPER-02]** Müsevitoğlu et al. *Experimental and analytical investigation of chemical anchors embedded in concrete under tensile effect*. Measurement (2020). https://www.sciencedirect.com/science/article/abs/pii/S026322412030227X
- **[PAPER-03]** Epackachi et al. *Behavior of adhesive bonded anchors under tension and shear loads*. Engineering Structures (2015). https://www.sciencedirect.com/science/article/abs/pii/S0143974X15300420
- **[ODOO-01]** Odoo. *Odoo 19 developer documentation - modules*. https://www.odoo.com/documentation/19.0/developer/reference/backend/module.html
- **[ODOO-02]** Odoo. *Security in Odoo - access rights and record rules*. https://www.odoo.com/documentation/19.0/developer/reference/backend/security.html
- **[NEXT-01]** Next.js. *App Router documentation*. https://nextjs.org/docs/app
- **[NEXT-02]** Next.js. *Progressive Web Applications guide*. https://nextjs.org/docs/app/guides/progressive-web-apps
- **[PG-01]** PostgreSQL. *JSON types*. https://www.postgresql.org/docs/current/datatype-json.html
