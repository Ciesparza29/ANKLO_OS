# Manual de Aterrizaje: Supervisor de Instalación de Anclajes — ANKLO

**Preparado para:** Israel, ingeniero biotecnólogo, primera supervisión de obra
**Alcance:** Guía técnica, normativa, de gestión y de sistemas para el puesto de Supervisor de Instalación de Anclajes

---

## Nota importante: lee esto primero

Antes de entrar en detalle, tres correcciones/aclaraciones normativas que cambian partes de lo que pediste:

1. **El Acuerdo Ministerial 174 (2008) ya no está vigente.** El 8 de septiembre de 2025, el Ministerio del Trabajo expidió el **Acuerdo Ministerial Nro. MDT-2025-122**, el nuevo *"Reglamento de seguridad en el trabajo y prevención de riesgos laborales para la construcción y obras públicas y privadas"*, que deroga expresamente el AM 00174. Es la norma que debes exigir que ANKLO aplique. La explico en la Sección 2.
2. **La NEC-SE-HM no es un manual de instalación de anclajes adhesivos.** Es la norma ecuatoriana de diseño de estructuras de hormigón armado (colado en sitio). Trata "anclaje" en el sentido de longitud de desarrollo de refuerzo embebido, y remite explícitamente al **ACI 318** para el diseño de conexiones. El diseño y la instalación de anclajes post-instalados (adhesivos/epóxicos, mecánicos) se rige por el **Capítulo 17 del ACI 318 ("Anchoring to Concrete")**, complementado por las normas de calificación de producto (ACI 355.4 para adhesivos), los métodos de ensayo ASTM E488/E1512, y — esto es lo más importante en el día a día — las **Instrucciones de Instalación Impresas del Fabricante (MPII, por sus siglas en inglés)** del producto epóxico específico que use ANKLO (ej. Hilti, Simpson Strong-Tie, Sika). Esas instrucciones son las que tienen fuerza contractual y de aprobación (ICC-ES ESR), y son las que debes seguir al pie de la letra.
3. **No voy a inventar cifras que dependen del producto** (tiempo de gel, tiempo de curado, diámetro exacto de broca, profundidad de empotramiento de diseño). Esos valores varían según el fabricante, la temperatura y el diámetro de varilla, y deben salir de la ficha técnica (MPII/ESR) del epóxico que ANKLO realmente usa. Te indico dónde y cómo verificarlos.

Con eso aclarado, aquí está el manual completo.

---

## 1. Procedimiento técnico de instalación de anclajes con epóxico

### 1.1 Marco normativo (verificado)

| Norma / documento | Qué cubre | Rol en tu trabajo diario |
|---|---|---|
| **ACI 318, Capítulo 17 — "Anchoring to Concrete"** | Diseño de anclajes colados y post-instalados (mecánicos y adhesivos) ante tracción, corte y combinación de cargas | Es la base de diseño que debió usar el ingeniero que definió el anclaje; tú verificas que la instalación sea consistente con ese diseño |
| **ACI 355.4** | Calificación de anclajes adhesivos post-instalados (la base técnica detrás de los ESR de cada producto) | Define de dónde salen los valores del ESR del fabricante |
| **ASTM E488 / E488M** | Métodos de ensayo de resistencia (tracción y corte) de anclajes en hormigón, en laboratorio | No es un protocolo de campo; es la base con la que el fabricante calificó el producto y generó su ESR |
| **ASTM E1512** | Métodos de ensayo específicos de desempeño de adherencia (bond) de anclajes adhesivos | Igual que el anterior: respaldo de laboratorio detrás de los valores publicados |
| **ICC-ES AC308 / ESR del producto** | Criterios de aceptación específicos de anclajes adhesivos, y el reporte de evaluación (ESR) de cada producto comercial | **Este es tu documento de cabecera en obra.** Ahí están el método de limpieza aprobado, tiempos de gel/curado, diámetros de broca y profundidades válidas para ESE producto |
| **NEC-SE-HM (Ecuador)** | Diseño de hormigón armado colado en sitio; longitud de anclaje de refuerzo | Contexto general de la estructura donde ancla; remite a ACI 318 para conexiones |

**Acción inmediata:** pide a tu jefe o al ingeniero residente el **ESR (Evaluation Service Report)** o ficha técnica del epóxico y de la varilla/perno que usa ANKLO. Imprímelo, plastifícalo, y llévalo contigo. Todo lo cuantitativo (diámetro de broca, profundidad, tiempo de gel, tiempo de curado) debe salir de ahí, no de una tabla genérica.

### 1.2 Secuencia de instalación (principios generales, válidos para cualquier producto epóxico de calidad)

