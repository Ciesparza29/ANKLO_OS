# ADR 0010: orquestador local seguro de agentes

- **Identificador:** ADR-0010
- **Estado:** ACEPTADO
- **Fecha:** 25 de julio de 2026
- **Director funcional y aprobador:** Israel
- **Issue relacionado:** #24
- **Ámbito:** infraestructura local de automatización y gobierno de agentes

> Este ADR no autoriza por sí solo instalaciones, autenticaciones, edición de
> archivos, ejecución de agentes, commits, pushes, pull requests, merges ni
> despliegues. Cada operación continúa sujeta a una autorización explícita.

## Contexto

ANKLO-OS dispone de:

- gobierno técnico en GitHub;
- documentación persistente para agentes;
- límites de seguridad;
- ocho Skills internas;
- Antigravity como implementador principal;
- Codex como revisor independiente;
- OpenCode y Ollama como auxiliares locales;
- CI como verificación objetiva;
- un flujo manual validado durante la Fase 15.

El flujo todavía requiere que Israel traslade manualmente instrucciones,
prepare entornos y conecte los resultados de cada herramienta.

La Fase 16 debe automatizar el despacho y los handoffs sin entregar a ningún
agente autoridad para decidir requisitos, ampliar alcance, hacer merge o
desplegar a producción.

El estado inicial comprobado es:

```text
main=79e6a525fe9e7d8a1335adff5fcf19942dd29465
origin/main=79e6a525fe9e7d8a1335adff5fcf19942dd29465
working_tree=clean
node=24.18.0
pnpm=11.7.0
codex_exec=available
opencode_run=available
antigravity_desktop=2.3.1
antigravity_cli=not_installed
antigravity_sdk=not_installed
system_python=3.9.6
```

El PR #7 permanece abierto y debe conservarse sin cambios durante toda la fase.

## Problema

Un orquestador demasiado permisivo podría:

- convertir un comentario ambiguo en autorización;
- ejecutar sobre una base obsoleta;
- usar un worktree equivocado;
- ejecutar dos veces el mismo issue;
- permitir shell arbitrario procedente de texto no confiable;
- filtrar secretos;
- desactivar controles del agente;
- modificar `main`;
- omitir la revisión independiente;
- borrar evidencia después de un fallo;
- hacer merge o desplegar sin autoridad humana.

Un orquestador demasiado manual no resolvería la fricción que motivó la fase.

## Fuerzas y restricciones

- El stack principal del repositorio es TypeScript y Node.js.
- El SDK oficial de Antigravity es Python.
- El orquestador debe funcionar inicialmente sin puertos entrantes.
- El merge continuará siendo manual.
- Producción debe permanecer fuera del alcance.
- Los permisos deben ser deny-by-default.
- La ausencia de aprobación debe interpretarse como denegación.
- Los runs deben ser idempotentes y recuperables.
- El runtime y la evidencia no deben almacenarse dentro de los worktrees.
- OpenCode no debe ser una dependencia crítica.
- Ninguna integración puede basarse en automatización frágil de la GUI.

## Decisión propuesta

### 1. Arquitectura general

Se propone una arquitectura de puertos y adaptadores con:

```text
GitHub
  ↓
ANKLO Agent Orchestrator CLI
  ├── application core
  ├── state machine
  ├── approval validator
  ├── lease manager
  ├── work-package service
  ├── worktree adapter
  ├── verification adapter
  ├── Antigravity adapter
  ├── Codex adapter
  ├── OpenCode adapter opcional
  ├── GitHub adapter
  ├── audit store
  ├── quarantine service
  └── kill switch
```

No se implementará inicialmente como daemon, servidor HTTP o aplicación web.

### 2. Ubicación

Ubicación propuesta:

```text
tools/agent-orchestrator/
```

Motivos:

- conserva el código junto con sus contratos y pruebas;
- reutiliza TypeScript, configuración y herramientas del monorepo;
- permite revisión mediante el mismo CI;
- evita un repositorio adicional durante el piloto;
- no lo acopla a los módulos funcionales del ERP.

El runtime mutable se almacenará fuera del repositorio:

```text
~/.anklo-orchestrator/
├── config/
├── state/
├── tasks/
├── logs/
├── quarantine/
├── backups/
└── pilots/
```

No se almacenarán bases, leases, paquetes generados ni logs dentro de
`tools/agent-orchestrator/` o de un worktree.

### 3. Runtimes

Núcleo:

```text
TypeScript estricto
Node.js >=24
```

Adaptador de Antigravity:

```text
Python aislado
versión compatible determinada por el piloto
entorno virtual dedicado
SDK fijado a una versión publicada
```

El Python `/usr/bin/python3` de macOS no se utilizará para instalar el SDK.

La comunicación entre Node y Python será mediante:

```text
stdin: una solicitud JSON validada
stdout: eventos JSONL validados
stderr: diagnóstico sanitizado
exit code: resultado del adaptador
```

La comunicación entre Node y Python no utilizará sockets ni puertos locales. El orquestador no abrirá listeners en la primera versión; una conexión saliente a loopback solo podrá habilitarse mediante la excepción allowlisted definida en la política de red.

### 4. Persistencia local

Se propone SQLite como almacenamiento transaccional para:

- runs;
- leases;
- transiciones;
- approvals observadas;
- idempotency keys;
- referencias de paquetes;
- heartbeats;
- cuarentena;
- resultados normalizados.

Ruta propuesta:

```text
~/.anklo-orchestrator/state/orchestrator.sqlite
```

Los artefactos de gran tamaño y logs permanecerán en archivos, relacionados
desde la base mediante rutas relativas y hashes.

La implementación de SQLite quedará encapsulada detrás de un puerto
`StateStore`, de modo que pueda sustituirse sin modificar el núcleo.

Antes de aceptar `node:sqlite` como implementación concreta se verificará su
estabilidad y compatibilidad. Si se considera demasiado inmaduro para esta
fase, se usará una dependencia SQLite mantenida y fijada o un pequeño
adaptador separado.

#### Garantías transaccionales y evolución del state store

La implementación concreta deberá cumplir:

```text
STATE_STORE=SQLITE
JOURNAL_MODE=WAL
FOREIGN_KEYS=ON
BUSY_TIMEOUT=DEFINED
LEASE_ACQUISITION=TRANSACTIONAL
ONE_ACTIVE_LEASE_PER_ISSUE=UNIQUE_CONSTRAINT
ONE_ACTIVE_IMPLEMENTER_PER_WORKTREE=UNIQUE_CONSTRAINT
INTEGRITY_CHECK=STARTUP_AND_RECOVERY
BACKUP_BEFORE_MIGRATION=REQUIRED
```

Cada conexión inicializará y verificará explícitamente `journal_mode`, claves
foráneas y un `busy_timeout` finito. Si una opción requerida no puede activarse,
el orquestador no comenzará a despachar trabajo.

La adquisición, renovación, liberación y expiración de leases se ejecutarán en
transacciones explícitas. La adquisición usará una transacción que impida que
dos procesos observen simultáneamente el recurso como libre. Las restricciones
de unicidad impedirán más de un lease activo por issue y más de un implementador
activo por worktree. Una colisión no se resolverá mediante reintentos ciegos:
producirá un resultado idempotente o cuarentena.

