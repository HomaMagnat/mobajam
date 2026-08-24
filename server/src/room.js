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
            READY: (ws) => this.playerready(ws),
            GAMECLICK: (ws, data) => this.gameclick(ws, data)
        };

        this.location = [{type: 'tile', texture: 'tile1', x: 3, y: 3, hitbox: true}];

        this.clock = 0;
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
            if(this.players[id].ws && this.players[id].ws.readyState === 1) {
                this.players[id].ws.send(rawdata);
            }
        }
    }

    playerleave(ws) { //выход игрока из комнаты в любой момент
        if(Object.keys(this.players).length < 3) { //остаётся один игрок (2 уходит)
            //остановка отсчёта и всего матча, (если матч идёт кидает в меню, если в лобби, то нельзя начать матч, а обратный таймер отсчёта лобби (60 сек) стоит)
        } else {
            //тогда удаляем игрока из списка, и говорим всем об этом (обновляем в игре)
        }

        if(this.state == 'LOBBY') {
            delete this.players[ws.playerid];
            this.rebalanceteams();
            this.checkready();
            this.sendlobbystate();
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

    findslot() {
        let bluecount = Object.values(this.players).filter(p => p.team === 'blue').length;
        let redcount = Object.values(this.players).filter(p => p.team === 'red').length;

        let targetteam = bluecount <= redcount ? 'blue' : 'red';
        let backupteam = targetteam === 'blue' ? 'red' : 'blue';

        for(let classid = 1; classid <= 5; classid++) {
            let busy = Object.values(this.players).some(p => p.team === targetteam && p.classid === classid);
            if(!busy) {
                return { team: targetteam, classid };
            }
        }
        
        for(let classid = 1; classid <= 5; classid++) {
            let busy = Object.values(this.players).some(p => p.team === backupteam && p.classid === classid);
            if(!busy) {
                return { team: backupteam, classid };
            }
        }

        return null;
    }

    rebalanceteams() {
        let all = Object.values(this.players);
        let blue = all.filter(p => p.team === 'blue').length;
        let red = all.filter(p => p.team === 'red').length;

        if(Math.abs(blue - red) >= 2) {
            let strong = blue > red ? 'blue' : 'red';
            let strongplayers = all.filter(p => p.team === strong);
            let playertomove = strongplayers[strongplayers.length - 1];

            if(playertomove) {
                let newslot = this.findslot();
                
                playertomove.team = newslot.team;
                playertomove.classid = newslot.classid;
            }
        }
    }

    selectslot(ws, data) {
        let player = this.players[ws.playerid];
        if(!player) return;

        let isoccupied = Object.values(this.players).some(p => p.team === data.team && p.classid === data.classid);
        if(!isoccupied) {
            if(player.team !== data.team) {
                let bluecount = Object.values(this.players).filter(p => p.team === 'blue').length;
                let redcount = Object.values(this.players).filter(p => p.team === 'red').length;

                if(player.team === 'blue' && redcount >= bluecount) {
                    this.sendlobbystate();
                    return;
                }
                if(player.team === 'red' && bluecount >= redcount) {
                    this.sendlobbystate();
                    return;
                }
            }

            player.team = data.team;
            player.classid = data.classid;
        }

        this.sendlobbystate();
    }

    chatmessage(ws, data) {
        let msg = this.players[ws.playerid].nickname + ': ' + data.message;
        this.sendchatmessage(msg); //SEND
    }

    playerready(ws) {
        this.players[ws.playerid].isready = true;
        this.checkready();
        this.sendlobbystate();
    }

    checkready() {
        let allplayers = Object.values(this.players);
        
        if(allplayers.length < 2) {
            return;
        };

        let readycount = allplayers.filter(p => p.isready === true).length;

        if (readycount === allplayers.length) {
            this.startmatch();
        }
    }

    startmatch() {
        if(Object.values(this.players).length < 2) return;

        this.startbuyphase();

        this.sendmatchstart();
    }

    startbuyphase() { //всё начинаем сначала, возрождаем, задаём значения
        this.state = 'BUYPHASE';
        
        for(let id in this.players) {
            const player = this.players[id];
            const config = player.classesconfig[player.classid];
            player.isdead = false;
            player.x = config.x;
            player.y = config.y;
            player.hp = config.hp;
            player.mana = config.mana;
            player.speed = config.speed;
        }

        this.clock = 20;
        const buytimer = () => {
            this.clock--;
            if(this.clock <= 0) {
                this.startround();
            } else {
                setTimeout(buytimer, 1000);
            }
        }
        setTimeout(buytimer, 1000);
    }

    startround() {
        this.state = 'ROUND';
        this.clock = 0;
        setInterval(() => {
            this.clock++;
        }, 1000);
    }

    gameclick(ws, data) {
        let player = this.players[ws.playerid];
        if(player && !player.isdead) {
            player.gameclick(data);
        }
    }

    //to client methods (send)
    sendlobbystate() {
        if(this.state != 'LOBBY') return;

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

    sendchatmessage(data) {
        this.sendtoroom('CHATMESSAGE', {msg: data});
    }

    sendmatchstart() {
        for(let id in this.players) {
            this.sendtoplayer(this.players[id].ws, 'GETMYID', {myid: id});
        }
        this.sendtoroom('MATCHSTART', {});
    }

    //roomloop
    roomupdate(dt) {
        let data = {};
        data.players = {};

        for(let id in this.players) {
            this.players[id].playerupdate(dt, this.location, this.players); //update only every logic dynamic prorps

            data.players[id] = {
                x: this.players[id].x,
                y: this.players[id].y,
                hp: this.players[id].hp,
                mana: this.players[id].mana,
                gold: this.players[id].gold,
                isdead: this.players[id].isdead
            }
        }

        data.clock = this.clock;

        this.sendtoroom('UPDATEROOM', data);
    }
}

module.exports = Room;