| Paso | Qué se hace | Punto de control crítico |
|---|---|---|
| 1. Lectura de planos | Confirmar ubicación, diámetro de varilla, profundidad de empotramiento (h_ef) especificada por el diseñador, espaciamiento y distancia a borde | ¿La ubicación real en campo coincide con el plano? ¿Hay refuerzo existente (varillas) que pueda interferir con la perforación? |
| 2. Trazado/marcado | Marcar el punto exacto con plantilla o cinta métrica | Verificar espaciamiento mínimo entre anclajes y distancia mínima a borde según el diseño (afectan la resistencia por "cono de rotura") |
| 3. Perforación | Perforar con broca del diámetro indicado en el ESR del producto (no asumas que es "diámetro de varilla + margen fijo"; cada producto define su propio diámetro de broca por tabla) | Profundidad real vs. profundidad especificada (usa tope de profundidad en el taladro o marca en la broca); perpendicularidad del taladro |
| 4. Limpieza del orificio | Método típico de la industria: **soplado – cepillado – soplado ("blow-brush-blow")**, frecuentemente repetido dos veces (2×2×2), con aire comprimido libre de aceite y cepillo de acero del diámetro correcto | El orificio debe quedar libre de polvo, agua estancada, hielo, grasa. **Una limpieza deficiente es la causa más común de fallas de anclajes adhesivos en campo.** Sigue exactamente el método del MPII del producto — algunos requieren más o menos ciclos |
| 5. Verificación de condiciones | Confirmar temperatura del hormigón y del producto dentro del rango que indica la ficha técnica; si hay agua en el orificio, seguir el protocolo de purga que indique el fabricante | Fuera de rango de temperatura, el tiempo de gel y la resistencia final cambian drásticamente |
| 6. Inyección del epóxico | Usar boquilla mezcladora estática (no premezclar a mano); descartar el primer tramo de mezcla (purga inicial) hasta que el color sea uniforme; inyectar desde el fondo del orificio hacia afuera para evitar burbujas de aire, llenando aproximadamente 2/3 del volumen (ajustar según diámetro de varilla) | Verificar uniformidad del color de la mezcla (bicomponente) antes de usarla en el anclaje |
| 7. Inserción de la varilla/anclaje | Insertar con movimiento de rotación leve hasta el fondo/marca de profundidad, dentro del **tiempo de trabajo (gel time)** del producto | No mover ni cargar el anclaje después de insertado; marcar la varilla para verificar visualmente que quedó a la profundidad correcta |
| 8. Curado | Dejar reposar sin perturbaciones ni cargas durante el **tiempo de curado** especificado (varía fuertemente con temperatura) | No golpear, no atornillar accesorios pesados, no aplicar carga de servicio antes del curado completo |
| 9. Verificación / ensayo de campo | Si el proyecto lo exige (según especificación técnica o criterio del fiscalizador), se realiza ensayo de **proof load** (tracción controlada a un porcentaje de la carga de diseño) o **ensayo de torque**, sobre una muestra o el 100%, según el plan de inspección especial del proyecto | Estos ensayos de campo se basan en los principios de ASTM E488, pero el protocolo exacto (carga, % de la muestra, criterio de aceptación) lo define la especificación del proyecto, no tú — pregunta si ANKLO tiene un plan de inspección especial definido |
| 10. Documentación | Registrar cada anclaje o lote instalado (ver plantilla en Sección 6.5) | Sin registro, no hay trazabilidad ante una auditoría o una falla |

### 1.3 Sobre embebido (h_ef) — un dato sí verificado y útil

El Capítulo 17 del ACI 318 (a través de ACI 355.4) establece que la profundidad de empotramiento de anclajes adhesivos está teóricamente acotada entre **4 y 20 veces el diámetro del anclaje (4·d_a ≤ h_ef ≤ 20·d_a)**, como límite del modelo de adherencia. Esto es un límite teórico del modelo, **no** el valor de diseño de tu proyecto — el h_ef específico lo define el ingeniero diseñador para cada conexión, según la carga requerida. Úsalo solo como verificación de sentido común: si una profundidad especificada en un plano está muy fuera de ese rango, es una señal para preguntar antes de perforar.

---

## 2. Protocolos de seguridad laboral

### 2.1 Marco normativo vigente (Ecuador, julio 2026)

| Norma | Estado | Aplica a |
|---|---|---|
| **Decreto Ejecutivo Nro. 255** (02-may-2024) | Vigente | Reglamento general de Seguridad y Salud en el Trabajo — aplica a todos los sectores |
| **Acuerdo Ministerial Nro. MDT-2025-122** (08-sep-2025) | Vigente — **reemplaza al AM 174/2008** | Reglamento de seguridad en el trabajo y prevención de riesgos laborales específico para construcción y obras públicas y privadas |
| **Código del Trabajo** | Vigente | Obligaciones generales empleador-trabajador, jornada, recargos |
| **Decisión 584 (CAN) / Resolución 957** | Vigente | Instrumento Andino de Seguridad y Salud en el Trabajo (marco regional) |
| Normativa técnica INEN aplicable | Vigente | Especificaciones técnicas de EPP y materiales |

