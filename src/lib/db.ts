import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const srcPath = path.join(process.cwd(), "shop.db");
    let dbPath = srcPath;

    // On Vercel the project root is read-only; copy to /tmp for write access
    if (process.env.VERCEL) {
      const tmpPath = "/tmp/shop.db";
      if (!fs.existsSync(tmpPath)) {
        fs.copyFileSync(srcPath, tmpPath);
      }
      dbPath = tmpPath;
    }

    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}
