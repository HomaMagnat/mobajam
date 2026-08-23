const Player = require('./player'); 

class Room {
    constructor(roomid, owner) {
        this.id = roomid;
        this.owner = owner;
        this.state = 'LOBBY';
        this.players = {};

        this.routes = {
            SELECTSLOT: (ws, data) => this.selectslot(ws, data),
            SENDMESSAGE: (ws, data) => this.chatmessage(ws, data),
            READY: (ws, data) => this.playerready(ws, data)
        };
    }

    //ws
    ondata(ws, type, data) {
        if(this.routes[type]) {
            this.routes[type](ws, data);
        }
    }

    sendtoplayer(ws, type, data) {
        let jsondata = {type: type, data: data};
        let rawdata = JSON.stringify(jsondata);
        ws.send(rawdata);
    }

    sendtoroom(type, data) {
        let rawdata = JSON.stringify({type: type, data: data});
        for(let id in this.players) {
            if (this.players[id].ws && this.players[id].ws.readyState === 1) {
                this.players[id].ws.send(rawdata);
            }
        }
    }

    addplayer(ws, nickname) {
        let playerid = ws.playerid;
        let newplayer = new Player(playerid, ws, nickname);

        let slot = this.findslot(); //найти первый свободный класс и команду
        if(!slot) {
            return;
        }

        newplayer.team = slot.team;
        newplayer.classid = slot.classid;

        this.players[playerid] = newplayer;

        this.sendlobbystate();
    }

    //utility
    findslot() {
        const teams = ['blue', 'red'];
        for (let team of teams) {
            for (let classid = 1; classid <= 5; classid++) {
                let busy = Object.values(this.players).some(p => p.team === team && p.classid === classid);
                if (!busy) {
                    return { team, classid };
                }
            }
        }
        return null;
    }

    //from client methods (get)
    selectslot(ws, data) {
        
    }

    chatmessage(ws, data) {

    }

    playerready(ws, data) {

    }

    //to client methods (send)
    sendlobbystate() {
        let data = {};
        data.owner = this.owner;
        data.playersnumber = Object.keys(this.players).length;
        data.playersready = 0;
        data.playerslist = {};

        for(let id in this.players) {
            let p = this.players[id];
            if(p.isready == true) {
                data.playersready++;
            }

            data.playerslist[id] = {
                nickname: p.nickname,
                team: p.team,
                classid: p.classid,
                isready: p.isready
            };
        }

        this.sendtoroom('UPDATELOBBYSTATE', data);
    }
}

module.exports = Room;