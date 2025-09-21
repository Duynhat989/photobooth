const { app } = require('electron');
const path = require('path');
const isDev = process.argv.includes('--dev')

const projectPath = () => {
    let pathNew = app.getAppPath();
    if (!isDev) {
        pathNew = path.dirname(app.getPath('exe'))
    }
    return pathNew
}

module.exports = {
    projectPath
}