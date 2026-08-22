const fs = require('fs');
const https = require('https');
const { WebSocketServer } = require('ws');
const Room = require('./room');

const serverconfig = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
};

class Server {
    constructor(port) {
        this.rooms = {};
        
        this.httpsserver = https.createServer(serverconfig);
        this.wss = new WebSocketServer({ server: this.httpsserver });

        this.wss.on('connection', this.onconnection);

        this.httpsserver.listen(port, () => {
        });
    }

    onconnection = (ws, req) => { //СЮДА ПРИЛЕТАЕТ ЛЮБОЕ СОЕДИНЕНИЕ (ЕЩЁ НЕ ИГРОК)
        ws.on('message', (rawdata) => this.ondata(ws, rawdata));
        ws.on('close', () => this.onclose(ws));
        ws.on('error', (err) => this.onclose(ws));
    }

    ondata(ws, rawdata) { //ВООБЩЕ ЛЮБОЙ ЗАПРОС ОТ ЛЮБОГО СОЕДИНЕНИЯ (ИГРОК ИЛИ НЕТ)

    }

    onclose(ws) {

    }
}

let server = new Server(9080);