El esquema tendrá una versión persistida y un historial de migraciones. Antes de
cada migración se detendrán nuevos despachos, se comprobará la integridad, se
creará un backup compatible y se verificará que pueda abrirse. Las migraciones
inversas solo se admitirán cuando hayan sido diseñadas y probadas; en los demás
casos, el rollback restaurará el backup compatible y la versión anterior del
orquestador.

En el arranque y durante la recuperación se ejecutará la comprobación de
integridad definida para la versión. Un resultado distinto de `ok`, una versión
desconocida o una migración incompleta activarán el kill switch y pondrán el
state store en cuarentena. Ninguna reparación automática destructiva estará
permitida.

### 5. GitHub

El orquestador usará inicialmente GitHub CLI como frontera de autenticación:

```text
gh api
gh issue view
gh pr view
```

No leerá ni almacenará directamente tokens.

Las operaciones se dividirán en:

```text
READ_GITHUB
WRITE_HANDOFF
PUSH_BRANCH
MERGE
```

`MERGE` no tendrá implementación ejecutable.

La creación de pull requests será manual en la primera versión:

```text
PR_CREATION=HUMAN_ONLY_INITIAL
```

El orquestador podrá verificar y registrar un PR ya creado, pero no ejecutará
`gh pr create` ni una operación equivalente. Automatizar la creación de PR
requerirá una decisión posterior y una capacidad separada.

Toda escritura en GitHub requerirá:

- endpoint allowlisted;
- issue o PR exacto;
- payload validado;
- aprobación aplicable;
- registro de auditoría.

La primera versión usará polling saliente o ejecución manual breve. No usará
webhooks entrantes.

#### Credencial dedicada y de privilegio mínimo

La sesión administrativa humana y la sesión del orquestador permanecerán
separadas:

```text
GH_SESSION_HUMAN_ADMIN=Ciesparza29
GH_SESSION_ORCHESTRATOR=DEDICATED_LIMITED_CREDENTIAL
ORCHESTRATOR_ADMIN_PERMISSION=DENIED
ORCHESTRATOR_BRANCH_PROTECTION_PERMISSION=DENIED
ORCHESTRATOR_MERGE_PERMISSION=DENIED
ORCHESTRATOR_PUSH_PERMISSION=DISABLED_BY_DEFAULT
```

El orquestador no reutilizará el directorio de configuración, token ni sesión
administrativa de Israel. Usará un `GH_CONFIG_DIR` aislado y una credencial
limitada al repositorio `Ciesparza29/ANKLO_OS`, con la menor vigencia y los
permisos mínimos compatibles con las operaciones autorizadas.

El perfil ordinario permitirá consultar metadatos, issues, pull requests,
checks y ramas, y escribir únicamente los handoffs o comentarios expresamente
allowlisted. No tendrá permisos de administración, secretos, entornos,
protección de ramas ni merge.

La capacidad de push no estará disponible en el perfil ordinario. Si el piloto
demuestra que debe existir, se expondrá como una capacidad separada, cargada
solo después de validar `PUSH_AUTHORIZED`, limitada a la rama exacta y retirada
al terminar el efecto. La presencia técnica de una credencial con escritura no
sustituye la aprobación ni amplía el alcance.

Antes de cada operación, el adaptador verificará identidad efectiva,
repositorio, endpoint, método, recurso objetivo y capacidad requerida. Una
credencial inesperada, más privilegiada de lo previsto, expirada o asociada a
otro repositorio bloqueará la operación y generará evidencia sin mostrar el
secreto.

#### Separación de identidad y prohibición de autoaprobación

La credencial dedicada del orquestador deberá pertenecer a un principal de
GitHub distinto del aprobador humano, como una GitHub App o una cuenta técnica
dedicada. Un token secundario perteneciente a `Ciesparza29` no satisface esta
separación.

```text
APPROVED_ACTOR=Ciesparza29
ORCHESTRATOR_EFFECTIVE_ACTOR=DEDICATED_NON_APPROVER_PRINCIPAL
ORCHESTRATOR_ACTOR_MUST_DIFFER_FROM_APPROVED_ACTOR=YES
ORCHESTRATOR_AUTHORED_APPROVAL=DENIED
```

El adaptador registrará y verificará la identidad efectiva del principal antes
de cada lectura o escritura. El validador rechazará cualquier aprobación
publicada, editada o recreada por la identidad del orquestador, aunque su
contenido reproduzca un esquema válido. Los handoffs escritos por el
orquestador no podrán conceder autoridad ni convertirse en aprobaciones.

### 6. Aprobaciones

Las aprobaciones se representarán mediante un bloque estructurado y
versionado, no mediante prosa libre.

Ejemplo normativo:

```yaml
anklo_approval:
  schema_version: "1.0"
  approval_kind: PLAN_APPROVED
  repository: Ciesparza29/ANKLO_OS
  issue_number: 24
  expires_at: ""
  approval_event_id: ""
  nonce: ""
  base_sha: ""
  plan_hash: ""
  source_snapshot_hash: ""
  authorized_files_hash: ""
  package_hash: null
```

El cuerpo del comentario contiene únicamente datos declarados por el aprobador.
El adaptador construirá y persistirá por separado un sobre observado desde la
API de GitHub:

```text
approval_comment_id
approval_author_login
approval_comment_created_at
approval_comment_updated_at
```

Los campos del sobre observado no deberán copiarse dentro del cuerpo como fuente
de autoridad.

El validador comprobará:

- autor allowlisted;
- tipo de aprobación;
- issue;
- SHA;
- hashes;
- vigencia;
- ausencia de cambios posteriores invalidantes.

Aprobaciones:

```text
PLAN_APPROVED
IMPLEMENT_APPROVED
PUSH_APPROVED
MERGE_APPROVED
```

`MERGE_APPROVED` solo registra que Israel puede ejecutar el merge manualmente.

#### Fuente, autenticidad, vigencia y protección contra replay

La única fuente válida de autorización para la primera versión será un
comentario estructurado en el Issue de GitHub correspondiente:

```text
APPROVAL_SOURCE=STRUCTURED_GITHUB_ISSUE_COMMENT
APPROVED_ACTOR=Ciesparza29
FREE_TEXT_APPROVAL=DENIED
APPROVAL_SCHEMA_VERSION=1.0
APPROVAL_REPLAY_PROTECTION=REQUIRED
APPROVAL_EXPIRATION=REQUIRED
```

Las etiquetas pueden reflejar el estado del flujo, pero no conceden autoridad.
Una frase libre, una reacción, una edición local, una salida de agente o la mera
existencia de un comentario no constituyen aprobación.

El comentario estructurado deberá incluir los siguientes campos comunes para
todos los tipos de aprobación:

```text
schema_version
approval_kind
repository
issue_number
expires_at
approval_event_id
nonce
```

Los campos específicos se incorporarán únicamente conforme al esquema del
`approval_kind`. Un campo obligatorio no podrá ser nulo ni una cadena vacía. Un
campo no declarado por el esquema será rechazado, salvo extensiones futuras
versionadas y namespaced que el validador conozca expresamente.

El registro observado asociado deberá obtener de GitHub y persistir:

```text
approval_comment_id
approval_author_login
approval_comment_created_at
approval_comment_updated_at
```