El MDT-2025-122 exige que **todo el personal con cargos de responsabilidad en la obra —incluidos los supervisores— reciba información e instrucción específica en seguridad y salud**, y establece plazos para que los empleadores cuenten con personal técnico certificado. Pregunta en RRHH de ANKLO si ya tienen definido el programa de capacitación exigido por este nuevo reglamento; si no lo tienen, es una oportunidad para que tú lo impulses.

**Punto que debes confirmar directamente con ANKLO (no lo voy a inventar):** el reglamento nuevo aún no tenía, al momento de mi verificación, toda su normativa técnica secundaria completamente desplegada (el propio acuerdo da hasta 6 meses para los instrumentos técnicos y hasta 18 meses para la certificación del personal). Pregunta a tu jefe directo o al departamento de SSO qué procedimientos internos de ANKLO ya están alineados a este reglamento.

### 2.2 EPP obligatorio por tarea

| Tarea | EPP mínimo |
|---|---|
| Perforación con taladro rotativo/rotopercutor | Casco, gafas de seguridad o careta, protección auditiva (el ruido de rotopercutores suele superar 85 dB), guantes de trabajo, respirador contra polvo (sílice cristalina — riesgo respiratorio serio en perforación de hormigón), calzado de seguridad |
| Manejo de epóxico | Guantes químicamente resistentes (nitrilo, según la Hoja de Seguridad/SDS del producto — el epóxico puede causar sensibilización cutánea con exposición repetida), gafas de seguridad, ropa de manga larga; ventilación adecuada si se trabaja en espacio confinado |
| Trabajo en altura (si aplica) | Arnés de cuerpo completo, línea de vida, punto de anclaje certificado, casco con barbiquejo; nunca trabajar en altura sin dos puntos de anclaje independientes (el de posicionamiento y el de detención de caídas) |
| Conducción del camión de la empresa | Cumplimiento de normativa de tránsito, revisión pre-uso del vehículo (frenos, luces, llantas), carga asegurada de herramientas y materiales, prohibido transportar personal en la tolva/carrocería de carga |
| General en obra | Casco, chaleco reflectivo, calzado de seguridad con puntera, en todo momento dentro del perímetro de obra |

### 2.3 Manejo seguro de herramientas eléctricas/rotativas

- Inspección visual antes de cada uso (cable, carcasa, broca sin fisuras).
- Uso de brocas apropiadas para hormigón armado (carburo de tungsteno); si se golpea refuerzo (varilla) al perforar, detener y reevaluar la ubicación con el diseñador, no forzar la perforación.
- Sujeción firme con ambas manos en rotopercutores; anticipar el par de reacción (torque de reacción) que puede lesionar la muñeca si la broca se traba.
- Puesta a tierra o doble aislamiento de las herramientas; nunca usar herramientas eléctricas dañadas o con cables pelados, especialmente en condiciones húmedas.
- Control de polvo de sílice: usar aspiración en la fuente cuando sea posible (brocas huecas con sistema de vacío) además del respirador — es exigencia creciente en normativa internacional de seguridad (OSHA 1926.1153 es la referencia técnica más citada a nivel internacional para este riesgo, aunque no es de aplicación directa en Ecuador, es una buena práctica de referencia).

### 2.4 Seguridad vial en transporte de personal y equipo

- Vehículos usados para transportar trabajadores deben estar en condiciones óptimas de funcionamiento y ser aptos para ese fin (no transportar personal en la tolva de carga).
- Definir velocidad máxima y señalización dentro del perímetro de obra según el tipo de vehículo y riesgos existentes.
- Registro de kilometraje y combustible si vas a manejar el camión — te sirve además para control administrativo (Sección 6).

### 2.5 Checklist diario de seguridad (modelo)

```
FECHA: ____________  OBRA/PROYECTO: ____________  SUPERVISOR: ____________

[ ] Charla de 5 minutos (riesgos del día) realizada
[ ] EPP completo verificado en todo el personal (casco, gafas, guantes, calzado, chaleco)
[ ] Herramientas eléctricas inspeccionadas (cables, carcasas, brocas)
[ ] Vehículo revisado antes de salida (frenos, luces, llantas, carga asegurada)
[ ] Área de trabajo señalizada / delimitada
[ ] SDS del epóxico disponible en obra
[ ] Ventilación adecuada donde se aplica epóxico
[ ] Puntos de anclaje para trabajo en altura verificados (si aplica)
[ ] Botiquín de primeros auxilios presente y completo
[ ] Incidentes/casi-accidentes del día: ____________________
[ ] Firma supervisor: ____________  Firma responsable SSO (si aplica): ____________
```

---

## 3. Gestión de personal y cadena de mando

Vienes de un contexto técnico-científico (biotecnología, laboratorio) a liderar personal operativo de campo — es un cambio real, pero varias de tus fortalezas (rigor, documentación, pensamiento en protocolos) son ventajas, no debilidades, si las combinas con las siguientes prácticas.

### 3.1 Liderazgo situacional (modelo Hersey-Blanchard, adaptado a obra)

