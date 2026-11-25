const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { supabaseAdmin, storageBucket } = require('../config/supabase');
const { requireAuth, requireRoles } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Strict 5MB limit
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
      return cb(new Error('Only JPG, PNG, WebP images and PDF documents are allowed.'));
    }
    cb(null, true);
  }
});

router.post(
  '/receipts',
  requireAuth,
  requireRoles(['admin', 'business_unit', 'line_manager', 'district_manager', 'medical_rep', 'product_manager', 'hr']),
  (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Invalid upload.' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Supabase Storage is not configured on the server.' });
      }

      try {
        const extMap = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'application/pdf': 'pdf'
        };
        const ext = extMap[req.file.mimetype.toLowerCase()] || 'bin';
        const objectPath = `receipts/${req.user.id}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from(storageBucket)
          .upload(objectPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('[Uploads] Supabase Storage error:', uploadError);
          return res.status(500).json({ error: 'Storage upload failed.' });
        }

        const { data: signedData, error: signedErr } = await supabaseAdmin.storage
          .from(storageBucket)
          .createSignedUrl(objectPath, 60 * 60 * 24 * 7); // 7-day signed URL

        return res.status(201).json({
          ok: true,
          path: objectPath,
          url: signedData && !signedErr ? signedData.signedUrl : null
        });
      } catch (uploadEx) {
        console.error('[Uploads] Exception:', uploadEx);
        return res.status(500).json({ error: 'Unexpected error while uploading file.' });
      }
    });
  }
);

module.exports = router;