#### Campos específicos según el tipo de aprobación

Además de los campos comunes, cada tipo deberá cumplir un esquema versionado
propio. La matriz normativa inicial es:

```text
PLAN_APPROVED:
  REQUIRED=base_sha,plan_hash,source_snapshot_hash
  FORBIDDEN=target_branch,target_worktree_id,target_head_sha,
            authorized_files_hash,package_hash,target_repository,target_remote,
            pull_request_number,pull_request_head_sha

IMPLEMENT_APPROVED:
  REQUIRED=target_branch,target_worktree_id,target_head_sha,
           authorized_files_hash,package_hash
  FORBIDDEN=base_sha,plan_hash,source_snapshot_hash,target_repository,
            target_remote,pull_request_number,pull_request_head_sha

PUSH_APPROVED:
  REQUIRED=target_repository,target_remote,target_branch,target_head_sha,
           package_hash
  FORBIDDEN=base_sha,plan_hash,source_snapshot_hash,target_worktree_id,
            authorized_files_hash,pull_request_number,pull_request_head_sha
  EQUALITY_CONSTRAINT=repository==target_repository

MERGE_APPROVED:
  REQUIRED=pull_request_number,pull_request_head_sha
  FORBIDDEN=base_sha,plan_hash,source_snapshot_hash,target_branch,
            target_worktree_id,target_head_sha,authorized_files_hash,
            package_hash,target_repository,target_remote
```

Los campos de `PUSH_APPROVED` deberán coincidir exactamente con el repositorio,
remoto, rama y commit que se pretende publicar. `package_hash` será obligatorio
en `IMPLEMENT_APPROVED` y `PUSH_APPROVED`, y estará prohibido en los otros tipos
mientras el esquema permanezca en la versión `1.0`. La aprobación no podrá
interpretarse a partir de valores implícitos del entorno local. `MERGE_APPROVED`
seguirá siendo únicamente un registro para la decisión y ejecución manual de
Israel; no habilitará un comando de merge.

El cuerpo no declarará ni duplicará como autoridad el identificador, autor,
`createdAt` o `updatedAt` del comentario. El adaptador obtendrá esos valores
directamente desde GitHub y verificará que `approval_author_login` corresponda al
actor humano allowlisted.

La primera versión solo aceptará comentarios que no hayan sido editados antes de
su primera ingestión:

```text
INITIAL_APPROVAL_REQUIRES_CREATED_AT_EQUALS_UPDATED_AT=YES
EFFECTIVE_APPROVAL_TIME=approval_comment_created_at
POST_INGESTION_EDIT_INVALIDATES=YES
```

La vigencia se evaluará contra `expires_at` mediante una fuente de tiempo definida
y una tolerancia máxima de desfase. Si GitHub no permite demostrar la igualdad
inicial de timestamps, el evento se rechazará en lugar de inferir su antigüedad.

Antes de cada efecto, el adaptador volverá a consultar el comentario y exigirá
que su identificador, autor y `updatedAt` coincidan con el sobre persistido. Una
edición, sustitución, eliminación o discordancia invalidará la aprobación.

El validador recuperará el comentario directamente desde GitHub y comprobará
autor, identidad del repositorio, issue, esquema, vigencia, hashes y que el
comentario no haya sido editado después del instante registrado. La aprobación
se rechazará si falta un campo obligatorio, si el actor no está allowlisted, si
el evento expiró, si el `nonce` o `approval_event_id` ya fue consumido para un
efecto no idempotente, o si cualquier dato protegido cambió.

La protección contra replay se aplicará mediante una restricción única sobre el
evento de aprobación y el efecto autorizado. Un reintento idempotente del mismo
run podrá consultar el resultado ya registrado, pero no repetirá el efecto. Una
aprobación no podrá reutilizarse para otro issue, SHA, plan, paquete, conjunto de
archivos o tipo de operación.

### 7. Máquina de estados

Los estados del núcleo previos a publicación serán:

```text
DRAFT
NEEDS_DECISION
PLAN_READY
PLAN_APPROVED
READY_TO_DISPATCH
RUNNING_IMPLEMENTATION
BLOCKED
IMPLEMENTATION_COMPLETE
READY_FOR_REVIEW
RUNNING_REVIEW
CHANGES_REQUESTED
DONE
CANCELLED
QUARANTINED
```

Las transiciones serán declarativas y probadas. Una transición inválida no
producirá efectos secundarios.

La tabla versionada de transiciones será un artefacto bloqueante antes de
implementar la máquina de estados. Como contrato mínimo, deberá preservar este
ciclo:

```text
DRAFT -> NEEDS_DECISION | PLAN_READY
NEEDS_DECISION -> PLAN_READY | CANCELLED
PLAN_READY -> PLAN_APPROVED
PLAN_APPROVED -> READY_TO_DISPATCH
READY_TO_DISPATCH -> RUNNING_IMPLEMENTATION
RUNNING_IMPLEMENTATION -> IMPLEMENTATION_COMPLETE | BLOCKED | QUARANTINED | CANCELLED
IMPLEMENTATION_COMPLETE -> READY_FOR_REVIEW
READY_FOR_REVIEW -> RUNNING_REVIEW
RUNNING_REVIEW -> READY_FOR_PUSH | CHANGES_REQUESTED | BLOCKED | QUARANTINED
CHANGES_REQUESTED -> READY_TO_DISPATCH | PLAN_READY | CANCELLED
READY_FOR_PUSH -> PUSH_AUTHORIZED
PUSH_AUTHORIZED -> PUSHED
PUSHED -> READY_FOR_PR
READY_FOR_PR -> PR_OPEN
PR_OPEN -> CI_PENDING | CI_RUNNING
CI_PENDING -> CI_RUNNING | CI_FAILED
CI_RUNNING -> CI_FAILED | CI_PASSED
CI_FAILED -> CHANGES_REQUESTED | BLOCKED | CANCELLED
CI_PASSED -> READY_FOR_HUMAN_MERGE
READY_FOR_HUMAN_MERGE -> DONE | BLOCKED | CANCELLED
```

Una transición desde `CHANGES_REQUESTED` a `READY_TO_DISPATCH` solo será válida
si el plan y el alcance permanecen vigentes y se han revalidado paquete,
aprobaciones y hashes; si cambian plan o alcance, deberá volver a `PLAN_READY`.
`DONE` será terminal y solo se alcanzará después de observar desde GitHub el
merge manual ejecutado por Israel y persistir el handoff final. Un run terminado
sin merge se representará como `CANCELLED`, no como `DONE`. Desde estados
terminales no se permitirán nuevos efectos; únicamente consultas y exportación
de evidencia.

#### Estados de publicación, pull request y CI

La máquina de estados se amplía con:

```text
READY_FOR_PUSH
PUSH_AUTHORIZED
PUSHED
READY_FOR_PR
PR_OPEN
CI_PENDING
CI_RUNNING
CI_FAILED
CI_PASSED
READY_FOR_HUMAN_MERGE
```

Reglas mínimas:

- `READY_FOR_PUSH` indica que verificaciones, revisión y alcance permiten
  solicitar autorización; no concede permiso para publicar.
- `PUSH_AUTHORIZED` exige una aprobación estructurada, vigente y específica para
  rama, SHA, remoto y package hash.