| Nivel de madurez del trabajador en la tarea | Estilo recomendado | Ejemplo en tu contexto |
|---|---|---|
| Nuevo en la tarea, poca experiencia | **Dirigir**: instrucciones claras y específicas, supervisión cercana | Instalador nuevo aprendiendo el protocolo de limpieza de orificios: acompáñalo paso a paso las primeras veces |
| Alguna experiencia, motivación variable | **Entrenar**: explicas el "por qué", das espacio para preguntas, sigues supervisando de cerca | Instalador que ya perfora bien pero se salta pasos de limpieza por apuro: refuerza el porqué de cada paso, no solo el qué |
| Experimentado, pero necesita apoyo en decisiones | **Apoyar**: das autonomía, participas en la toma de decisiones, delegas más | Instalador senior a quien puedes delegar la revisión de calidad de otros compañeros |
| Experimentado y autónomo | **Delegar**: defines el resultado esperado, dejas el cómo a su criterio, supervisión mínima | Un instalador que puede liderar una cuadrilla pequeña en tu ausencia puntual |

No es un estilo fijo por persona — es por *tarea*. La misma persona puede necesitar "dirigir" en una tarea nueva y "delegar" en una que domina.

### 3.2 Autoridad respetada (no impuesta)

- **Domina el protocolo técnico antes que nada.** La autoridad de un supervisor recién llegado se construye más rápido por competencia técnica visible que por jerarquía formal. Si tú puedes explicar *por qué* se limpia el orificio de cierta forma, o *por qué* una profundidad importa, ganas credibilidad rápido — y esto lo tienes a tu favor por tu formación técnica.
- **Sé consistente**: mismas reglas para todos, todos los días. La inconsistencia (dejar pasar algo un día y corregirlo al siguiente) erosiona autoridad más rápido que ser exigente.
- **Corrige el comportamiento en privado cuando sea posible; reconoce en público.** Corregir en voz alta frente al equipo genera resentimiento y no cambia el comportamiento tan bien como una conversación directa y respetuosa.

### 3.3 Retroalimentación constructiva (modelo SBI: Situación – Comportamiento – Impacto)

En vez de "hiciste mal el anclaje" (juicio, genera defensiva), usa:
- **Situación:** "En el anclaje del eje B-3 de esta mañana..."
- **Comportamiento:** "...no se hizo el ciclo completo de soplado-cepillado-soplado..."
- **Impacto:** "...lo que puede reducir la resistencia del anclaje y significa que tenemos que rehacerlo, perdiendo tiempo y material."

Cierra siempre preguntando: *"¿Qué necesitas de mí para que esto no vuelva a pasar?"* — convierte la corrección en solución conjunta, no en regaño.

### 3.4 Resolución de conflictos

1. Separar a las partes si hay tensión activa, escuchar individualmente antes de mediar en conjunto.
2. Enfocarse en el hecho concreto (qué pasó, cuándo, con qué impacto en la obra), no en atributos de la persona.
3. Buscar un acuerdo operativo específico ("a partir de mañana, X hace Y, Z hace W"), no solo una disculpa genérica.
4. Documentar si el conflicto afecta seguridad o calidad — no por castigar, sino por trazabilidad.

### 3.5 Reporte hacia tus superiores

- **Frecuencia:** diario (parte de obra, Sección 6.1) + semanal (resumen ejecutivo con KPIs, Sección 6.2).
- **Formato:** breve, con datos primero, contexto después. Un gerente de obra necesita saber en 30 segundos: ¿avanzamos según lo planeado?, ¿hay incidentes?, ¿hay bloqueos que requieren su decisión?
- **Regla de oro:** nunca sea la primera vez que tu jefe se entera de un problema serio por otra persona. Reporta proactivamente incidentes, retrasos y no conformidades, aunque sea información incómoda — construye confianza a largo plazo.

---

## 4. Optimización de procesos y control de calidad

### 4.1 PDCA aplicado a instalación de anclajes

| Fase | En tu contexto |
|---|---|
| **Plan (Planificar)** | Antes de iniciar el día: ¿cuántos anclajes hay que instalar?, ¿qué recursos (broca, epóxico, personal) se necesitan?, ¿hay interferencias conocidas (refuerzo, instalaciones)? |
| **Do (Hacer)** | Ejecutar según el protocolo de la Sección 1, con el checklist de calidad (4.3) por cada anclaje o lote |
| **Check (Verificar)** | Revisar al final del día: ¿cuántos anclajes cumplieron el protocolo al 100%?, ¿hubo desviaciones?, ¿qué dice el registro de no conformidades? |
| **Act (Actuar)** | Ajustar el protocolo o la capacitación según lo detectado — por ejemplo, si varios instaladores se saltan el mismo paso, no es un problema de una persona, es un problema de proceso o de entrenamiento |

Este ciclo, repetido semanalmente, es la base de la mejora continua tipo Lean Construction sin necesitar herramientas complejas.

