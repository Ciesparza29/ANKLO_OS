# ANKLO-OS — reglas para agentes

## Propósito y fuentes

ANKLO-OS es un ERP de campo para instalación de anclajes, todavía sin módulos operativos. Antes de cambiar código, leer las versiones semánticamente más recientes: Bosquejo v1.1 (arquitectura y roadmap), Manual v1.1 (operación y evidencia), Resumen v1.1 (contexto), Glosario v1.1-borrador solo como terminología no aprobada, y README. Normativa, contrato, planos, RFI, evaluaciones y MPII aplicables prevalecen. No mezclar silenciosamente versiones ni convertir decisiones futuras en requisitos; registrar vacíos en `docs/decisions/open-questions.md`.

## Límites de dominio y arquitectura

- TypeScript estricto, Next.js App Router, PostgreSQL, Prisma, Zod y monolito modular.
- Dependencias: `apps/web -> contracts -> domain -> db`; `ui` no depende de `db`; `contracts` no depende de Next.js ni Prisma; `domain` no depende de UI; `db` no contiene presentación.
- Los módulos controlan sus datos y acceden a otros módulos mediante contratos o servicios públicos. Evitar ciclos y accesos directos entre persistencias.
- Toda entrada no confiable se valida en servidor. Los tipos del cliente no sustituyen validación.
- No crear migraciones funcionales sin modelo aprobado. Una migración es inmutable después de compartirse y debe incluir plan de reversión o mitigación.
- Operaciones que afectan varias invariantes usan transacciones con alcance mínimo; no mantener transacciones abiertas durante llamadas externas.

## Invariantes

- Toda tabla de negocio tendrá `organization_id`; servicio y, cuando sea viable, RLS verifican aislamiento. Nunca mezclar organizaciones.
- Registros aprobados no se modifican silenciosamente. `AuditEvent` es append-only para interfaces ordinarias; una corrección crea evento o revisión.
- Operaciones críticas futuras serán idempotentes mediante identificadores de cliente.
- Archivos binarios viven fuera de la base relacional, aislados por organización; metadatos y relaciones se conservan en datos estructurados.
- Conservar originales; toda transformación crea un derivado relacionado. Retención y preservación extraordinaria gobiernan eliminación.
- Un hash acredita coincidencia o integridad, no autoría, fecha, ubicación, verdad ni validez jurídica.
- Aprobación autenticada, firma digitalizada y firma electrónica son conceptos distintos.

## Seguridad, privacidad e IA

- Privacidad por diseño: finalidad, minimización, acceso necesario y datos ficticios en desarrollo.
- Secretos fuera del repositorio; usar variables de entorno y `.env.example` sin valores reales. No diseñar criptografía.
- IA futura solo asiste. `AIInteraction` y `HumanReviewDecision` permanecen separados y relacionados.
- Prohibidas decisiones exclusivamente automatizadas sobre seguridad, conformidad estructural, disciplina, aptitud laboral, pagos o derechos de trabajadores.
- No inventar torques, tiempos, cargas, profundidades, ciclos de limpieza, reglas jurídicas, aprobaciones ni permisos.

## Calidad y terminado

- Pruebas para contratos, reglas e invariantes; cada corrección incluye una prueba cuando sea razonable.
- Ejecutar `pnpm verify`, `docker compose config`, `git diff --check` y `git status --short`.
- Terminado significa instalación reproducible, lockfile actualizado, formato/lint/tipos/pruebas/Prisma/build correctos, documentación coherente y diff limitado.
- No commit, push o despliegue sin autorización expresa.

## Reporte final

Informar: archivos; decisiones; verificación real; alcance excluido; riesgos o limitaciones; preguntas bloqueantes; una siguiente tarea concreta.