- `PUSHED` exige verificar que el `remote head` coincida exactamente con el SHA
  local autorizado.
- `READY_FOR_PR` exige rama publicada, upstream esperado y ausencia de
  invalidaciones.
- `PR_OPEN` registra el número, URL, base, head y SHA del PR recuperados desde
  GitHub. En la primera versión, el PR debe haber sido creado manualmente.
- `CI_PENDING`, `CI_RUNNING`, `CI_FAILED` y `CI_PASSED` se derivan de checks
  consultados en GitHub y no de afirmaciones de un agente.
- `CI_PASSED` solo será válido cuando el SHA evaluado coincida exactamente con
  el head actual del PR, el remote head verificado y el commit autorizado; todos
  los checks requeridos para ese SHA deberán haber concluido con éxito.
- Un check exitoso de otro SHA, un resultado obsoleto o un conjunto incompleto de
  checks no contará como `CI_PASSED`.
- `CODEX_REVIEW_PASS` deberá referenciar el mismo commit autorizado y revisado.
- `CI_FAILED` bloquea todo avance hacia merge.
- Ningún estado ejecuta merge.

`CODEX_REVIEW_PASS`, `REMOTE_HEAD_VERIFIED`, `NO_INVALIDATED_APPROVALS` y
`HEAD_SHA_BINDING_VERIFIED` son guardas persistidas con evidencia y hash, no
estados de la máquina. Su pérdida, expiración o discordancia invalida la
transición que dependa de ellas.

`PUSH_APPROVED` es el tipo de aprobación humana; `PUSH_AUTHORIZED` es el estado
alcanzado únicamente después de validarla.

`READY_FOR_HUMAN_MERGE` requiere simultáneamente:

```text
PUSH_AUTHORIZED
REMOTE_HEAD_VERIFIED
PR_OPEN
CODEX_REVIEW_PASS
CI_PASSED
NO_INVALIDATED_APPROVALS
HEAD_SHA_BINDING_VERIFIED
```

Ese estado solo informa que Israel puede evaluar y ejecutar manualmente el
merge. No constituye `MERGE_APPROVED` ni habilita una operación automática.

### 8. Work package

Cada ejecución usará un paquete inmutable, generado fuera del worktree y
validado antes del despacho.

El hash se calculará sobre una representación canónica que excluya el propio
campo `package_hash`.

Cualquier cambio en:

- issue;
- plan;
- criterios;
- archivos autorizados;
- archivos prohibidos;
- base SHA;
- aprobación;

invalidará el paquete y obligará a generar uno nuevo.

#### Canonicalización del work package

La representación canónica usada para calcular el hash obedecerá estas reglas:

```text
ENCODING=UTF-8
LINE_ENDINGS=LF
HASH_ALGORITHM=SHA-256
OBJECT_KEYS=LEXICOGRAPHIC_ORDER
ARRAY_ORDER=PRESERVED
PATHS=NORMALIZED_RELATIVE_PATHS
PACKAGE_HASH_FIELD=EXCLUDED_FROM_HASH_INPUT
```

Los strings no sufrirán normalizaciones semánticas implícitas. Los números,
booleanos y valores nulos conservarán su tipo. Se rechazarán rutas absolutas,
segmentos `..`, separadores ambiguos y claves duplicadas. La serialización
canónica será implementada por una única función versionada y cubierta por
vectores de prueba compartidos entre generador y validador.

#### Algoritmo de invalidación

Antes de cada efecto externo y después de cada espera relevante, el orquestador
volverá a obtener y comparar:

```text
SOURCE_SNAPSHOT_HASH
ISSUE_BODY_HASH
ISSUE_UPDATED_AT
PLAN_HASH
BASE_SHA
AUTHORIZED_FILES_HASH
APPROVAL_EVENT_ID
APPROVAL_COMMENT_UPDATED_AT
PACKAGE_HASH
```

La comparación se realizará contra el snapshot persistido del run. Si cualquiera
de estos valores difiere, si el comentario fue editado, si la aprobación expiró,
si cambió el conjunto de archivos o si el paquete ya no reproduce su hash, el
run pasará a estado bloqueado o cuarentena según el momento del fallo. No se
intentará regenerar silenciosamente el paquete ni trasladar una aprobación a la
nueva versión.

### 9. Worktrees

Cada issue tendrá como máximo un worktree implementador activo.

El adaptador Git:

- solo aceptará el repositorio allowlisted;
- exigirá una base SHA exacta;
- impedirá trabajar sobre `main`;
- rechazará rutas existentes no registradas;
- rechazará la rama del PR #7;
- no ejecutará reset, clean, rebase ni force push;
- no eliminará worktrees o ramas;
- registrará evidencia antes y después.

### 10. Antigravity

Camino preferido:

```text
PROGRAMMATIC_OFFICIAL
```

mediante el SDK oficial, siempre que el piloto demuestre:

- instalación reproducible y fijada;
- autenticación apropiada;
- permisos deny-by-default;
- control del directorio;
- políticas y hooks efectivos;
- salida estructurable;
- timeout y cancelación;
- ausencia de acceso productivo;
- ausencia de modificación fuera del worktree;
- ausencia de copia manual de prompts.

El agente comenzará con herramientas denegadas. La escritura solo se habilitará
después de `IMPLEMENT_APPROVED` y únicamente para rutas autorizadas.

Fallback:

```text
SUPERVISED_ONE_CLICK
```

mediante la CLI oficial, cuando el SDK no pueda cumplir los controles pero la
CLI permita preparar y abrir de manera segura el contexto exacto, requiriendo
una acción explícita de Israel.

Se rechaza:

```text
MANUAL_ONLY
GUI_COORDINATE_AUTOMATION
KEYBOARD_SIMULATION
UNAUDITED_ACCESSIBILITY_AUTOMATION
```

### 11. Codex

Codex será invocado automáticamente mediante su interfaz `exec`, usando:

- directorio explícito;
- sandbox read-only;
- sesión efímera;
- MCP deshabilitado;
- esquema de salida;
- salida JSON.

Git se comprobará externamente antes y después.

Codex podrá recomendar:

```text
APPROVE
REQUEST_CHANGES
BLOCKED
NOT_VERIFIABLE
```

No podrá aprobar requisitos ni ejecutar merge.

### 12. OpenCode

OpenCode será un adaptador opcional.

Condiciones mínimas:

```text
opencode run
--pure
--format json
--dir <worktree>
--auto prohibido
```

Su fallo no cambiará el resultado del camino crítico.

### 13. Runner

El runner no aceptará comandos del work package.

Aceptará únicamente perfiles lógicos definidos en código o configuración
versionada:

```text
docs-only
code-standard
```

Cada comando tendrá:

- ejecutable fijo;
- argumentos fijos;
- cwd fijo;
- timeout;
- política de fallo;
- máximo de salida;
- sanitización;
- registro del exit code.

#### Verificaciones herméticas y prohibición de instalaciones implícitas

Las verificaciones se ejecutarán con estas restricciones:

```text
VERIFICATION_INSTALLS=DENIED
PACKAGE_RESOLUTION_DURING_RUN=DENIED
EXECUTABLE_PATHS=PRE_RESOLVED
NODE_MODULES_PREFLIGHT=REQUIRED
LOCKFILE_MUTATION=DENIED
NETWORK_DURING_VERIFICATION=DENIED_BY_DEFAULT
FILESYSTEM_SNAPSHOT_BEFORE_AFTER=REQUIRED
```

