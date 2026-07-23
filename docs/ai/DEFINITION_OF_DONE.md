# Definición de Terminado (DEFINITION OF DONE)

## Estados de "Terminado"

- **Terminado local:** implementación completa y verificaciones locales ejecutadas sobre el SHA actual.
- **Terminado en PR:** rama publicada, PR abierto, CI vigente verde y revisión pendiente o realizada.
- **Terminado tras merge:** merge manual autorizado y cambio presente en `main`.
- **Terminado operativo:** despliegue, adopción o activación verificados cuando corresponda.
- **No terminado:** existe cualquier requisito, verificación, revisión, aprobación o evidencia pendiente.

## Aclaraciones Importantes

- CI histórica no sustituye CI del SHA actual.
- `docker compose config` solo valida la configuración, no asegura que el contenedor levante correctamente con la aplicación.
- Árbol limpio no prueba corrección del código o funcionalidad.
- Un PR abierto no está terminado.
- Merge no implica despliegue.
- Revisión independiente y aprobación humana son controles distintos.
- El cierre de cada issue depende de la condición de terminado aplicable definida en el propio issue.
- un issue documental puede terminar tras verificaciones, CI, revisión independiente, PR y merge manual autorizado;
- un issue de despliegue o activación puede exigir terminado operativo.

Para el Issue #12, la condición de terminado exige:

- plan aprobado;
- cambios documentales;
- verificaciones;
- CI vigente;
- revisión independiente;
- PR;
- merge manual autorizado por Israel.
  (No exige despliegue productivo).
