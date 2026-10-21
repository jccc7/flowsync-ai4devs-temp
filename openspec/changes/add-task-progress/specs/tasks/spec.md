## ADDED Requirements

### Requirement: Avance de una tarea

El sistema SHALL guardar para toda tarea un avance, `progress`, expresado como un número entero de `0` a `100` que se lee como un porcentaje. Toda tarea SHALL nacer con avance `0`, y la creación NO SHALL admitir que se fije otro. El avance SHALL viajar en todas las formas en que la API devuelve una tarea: la de la lista, la de la tarea suelta y la de la papelera.

#### Scenario: La tarea nace sin avance

- **WHEN** se crea una tarea con `POST /api/v1/tasks`
- **THEN** la tarea creada tiene `progress` igual a `0`

#### Scenario: La creación ignora el avance

- **WHEN** se envía una creación de tarea que incluye además `"progress": 70` en el cuerpo
- **THEN** ese valor se ignora y la tarea se crea igualmente con `progress` igual a `0`

#### Scenario: El avance viaja en las tres formas de tarea

- **WHEN** se consulta una tarea en la lista (`GET /api/v1/tasks`), suelta (`GET /api/v1/tasks/:id`) y, una vez borrada, en la papelera (`GET /api/v1/tasks/trash`)
- **THEN** las tres respuestas traen su `progress` con el mismo valor

### Requirement: Fijar el avance de una tarea

El sistema SHALL fijar el avance de una tarea existente al recibir `PATCH /api/v1/tasks/:id/progress` con `{"progress": <entero de 0 a 100>}`, respondiendo `200` con la tarea en la forma de la lista ya actualizada. Cualquier cuenta con sesión SHALL poder hacerlo sobre cualquier tarea, sea o no la responsable. El avance y el estado SHALL ser independientes: fijar uno NO SHALL cambiar el otro. Un valor que no sea un entero entre `0` y `100` SHALL rechazarse con `422` sobre el campo `progress`, sin convertirlo ni recortarlo.

#### Scenario: Fijar el avance

- **WHEN** se envía `PATCH /api/v1/tasks/:id/progress` con `{"progress": 40}` sobre una tarea existente
- **THEN** la respuesta es `200` con la tarea ya con `progress` igual a `40`, y las siguientes consultas de la lista la devuelven con ese avance

#### Scenario: Los extremos valen

- **WHEN** se fija el avance a `0` y después a `100`
- **THEN** los dos valores se aceptan con `200`

#### Scenario: Avance fuera de rango

- **WHEN** se envía `{"progress": -1}` o `{"progress": 101}`
- **THEN** la respuesta es `422` con un error sobre `progress`, y la tarea conserva el avance que tenía

#### Scenario: Avance que no es un entero

- **WHEN** se envía `{"progress": 42.5}`, `{"progress": "50"}`, `{"progress": null}` o un cuerpo sin `progress`
- **THEN** la respuesta es `422` con un error sobre `progress`, y la tarea conserva el avance que tenía

#### Scenario: Avance de una tarea ajena

- **WHEN** una cuenta fija el avance de una tarea cuyo responsable es otra
- **THEN** el cambio se aplica igual que en una tarea propia, sin exigir ningún permiso adicional

#### Scenario: Tocar el avance no toca nada más

- **WHEN** se fija el avance de una tarea
- **THEN** su título, su responsable, su estado y su fecha de vencimiento siguen siendo exactamente los mismos

#### Scenario: Avance y estado son independientes

- **WHEN** se fija el avance de una tarea pendiente a `100`, y después se cambia su estado
- **THEN** fijar el avance no la pasa a `done`, y cambiar el estado no mueve su avance

#### Scenario: Tarea inexistente

- **WHEN** se intenta fijar el avance de una tarea que no existe, aunque el cuerpo tampoco valga
- **THEN** la respuesta es `404`

#### Scenario: Fijar el avance sin haber entrado

- **WHEN** se envía `PATCH /api/v1/tasks/:id/progress` sin cabecera `Authorization` válida
- **THEN** la respuesta es `401` y el avance no cambia

### Requirement: La barra de avance en pantalla

La interfaz SHALL mostrar el avance de cada tarea como una barra de progreso acompañada de su porcentaje escrito, tanto en cada fila de la lista como en la pantalla de la tarea. En la lista la barra SHALL ser solo de lectura; el avance SHALL editarse desde la pantalla de la tarea, reflejando el cambio al instante y guardándolo sin ningún paso adicional.

#### Scenario: El avance se lee sin abrir la tarea

- **WHEN** se recorre la lista del equipo
- **THEN** cada fila muestra una barra con el avance de la tarea y su porcentaje escrito, también cuando es `0 %`

#### Scenario: La barra no es solo un dibujo