El perfil de verificación contendrá rutas absolutas o resoluciones previamente
validadas de cada ejecutable. No podrá usar comandos que descarguen paquetes,
resuelvan una versión ausente o acepten instalaciones implícitas. Se prohíben,
entre otros equivalentes, `npx`, `pnpm dlx` y cualquier uso de `pnpm exec` que
pueda instalar o resolver dependencias no presentes.

Antes de ejecutar se comprobarán los binarios requeridos, `node_modules` cuando
aplique, la versión de Node y pnpm, y los hashes de manifiestos y lockfiles. Al
final se compararán los mismos hashes y un snapshot del sistema de archivos
autorizado. Cualquier mutación no prevista, intento de red o ejecutable no
resuelto invalidará la verificación.

#### Entorno seguro de subprocesos

Todo proceso hijo recibirá un entorno construido desde cero mediante allowlist:

```text
SUBPROCESS_ENV=ALLOWLIST_ONLY
ENV_DUMP=DENIED
HOME=ISOLATED_OR_EXPLICIT
PATH=PINNED
TMPDIR=PER_RUN
PRODUCTION_ENV_VARS=REMOVED
DOTENV_AUTOLOAD=DENIED
GIT_HOOKS=DISABLED_FOR_AUTOMATED_RUNS
GIT_CONFIG_SCOPE=CONTROLLED
```

No se heredará el entorno completo del proceso padre. Se eliminarán variables de
producción, tokens no requeridos, agentes SSH no autorizados y rutas de
herramientas no fijadas. `HOME` apuntará a un directorio aislado o a uno
explícitamente autorizado; `TMPDIR` será exclusivo del run y se preservará si
la ejecución entra en cuarentena.

Los procesos se crearán sin shell, con argumentos separados y directorio de
trabajo comprobado. La carga automática de `.env` estará prohibida. No se
registrarán dumps de entorno; los nombres de variables sensibles tampoco se
copiarán innecesariamente a la evidencia.

Las operaciones Git automatizadas usarán configuración controlada y hooks
deshabilitados, por ejemplo mediante un `core.hooksPath` vacío administrado por
el orquestador. No se leerán configuraciones de repositorios o usuarios no
allowlisted para ampliar capacidades.

#### Red, loopback, symlinks, submódulos y hooks

La política distingue abrir un listener de realizar una conexión saliente:

```text
ORCHESTRATOR_LISTENERS=DENIED
INBOUND_REMOTE_CONNECTIONS=DENIED
OUTBOUND_NETWORK=DENIED_BY_DEFAULT
OUTBOUND_LOOPBACK_CONNECTIONS=ALLOWLISTED_OPTIONAL
```

El orquestador no abrirá puertos TCP, UDP, sockets de escucha accesibles ni
webhooks entrantes. Una conexión saliente a loopback podrá habilitarse solo para
un adaptador local identificado, puerto exacto, protocolo esperado y duración
del run. Loopback no se considerará automáticamente confiable ni habilitará
salida a Internet.

Todas las rutas se normalizarán y resolverán con `realpath` antes del efecto. Se
rechazarán symlinks que salgan de las raíces permitidas, enlaces que cambien
entre validación y uso, hardlinks inseguros y rutas que atraviesen componentes
no autorizados. El descriptor o recurso abierto deberá corresponder al objeto
validado inmediatamente antes de leer o escribir.

Los submódulos no se inicializarán, actualizarán ni ejecutarán durante un run.
Si un repositorio autorizado ya contiene submódulos, se tratarán como límites
separados y read-only hasta una decisión específica. Los hooks del repositorio,
globales y de plantillas no se ejecutarán en operaciones automatizadas.

### 14. Seguridad

Controles obligatorios:

- deny-by-default;
- repositorio y rutas allowlisted;
- no production credentials;
- no inbound listeners;
- no arbitrary shell;
- no environment dumps;
- secretos excluidos de paquetes y logs;
- comparación de Git antes y después;
- proceso implementador único;
- revisor read-only independiente;
- límites de tiempo y tamaño;
- validación de salidas;
- cuarentena ante inconsistencia;
- kill switch global y por run;
- preservación de evidencia.

### 15. Auditoría

Los eventos serán append-only e incluirán:

```text
schema_version
event_id
run_id
correlation_id
timestamp
actor
state_before
state_after
operation
approval_reference
package_hash
result
evidence_reference
```

Las rutas personales publicadas en GitHub se sanitizarán.

#### Política de logs, retención y límites

La evidencia crítica de auditoría y la salida operativa de procesos tendrán
tratamientos diferentes:

```text
AUDIT_EVENTS=NO_TRUNCATION
AGENT_RAW_OUTPUT=BOUNDED_AND_REDACTED
COMMAND_STDOUT=BOUNDED
COMMAND_STDERR=BOUNDED
```

Los eventos de auditoría estructurados conservarán íntegros sus campos
obligatorios y hashes. No se truncará silenciosamente un evento crítico; si no
puede persistirse de forma durable, el efecto externo no continuará y el run
entrará en cuarentena.

La salida cruda de agentes, `stdout` y `stderr` estará sujeta a límites
configurados por perfil, redacción previa a persistencia, segmentación y
referencias por hash. Los límites numéricos, cuotas de disco, compresión,
retención y purga se definirán en configuración versionada y serán parte del
piloto. Alcanzar un límite producirá un marcador explícito de truncamiento, no
una apariencia de salida completa.

La redacción eliminará secretos, tokens, credenciales, variables sensibles,
rutas personales no necesarias y datos personales ajenos al objetivo. Nunca se
registrarán dumps completos del entorno. La purga automática no eliminará
evidencia asociada a runs en cuarentena, incidentes, revisiones pendientes o
decisiones todavía auditables.

### 16. Kill switch

Ubicación candidata:

```text
~/.anklo-orchestrator/KILL_SWITCH
```

La existencia del archivo impedirá:

- nuevos despachos;
- renovaciones no necesarias;
- nuevas invocaciones de agentes;
- nuevas escrituras en GitHub;
- push.

La cancelación preservará worktrees, estado y evidencia.

### 17. Cuarentena

Un run se moverá lógicamente a `QUARANTINED` cuando:

- el paquete no valide;
- Git cambie durante una fase read-only;
- aparezca una colisión de lease;
- falle la integridad del state store;
- el agente escriba fuera del alcance;
- se pierda el proceso hijo sin estado confiable;
- una aprobación quede invalidada durante la ejecución;
- la recuperación automática sea insegura.

Salir de cuarentena requerirá decisión humana.

### 18. Rollback

El orquestador será un componente auxiliar y reversible.

Rollback:

1. activar kill switch;
2. impedir nuevos runs;
3. detener procesos hijos;
4. poner runs incompletos en cuarentena;
5. respaldar state store y artefactos;
6. volver a una versión fijada del código;
7. ejecutar migraciones inversas solo cuando estén probadas;
8. restaurar backup compatible si procede;
9. usar temporalmente el flujo manual validado en la Fase 15;
10. preservar ramas, worktrees, paquetes, logs y comentarios.

