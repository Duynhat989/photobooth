const { Sequelize, DataTypes, Model } = require('sequelize');
const path = require('path');

class Database {
  constructor(dbPath = 'database.sqlite') {
    this.sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.resolve(dbPath),
      logging: false, // tắt log SQL
    });

    this.defineModels();
  }

  defineModels() {
    this.Template = this.sequelize.define('Template', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    });

    this.Category = this.sequelize.define('Category', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    });

    this.Image = this.sequelize.define('Image', {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });

    // Quan hệ: mỗi ảnh thuộc một danh mục
    this.Category.hasMany(this.Image, { foreignKey: 'categoryId' });
    this.Image.belongsTo(this.Category, { foreignKey: 'categoryId' });
  }

  async connect() {
    try {
      await this.sequelize.authenticate();
      console.log('Connect SQLite success.');
      await this.sequelize.sync(); // tạo bảng nếu chưa có
      console.log('Async success.');
    } catch (error) {
      console.error('Can not connect CSDL:', error);
    }
  }
}

module.exports = Database;
