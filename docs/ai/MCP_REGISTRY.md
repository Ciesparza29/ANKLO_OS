# Registro MCP (MCP REGISTRY)

No hay MCP registrados como habilitados por este documento.

## Estados de Registro

- `CANDIDATO`: propuesto para evaluación, sin acceso todavía.
- `EN_REVISION`: en proceso de auditoría y análisis de riesgos.
- `APROBADO_NO_INSTALADO`: aprobado funcionalmente pero pendiente de configuración.
- `HABILITADO_LIMITADO`: activo bajo restricciones específicas.
- `SUSPENDIDO`: temporalmente desactivado por precaución o incidente.
- `RETIRADO`: desactivado permanentemente.
- `RECHAZADO`: evaluado y denegado su uso.

**Nota:** Una transición entre estados requiere revisión y aprobación registrada.

## Campos de Registro MCP

```text
Nombre:
Proveedor:
Documentación o repositorio:
Propietario interno:
Versión:
Finalidad:
Clasificación de datos:
Permisos:
Operaciones de escritura:
Acceso a red:
Secretos:
Entornos:
Riesgos:
Evidencia de revisión:
Aprobador:
Fecha:
Estado:
Procedimiento de suspensión:
Procedimiento de retiro:
```

## Notion MCP oficial — piloto limitado

Nombre: Notion MCP oficial
Proveedor: Notion Labs, Inc.
Documentación o repositorio: `https://developers.notion.com/guides/mcp/get-started-with-mcp`
Endpoint previsto: `https://mcp.notion.com/mcp`
Propietario interno: Israel
Versión: Servicio hospedado administrado por Notion; versión no fijada en el repositorio
Finalidad: Evaluar acceso controlado a documentación no sensible de Notion desde Antigravity
Cliente previsto: Antigravity
Clasificación de datos: Solo contenido de prueba o documentación no sensible preparada expresamente para el piloto
Permisos efectivos: No concedidos
Operaciones de escritura: No autorizadas
Operaciones explícitamente prohibidas: Crear, editar, borrar, mover, archivar, compartir, exportar o sobrescribir contenido
Acceso a red: No habilitado
Secretos: OAuth administrado fuera del repositorio; prohibido almacenar tokens, cookies, códigos, credenciales o secretos en Git, issues, logs o evidencias
Entornos: Producción fuera de alcance
Aprobador: Israel
Fecha de revisión inicial: 2026-07-24
Estado: `EN_REVISION`

### Resultado de la evaluación técnica

- La configuración global de Antigravity se encuentra en `~/.gemini/config/mcp_config.json`.
- La configuración global aplica a todas las sesiones y no es aceptable para este piloto limitado.
- Antigravity permite MCP empaquetado dentro de plugins.
- Un MCP de plugin solo está activo cuando el plugin correspondiente está habilitado.
- Las herramientas MCP se descubren e incorporan automáticamente.
- La política predeterminada puede permitir todas las herramientas MCP.
- Para restringirlas debe utilizarse una política de denegación por defecto y autorizaciones por nombre exacto.
- No existe evidencia de que `.agents/mcp_config.json` sea una ubicación runtime reconocida por Antigravity.
- La configuración experimental en `.agents/mcp_config.json` fue retirada antes de cualquier conexión.
- No se ejecutó OAuth.
- No se conectó ningún MCP.
- No se realizó ninguna lectura o escritura en Notion.

### Estado del piloto

Piloto bloqueado de forma preventiva.

No debe configurarse Notion MCP globalmente en `~/.gemini/config/mcp_config.json`.

No debe ejecutarse OAuth mientras no exista un mecanismo de aislamiento y control de herramientas demostrado.

### Condición para avanzar

Diseñar, revisar y aprobar un plugin de Antigravity aislado que:

1. contenga su propio `mcp_config.json`;
2. solo se active de forma explícita;
3. utilice una política `deny_all()` o equivalente;
4. permita únicamente herramientas de lectura identificadas por nombre exacto;
5. deniegue cualquier herramienta de creación, edición, borrado, movimiento, archivo, compartición o exportación;
6. use únicamente contenido de prueba no sensible;
7. documente instalación, activación, suspensión y retiro;
8. sea aprobado por Israel antes de instalarse o autenticarse.

### Riesgos identificados

- activación global accidental;
- exposición de herramientas de escritura;
- permisos equivalentes al usuario autenticado;
- acceso a contenido no autorizado;
- persistencia insegura de credenciales;
- ampliación de alcance sin aprobación;
- falsa sensación de aislamiento por usar una ruta no reconocida.

### Mitigaciones

- no usar configuración global;
- no ejecutar OAuth;
- no instalar plugins sin revisión;
- aplicar denegación por defecto;
- permitir herramientas por nombre exacto;
- usar contenido de prueba;
- conservar evidencia de cada transición;
- exigir autorización humana separada.

### Evidencia de revisión

- Fase 14.1: auditoría de entrada.
- Fase 14.2: inspección de configuraciones activas.
- Fase 14.3: configuración documental inicial.
- Fase 14.4: auditoría de ubicación runtime.
- Fase 14.5: diagnóstico de configuración central.
- Fase 14.6: confirmación de archivo global vacío.
- Fase 14.7: auditoría de plugins y políticas.

### Procedimiento de suspensión

1. Deshabilitar el plugin, si existiera.
2. Cerrar Antigravity.
3. Revocar OAuth desde Notion.
4. Confirmar que no exista configuración global.
5. Registrar la suspensión y conservar evidencia.

### Procedimiento de retiro

1. Revocar OAuth.
2. Eliminar el plugin mediante un cambio autorizado.
3. Confirmar ausencia de configuración MCP global.
4. Cambiar este registro a `RETIRADO`.
5. Conservar evidencia del cierre.
