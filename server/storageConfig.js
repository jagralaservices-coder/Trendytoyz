const path = require('path');
const fs = require('fs');

/**
 * Ensures a directory exists and is writable.
 * If preferredDir is not writable or cannot be created, falls back to safe local workspace path.
 */
function ensureWritableDir(preferredDir, fallbackRelativePath) {
  const projectRoot = path.resolve(__dirname, '..');
  const fallbackDir = path.resolve(projectRoot, fallbackRelativePath);

  if (preferredDir) {
    try {
      const resolved = path.resolve(preferredDir);
      if (!fs.existsSync(resolved)) {
        fs.mkdirSync(resolved, { recursive: true });
      }
      fs.accessSync(resolved, fs.constants.W_OK);
      return resolved;
    } catch (err) {
      console.warn(`[Storage Fallback] Cannot use "${preferredDir}" (${err.message}). Using safe workspace directory: "${fallbackDir}"`);
    }
  }

  try {
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    return fallbackDir;
  } catch (err) {
    console.error(`[Storage Error] Could not create fallback directory "${fallbackDir}":`, err.message);
    const tmpDir = path.resolve(__dirname, '../data');
    if (!fs.existsSync(tmpDir)) {
      try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
    }
    return tmpDir;
  }
}

/**
 * Resolves the database file path safely.
 */
function getDatabasePath() {
  const fallbackDir = ensureWritableDir(null, 'data');
  const fallbackDbPath = path.join(fallbackDir, 'database.sqlite');

  if (process.env.DATABASE_PATH) {
    try {
      const resolved = path.resolve(process.env.DATABASE_PATH);
      const dir = path.dirname(resolved);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return resolved;
    } catch (err) {
      console.warn(`[Storage Fallback] Cannot use DATABASE_PATH="${process.env.DATABASE_PATH}" (${err.message}). Falling back to: "${fallbackDbPath}"`);
      return fallbackDbPath;
    }
  }

  return fallbackDbPath;
}

/**
 * Resolves the uploads directory safely.
 */
function getUploadsDir() {
  return ensureWritableDir(process.env.UPLOADS_DIR, 'data/uploads');
}

/**
 * Resolves the backups directory safely.
 */
function getBackupDir() {
  return ensureWritableDir(process.env.BACKUP_DIR, 'data/backups');
}

module.exports = {
  getDatabasePath,
  getUploadsDir,
  getBackupDir,
  ensureWritableDir
};
