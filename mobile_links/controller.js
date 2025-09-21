const db = require('./utils/config');
const fs = require('fs');
const path = require('path');
const { projectPath } = require('../config');
const { randomUUID } = require('crypto');



const projectDir = projectPath()
console.log(projectDir);
// ===== TEMPLATE =====
const getTemplate = async (req, res) => {
    const list = await db.Template.findAll();
    return res.json(list);
};
const addTemplate = async (req, res) => {
    const tpl = await db.Template.create(req.body);
    return res.json(tpl);
};
const updateTemplate = async (req, res) => {
    const { id } = req.params;
    await db.Template.update(req.body, { where: { id } });
    const tpl = await db.Template.findByPk(id);
    return res.json(tpl);
};
const deleteTemplate = async (req, res) => {
    const { id } = req.params;
    await db.Template.destroy({ where: { id } });
    return res.json({ message: 'Deleted' });
};

// ===== IMAGE =====
const getImages = async (req, res) => {
    const list = await db.Image.findAll();
    return res.json(list);
};
const getImagesByCategory = async (req, res) => {
    const { categoryId } = req.params;
    const list = await db.Image.findAll({ where: { categoryId } });
    return res.json(list);
};
const addImage = async (req, res) => {
    const img = await db.Image.create(req.body);
    return res.json(img);
};
const updateImage = async (req, res) => {
    const { id } = req.params;
    await db.Image.update(req.body, { where: { id } });
    const img = await db.Image.findByPk(id);
    return res.json(img);
};
const deleteImage = async (req, res) => {
    const { id } = req.params;
    await db.Image.destroy({ where: { id } });
    return res.json({ message: 'Deleted' });
};

// ===== CATEGORY =====
const getCategories = async (req, res) => {
    const list = await db.Category.findAll();
    return res.json(list);
};
const addCategory = async (req, res) => {
    try {
        const cat = await db.Category.create(req.body);
        return res.json(cat);
    } catch (error) {
        return res.json(null);
    }
};
const updateCategory = async (req, res) => {
    const { id } = req.params;
    await db.Category.update(req.body, { where: { id } });
    const cat = await db.Category.findByPk(id);
    return res.json(cat);
};
const deleteCategory = async (req, res) => {
    const { id } = req.params;
    await db.Category.destroy({ where: { id } });
    return res.json({ message: 'Deleted' });
};

// ===== UPLOAD BASE64 =====
const uploadImageBase64 = async (req, res) => {
    try {
        const { base64 } = req.body;
        if (!base64) return res.status(400).json({ error: 'Missing base64' });

        const uuid = randomUUID();
        const matches = base64.match(/^data:(.+);base64,(.*)$/);
        const data = matches ? matches[2] : base64;
        const buffer = Buffer.from(data, 'base64');
        const fileName = `photobooth_${uuid}_${Date.now()}.png`;

        const uploadDir = path.join(projectDir, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        fs.writeFileSync(path.join(uploadDir, fileName), buffer);
        return res.json({ path: `/uploads/${fileName}` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Upload failed' });
    }
};

module.exports = {
    getTemplate,
    addTemplate,
    updateTemplate,
    deleteTemplate,

    getImages,
    getImagesByCategory,
    addImage,
    updateImage,
    deleteImage,

    getCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    uploadImageBase64
};