### 4.2 Identificación de cuellos de botella

Preguntas prácticas para tu contexto (concepto de Lean Construction: "flujo" y "desperdicio"):
- ¿El equipo espera por materiales (epóxico, brocas) que no llegaron a tiempo? → cuello de botella de logística.
- ¿El equipo espera por aprobación de ubicación (interferencia con refuerzo) antes de perforar? → cuello de botella de coordinación con diseño/fiscalización.
- ¿Se repite trabajo por limpieza deficiente del orificio? → cuello de botella de calidad/capacitación.
- ¿El camión pasa tiempo muerto por mala planificación de rutas entre frentes de trabajo? → cuello de botella logístico tuyo, como conductor/coordinador.

Registra el tiempo perdido por categoría cada día (aunque sea estimado en minutos) — en unas semanas vas a ver un patrón claro de dónde se pierde más tiempo, y ahí enfocas tu esfuerzo de mejora.

### 4.3 Checklist de calidad por anclaje/lote (modelo)

```
OBRA: __________  FECHA: __________  INSTALADOR: __________  SUPERVISOR: __________

Anclaje / lote N°: __________   Ubicación (eje/nivel): __________
[ ] Ubicación verificada contra plano
[ ] Diámetro de broca correcto según ficha técnica del producto
[ ] Profundidad de perforación verificada (marca/tope)
[ ] Ciclo de limpieza completo (soplado-cepillado-soplado) según MPII
[ ] Orificio libre de agua/polvo/grasa al momento de inyectar
[ ] Purga inicial de epóxico descartada, color de mezcla uniforme
[ ] Anclaje insertado dentro del tiempo de gel
[ ] Profundidad final de la varilla verificada visualmente
[ ] Sin perturbación durante tiempo de curado
[ ] Fotografía de respaldo tomada
Resultado: [ ] Conforme   [ ] No conforme (ver registro de no conformidad N°: _____)
```

### 4.4 Registro de no conformidades (modelo)

| N° | Fecha | Ubicación | Descripción de la desviación | Causa raíz probable | Acción correctiva | Responsable | Cierre (fecha) |
|---|---|---|---|---|---|---|---|
| 001 | | | Ej: limpieza incompleta del orificio | Ej: apuro por cumplir meta diaria | Ej: reperforar y re-limpiar; reforzar charla de seguridad/calidad | | |

### 4.5 Auditoría interna rápida (semanal, 15-20 minutos)

1. Selecciona al azar 3-5 anclajes instalados esa semana (idealmente antes de que queden ocultos por acabados).
2. Revisa contra el checklist 4.3 y el registro correspondiente.
3. Verifica que la documentación (Sección 6.5) exista y sea consistente con lo observado en campo.
4. Registra hallazgos y decide si ameritan una no conformidad formal.
5. Comunica hallazgos positivos también — refuerza el comportamiento correcto, no solo corrige el incorrecto.

---

## 5. Aplicación de estadística: datos, KPIs y control

### 5.1 Datos a recolectar cada día

| Dato | Unidad | Para qué sirve |
|---|---|---|
| Hora de inicio / fin de perforación por anclaje o lote | hh:mm | Calcular tiempos de ciclo |
| Hora de limpieza | hh:mm | Verificar que se realizó y su duración |
| Hora de inyección | hh:mm | Trazabilidad de tiempo de gel disponible |
| Hora de inserción del anclaje | hh:mm | Verificar cumplimiento de tiempo de gel |
| N° de anclajes instalados | conteo | Productividad |
| N° de anclajes con no conformidad | conteo | Tasa de defectos |
| Horas-hombre trabajadas (por persona) | horas | Base de productividad y de nómina |
| Consumo de cartuchos de epóxico | unidades/ml | Control de material |
| Incidentes / casi-accidentes | conteo, descripción | Seguridad |
| Ítems de checklist cumplidos vs. totales | conteo | Cumplimiento de protocolo |

### 5.2 Fórmulas de KPI

- **Productividad** = N° de anclajes instalados ÷ horas-hombre trabajadas *(anclajes/hora-hombre)*
- **Tasa de defectos** = (N° de anclajes con no conformidad ÷ N° total de anclajes instalados) × 100
- **Cumplimiento de protocolo** = (Ítems de checklist cumplidos ÷ Ítems totales del checklist) × 100, promediado por día o semana
- **Consumo de material** = Cartuchos de epóxico usados ÷ N° de anclajes instalados *(comparar contra el consumo teórico según volumen de orificio, para detectar desperdicio o fugas)*
- **Eficiencia de tiempo** = (Tiempo estándar planeado ÷ Tiempo real empleado) × 100 *(si sale menor a 100%, el proceso tardó más de lo previsto)*

### 5.3 Gráficos de control (para detectar variación anormal, no solo promedio)

Con datos diarios como "anclajes instalados por día" o "tiempo promedio por anclaje", el gráfico más práctico cuando no tienes subgrupos grandes es un **gráfico de Individuales y Rango Móvil (I-MR)**:

