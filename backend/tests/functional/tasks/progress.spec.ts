import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * El avance de una tarea. Un test por cada scenario de API del delta
 * `openspec/changes/add-task-progress/specs/tasks/spec.md`:
 *
 *   - Requirement «Avance de una tarea»: nace sin avance, la creación lo ignora y viaja
 *     en las tres formas de tarea (lista, suelta y papelera).
 *   - Requirement «Fijar el avance de una tarea»: `PATCH /api/v1/tasks/:id/progress`,
 *     extremos, rechazos con 422, tarea ajena, que no toca nada más, independencia del
 *     estado, tarea inexistente y sin sesión.
 *   - Requirement «Lo borrado no sale por ningún otro camino» (MODIFIED): solo el
 *     scenario nuevo, «No se le puede cambiar el avance».
 *
 * Fuera, a propósito: «La barra de avance en pantalla», que es de la interfaz.
 *
 * Todo entra por HTTP: las tareas se crean con `POST /tasks` y se usa el `id` que
 * devuelve la respuesta. Lo que se guarda se comprueba además en la base, en la
 * columna `tasks.progress`.
 *
 * Todo test que espera un error lleva antes un control positivo (la misma cuenta fija
 * el avance de una tarea viva y recibe 200): sin él, un 404 o un 401 pasarían hoy solo
 * porque la ruta todavía no existe.
 */
