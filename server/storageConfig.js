const os = require('os');
const path = require('path');
const fs = require('fs');

// Global fallback to OS temp directory which is guaranteed writable on any Linux/Render container
const TMP_FALLBACK_BASE = path.join(os.tmpdir(), 'trendytoyz');

/**
 * Safely creates a directory if it doesn't exist and verifies write access.
 * Returns true if writable, false otherwise (without throwing).
 */
function safeEnsureDir(targetDir) {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    fs.accessSync(targetDir, fs.constants.W_OK);
    return true;
  } catch (err) {
    console.warn(`[Storage Warning] Cannot write to directory "${targetDir}": ${err.message}`);
    return false;
  }
}

/**
 * Determines a guaranteed writable base directory.
 * Priority:
 * 1. process.env.STORAGE_DIR (if set and writable)
 * 2. Project-root ./data (if writable)
 * 3. os.tmpdir()/trendytoyz (guaranteed writable fallback)
 */
function getBaseStorageDir() {
  if (process.env.STORAGE_DIR) {
    const custom = path.resolve(process.env.STORAGE_DIR);
    if (safeEnsureDir(custom)) return custom;
  }

  const projectLocal = path.resolve(__dirname, '../data');
  if (safeEnsureDir(projectLocal)) {
    return projectLocal;
  }

  // OS temp fallback (Render free tier friendly)
  safeEnsureDir(TMP_FALLBACK_BASE);
  return TMP_FALLBACK_BASE;
}

/**
 * Safely resolves a subfolder or returns guaranteed safe fallback.
 */
function ensureWritableDir(preferredDir, fallbackSubdir) {
  if (preferredDir) {
    const resolved = path.resolve(preferredDir);
    if (safeEnsureDir(resolved)) return resolved;
  }

  const base = getBaseStorageDir();
  const target = path.join(base, fallbackSubdir || '');
  if (safeEnsureDir(target)) return target;

  const tempTarget = path.join(TMP_FALLBACK_BASE, fallbackSubdir || '');
  safeEnsureDir(tempTarget);
  return tempTarget;
}

/**
 * Resolves SQLite database path safely.
 */
function getDatabasePath() {
  if (process.env.DATABASE_PATH) {
    const resolved = path.resolve(process.env.DATABASE_PATH);
    const dir = path.dirname(resolved);
    if (safeEnsureDir(dir)) return resolved;
    console.warn(`[Storage] DATABASE_PATH directory not writable. Falling back to safe database path.`);
  }

  const baseDir = getBaseStorageDir();
  return path.join(baseDir, 'database.sqlite');
}

/**
 * Resolves uploads directory safely.
 */
function getUploadsDir() {
  return ensureWritableDir(process.env.UPLOADS_DIR, 'uploads');
}

/**
 * Resolves backups directory safely.
 */
function getBackupDir() {
  return ensureWritableDir(process.env.BACKUP_DIR, 'backups');
}

/**
 * Cloudinary configuration & upload helper
 */
let cloudinary = null;
try {
  cloudinary = require('cloudinary').v2;
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });
  }
} catch (e) {
  // Cloudinary module not loaded
}

function isCloudinaryConfigured() {
  return !!(
    cloudinary &&
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * Uploads a file buffer directly to Cloudinary
 */
async function uploadToCloudinary(fileBuffer, originalName = 'upload') {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured on this server.');
  }

  return new Promise((resolve, reject) => {
    const cleanPublicId = path.basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9]/g, '-')
      .slice(0, 30);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'trendytoyz/products',
        public_id: `${cleanPublicId}-${Date.now()}`,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

module.exports = {
  getBaseStorageDir,
  getDatabasePath,
  getUploadsDir,
  getBackupDir,
  ensureWritableDir,
  isCloudinaryConfigured,
  uploadToCloudinary
};