- Rango móvil: `MR_i = |X_i − X_(i-1)|`
- Línea central de individuales: `X̄` (promedio de todos los valores)
- **LSC (límite superior de control) = X̄ + 2.66 × MR̄**
- **LIC (límite inferior de control) = X̄ − 2.66 × MR̄**
- Línea central de rango móvil: `MR̄`
- LSC del rango móvil = 3.267 × MR̄ ; LIC = 0

*(Las constantes 2.66 y 3.267 son constantes estadísticas estándar para gráficos de control con subgrupo n=2 — no son un valor que yo haya inventado para tu caso, son de tablas estándar de control estadístico de procesos.)*

**Cómo interpretarlo:** un punto fuera de los límites de control (LSC/LIC) indica una causa especial (algo cambió: nuevo instalador, lote de epóxico diferente, clima) que merece investigarse — no es "mala suerte", es una señal. Puntos dentro de los límites, aunque varíen, son variación normal del proceso.

Si prefieres agrupar por día con varios anclajes (subgrupo n>1), el gráfico clásico es **X̄-R** (promedio y rango), con constantes A2, D3, D4 que varían según el tamaño de subgrupo — te recomiendo usar una plantilla de Excel/Sheets con estas fórmulas ya armadas en vez de calcular a mano cada semana (te lo dejo listo en la Sección 7).

### 5.4 Histogramas y tendencias semanales

- **Histograma de tiempos de instalación por anclaje**: te muestra si el proceso es consistente (campana estrecha) o disperso (cola larga = hay algo generando variabilidad, como distintos operarios con distinta técnica).
- **Tendencia semanal de tasa de defectos**: grafica la tasa de defectos semana a semana; una tendencia a la baja confirma que tus acciones correctivas (Sección 4.4) están funcionando; una tendencia al alza es alerta temprana antes de que se vuelva un problema grande.

### 5.5 Ejemplo de tabla de registro diario (para volcar a tu sistema, Sección 7)

| Fecha | Anclaje/lote | Hora perf. | Hora limp. | Hora inyec. | Hora inserción | Instalador | Conforme (S/N) | Observación |
|---|---|---|---|---|---|---|---|---|

---

## 6. Plantillas de informes

### 6.1 Informe diario de obra (parte diario)

```
PARTE DIARIO DE OBRA — ANKLO
Fecha: __________        Obra/Proyecto: __________        N° de parte: __________
Supervisor: __________   Clima: __________   Horario: entrada __:__ / salida __:__

PERSONAL EN OBRA
Nombre                Cargo              Horas trabajadas    Horas extra (S/E)*
_______________       _____________      _______________      _______________
*S = suplementarias, E = extraordinarias

ACTIVIDADES REALIZADAS
- Anclajes instalados hoy: _____   Ubicación/eje: _____
- % de avance respecto a lo planificado: _____

MATERIALES CONSUMIDOS
Ítem                  Cantidad
_______________       _______________

INCIDENCIAS / NO CONFORMIDADES
_____________________________________________

VIÁTICOS Y GASTOS DEL DÍA
Concepto              Monto        Respaldo (factura/recibo)
_______________       _______      _______________

Firma supervisor: __________
```

### 6.2 Informe de rendimiento semanal/mensual (KPIs)

```
INFORME DE RENDIMIENTO — ANKLO
Periodo: __________   Obra/Proyecto: __________   Supervisor: __________

RESUMEN DE PRODUCCIÓN
- Anclajes instalados en el periodo: _____
- Productividad promedio (anclajes/hora-hombre): _____
- Horas-hombre totales: _____

CALIDAD
- Tasa de defectos del periodo: _____%
- No conformidades abiertas: _____   Cerradas: _____
- Cumplimiento de protocolo (checklist): _____%

MATERIAL
- Consumo real de epóxico: _____   vs. teórico: _____   Desviación: _____%

SEGURIDAD
- Incidentes: _____   Casi-accidentes: _____   Días sin incidentes: _____

OBSERVACIONES Y PLAN DE ACCIÓN PARA EL SIGUIENTE PERIODO
_____________________________________________
```

### 6.3 Informe de incidencias o no conformidades

Usa la tabla de la Sección 4.4 como base; para incidentes de seguridad, añade: hora exacta, testigos, si hubo lesión (leve/grave), si se notificó al IESS (obligatorio en caso de accidente de trabajo con baja médica), y las medidas correctivas inmediatas tomadas.

### 6.4 Informe de liquidación de viáticos y horas extra

**Importante sobre viáticos:** a diferencia de las horas extra (que sí tienen un porcentaje fijo por Código del Trabajo), **los viáticos en el sector privado no están fijados por una tabla legal única** — el Ministerio del Trabajo sí tiene una tabla de viáticos para servidores públicos (LOSEP), pero esa tabla **no aplica automáticamente a una empresa privada como ANKLO**. En el sector privado, el monto de viáticos (desayuno, almuerzo, movilización) se rige por la **política interna de la empresa** o el contrato/reglamento interno de trabajo. **Pregunta directamente a RRHH de ANKLO cuál es su política interna de viáticos** — no asumas un monto.

