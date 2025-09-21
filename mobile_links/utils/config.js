// const cat = await db.Category.create({ name: 'Danh mục 1' });
// const img = await db.Image.create({ name: 'Ảnh 1', path: '/uploads/img1.jpg', categoryId: cat.id });
// const tpl = await db.Template.create({ name: 'Template A', content: '<html>...</html>' });
const Database = require('./db');
const db = new Database('photobooth.sqlite');

const connect = async () => {
    await db.connect();
    return db;
};

// Gọi connect khi file được import
connect().then(() => {
    console.log('Database connected');
}).catch(err => {
    console.error('Database connection failed:', err);
});

module.exports = db;