El rollback no modificará código funcional del ERP.

## Matriz de trazabilidad de las Skills internas

Las Skills son contratos versionados de procedimiento y salida. No conceden
permisos, no sustituyen aprobaciones y no pueden ampliar el issue.

| Skill                      | Componente consumidor principal               | Uso dentro del flujo                                                                               |
| -------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `anklo-context-check`      | application core y context validator          | Verifica fuentes, estado Git, decisiones y contradicciones antes de planificar o despachar.        |
| `anklo-issue-readiness`    | GitHub adapter y readiness service            | Decide si el issue contiene el contrato mínimo y si existen bloqueos funcionales.                  |
| `anklo-plan-increment`     | plan service y approval validator             | Produce el plan versionado cuya identidad y hash serán objeto de aprobación.                       |
| `anklo-work-package`       | work-package service                          | Genera el paquete inmutable y su representación canónica.                                          |
| `anklo-dispatch-readiness` | dispatch gate, lease manager y state machine  | Revalida aprobaciones, base SHA, disponibilidad, permisos, lease y kill switch antes del despacho. |
| `anklo-pr-review`          | Codex adapter                                 | Construye el contrato de revisión independiente y read-only.                                       |
| `anklo-review-result`      | review normalizer y state machine             | Valida y normaliza el resultado del revisor antes de permitir una transición.                      |
| `anklo-handoff`            | handoff service, GitHub adapter y audit store | Publica el resumen verificable y relaciona evidencia, commit, PR y siguiente acción autorizada.    |

Cada consumidor fijará el nombre de la Skill, su `schema_version` y el hash de
la versión utilizada. Una Skill ausente, no válida, modificada después de la
aprobación o incompatible con el consumidor bloqueará el flujo. El orquestador
no ejecutará texto arbitrario contenido en una Skill como shell o código.

## Plan del piloto de Antigravity

### P0 — Investigación de versión

Sin instalar:

- seleccionar una versión publicada;
- revisar licencia y release notes;
- registrar requisitos de Python;
- registrar hashes disponibles;
- definir autenticación;
- revisar herramientas, políticas y hooks.

### P1 — Entorno aislado

Después de autorización:

- instalar un Python compatible fuera del Python del sistema;
- crear entorno virtual dedicado;
- instalar el SDK fijado;
- registrar versión y hashes;
- no modificar el repositorio.

### P2 — Fixture desechable read-only

Usar un repositorio ficticio fuera de ANKLO-OS.

Demostrar:

- listado permitido;
- lectura permitida;
- escritura denegada;
- shell denegado;
- acceso externo denegado;
- salida JSONL;
- timeout;
- kill switch;
- Git sin cambios.

### P3 — Fixture desechable con escritura controlada

Con aprobación específica:

- permitir un único archivo;
- denegar rutas restantes;
- denegar `.git`;
- denegar comandos peligrosos;
- comprobar diff exacto;
- comprobar que no hubo escritura fuera del alcance.

### P4 — Fallos y recuperación

Simular:

- proceso interrumpido;
- timeout;
- salida malformada;
- intento de comando prohibido;
- intento de path traversal;
- paquete alterado;
- aprobación invalidada;
- duplicado del mismo run.

### P5 — Piloto ANKLO docs-only

Solo después de P0–P4:

- issue documental de riesgo bajo;
- base SHA exacta;
- worktree nuevo;
- un archivo documental autorizado;
- ninguna dependencia funcional;
- ninguna migración;
- ninguna relación con el PR #7;
- revisión Codex read-only;
- CI;
- merge manual.

### Métricas obligatorias del piloto

La Fase 15 constituye la línea base manual. El piloto de la Fase 16 registrará,
como mínimo:

```text
TIME_TO_DISPATCH
IMPLEMENTATION_DURATION
REVIEW_DURATION
MANUAL_INTERVENTIONS
PROMPTS_COPIED
RETRIES
BLOCKS
FALSE_DISPATCHES
AGENT_COST_OR_CONSUMPTION
```

La métrica de salida obligatoria será:

```text
PROMPTS_EXTENSOS_COPIADOS_MANUALMENTE=0
```

Los tiempos se derivarán de eventos persistidos y no de estimaciones del
agente. Cada intervención manual se clasificará por causa; los reintentos,
bloqueos y falsos despachos conservarán referencia al run y a la evidencia. La
comparación se realizará contra tareas de riesgo y tamaño semejantes, sin
declarar mejora únicamente porque aumentó la automatización.

El piloto no se considerará exitoso si reduce tiempo a costa de incumplir
criterios, ampliar alcance, perder evidencia, omitir revisión o aumentar
defectos. Los umbrales numéricos finales se aprobarán antes del piloto real.

### Criterio de clasificación

`PROGRAMMATIC_OFFICIAL` requiere:

- SDK oficial;
- invocación programática;
- permisos verificables;
- trabajo entregado sin copiar prompt;
- salida capturable;
- ejecución reproducible;
- cancelación;
- aislamiento;
- evidencia completa.

Si falla, se evalúa `SUPERVISED_ONE_CLICK`.

Si solo se consigue `MANUAL_ONLY`, la Fase 16 queda bloqueada.

## Threat model

### Activos

- repositorio;
- ramas y worktrees;
- issues y aprobaciones;
- paquetes de trabajo;
- credenciales locales;
- estado de runs;
- logs y evidencia;
- integridad de CI;
- PR #7;
- autoridad exclusiva de Israel.

### Trust boundaries

1. GitHub → orquestador.
2. Texto no confiable → contratos validados.
3. Orquestador Node → adaptador Python.
4. Adaptador → runtime Antigravity.
5. Orquestador → procesos Git y verificadores.
6. Orquestador → Codex/OpenCode.
7. Runtime local → GitHub.
8. Worktree → sistema de archivos exterior.

### Amenazas y mitigaciones

| Amenaza                              | Mitigación                                                             |
| ------------------------------------ | ---------------------------------------------------------------------- |
| Prosa interpretada como autorización | Eventos estructurados y actor allowlisted                              |
| Autoaprobación del orquestador       | Principal distinto del aprobador y rechazo por identidad efectiva      |
| Metadatos GitHub autodeclarados      | Sobre observado desde la API, separado del cuerpo                      |
| Paradoja de hash al aceptar el ADR   | Hash candidato y final con transición determinista solo de estado      |
| Aprobación replay                    | Nonce, hashes, issue y vigencia                                        |
| TOCTOU sobre SHA o issue             | Revalidación inmediatamente antes del efecto                           |
| CI o revisión de un SHA obsoleto     | Vinculación exacta entre commit autorizado, PR, remote head y checks   |
| Command injection                    | Spawn sin shell y argumentos allowlisted                               |
| Path traversal                       | Resolución real de ruta, raíz permitida y rechazo de enlaces inseguros |
| Symlink escape                       | `realpath` y comprobación antes de cada escritura                      |
| Doble ejecución                      | Lease transaccional e idempotency key única                            |
| Proceso zombi                        | Heartbeat, PID y expiración controlada                                 |
| SDK comprometido                     | Versión fijada, fuente oficial, hashes y entorno aislado               |
| Prompt injection                     | Contenido no concede permisos ni cambia políticas                      |
| Agent tool escalation                | Deny-by-default, hooks y validación externa                            |
| Codex modifica archivos              | Sandbox read-only y comparación de Git                                 |
| Salida falsa o malformada            | Esquema estricto y evidencia independiente                             |
| Fuga de secretos                     | Entorno mínimo, redacción y sin dumps                                  |
| Disco lleno                          | Cuotas, límites y parada segura                                        |
| Corrupción SQLite                    | Backups, integrity check y cuarentena                                  |
| Borrado destructivo                  | Sin cleanup automático                                                 |
| Modificación de main                 | Rechazo por rama y worktree                                            |
| Modificación del PR #7               | Rama, SHA y rutas protegidas                                           |
| Bypass del merge humano              | Ningún puerto o comando de merge implementado                          |
| Acceso productivo                    | Sin credenciales ni endpoints de producción                            |

