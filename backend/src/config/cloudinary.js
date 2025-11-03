const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Detect whether Cloudinary appears to be configured (avoid placeholder values)
const CLOUDINARY_CONFIGURED = (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET &&
  process.env.CLOUDINARY_API_KEY !== 'your-api-key'
);
const DEV_PLACEHOLDER_IMAGE = 'https://via.placeholder.com/800?text=No+Image+Available';

// Local uploads directory (backend/uploads)
const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const SERVER_BASE = process.env.SERVER_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;

// Multer memory storage (we'll upload to cloudinary manually)
const storage = multer.memoryStorage();

// Multer upload configuration
const multerUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Custom middleware to upload to Cloudinary
const uploadToCloudinary = (fieldName) => {
  return async (req, res, next) => {
    if (!req.files || !req.files[fieldName]) {
      return next();
    }

    // If Cloudinary isn't configured, save files locally into /uploads and return absolute URLs
    if (!CLOUDINARY_CONFIGURED) {
      console.warn('[cloudinary] Cloudinary not configured - saving uploads locally to /uploads');
      const files = Array.isArray(req.files[fieldName]) ? req.files[fieldName] : [req.files[fieldName]];

      // Determine base URL from request when available so mobile clients get reachable URLs
      const requestBase = (req && req.protocol && req.get) ? `${req.protocol}://${req.get('host')}` : SERVER_BASE;

      const saved = files.map((file) => {
        try {
          // Determine extension
          const originalName = file.originalname || `${Date.now()}.jpg`;
          const ext = path.extname(originalName) || '.jpg';
          const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
          const destPath = path.join(UPLOADS_DIR, filename);

          // file.buffer is available because we're using memoryStorage
          fs.writeFileSync(destPath, file.buffer);

          return {
            ...file,
            path: `${requestBase}/uploads/${filename}`,
            cloudinaryId: null
          };
        } catch (err) {
          console.error('[cloudinary] Failed to save local upload:', err);
          return {
            ...file,
            path: DEV_PLACEHOLDER_IMAGE,
            cloudinaryId: null
          };
        }
      });

      req.files[fieldName] = saved;
      return next();
    }

    try {
      const files = Array.isArray(req.files[fieldName]) 
        ? req.files[fieldName] 
        : [req.files[fieldName]];

      const uploadPromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'lost-and-found',
              transformation: [
                { width: 800, height: 800, crop: 'limit' },
                { quality: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const results = await Promise.all(uploadPromises);
      
      // Add Cloudinary URLs to files
      req.files[fieldName] = req.files[fieldName].map((file, index) => ({
        ...file,
        path: results[index].secure_url,
        cloudinaryId: results[index].public_id
      }));

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Combine multer upload with cloudinary upload
const upload = {
  single: (fieldName) => [multerUpload.single(fieldName), uploadToCloudinary(fieldName)],
  fields: (fields) => [multerUpload.fields(fields), ...fields.map(f => uploadToCloudinary(f.name))]
};

// Delete image from Cloudinary
const deleteImage = async (publicIdOrUrl) => {
  try {
    if (CLOUDINARY_CONFIGURED) {
      // When using Cloudinary, the publicId is expected
      await cloudinary.uploader.destroy(publicIdOrUrl);
      return;
    }

    // Otherwise treat the input as a URL or filename and delete the local file
    // Extract filename
    let filename = publicIdOrUrl;
    if (!filename) return;
    if (filename.includes('/')) filename = filename.split('/').pop();

    // If no extension, try to find a file that starts with the name
    let target = filename;
    if (!path.extname(filename)) {
      const files = fs.readdirSync(UPLOADS_DIR);
      const found = files.find(f => f.startsWith(filename));
      if (found) target = found;
    }

    const fullPath = path.join(UPLOADS_DIR, target);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteImage
};