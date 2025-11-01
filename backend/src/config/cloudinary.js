const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
};

module.exports = {
  cloudinary,
  upload,
  deleteImage
};