function d1Meta(changes = 0, lastRowId = 0) {
  return {
    duration: 0,
    size_after: 0,
    rows_read: 0,
    rows_written: changes,
    last_row_id: lastRowId,
    changed_db: changes > 0,
    changes,
  };
}

function toStatement(stmt, params = [], query = "") {
  const statement = {
    bind(...values) {
      return toStatement(stmt, [...params, ...values], query);
    },
    async first(col) {
      const row = stmt.get(...params);
      if (!row) return null;
      if (typeof col === "string") return row[col] ?? null;
      return { ...row };
    },
    async all() {
      const rows = stmt.all(...params).map((row) => ({ ...row }));
      return {
        success: true,
        meta: d1Meta(),
        results: rows,
      };
    },
    async run() {
      const { changes, lastInsertRowid } = stmt.run(...params);
      const numericChanges = Number(changes);
      return {
        success: true,
        meta: d1Meta(numericChanges, Number(lastInsertRowid)),
        results: [],
      };
    },
    async raw() {
      const rows = stmt.all(...params).map((row) => Object.values(row));
      return rows;
    },
  };
  statement.__query = query || stmt.source || "";
  return statement;
}

export function createD1Adapter(sqlite) {
  sqlite.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  return {
    prepare(query) {
      return toStatement(sqlite.prepare(query), [], query);
    },
    async batch(statements) {
      return Promise.all(
        statements.map(async (statement) => {
          const q = (statement.__query || "").trim().toUpperCase();
          if (q.startsWith("SELECT")) {
            return await statement.all();
          }
          return await statement.run();
        })
      );
    },
    async exec(query) {
      sqlite.exec(query);
      return { count: 0, duration: 0 };
    },
  };
}
