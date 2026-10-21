## 1. Base de datos

- [ ] 1.1 Mirar el esquema real de `tasks` por el MCP y contar las filas afectadas — rama: reversible
- [x] 1.2 Migración `add_progress_to_tasks_table`: `down` primero, `smallint NOT NULL DEFAULT 0` y `CHECK tasks_progress_check`
- [x] 1.3 Probar ida, vuelta e ida en `db-test`

## 2. API

- [x] 2.1 `updateTaskProgressValidator` estricto, entero de 0 a 100
- [x] 2.2 `PATCH /tasks/:id/progress` → `TaskProgressesController.update`
- [x] 2.3 `progress` en `TaskTransformer`, `TaskDetailTransformer` y `TrashedTaskTransformer`
- [x] 2.4 Esquemas OpenAPI, `npm run openapi:generate` y `openapi:check`
- [x] 2.5 `TaskFactory`: avance coherente con el estado y estado `conAvance`
- [x] 2.6 `docs/capabilities/tasks/README.md`

## 3. Tests

- [x] 3.1 `tests/functional/tasks/progress.spec.ts`: un test por Scenario de API
- [x] 3.2 Rojo, congelado por `shasum`, verde

## 4. Frontend

- [x] 4.1 `progress` en `Task`, `updateTaskProgress` en `lib/api.ts`
- [x] 4.2 Componente de barra y deslizador sobre los primitivos de `radix-ui` (los `progress` y `slider` de shadcn pierden `aria-valuenow` y el nombre del tirador), con porcentaje en texto
- [x] 4.3 Barra en `task-item.tsx` (solo lectura)
- [x] 4.4 Barra y deslizador en `task-page.tsx`, guardado al soltar y vuelta atrás si falla
- [x] 4.5 `npm run build` y `npm run lint`
