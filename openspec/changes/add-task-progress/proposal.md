## Why

El estado de una tarea dice en qué fase está (`pending`, `in_progress`, `done`), pero no cuánto le falta. Una tarea «En curso» desde hace semanas y una recién empezada se ven igual en la lista. Se pide una barra de progreso por tarea para leerlo sin abrirla.

## What Changes

- **Una columna, `tasks.progress`** (`smallint NOT NULL DEFAULT 0`, con `CHECK` de `0` a `100`): el avance de cada tarea, en porcentaje entero.
- **`PATCH /api/v1/tasks/:id/progress`** con `{"progress": n}` fija el avance. Cualquier cuenta con sesión, sobre cualquier tarea. Responde `200` con la tarea en forma de lista.
- **`progress` viaja en las tres formas de tarea**: lista, tarea suelta y papelera. Toda tarea nace a `0` y la creación no admite otro valor.
- **Avance y estado son independientes**: ninguno mueve al otro.
- **Lo borrado** tampoco admite cambio de avance (`404`), heredado del modelo.
- **Interfaz**: barra de progreso con su porcentaje escrito en cada fila de la lista (solo lectura) y en la pantalla de la tarea, donde se edita con un control deslizante que guarda al soltarlo.

### Fuera de alcance

- Historial de avances, avance calculado a partir de subtareas o de comentarios.
- Filtrar u ordenar la lista por avance: el estado sigue siendo la única dimensión por la que se acota.
- Acoplar avance y estado (por ejemplo, marcar como hecha pone `100`).

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `tasks`: aparece el avance, su endpoint y su barra en pantalla; la creación devuelve `progress`; la lista deja de prometer «los mismos datos que antes del vencimiento» y solo prohíbe el vencimiento; lo borrado tampoco admite cambio de avance.

## Impact

- **Base de datos:** una migración que añade `tasks.progress` (ver `## Reversibilidad` en `design.md`).
- **Backend:** `TaskProgressesController`, `updateTaskProgressValidator`, los tres transformers de tarea, una ruta, esquemas OpenAPI y `TaskFactory`. `docs/capabilities/tasks/README.md` al día.
- **Tests:** `backend/tests/functional/tasks/progress.spec.ts`.
- **Frontend:** `lib/types.ts`, `lib/api.ts`, `components/task-progress.tsx` (barra y deslizador sobre los primitivos de `radix-ui`), `task-item.tsx` y `task-page.tsx`.
- **Copia de producción:** sin cambios. La copia es anterior a la columna; `copia-produccion.sh` inserta nombrando solo las columnas de la copia sobre una tabla `LIKE tasks INCLUDING DEFAULTS`, así que `progress` toma su valor por defecto.
