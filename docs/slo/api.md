# SLO de la API: tareas

**Qué cubre:** todas las rutas de `/api/v1/tasks` (listar, crear, ver, borrar, restaurar, papelera, estado, fecha de vencimiento y comentarios).

## Indicador (SLI)

```
SLI = peticiones buenas / peticiones válidas
```

- **Peticiones válidas:** tramos de servidor raíz (sin padre) cuyo `http.route` empieza por `/api/v1/tasks`.
- **Peticiones buenas:** de las válidas, las que cumplen las dos condiciones:
  - `http.response.status_code` < 500;
  - duración (hora de fin − hora de inicio del tramo) < 500 ms.

Un 4xx cuenta como buena: es el sistema rechazando bien una petición incorrecta. Un tramo sin código de respuesta cuenta como mala.

## Objetivo (SLO)

**SLI ≥ 99 %**, medido sobre una **ventana móvil de 28 días**.

## Presupuesto de error

1 % de las peticiones válidas de la ventana.

> **Supuesto:** 20.000 peticiones en 28 días → **200 peticiones malas** permitidas (≈ 7 al día). Se sustituye por el volumen real en cuanto haya 28 días medidos.

## Alerta (única)

**Síntoma:** «Quien trabaja con sus tareas está recibiendo errores o respuestas lentas a un ritmo que agota el margen de los 28 días antes de que acabe la ventana».

```
ritmo de consumo = (malas_24h / válidas_24h) / 0,01
```

Se avisa cuando **ritmo de consumo > 1** en las últimas 24 horas. A ese ritmo, las 200 peticiones del presupuesto se gastan en menos de 28 días. Con el supuesto, equivale a más de ~7 peticiones malas en un día de ~714.

## Qué NO cubre

- Las rutas que no son de `/api/v1/tasks`: `/api/v1/auth/signup`, `/api/v1/auth/login`, `/api/v1/account/*` y `/health`. Si importan, merecen su propio objetivo con su propio presupuesto.
- Las peticiones que no casan con ninguna ruta: no llevan `http.route`, así que no entran en el indicador.
- Lo que pasa en el navegador: el indicador mide desde que la petición llega a la API hasta que la API responde.
