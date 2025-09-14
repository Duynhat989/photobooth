const path = require('path')
const http = require('http')
const express = require('express')

const bodyParser = require('body-parser')
const cors = require('cors')
const ControllerRoutes = require('./router')
const initServer = () => {
    const app = express();
    const server = http.createServer(app);
    // Mở công giao tiếp công khai
    app.use(express.static(path.join(__dirname, 'public')));

    app.use(cors());
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    app.use('/controller', ControllerRoutes);

    const PORT = 13995;
    server.listen(PORT, () => console.log(`Listen: ${PORT}`));
}

module.exports = {
    initServer
}

