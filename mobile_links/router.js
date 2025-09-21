const express = require('express');
const controller = require('./controller');
const router = express.Router();

// ========== TEMPLATE ==========
router.get('/templates', controller.getTemplate);
router.post('/templates', controller.addTemplate);
router.put('/templates/:id', controller.updateTemplate);
router.delete('/templates/:id', controller.deleteTemplate);

// ========== IMAGE ==========
router.get('/images', controller.getImages);              // lấy tất cả
router.get('/images/by-category/:categoryId', controller.getImagesByCategory); 
router.post('/images', controller.addImage);
router.put('/images/:id', controller.updateImage);
router.delete('/images/:id', controller.deleteImage);

// ========== CATEGORY ==========
router.get('/categories', controller.getCategories);
router.post('/categories', controller.addCategory);
router.put('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

// ========== UPLOAD BASE64 ==========
router.post('/upload-base64', controller.uploadImageBase64);

module.exports = router;
