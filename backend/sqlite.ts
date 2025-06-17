// @ts-expect-error
import Database from 'better-sqlite3'

type ExecuteReturn = { lastID: number; changes: number }

export class SQLiteClient {
  db: Database

  constructor(filename: string) {
    this.db = new Database(filename)
  }

  // Serialize database operations (better-sqlite3 handles transactions synchronously)
  async transaction(callback: () => void) {
    const transaction = this.db.transaction(callback)
    try {
      return await transaction()
    } catch (error) {
      throw error
    }
  }

  // Execute a query and return rows
  async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(params) as T[]
  }

  // Execute a query and return a single row
  async queryOne<T>(sql: string, params: any[] = []): Promise<T> {
    return this.db.prepare(sql).get(params) as T
  }

  // Execute a query without returning rows (e.g., INSERT, UPDATE, DELETE)
  async execute(sql: string, params: any[] = []): Promise<ExecuteReturn> {
    const stmt = this.db.prepare(sql)
    const result = stmt.run(params)
    return { lastID: result.lastInsertRowid as number, changes: result.changes }
  }

  // Close the database connection
  async close() {
    this.db.close()
  }
}
