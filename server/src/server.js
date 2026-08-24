const fs = require('fs');
const https = require('https');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');

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

        this.startglobaltick();
    }

    //ws
    onconnection = (ws, req) => { //СЮДА ПРИЛЕТАЕТ ЛЮБОЕ СОЕДИНЕНИЕ (ЕЩЁ НЕ ИГРОК)
        ws.roomid = null;
        ws.playerid = null;

        ws.on('message', (rawdata) => this.ondata(ws, rawdata));
        ws.on('close', () => this.onclose(ws));
        ws.on('error', (err) => this.onclose(ws));

        this.sendrooms(ws);
    }

    ondata(ws, rawdata) { //ВООБЩЕ ЛЮБОЙ ЗАПРОС ОТ ЛЮБОГО СОЕДИНЕНИЯ (ИГРОК ИЛИ НЕТ)
        let jsondata = JSON.parse(rawdata);
        let type = jsondata.type;
        let data = jsondata.data;

        if(ws.roomid == null && ws.playerid == null) { //ЗАПРОС ОТ СОЕДИНЕНИЯ БЕЗ ИГРОКА НЕ В ЛОББИ
            if(type == 'MATCHMAKING') { //АВТОМАТИЧЕСКИЙ ПОДБОР (присоединяется к самой крупной или создаёт если нет)
                this.matchmaking(ws, data.nickname);
            }
            if(type == 'JOINROOM') { //ПОДКЛЮЧЕНИЕ К КОНКРЕТНОЙ КОМНАТЕ
                this.joinroom(ws, data.nickname, data.roomid);
            }
            if(type == 'CREATEROOM') { //ПРИНУДИТЕЛЬНОЕ СОЗДАНИЕ КОМНАТЫ (для друзей)
                this.createroom(ws, data.nickname);
            }
        } else { //ЗАПРОС ОТ ИГРОКА В ЛОББИ ИЛИ ИГРЕ
            this.rooms[ws.roomid].ondata(ws, type, data);
        }
    }

    onclose(ws) { //ЛЮБОЕ ОТКЛЮЧЕНИЕ СОЕДИНЕНИЯ (ИГРОК ИЛИ НЕТ)
        if(ws.roomid == null && ws.playerid == null) { //ЗАПРОС ОТ СОЕДИНЕНИЯ БЕЗ ИГРОКА НЕ В ЛОББИ
            //если его нигде не было, то похую вообще
        } else { //ЗАПРОС ОТ ИГРОКА В ЛОББИ ИЛИ ИГРЕ
            this.playerleave(ws);
        }
    }

    playerleave(ws) {
        if(Object.keys(this.rooms[ws.roomid].players).length < 2) { //уходит последний (в данный момент 1 он)
            delete this.rooms[ws.roomid];
            console.log(' room deleted ');
        } else { //уходит не последний
            this.rooms[ws.roomid].playerleave(ws);
        }

        this.updaterooms();
    }

    //format guest send
    send(ws, type, data) {
        let jsondata = {type: type, data: data};
        let rawdata = JSON.stringify(jsondata);
        ws.send(rawdata);
    }

    //to guest (send)
    sendrooms(ws) {
        let type = 'ROOMLIST';
        let data = {};
        for (const [roomid, room] of Object.entries(this.rooms)) {
            if(room.state == 'LOBBY') {
                data[roomid] = {};
                data[roomid].playersnumber = Object.keys(room.players).length;
                data[roomid].owner = room.owner;
            }
        }
        this.send(ws, type, data);
    }

    updaterooms() {
        this.wss.clients.forEach(ws => {
            if (ws.readyState === 1 && ws.roomid == null && ws.playerid == null) {
                this.sendrooms(ws);
            }
        });
    }

    //from guest (get)
    matchmaking(ws, nickname) { //автоподбор лобби для входа игрока (нужно соединение и никнейм из меню)
        let allrooms = Object.values(this.rooms);

        let openrooms = allrooms.filter(r => r.state === 'LOBBY' && Object.keys(r.players).length < 10);

        if(openrooms.length > 0) {
            openrooms.sort((a, b) => Object.keys(b.players).length - Object.keys(a.players).length);
            let targetroom = openrooms[0];
            
            this.joinroom(ws, nickname, targetroom.id);
        } else {
            this.createroom(ws, nickname);
        }
    }

    joinroom(ws, nickname, roomid) { //общий способ подключения к конкретному лобби по ID
        let room = this.rooms[roomid];

        if(room && room.state == 'LOBBY' && Object.keys(room.players).length < 10) {
            ws.roomid = roomid;
            ws.playerid = crypto.randomUUID();

            room.addplayer(ws, nickname);

            this.updaterooms();
        }
    }

    createroom(ws, nickname) { //создание лобби
        let roomid = crypto.randomUUID();
        this.rooms[roomid] = new Room(roomid, nickname);
        
        this.joinroom(ws, nickname, roomid);
    }

    //loop
    startglobaltick() {
        const dt = 1 / 30; //30 tickrate deltatime
    
        setInterval(() => {
            for (let id in this.rooms) {
                let room = this.rooms[id];

                if(room.state != 'LOBBY') {
                    room.roomupdate(dt);
                }
            }
        }, 1000 / 30);
    }
}

let server = new Server(9080);