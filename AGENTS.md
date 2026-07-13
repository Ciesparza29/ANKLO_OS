# ANKLO-OS — reglas para agentes

## Propósito y fuentes

ANKLO-OS es un ERP de campo para instalación de anclajes, todavía sin módulos operativos. Antes de cambiar código, leer estas rutas canónicas:

1. `ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md` — arquitectura y roadmap.
2. `ANKLO_Paquete_Documental_v1.0/Manual_Maestro_Supervision_Anclajes_ANKLO_v1.1.md` — operación y evidencia.
3. `ANKLO_Paquete_Documental_v1.0/Resumen_Maestro_Proyecto_ANKLO_v1.1.md` — contexto.
4. `ANKLO_Paquete_Documental_v1.0/README.md` — límites documentales.
5. `ANKLO_Paquete_Documental_v1.0/Glosario_Maestro_ANKLO_v1.1-borrador.md` — terminología auxiliar no aprobada.

Normativa, contrato, planos, RFI, evaluaciones y MPII aplicables prevalecen. Las versiones antiguas son historial. No combinar versiones ni convertir decisiones futuras en requisitos; registrar vacíos en `docs/decisions/open-questions.md`.

## Arquitectura y dirección de dependencias

- TypeScript estricto, Next.js App Router, PostgreSQL, Prisma, Zod y monolito modular.
- `contracts` contiene esquemas y tipos compartidos; no depende de paquetes internos, Next.js ni Prisma.
- `domain` contiene reglas y puertos; solo puede depender de `contracts`. No depende de Prisma, Next.js, `db` ni `ui`.
- `db` es un adaptador de persistencia; puede depender de `domain` y `contracts`. Nunca depende de `web` ni `ui`.
- `ui` comparte componentes de presentación; puede depender de `contracts`, nunca de `db` o Prisma.
- `apps/web` es la raíz de composición: puede conectar `domain`, `db`, `contracts` y `ui`. La composición ocurre aquí, nunca dentro de `domain`.
- `config` es fundacional y no depende de paquetes de producto.
- Dirección permitida: `web -> {ui, db, domain, contracts}`, `db -> {domain, contracts}`, `domain -> contracts`, `ui -> contracts`. Nunca `domain -> db`, `db -> web` ni ciclos.
- Los módulos acceden a otros mediante contratos, puertos, eventos o servicios públicos; nunca mediante tablas o internals ajenos.

## Ingeniería

- Toda entrada no confiable se valida en servidor; los tipos del cliente no sustituyen validación.
- No crear migraciones funcionales sin modelo aprobado. Una migración compartida es inmutable y requiere mitigación o reversión documentada.
- Operaciones sobre varias invariantes usan transacciones breves; no mantenerlas durante llamadas externas.
- Ejecutar `pnpm arch:check`; no eludir restricciones de importación o ciclos.

## Invariantes

- Toda tabla de negocio tendrá `organization_id`; servicio y, cuando sea viable, RLS verifican aislamiento. Nunca mezclar organizaciones.
- Registros aprobados no se modifican silenciosamente. `AuditEvent` es append-only para interfaces ordinarias; una corrección crea evento o revisión.
- Operaciones críticas futuras serán idempotentes mediante identificadores de cliente.
- Archivos binarios viven fuera de la base relacional, aislados por organización; metadatos y relaciones permanecen estructurados.
- Conservar originales; toda transformación crea un derivado relacionado. Retención y preservación extraordinaria gobiernan eliminación.
- Un hash acredita coincidencia o integridad, no autoría, fecha, ubicación, verdad ni validez jurídica.
- Aprobación autenticada, firma digitalizada y firma electrónica son conceptos distintos.

## Seguridad, privacidad e IA

- Privacidad por diseño: finalidad, minimización, acceso necesario y datos ficticios en desarrollo.
- Secretos fuera del repositorio; usar variables de entorno y `.env.example` sin valores reales. No diseñar criptografía.
- IA futura solo asiste. `AIInteraction` y `HumanReviewDecision` permanecen separados y relacionados.
- Prohibidas decisiones exclusivamente automatizadas sobre seguridad, conformidad estructural, disciplina, aptitud laboral, pagos o derechos de trabajadores.
- No inventar torques, tiempos, cargas, profundidades, ciclos de limpieza, reglas jurídicas, aprobaciones ni permisos.

## Calidad, terminado y reporte

- Probar contratos, reglas e invariantes; cada corrección incluye prueba cuando sea razonable.
- Ejecutar `pnpm verify`, `docker compose config`, `git diff --check` y `git status --short`.
- Terminado exige instalación reproducible, lockfile actualizado, formato/lint/arquitectura/tipos/pruebas/Prisma/build correctos y diff limitado.
- No commit, push o despliegue sin autorización expresa.
- Reportar: archivos, problemas, correcciones, decisiones, verificación real, alcance excluido, riesgos y preguntas pendientes.