test.group('Tasks | avance', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // La tarea suelta y la fecha exigen el día de quien mira; aquí no se prueba el
  // vencimiento. Ningún test mira el reloj.
  const HOY = '2026-08-13'

  const con = (token: string) => ({ Authorization: `Bearer ${token}` })

  async function persona(client: any, email: string, fullName: string) {
    const user = await User.create({ fullName, email, password: 'secreto123' })
    const login = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return { user, token: login.body().data.token as string }
  }

  /** Crea una tarea por la API y devuelve la tarea tal y como la devuelve la creación. */
  async function crearTarea(client: any, token: string, cuerpo: Record<string, unknown> = {}) {
    const creada = await client
      .post('/api/v1/tasks')
      .headers(con(token))
      .json({ title: 'Revisar el informe', ...cuerpo })

    creada.assertStatus(201)

    return creada.body().data
  }

  const fijarAvance = (client: any, token: string, id: number, cuerpo: unknown) =>
    client.patch(`/api/v1/tasks/${id}/progress`).headers(con(token)).json(cuerpo)

  /** Fija el avance y exige que se acepte: es el control positivo de cada test. */
  async function avanceAceptado(client: any, token: string, id: number, progress: number) {
    const response = await fijarAvance(client, token, id, { progress })

    response.assertStatus(200)

    return response.body().data
  }

  async function consultar(client: any, token: string, id: number) {
    const response = await client.get(`/api/v1/tasks/${id}`).qs({ today: HOY }).headers(con(token))

    response.assertStatus(200)

    return response.body().data
  }

  /** La tarea tal y como sale en la lista (sin filtro, o acotada por un estado). */
  async function enLaLista(client: any, token: string, id: number, status?: string) {
    const request = client.get('/api/v1/tasks').headers(con(token))
    if (status) request.qs({ status })
    const response = await request

    response.assertStatus(200)

    return response.body().data.find((tarea: any) => tarea.id === id)
  }

  async function cambiarEstado(client: any, token: string, id: number, status: string) {
    const response = await client
      .patch(`/api/v1/tasks/${id}/status`)
      .headers(con(token))
      .json({ status })

    response.assertStatus(200)

    return response.body().data
  }

  test('La tarea nace sin avance | la creación devuelve progress 0', async ({
    client,
    assert,
    db,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')

    const tarea = await crearTarea(client, token)

    assert.strictEqual(tarea.progress, 0)
    await db.assertHas('tasks', { id: tarea.id, progress: 0 }, 1)
  })

  test('La creación ignora el avance | un progress en el cuerpo no se aplica', async ({
    client,
    assert,
    db,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')

    const tarea = await crearTarea(client, token, { progress: 70 })

    assert.strictEqual(tarea.progress, 0)
    await db.assertHas('tasks', { id: tarea.id, progress: 0 }, 1)
    await db.assertMissing('tasks', { id: tarea.id, progress: 70 })
  })

  test('El avance viaja en las tres formas de tarea | lista, suelta y papelera', async ({
    client,
    assert,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)
    // Un valor distinto del de nacimiento: así un `0` fijo en algún transformer no pasa.
    await avanceAceptado(client, token, id, 35)

    const deLaLista = await enLaLista(client, token, id)
    const suelta = await consultar(client, token, id)

    const borrada = await client.delete(`/api/v1/tasks/${id}`).headers(con(token))
    borrada.assertStatus(200)

    const papelera = await client.get('/api/v1/tasks/trash').headers(con(token))
    papelera.assertStatus(200)
    const enLaPapelera = papelera.body().data.find((tarea: any) => tarea.id === id)

    assert.strictEqual(deLaLista.progress, 35)
    assert.strictEqual(suelta.progress, 35)
    assert.strictEqual(enLaPapelera?.progress, 35)
  })

  test('Fijar el avance | 200 con la tarea ya actualizada y la lista lo refleja', async ({
    client,
    assert,
    db,
  }) => {
    const { user, token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)

    const response = await fijarAvance(client, token, id, { progress: 40 })

    response.assertStatus(200)
    const tarea = response.body().data
    assert.equal(tarea.id, id)
    assert.strictEqual(tarea.progress, 40)
    assert.equal(tarea.assignee.id, user.id)

    // La forma de la lista: sin vencimiento, que es cosa de la tarea suelta.
    assert.deepEqual(Object.keys(tarea).sort(), [
      'assignee',
      'createdAt',
      'id',
      'progress',
      'status',
      'title',
      'updatedAt',
    ])
    assert.deepEqual(Object.keys(tarea.assignee).sort(), ['fullName', 'id', 'initials'])

    // Las consultas siguientes de la lista la devuelven con ese avance.
    const deLaLista = await enLaLista(client, token, id)
    assert.strictEqual(deLaLista.progress, 40)
    await db.assertHas('tasks', { id, progress: 40 }, 1)
  })

  test('Los extremos valen | 0 y 100 se aceptan', async ({ client, assert, db }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)

    const aCero = await fijarAvance(client, token, id, { progress: 0 })
    aCero.assertStatus(200)
    assert.strictEqual(aCero.body().data.progress, 0)

    const aCien = await fijarAvance(client, token, id, { progress: 100 })
    aCien.assertStatus(200)
    assert.strictEqual(aCien.body().data.progress, 100)

    await db.assertHas('tasks', { id, progress: 100 }, 1)
  })

  test('Avance fuera de rango | -1 y 101 dan 422 sobre progress y no cambian nada', async ({
    client,
    assert,
    db,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)
    // Control positivo y avance de partida, distinto de 0 y de los dos extremos.
    await avanceAceptado(client, token, id, 30)

    for (const progress of [-1, 101]) {
      const response = await fijarAvance(client, token, id, { progress })

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'progress' }] })
    }

    // Ni se ha recortado a 0 ni a 100: sigue con el que tenía.
    const tarea = await consultar(client, token, id)
    assert.strictEqual(tarea.progress, 30)
    await db.assertHas('tasks', { id, progress: 30 }, 1)
  })

  test('Avance que no es un entero | decimal, texto, null y ausente dan 422 sobre progress', async ({
    client,
    assert,
    db,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)
    await avanceAceptado(client, token, id, 30)

    const cuerpos = [{ progress: 42.5 }, { progress: '50' }, { progress: null }, {}]

    for (const cuerpo of cuerpos) {
      const response = await fijarAvance(client, token, id, cuerpo)

      response.assertStatus(422)
      response.assertBodyContains({ errors: [{ field: 'progress' }] })
    }

    // Ni 42 ni 43 ni 50: no se convierte ni se redondea.
    const tarea = await consultar(client, token, id)
    assert.strictEqual(tarea.progress, 30)
    await db.assertHas('tasks', { id, progress: 30 }, 1)
  })

  test('Avance de una tarea ajena | se aplica igual que en una propia', async ({
    client,
    assert,
    db,
  }) => {
    const ada = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const grace = await persona(client, 'grace@example.com', 'Grace Hopper')
    const { id } = await crearTarea(client, ada.token)

    const response = await fijarAvance(client, grace.token, id, { progress: 60 })

    response.assertStatus(200)
    assert.strictEqual(response.body().data.progress, 60)
    // Sigue siendo de Ada: fijar el avance no la reasigna a quien lo fija.
    assert.equal(response.body().data.assignee.id, ada.user.id)

    const tarea = await consultar(client, ada.token, id)
    assert.strictEqual(tarea.progress, 60)
    await db.assertHas('tasks', { id, progress: 60 }, 1)
  })

  test('Tocar el avance no toca nada más | título, responsable, estado y fecha siguen igual', async ({
    client,
    assert,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token, { title: 'Preparar la demo' })
    await cambiarEstado(client, token, id, 'in_progress')
    const conFecha = await client
      .put(`/api/v1/tasks/${id}/due-date`)
      .qs({ today: HOY })
      .headers(con(token))
      .json({ dueDate: '2026-09-01', today: HOY })
    conFecha.assertStatus(200)

    // Cómo se ve antes, por el mismo camino por el que se verá después.
    const antes = await consultar(client, token, id)
    assert.isNotNull(antes.dueDate)

    const fijada = await avanceAceptado(client, token, id, 55)
    assert.equal(fijada.title, antes.title)
    assert.equal(fijada.status, antes.status)
    assert.deepEqual(fijada.assignee, antes.assignee)

    const despues = await consultar(client, token, id)
    assert.strictEqual(despues.progress, 55)
    assert.equal(despues.title, 'Preparar la demo')
    assert.equal(despues.title, antes.title)
    assert.deepEqual(despues.assignee, antes.assignee)
    assert.equal(despues.status, 'in_progress')
    assert.equal(despues.dueDate, antes.dueDate)
  })

  test('Avance y estado son independientes | 100 no la da por hecha y el estado no mueve el avance', async ({
    client,
    assert,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)

    // Fijar el avance a 100 no la pasa a `done`.
    const alCien = await avanceAceptado(client, token, id, 100)
    assert.equal(alCien.status, 'pending')
    const pendiente = await consultar(client, token, id)
    assert.equal(pendiente.status, 'pending')
    assert.strictEqual(pendiente.progress, 100)
    // Y sigue en la lista sin filtro, que solo lleva las no hechas.
    assert.isDefined(await enLaLista(client, token, id))

    // Cambiar el estado no mueve el avance.
    const hecha = await cambiarEstado(client, token, id, 'done')
    assert.equal(hecha.status, 'done')
    assert.strictEqual(hecha.progress, 100)

    const enHechas = await enLaLista(client, token, id, 'done')
    assert.strictEqual(enHechas.progress, 100)
    const suelta = await consultar(client, token, id)
    assert.equal(suelta.status, 'done')
    assert.strictEqual(suelta.progress, 100)
  })

  test('Tarea inexistente | 404, también con un cuerpo que no vale', async ({ client, db }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)
    // Control positivo: la ruta existe y sobre una tarea real responde 200.
    await avanceAceptado(client, token, id, 10)

    // Un identificador que no existe: el real más un margen, comprobado antes.
    const inexistente = id + 1000
    const abrir = await client
      .get(`/api/v1/tasks/${inexistente}`)
      .qs({ today: HOY })
      .headers(con(token))
    abrir.assertStatus(404)

    const conCuerpoValido = await fijarAvance(client, token, inexistente, { progress: 50 })
    conCuerpoValido.assertStatus(404)

    // El 404 gana al 422: no se valida el cuerpo de algo que no existe.
    const conCuerpoInvalido = await fijarAvance(client, token, inexistente, { progress: 'no' })
    conCuerpoInvalido.assertStatus(404)

    // Y no se ha creado ninguna tarea con ese identificador, ni tocado la real.
    await db.assertMissing('tasks', { id: inexistente })
    await db.assertHas('tasks', { id, progress: 10 }, 1)
  })

  test('Fijar el avance sin haber entrado | 401 y el avance no cambia', async ({
    client,
    assert,
    db,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)
    // Control positivo: con token, la misma petición se acepta.
    await avanceAceptado(client, token, id, 20)

    const sinToken = await client.patch(`/api/v1/tasks/${id}/progress`).json({ progress: 90 })
    const inventado = await client
      .patch(`/api/v1/tasks/${id}/progress`)
      .header('Authorization', 'Bearer oat_1.esto-no-es-un-token')
      .json({ progress: 90 })

    sinToken.assertStatus(401)
    inventado.assertStatus(401)

    const tarea = await consultar(client, token, id)
    assert.strictEqual(tarea.progress, 20)
    await db.assertHas('tasks', { id, progress: 20 }, 1)
  })

  test('No se le puede cambiar el avance | 404 sobre una tarea borrada y conserva el suyo', async ({
    client,
    assert,
    db,
  }) => {
    const { token } = await persona(client, 'ada@example.com', 'Ada Lovelace')
    const { id } = await crearTarea(client, token)
    // Control positivo: viva, su avance sí se puede fijar.
    await avanceAceptado(client, token, id, 45)

    const borrada = await client.delete(`/api/v1/tasks/${id}`).headers(con(token))
    borrada.assertStatus(200)

    const response = await fijarAvance(client, token, id, { progress: 90 })
    response.assertStatus(404)

    // Sigue en la papelera con el avance que tenía, no con el 90 que se intentó poner.
    const papelera = await client.get('/api/v1/tasks/trash').headers(con(token))
    papelera.assertStatus(200)
    const enLaPapelera = papelera.body().data.find((tarea: any) => tarea.id === id)
    assert.isDefined(enLaPapelera)
    assert.strictEqual(enLaPapelera?.progress, 45)
    await db.assertHas('tasks', { id, progress: 45 }, 1)
    await db.assertMissing('tasks', { id, progress: 90 })
  })
})