## Consecuencias positivas

- Reduce traslado manual de contexto.
- Mantiene aprobaciones humanas.
- Crea aislamiento reproducible.
- Permite recuperación tras fallos.
- Normaliza resultados de diferentes agentes.
- Conserva auditoría verificable.
- Mantiene el ERP desacoplado de la automatización.
- Permite reemplazar adaptadores sin reescribir el núcleo.

## Costos y consecuencias negativas

- Añade un segundo runtime para Antigravity.
- Añade almacenamiento local y migraciones propias.
- Requiere mantener esquemas y contratos.
- Introduce complejidad de concurrencia.
- Exige pruebas de seguridad y recuperación.
- El SDK de Antigravity está en preview y puede cambiar.
- SQLite en Node debe encapsularse por su madurez actual.
- El polling tiene latencia y consumo de API.
- La primera versión seguirá requiriendo aprobaciones explícitas.

## Alternativas consideradas

### Repositorio separado

No seleccionada inicialmente.

Ventajas:

- mayor aislamiento;
- releases independientes;
- menor riesgo de afectar CI del ERP.

Desventajas:

- duplica gobierno y configuración;
- dificulta reutilización de contratos;
- aumenta la carga inicial.

Debe reconsiderarse si el orquestador adquiere ciclo de release o secretos
claramente distintos.

### Orquestador completamente en Python

No seleccionado.

Simplifica Antigravity, pero separa el núcleo del stack principal del
repositorio y aumenta el mantenimiento para las demás integraciones.

### Solo Antigravity CLI

Fallback, no primera opción.

Puede servir para `SUPERVISED_ONE_CLICK`, pero no garantiza por sí sola una
invocación programática completa.

### Automatizar la aplicación de escritorio

Rechazada.

No se usarán coordenadas, teclado, posición de ventanas ni accesibilidad no
auditada.

### Servicio HTTP local

Diferido.

No se justifican puertos entrantes para el piloto.

### Archivos JSON como único state store

Rechazada como almacenamiento principal.

Son simples, pero insuficientes para leases, unicidad, concurrencia y
recuperación transaccional.

## Glosario operativo

- **Aprobación:** evento estructurado, vigente y verificable que autoriza un
  efecto específico; no equivale a una opinión o etiqueta.
- **Efecto:** operación que modifica estado local o remoto, crea recursos,
  ejecuta un agente, publica información o cambia una rama.
- **Run:** instancia identificada e idempotente del flujo para un issue, plan,
  base SHA y paquete determinados.
- **Lease:** exclusión temporal y transaccional que impide implementadores o
  runs incompatibles sobre el mismo recurso.
- **Work package:** contrato inmutable y canonicalizado que contiene el alcance
  autorizado para un agente.
- **Handoff:** salida estructurada que relaciona resultado, evidencia, estado y
  siguiente acción sin conceder autoridad adicional.
- **Cuarentena:** estado de preservación en el que se bloquean efectos nuevos
  hasta una decisión humana.
- **Kill switch:** control que impide nuevos despachos y efectos, preservando la
  evidencia existente.
- **Implementador:** agente con escritura limitada al worktree y archivos
  autorizados.
- **Revisor:** agente independiente y read-only que no implementa ni fusiona.
- **State store:** SQLite local que persiste estados, leases, aprobaciones,
  idempotencia y referencias de evidencia.
- **Listener:** recurso que acepta conexiones entrantes; está prohibido para la
  primera versión.
- **Loopback:** conexión saliente limitada a un servicio local exacto; solo se
  admite mediante allowlist explícita.

## Relación precisa con los ADR 0001–0009

ADR-0010 es una decisión de infraestructura y gobierno de agentes. No sustituye,
modifica ni reinterpreta decisiones funcionales, de dominio, datos, seguridad
del ERP o arquitectura modular contenidas en los ADR 0001–0009.

El orquestador debe consumir esos ADR como fuentes versionadas cuando sean
aplicables. Ante una contradicción entre un paquete de trabajo y un ADR vigente,
el flujo se detendrá en lugar de escoger una interpretación. ADR-0010 tampoco
autoriza funcionalidades, migraciones, cambios de producto, divisiones
`PRODUCT-SPLIT` ni modificaciones del PR #7.

## Decisiones pendientes posteriores a la aceptación arquitectónica

La aceptación de este ADR aprueba la arquitectura y sus límites de autoridad; no
selecciona automáticamente herramientas, versiones, credenciales ni parámetros
operativos todavía pendientes.

```text
DECISIONS_BLOCKING_ADR_ACCEPTANCE=NONE
```

### Bloqueantes antes de iniciar la implementación

- Duración exacta, emisión, rotación y revocación de la credencial limitada del
  orquestador.
- Implementación concreta y versión fijada del adaptador SQLite.
- División exacta de subissues y PR de implementación.
- Política para commits preparados por el orquestador y mecanismo temporal de
  push cuando exista autorización específica.

### Bloqueantes antes del piloto técnico de Antigravity

- Versión exacta del SDK.
- Python exacto y método de instalación.
- Mecanismo de autenticación exacto requerido por el SDK, incluida Gemini API key
  o ADC únicamente si la versión seleccionada lo exige.
- Duración, renovación y expiración exactas de leases.
- Límites numéricos de logs, cuotas, retención y backup.

### Bloqueantes antes del piloto ANKLO docs-only

- Issue documental que servirá como piloto.
- Umbrales numéricos para declarar exitoso el piloto.

Cada decisión se registrará en una fuente versionada y deberá aprobarse antes de
la puerta indicada. Mientras permanezca pendiente no podrá inferirse desde este
ADR ni completarse por una herramienta o agente.

## Metadatos requeridos para aceptar el ADR

El ADR candidato permanecerá como `PROPUESTO` durante la auditoría y la
aceptación. Para evitar una referencia circular al cambiar el estado, la
aceptación utilizará dos hashes calculados antes de publicar el comentario.

### Protocolo determinista de hashes y transición de estado

```text
ACCEPTANCE_HASH_ALGORITHM=SHA-256
ACCEPTANCE_HASH_INPUT=EXACT_FILE_BYTES
ACCEPTANCE_ENCODING_NORMALIZATION=DENIED
ACCEPTANCE_LINE_ENDING_NORMALIZATION=DENIED
STATUS_TRANSITION_SOURCE_BYTES=UTF8("- **Estado:** PROPUESTO\n")
STATUS_TRANSITION_TARGET_BYTES=UTF8("- **Estado:** ACEPTADO\n")
STATUS_TRANSITION_REQUIRED_MATCH_COUNT=1
STATUS_TRANSITION_OTHER_BYTE_CHANGES=DENIED
```

