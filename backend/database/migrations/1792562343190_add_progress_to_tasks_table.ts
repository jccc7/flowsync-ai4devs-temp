import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * El avance de una tarea: un entero de 0 a 100 que se lee como porcentaje.
 *
 * `smallint NOT NULL DEFAULT 0` y un `CHECK` (convención 2 de
 * docs/convenciones/base-de-datos.md): el validador de la API no basta, porque un
 * `INSERT` directo, un seeder, una factory o un script se lo saltan. Entero y no
 * decimal porque una barra no distingue décimas, y así no hay redondeos que discutir.
 *
 * Rama (convención 5): REVERSIBLE. Todas las filas existentes de `tasks` reciben el
 * valor por defecto `0`, que cumple el `CHECK`; ningún dato existente se transforma.
 * El `down` quita la restricción y la columna: pierde solo los avances fijados
 * después de migrar, nada que existiera antes.
 */
export default class extends BaseSchema {
  protected tableName = 'tasks'
  protected constraintName = 'tasks_progress_check'

  async down() {
    // Primero la regla y después la columna sobre la que se apoya.
    this.schema.raw(`ALTER TABLE ${this.tableName} DROP CONSTRAINT ${this.constraintName}`)

    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('progress')
    })
  }

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Con valor por defecto: toda tarea nace sin avance, y las que ya existen
      // quedan en 0, que es un valor válido y no un dato a medio rellenar.
      table.smallint('progress').notNullable().defaultTo(0)
    })

    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      ADD CONSTRAINT ${this.constraintName}
      CHECK (progress BETWEEN 0 AND 100)
    `)
  }
}
