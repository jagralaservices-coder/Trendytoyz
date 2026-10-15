const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const backupService = require('../services/backupService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

/**
 * GET /api/backup/export
 * Admin download complete JSON export of all products, categories, orders, customers, and settings
 */
router.get('/export', authenticateToken, requireAdmin, (req, res) => {
  try {
    const data = backupService.exportFullDatasetJSON();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `trendytoyz-backup-${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Backup export error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to export backup.' });
  }
});

/**
 * POST /api/backup/import
 * Admin upload / restore dataset from JSON backup file
 */
router.post('/import', authenticateToken, requireAdmin, (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !payload.data) {
      return res.status(400).json({ success: false, error: 'Invalid backup file payload. Must contain "data" object.' });
    }

    const results = backupService.importDatasetJSON(payload);
    return res.json({
      success: true,
      message: 'Backup restored successfully without data loss.',
      results
    });
  } catch (err) {
    console.error('Backup import error:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to import backup data.' });
  }
});

/**
 * GET /api/backup/list
 * Admin list automated snapshots
 */
router.get('/list', authenticateToken, requireAdmin, (req, res) => {
  try {
    const backups = backupService.getBackupList();
    res.json({
      success: true,
      backupDir: backupService.backupDir,
      backups
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to retrieve backups.' });
  }
});

/**
 * POST /api/backup/create
 * Admin manual snapshot creation
 */
router.post('/create', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { label } = req.body;
    const result = backupService.createDatabaseBackup(label || 'manual');
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json({
      success: true,
      message: 'Database backup snapshot created successfully!',
      backup: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to create snapshot.' });
  }
});

/**
 * GET /api/backup/download-file/:fileName
 * Admin download raw sqlite snapshot file
 */
router.get('/download-file/:fileName', authenticateToken, requireAdmin, (req, res) => {
  try {
    const safeName = path.basename(req.params.fileName);
    const filePath = path.join(backupService.backupDir, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup file not found.' });
    }

    res.download(filePath, safeName);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error downloading backup file.' });
  }
});

module.exports = router;