- `CANDIDATE_ADR_HASH` será el SHA-256 hexadecimal en minúsculas de los bytes
  exactos del archivo auditado con estado `PROPUESTO`.
- `FINAL_ACCEPTED_ADR_HASH` será el SHA-256 hexadecimal en minúsculas de los bytes
  obtenidos en memoria al reemplazar exactamente una vez la secuencia fuente por
  la secuencia objetivo.

El cálculo fallará si la secuencia fuente aparece cero veces o más de una vez,
si el archivo no es UTF-8 válido, si no usa LF, si carece de newline final o si
cualquier byte adicional cambia. Entre ambos cálculos y la materialización no se
ejecutará formatter, normalizador ni reescritura del documento.

### Evidencia de auditoría resoluble

El cuerpo del comentario de aceptación incluirá:

```text
ACCEPTANCE_EVENT_ID
CANDIDATE_ADR_HASH
FINAL_ACCEPTED_ADR_HASH
FINAL_STATUS=ACEPTADO
ACCEPTED_BASE_SHA
AUDIT_EVIDENCE_REFERENCE
AUDIT_EVIDENCE_HASH
AUDIT_EVIDENCE_HASH_ALGORITHM=SHA-256
AUDIT_EVIDENCE_FORMAT_VERSION=1.0
AUDIT_EVIDENCE_STORAGE_KIND
AUDIT_DECISION=APPROVE
```

La evidencia de auditoría será un artefacto estructurado que incluya, como
mínimo, identificador del ADR, hash candidato auditado, decisión, conteo de
hallazgos críticos y altos, productor de la auditoría, timestamp y versión del
formato. El hash se calculará sobre los bytes exactos recuperados del recurso
referenciado, sin normalización.

Los mecanismos admitidos inicialmente serán:

```text
GITHUB_ISSUE_COMMENT:
  reference=repository,issue_number,comment_id
  hash_input=UTF8_EXACT_API_BODY
  initial_created_at_must_equal_updated_at=YES

REPOSITORY_BLOB:
  reference=repository,commit_sha,path,blob_oid
  hash_input=EXACT_BLOB_BYTES
```

Para el bootstrap previo a la implementación del orquestador se usará un
comentario dedicado del Issue #24 con `AUDIT_EVIDENCE_STORAGE_KIND` igual a
`GITHUB_ISSUE_COMMENT`. Ese comentario no concede autoridad, no sustituye el
comentario de aceptación y deberá recuperarse mediante la API. Su edición,
eliminación, cambio de autor, discordancia de `updatedAt`, referencia o hash
invalidará la aceptación. En una fase posterior podrá usarse un blob de
repositorio fijado a un commit exacto.

El adaptador observará y persistirá por separado desde GitHub:

```text
ACCEPTANCE_EVENT_SOURCE=STRUCTURED_GITHUB_ISSUE_COMMENT
ACCEPTANCE_ACTOR
ACCEPTANCE_COMMENT_ID
ACCEPTANCE_COMMENT_CREATED_AT
ACCEPTANCE_COMMENT_UPDATED_AT
INITIAL_ACCEPTANCE_REQUIRES_CREATED_AT_EQUALS_UPDATED_AT=YES
ACCEPTED_AT=ACCEPTANCE_COMMENT_CREATED_AT
```

`ACCEPTANCE_ACTOR` se derivará del autor efectivo devuelto por GitHub y deberá
ser `Ciesparza29`; no será un valor autodeclarado en el cuerpo. La aceptación se
rechazará si el comentario ya había sido editado antes de su primera ingestión.
`AUDIT_EVIDENCE_REFERENCE` y `AUDIT_EVIDENCE_HASH` deberán resolver al mismo
artefacto cuya decisión sea `APPROVE` y que registre cero hallazgos críticos y
cero hallazgos altos abiertos.

Después de validar el comentario, la única edición permitida para materializar
la aceptación será la sustitución exacta del estado indicada arriba. Antes de
guardar o commitear, el blob resultante deberá reproducir
`FINAL_ACCEPTED_ADR_HASH`. Cualquier otro cambio, una discordancia de hash, una
edición posterior del comentario, un cambio de base SHA o una auditoría distinta
invalidará la aceptación y exigirá una nueva auditoría y un nuevo evento.

## Criterios para aceptar este ADR

- El threat model cubre los límites reales.
- Israel aprueba ubicación y runtimes.
- Las aprobaciones provienen de comentarios estructurados, expiran y cuentan
  con protección contra replay e invalidación.
- Los identificadores, autores y timestamps generados por GitHub se obtienen de
  la API y se persisten en un sobre observado separado del cuerpo.
- La identidad efectiva del orquestador es distinta del aprobador humano y no
  puede publicar una aprobación válida.
- La credencial del orquestador es dedicada, limitada y distinta de la sesión
  administrativa humana.
- Cada aprobación de push vincula explícitamente repositorio, remoto, rama,
  commit y package hash.
- La persistencia SQLite soporta leases atómicos, restricciones de unicidad,
  verificación de integridad, migraciones versionadas y backup previo.
- Las verificaciones son herméticas, no instalan ni resuelven paquetes durante
  el run y detectan mutaciones del sistema de archivos.
- Los subprocesos reciben un entorno allowlisted, sin variables productivas,
  carga automática de `.env` ni hooks Git.
- No existen listeners entrantes; cualquier conexión loopback requiere
  allowlist explícita.
- Las ocho Skills están relacionadas con consumidores concretos y sus versiones
  y hashes son verificables.
- La política de auditoría separa eventos íntegros de salidas acotadas y
  redactadas.
- El piloto registra métricas comparables y exige
  `PROMPTS_EXTENSOS_COPIADOS_MANUALMENTE=0`.
- El SDK tiene un plan de piloto aislado.
- El fallback supervisado está definido.
- Merge y producción carecen de ejecución automática.
- El rollback permite volver al flujo manual.
- El PR #7 queda explícitamente protegido.
- La primera versión observa PR creados manualmente y vincula revisión, remote
  head, PR head y CI al mismo commit autorizado.
- La implementación puede dividirse en cambios pequeños y revisables.
- La segunda auditoría concluye sin hallazgos críticos ni altos y la aceptación
  estructurada referencia una evidencia resoluble, no editada y verificable por
  hash, además del hash candidato y el hash final determinista del ADR aceptado.
- Los hashes de aceptación se calculan con SHA-256 sobre bytes exactos y una sola
  transición de estado; cualquier normalización o cambio adicional se rechaza.
- Las decisiones pendientes están clasificadas por puerta de control y ninguna
  se interpreta como aprobada por la aceptación arquitectónica del ADR.

## Relaciones

- Complementa `docs/ai/AGENT_OPERATING_MODEL.md`.
- Implementa límites de `docs/ai/SECURITY_BOUNDARIES.md`.
- Consume las ocho Skills internas.
- No modifica los ADR funcionales 0001–0009.
- No autoriza ningún `PRODUCT-SPLIT`.
- No autoriza modificar el PR #7.
