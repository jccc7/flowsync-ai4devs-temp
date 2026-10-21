import Task from '#models/task'
import { updateTaskProgressValidator } from '#validators/task'
import type { HttpContext } from '@adonisjs/core/http'
import TaskTransformer from '#transformers/task_transformer'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from '@foadonis/openapi/decorators'
import {
  ErrorResponse,
  TaskResponse,
  UpdateTaskProgressBody,
  ValidationErrorResponse,
} from '#openapi/schemas'

@ApiBearerAuth()
export default class TaskProgressesController {
  /**
   * El avance tiene endpoint propio, como el estado y la fecha, y por el mismo
   * motivo: por un update genérico acabarían colándose el título y el responsable.
   *
   * Avance y estado son independientes. Fijar el avance a 100 no da la tarea por
   * hecha, y cambiar el estado no mueve el avance: acoplarlos haría que un clic en
   * «Hecho» dado por error borrara en silencio el avance que había.
   *
   * Cualquier persona con sesión puede fijar el avance de cualquier tarea, sea o no
   * la responsable. Si dos lo fijan a la vez, gana la última escritura, igual que
   * con el estado y la fecha.
   */
  @ApiOperation({
    summary: 'Fijar el avance de una tarea',
    description:
      'Cualquier cuenta con sesión fija el avance de cualquier tarea, sea o no la responsable, a un entero de 0 a 100. Es independiente del estado: fijarlo a 100 no pasa la tarea a `done`, y cambiar el estado no lo mueve. El título, el responsable, el estado y la fecha no se tocan. Responde con la forma de lista, sin fecha ni condición de vencida, así que no pide día de referencia.',
  })
  @ApiBody({ type: () => UpdateTaskProgressBody })
  @ApiResponse({
    status: 200,
    description: 'La tarea con el avance ya fijado.',
    type: () => TaskResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Falta el token o no es válido. Nada cambia.',
    type: () => ErrorResponse,
  })
  @ApiResponse({
    status: 404,
    description:
      'No existe ninguna tarea viva con ese identificador (las de la papelera tampoco cuentan). Se comprueba antes que el cuerpo.',
    type: () => ErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description:
      'El avance falta, es `null`, no es un número (`"50"` tampoco vale), tiene decimales o está fuera de 0..100. No se convierte, no se redondea ni se recorta: la tarea conserva el avance que tenía.',
    type: () => ValidationErrorResponse,
  })
  async update({ params, request, serialize }: HttpContext) {
    // Primero la tarea y después el cuerpo: lo que no existe es un 404 aunque el
    // cuerpo tampoco valga.
    const task = await Task.findOrFail(params.id)
    const { progress } = await request.validateUsing(updateTaskProgressValidator)

    task.progress = progress
    await task.save()
    await task.load('assignee')

    return serialize(TaskTransformer.transform(task))
  }
}
