# ADR 0002: ubicación de puertos y adaptadores

- **Estado:** Aceptada provisionalmente para orientar futuros cortes verticales
- **Fecha:** 11 de julio de 2026

## Contexto

La fundación define un dominio independiente y una aplicación web como raíz de composición, pero todavía no precisa dónde vivirán los elementos de una arquitectura hexagonal. Esta decisión fija ubicaciones y dirección de dependencias sin crear interfaces, adaptadores ni lógica de negocio.

## Decisión

### Núcleo y puertos

- Las entidades, valores, reglas y servicios de dominio vivirán en `packages/domain/src/<contexto>/` cuando un corte vertical aprobado los requiera.
- Los puertos serán interfaces tecnológicamente neutrales y vivirán junto al contexto consumidor en `packages/domain/src/<contexto>/ports/`.
- Los puertos de entrada describirán casos de uso ofrecidos por el núcleo. Los puertos de salida describirán capacidades que el núcleo necesita, como persistencia, archivos, mensajería o tiempo.
- Un puerto no importará Prisma, Next.js, SDK de nube, cliente HTTP, proveedor de IA, correo ni tipos propios de un adaptador.
- `packages/contracts` conservará esquemas Zod y DTO compartidos en fronteras. No sustituye los puertos ni contendrá lógica de dominio.

### Adaptadores

- Prisma y la persistencia PostgreSQL vivirán en `packages/db`; este paquete implementará puertos de salida definidos por el dominio.
- Los futuros adaptadores de objetos compatibles con S3, IA y correo vivirán en paquetes de infraestructura separados bajo `packages/adapters/<capacidad>/` únicamente cuando un corte aprobado los necesite.
- Los route handlers de Next.js serán adaptadores de entrada y permanecerán en `apps/web`.
- La creación de instancias y conexión entre puertos y adaptadores ocurrirá en una zona de composición de `apps/web`, no en `packages/domain`.
- `packages/ui` contendrá presentación compartida y no actuará como adaptador de persistencia o integración.

### Dirección de dependencias

```text
adaptador de entrada (apps/web)
        -> puerto de entrada / dominio
        <- adaptadores de salida (db, S3, IA, correo)

apps/web -> domain, contracts, db, ui y adaptadores futuros
db/adaptadores -> domain, contracts
domain -> contracts
```

Las flechas expresan dependencias de código. El dominio define los puertos y los adaptadores dependen de ellos; nunca ocurre `domain -> db`, `domain -> Next.js` o `domain -> SDK externo`.

## Estado actual verificado

- `packages/domain/package.json` no declara dependencias.
- `packages/domain/src/index.ts` no importa infraestructura.
- Prisma se limita a `packages/db` y todavía no contiene modelos funcionales.
- ESLint y `pnpm arch:check` protegen la dirección actual de paquetes.

## Consecuencias

- El dominio puede probarse sin base de datos, red o framework.
- Un proveedor puede cambiar sin alterar reglas de dominio, siempre que respete el puerto.
- Cada corte vertical deberá crear solo los puertos y adaptadores que necesite; este ADR no autoriza implementaciones anticipadas.
- Los adaptadores transversales no se agruparán en un paquete genérico que permita dependencias indiscriminadas.

## Riesgos y controles

- Un puerto demasiado orientado a Prisma o a un proveedor filtraría infraestructura al dominio; la revisión debe rechazar tipos tecnológicos.
- Duplicar DTO entre contratos y dominio puede generar traducciones; estas deben ser explícitas en el adaptador.
- Las rutas futuras bajo `packages/adapters/` deberán añadirse a `scripts/check-architecture.mjs` y a ESLint antes de introducir código.

## Alternativas descartadas

- Puertos dentro de `packages/db`: invertiría la dependencia y acoplaría el dominio al adaptador.
- Interfaces de repositorio en `packages/contracts`: mezclaría contratos de transporte con necesidades internas del dominio.
- Todos los adaptadores dentro de `apps/web`: dificultaría reutilización y aislar pruebas; solo composición y adaptadores de entrada pertenecen a la aplicación web.
- Crear ahora esqueletos de S3, IA o correo: sería infraestructura especulativa fuera del alcance.

## Referencias

- `docs/adr/0001-arquitectura-base.md`
- `docs/architecture/module-boundaries.md`
- `AGENTS.md`
- `ANKLO_Paquete_Documental_v1.0/Bosquejo_Arquitectura_ERP_ANKLO_OS_v1.1.md`
