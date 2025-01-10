import sqlite3 from 'sqlite3'

type ExecuteReturn = { lastID: number; changes: number }

export class SQLiteClient {
  db: sqlite3.Database

  constructor(filename: string) {
    const sqliteVerbose = sqlite3.verbose()
    this.db = new sqliteVerbose.Database(filename)
  }

  // Serialize database operations
  async serialize(callback: () => Promise<void>) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        callback().then(resolve).catch(reject)
      })
    })
  }

  // Execute a query and return rows
  async query<T>(sql: string, params = <any>[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows as T[])
        }
      })
    })
  }

  // Execute a query and return a single row
  async queryOne<T>(sql: string, params = <any>[]): Promise<T> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row as T)
        }
      })
    })
  }

  // Execute a query without returning rows (e.g., INSERT, UPDATE, DELETE)
  async execute(sql: string, params = <any>[]): Promise<ExecuteReturn> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) {
          reject(err)
        } else {
          resolve({ lastID: this.lastID, changes: this.changes })
        }
      })
    })
  }

  // Close the database connection
  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err)
        } else {
          resolve(null)
        }
      })
    })
  }
}