**Lo que sí es fijo por ley (Código del Trabajo, verificado con el Salario Básico Unificado 2026 = $482):**

| Concepto | Base legal | Recargo | Condición |
|---|---|---|---|
| Horas suplementarias | Art. 55 Código del Trabajo | +50% sobre valor hora | Trabajadas después de la jornada ordinaria, hasta las 24:00; máximo 4 horas/día y 12 horas/semana |
| Horas extraordinarias | Art. 55 Código del Trabajo | +100% sobre valor hora | Trabajadas entre 00:00 y 06:00, o en sábados, domingos y feriados |
| Recargo por jornada nocturna | Art. 49 Código del Trabajo | +25% adicional | Cuando la jornada *ordinaria* (no extra) cae entre 19:00 y 06:00; se suma a los recargos anteriores si además hay horas suplementarias/extraordinarias en ese horario |

**Fórmulas:**
- Valor hora ordinaria = Sueldo mensual ÷ 240
- Valor hora suplementaria = Valor hora ordinaria × 1.5
- Valor hora extraordinaria = Valor hora ordinaria × 2

**Ejemplo con SBU 2026 ($482/mes, jornada completa):**
Valor hora = 482 ÷ 240 = $2.01
Hora suplementaria = 2.01 × 1.5 = $3.02
Hora extraordinaria = 2.01 × 2 = $4.02

**Nota 2026:** existen acuerdos ministeriales recientes (MDT-2026-046 y MDT-2026-059) que permiten, **solo por acuerdo escrito entre empleador y trabajador y con autorización previa del Ministerio**, jornadas especiales y "banco de horas" para redistribuir las 40 horas semanales sin recargo, dentro de ciertos límites. Esto **no elimina** el derecho a recargos cuando se supera lo pactado — pregunta en RRHH si ANKLO tiene alguno de estos acuerdos activos, porque cambia cómo debes calcular y reportar las horas de tu equipo.

```
LIQUIDACIÓN SEMANAL — Trabajador: __________   Semana del: __________

Sueldo mensual: $______   Valor hora ordinaria: $______

Día    H. suplementarias   H. extraordinarias   Recargo nocturno (S/N)   Total día
___    _________________   __________________   ______________________   _________

TOTAL horas suplementarias: _____ × $_____ = $_____
TOTAL horas extraordinarias: _____ × $_____ = $_____
TOTAL viáticos (según política interna ANKLO): $_____
TOTAL A PAGAR: $_____
```

### 6.5 Informe de control de calidad por lote de anclajes

Usa la tabla de la Sección 5.5 (registro diario) agregada por lote, más el resumen de KPI del periodo (Sección 6.2, sección "Calidad"). Adjunta fotografías por anclaje o por lote representativo como respaldo.

---

## 7. Diseño de un sistema informático sencillo

### 7.1 Recomendación por fases (dado tu perfil)

Ya tienes experiencia construyendo sistemas reales (BioCore, con Flask y PostgreSQL), así que no partes de cero en lo técnico. Pero para las **primeras semanas en ANKLO**, la prioridad es velocidad de despliegue y uso desde el celular en obra — no la elegancia de la arquitectura. Te propongo dos fases:

**Fase 1 (semanas 1-4): Google Sheets + Google Forms + Apps Script**
- Cero costo, funciona desde el celular sin instalar nada, y tú ya puedes tenerlo funcionando en un día.
- No requiere depender de que ANKLO te dé acceso a un servidor o presupuesto de software.

**Fase 2 (mes 2 en adelante, si el volumen lo justifica): migrar a algo parecido a BioCore**
- Una vez que sepas exactamente qué campos y flujos realmente usa tu equipo día a día (lo vas a descubrir usando la Fase 1), migras a una aplicación web ligera con Flask + PostgreSQL — el mismo stack que ya conoces — con formularios optimizados para celular, generación automática de PDFs de los informes de la Sección 6, y paneles de KPI con gráficos en tiempo real. Esto también es un candidato natural si en algún momento quieres convertirlo en un producto que ofrezcas a otras constructoras (conectando con tu interés de escalar proyectos a SaaS).

### 7.2 Estructura de la Fase 1 (Google Sheets + Apps Script)

**Hojas (tablas) a crear:**