- **WHEN** se recorre la lista o la pantalla de una tarea con un lector de pantalla
- **THEN** cada barra se anuncia como barra de progreso con su valor, y el porcentaje también está escrito en texto

#### Scenario: Cambiar el avance desde la pantalla de la tarea

- **WHEN** se ajusta el avance en la pantalla de la tarea y se suelta el control
- **THEN** la pantalla muestra el nuevo avance al momento y el cambio queda guardado, sin pulsar ningún botón de guardado

#### Scenario: El cambio de avance no cuela

- **WHEN** el cambio de avance no llega a aplicarse porque el servidor lo rechaza o no responde
- **THEN** la pantalla vuelve a mostrar el avance que la tarea tiene de verdad y se avisa de que no se ha podido cambiar

## MODIFIED Requirements

### Requirement: Creación de una tarea con solo el título

El sistema SHALL crear una tarea a partir únicamente de su título cuando se envíe `POST /api/v1/tasks` con `{"title": "..."}`, sin exigir ningún otro dato, y SHALL devolver la tarea ya creada.

#### Scenario: Alta con el título como único dato

- **WHEN** se envía `POST /api/v1/tasks` con `{"title": "Revisar el informe"}` y un token válido
- **THEN** la respuesta es `201` con `{"data": {"id": ..., "title": "Revisar el informe", "status": "pending", "progress": 0, "assignee": {...}, "createdAt": ..., "updatedAt": ...}}`

#### Scenario: La tarea nace a nombre de quien la crea

- **WHEN** se crea una tarea con un token cualquiera
- **THEN** el `assignee` de la tarea creada es la cuenta dueña de ese token, sin que la petición haya indicado ningún responsable

#### Scenario: La tarea nace pendiente

- **WHEN** se crea una tarea sin indicar estado
- **THEN** su `status` es `pending`

#### Scenario: No se admite fijar responsable ni estado al crear

- **WHEN** se envía una creación que incluye además `"status"` o un identificador de responsable en el cuerpo
- **THEN** esos valores se ignoran y la tarea se crea igualmente a nombre de quien la envía y en estado `pending`

### Requirement: La lista no lleva el vencimiento

El sistema NO SHALL incluir la fecha de vencimiento ni la condición de vencida en las tareas que devuelve `GET /api/v1/tasks`, de modo que ninguna vista construida sobre la lista pueda mostrarlas. Lo que la lista devuelve por tarea SHALL seguir sin depender de ningún día de referencia.

#### Scenario: La lista calla sobre el vencimiento

- **WHEN** se solicita `GET /api/v1/tasks` en un espacio con tareas con fecha, algunas de ellas vencidas
- **THEN** ninguna de las tareas devueltas trae fecha de vencimiento ni condición de vencida

#### Scenario: La lista no pide día de referencia

- **WHEN** se solicita la lista sin indicar ningún día de referencia
- **THEN** la respuesta es correcta, porque la lista no informa del vencimiento y por tanto no lo necesita

### Requirement: Lo borrado no sale por ningún otro camino

El sistema SHALL tratar una tarea que está en la papelera como inexistente para todo camino que no sea la propia papelera: NO SHALL aparecer en la lista, ni sin acotar ni acotada por ninguno de los estados; NO SHALL poder abrirse por su identificador; y NO SHALL poder cambiársele el estado, la fecha de vencimiento ni el avance. Esta garantía SHALL estar en el modelo de tarea y no en cada ruta, de modo que una ruta que se añada después la herede sin tener que acordarse de ella.

#### Scenario: No sale en la lista

- **WHEN** se solicita `GET /api/v1/tasks`, sin acotar y acotada por `pending`, por `in_progress` y por `done`, habiendo tareas borradas en cada uno de esos estados
- **THEN** ninguna de las borradas aparece en ninguna de las cuatro respuestas, y las tareas vivas sí

#### Scenario: No se abre por su identificador

- **WHEN** se solicita `GET /api/v1/tasks/:id` de una tarea borrada
- **THEN** la respuesta es `404`, la misma que para una tarea que no existe

#### Scenario: No se le puede cambiar el estado

- **WHEN** se envía `PATCH /api/v1/tasks/:id/status` sobre una tarea borrada
- **THEN** la respuesta es `404` y la tarea conserva el estado que tenía

#### Scenario: No se le puede cambiar la fecha

- **WHEN** se envía `PUT /api/v1/tasks/:id/due-date` sobre una tarea borrada
- **THEN** la respuesta es `404` y la tarea conserva la fecha de vencimiento que tenía

#### Scenario: No se le puede cambiar el avance

- **WHEN** se envía `PATCH /api/v1/tasks/:id/progress` sobre una tarea borrada
- **THEN** la respuesta es `404` y la tarea conserva el avance que tenía
