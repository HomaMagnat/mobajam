const fs = require('fs');
const https = require('https');
const { WebSocketServer } = require('ws');
const Room = require('./room');

process.on('uncaughtException', (err) => {
    console.error('ОШИБКА СЕРВЕРА:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('НЕОБРАБОТАННЫЙ ПРОМИС:', reason);
});

const serverconfig = {
    key: fs.readFileSync('/etc/letsencrypt/live/hmxstudio.ru/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/hmxstudio.ru/fullchain.pem')
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
        ws.roomid = null;
        ws.playerid = null;

        ws.on('message', (rawdata) => this.ondata(ws, rawdata));
        ws.on('close', () => this.onclose(ws));
        ws.on('error', (err) => this.onclose(ws));
    }

    ondata(ws, rawdata) { //ВООБЩЕ ЛЮБОЙ ЗАПРОС ОТ ЛЮБОГО СОЕДИНЕНИЯ (ИГРОК ИЛИ НЕТ)
        let jsondata = JSON.parse(rawdata);
        let type = jsondata.type;
        let data = jsondata.data;

        if(ws.roomid == null && ws.playerid == null) { //ЗАПРОС ОТ СОЕДИНЕНИЯ БЕЗ ИГРОКА НЕ В ЛОББИ
            if(type == 'MATCHMAKING') { //АВТОМАТИЧЕСКИЙ ПОДБОР (присоединяется к самой крупной или создаёт если нет)

            }
            if(type == 'JOINROOM') { //ПОДКЛЮЧЕНИЕ К КОНКРЕТНОЙ КОМНАТЕ
                
            }
            if(type == 'CREATEROOM') { //ПРИНУДИТЕЛЬНОЕ СОЗДАНИЕ КОМНАТЫ (для друзей)

            }
        } else { //ЗАПРОС ОТ ИГРОКА В ЛОББИ ИЛИ ИГРЕ

        }
    }

    onclose(ws) { //ЛЮБОЕ ОТКЛЮЧЕНИЕ СОЕДИНЕНИЯ (ИГРОК ИЛИ НЕТ)
        if(ws.roomid == null && ws.playerid == null) { //ЗАПРОС ОТ СОЕДИНЕНИЯ БЕЗ ИГРОКА НЕ В ЛОББИ

        } else { //ЗАПРОС ОТ ИГРОКА В ЛОББИ ИЛИ ИГРЕ

        }
    }

    matchmaking() {

    }

    joinroom() {

    }

    createroom() {

    }
}

let server = new Server(9080);