1. **Registro_Diario**: fecha, obra, anclaje/lote, hora perforación, hora limpieza, hora inyección, hora inserción, instalador, diámetro, profundidad, conforme (S/N), observación → alimenta la Sección 5.5
2. **Asistencia**: fecha, trabajador, hora entrada, hora salida, horas suplementarias, horas extraordinarias, recargo nocturno (S/N) → alimenta la Sección 6.4
3. **Viaticos_Gastos**: fecha, trabajador, concepto, monto, respaldo (sí/no) → alimenta la Sección 6.1 y 6.4
4. **Checklist_Seguridad**: fecha, ítem, cumplido (S/N), observación → alimenta la Sección 2.5
5. **No_Conformidades**: (columnas de la tabla 4.4)
6. **Panel_KPI** (hoja de fórmulas, no de captura): calcula automáticamente productividad, tasa de defectos, cumplimiento de protocolo con fórmulas `=PROMEDIO()`, `=CONTAR.SI()`, `=SUMAR.SI()` sobre las hojas anteriores, y un gráfico de tendencia semanal.

**Formularios (Google Forms) vinculados a cada hoja**, para que tú o tus instaladores capturen datos desde el celular sin abrir la hoja de cálculo directamente — más rápido y con menos errores en obra.

**Apps Script** (opcional, cuando tengas tiempo): un script simple que, al enviarse el Form del parte diario, genere automáticamente un PDF con el formato de la Sección 6.1 y lo envíe por correo a tu jefe — te ahorra transcribir el informe a mano cada tarde.

### 7.3 Cómo empezar (primer día de implementación)

1. Crea la hoja `Registro_Diario` con las columnas exactas de la Sección 5.5.
2. Crea el Form de "Parte diario" con esos mismos campos.
3. Úsalo tú mismo un par de días antes de pedirle a tus instaladores que lo usen — vas a descubrir campos que sobran o que faltan.
4. Recién cuando el flujo de captura esté estable, arma el Panel_KPI con fórmulas.
5. Escala a las demás hojas (asistencia, viáticos, checklist) una por una, no todas a la vez — evita el error común de sobre-diseñar el sistema antes de entender el proceso real.

---

## 8. Pasos prioritarios para tus primeras dos semanas

**Semana 1 — Entender antes de actuar**
1. Pide el ESR/ficha técnica del producto epóxico y del sistema de anclaje que usa ANKLO. Imprímelo.
2. Pregunta a RRHH: ¿cuál es la política interna de viáticos? ¿ANKLO tiene acuerdos de jornada especial/banco de horas (MDT-2026-046/059) activos? ¿Ya tienen implementado el reglamento MDT-2025-122 (capacitación, responsables SSO)?
3. Acompaña, sin intervenir todavía, la instalación completa de al menos 3-5 anclajes con tu equipo actual — observa el proceso real antes de imponer cambios.
4. Identifica quién en tu equipo tiene más experiencia técnica — va a ser tu mejor aliado para validar procedimientos y ganar credibilidad rápido.
5. Pide a tu jefe el plan de inspección especial del proyecto (si existe) para saber si se requieren ensayos de campo (proof load/torque) y quién los define.

**Semana 2 — Empezar a estructurar**
6. Implementa el checklist diario de seguridad (2.5) y el checklist de calidad por anclaje (4.3) en papel primero — valida que funcionen en la práctica antes de digitalizarlos.
7. Arma la hoja `Registro_Diario` en Google Sheets (7.3) y empieza a capturar datos tú mismo.
8. Ten tu primera conversación de retroalimentación (modelo SBI, 3.3) con al menos un miembro del equipo — practica el modelo en una situación de bajo riesgo antes de necesitarlo en una de alto riesgo.
9. Entrega tu primer informe semanal (6.2) a tu jefe, aunque sea con datos incompletos — establece el hábito y el formato desde ya.
10. Pregunta explícitamente a tu jefe: "¿qué información necesitas de mí y con qué frecuencia?" — puede que tu propio diseño de reportes (Sección 6) no coincida exactamente con lo que la gerencia espera, y es mejor ajustarlo en la semana 2 que en el mes 3.

---

## Fuentes normativas verificadas

- Acuerdo Ministerial Nro. MDT-2025-122 (08-sep-2025), Ministerio del Trabajo del Ecuador — reglamento vigente de seguridad para construcción, deroga AM 00174/2008.
- Decreto Ejecutivo Nro. 255 (02-may-2024) — Reglamento de Seguridad y Salud en el Trabajo (marco general).
- Código del Trabajo del Ecuador, Arts. 47, 49 y 55 — jornada, recargo nocturno, horas suplementarias/extraordinarias.
- Acuerdos Ministeriales MDT-2026-046 y MDT-2026-059 — jornadas especiales/banco de horas (2026).
- Norma Ecuatoriana de la Construcción, NEC-SE-HM — estructuras de hormigón armado.
- ACI 318, Capítulo 17 ("Anchoring to Concrete") y ACI 355.4 — diseño y calificación de anclajes.
- ASTM E488/E488M y ASTM E1512 — métodos de ensayo de anclajes en hormigón.

**Lo que debes verificar directamente con ANKLO/el fabricante (no está en fuentes públicas generales):** ESR o ficha técnica del producto epóxico específico usado, política interna de viáticos, plan de inspección especial del proyecto (si aplica ensayo de campo), y estado de implementación interna del MDT-2025-122.
