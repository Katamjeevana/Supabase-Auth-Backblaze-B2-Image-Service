const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const upload = require('../utils/upload');
const {
  uploadImage,
  getImages,
  getImage,
  deleteImage
} = require('../controllers/images');

// All routes require authentication
router.use(authenticateToken);

router.post('/', upload.single('image'), uploadImage);
router.get('/', getImages);
router.get('/:id', getImage);
router.delete('/:id', deleteImage);

module.exports = router;