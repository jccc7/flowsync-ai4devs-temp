## Context

Una tarea tiene título, responsable, estado, fecha de vencimiento opcional y, si está borrada, `deleted_at`. Se añade un avance en porcentaje, editable, que la interfaz pinta como barra.

## Goals / Non-Goals

**Goals:** guardar un avance entero de 0 a 100 por tarea, fijarlo por la API, enseñarlo en la lista y en la pantalla de la tarea.

**Non-Goals:** historial, avance derivado, filtros u orden por avance, acoplamiento con el estado.

## Decisions

### 1. Entero de 0 a 100, impuesto por la base

`smallint NOT NULL DEFAULT 0` con `CHECK (progress BETWEEN 0 AND 100)` (convención 2): el validador no basta, se salta con un `INSERT`, un seeder o un script. Entero porque una barra no distingue décimas y así no hay redondeos que discutir.

### 2. Endpoint propio, como el estado y la fecha

`PATCH /api/v1/tasks/:id/progress` y no un update genérico, por el mismo motivo que los otros dos: por un update genérico se colarían el título y el responsable. Responde con la forma de lista (la de `PATCH :id/status`), que ya no depende de ningún día de referencia, así que no pide `today`.

### 3. Validación estricta

`vine.number({ strict: true }).withoutDecimals().range([0, 100])`. Sin `strict`, VineJS convertiría `"50"` a `50`; se rechaza para no aceptar dos formas del mismo dato. Fuera de rango es `422`, nunca un recorte silencioso.

### 4. Avance y estado, independientes

Fijar el avance no cambia el estado y cambiar el estado no mueve el avance. Acoplarlos haría que un clic en «Hecho» dado por error borrara en silencio el avance que había, y rompería «Cambiar el estado no toca nada más».

### 5. En la lista se ve; se edita en la pantalla de la tarea

La fila ya tiene tres botones de estado; un segundo control editable competiría con ellos. La barra de la fila es de solo lectura.

## Reversibilidad

- **Rama: reversible.** El `up` añade la columna con valor por defecto `0` y el `CHECK`; todas las filas existentes quedan a `0`, que es un valor válido. No se transforma ningún dato existente.
- **Filas afectadas:** todas las de `tasks` reciben el valor por defecto. El recuento contra la base real por `dbhub` se apunta en `tasks.md` (1.1).
- **Vuelta:** el `down` quita el `CHECK` y la columna. Pierde los avances fijados después de migrar, pero ningún dato que existiera antes.

## Risks / Trade-offs

- Dos personas fijando el avance a la vez: gana la última escritura, igual que con el estado y la fecha.
