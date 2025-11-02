const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
  getItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getMyItems,
  claimItem,
  resolveItem,
  getShareLink
} = require('../controllers/itemController');
const { protect, checkVerified } = require('../middleware/auth');

// Apply authentication to all routes
router.use(protect);
router.use(checkVerified);

// @route   GET /api/items
// @desc    Get all items with filters
// @access  Private
router.get('/', getItems);

// @route   GET /api/items/my-items
// @desc    Get current user's items
// @access  Private
router.get('/my-items', getMyItems);

// @route   GET /api/items/:id
// @desc    Get single item by ID
// @access  Private
router.get('/:id', getItem);

// @route   POST /api/items
// @desc    Create new item
// @access  Private
router.post(
  '/',
  upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 }
  ]),
  createItem
);

// @route   PUT /api/items/:id
// @desc    Update item
// @access  Private
router.put(
  '/:id',
  upload.fields([
    { name: 'photo1', maxCount: 1 },
    { name: 'photo2', maxCount: 1 }
  ]),
  updateItem
);

// @route   DELETE /api/items/:id
// @desc    Delete item
// @access  Private
router.delete('/:id', deleteItem);

// @route   POST /api/items/:id/claim
// @desc    Claim an item (Found button for lost items, This is Mine for found items)
// @access  Private
router.post('/:id/claim', claimItem);

// @route   PUT /api/items/:id/resolve
// @desc    Mark item as resolved
// @access  Private
router.put('/:id/resolve', resolveItem);

// @route   GET /api/items/:id/share
// @desc    Get share link for item
// @access  Private
router.get('/:id/share', getShareLink);

module.exports = router;