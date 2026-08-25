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
        this.ticksec = 0;

        this.location = [{type: 'tile', texture: 'tile1', x: 3, y: 3, hitbox: true}];
        this.towers = {
            blue: {
                mid: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30},
                top: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30},
                bottom: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30},
                throne: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30}
            },
            red: {
                mid: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30},
                top: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30},
                bottom: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30},
                throne: {x: 100, y: 100, hp: 1000, attackradius: 256, cooldown: 1000, damage: 30}
            }
        };

        this.clock = 0;
        this.bluescore = 0;
        this.redscore = 0;
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
        if(this.state != 'LOBBY') {
            this.sendtoroom('DELETEPLAYER', {id: ws.playerid});
            delete this.players[ws.playerid];

            let bluecount = 0;
            let redcount = 0;

            for(let id in this.players) {
                if(this.players[id].team == 'blue') bluecount++;
                if(this.players[id].team == 'red') redcount++;
            }

            if(bluecount == 0 || redcount == 0) {
                for(let id in this.players) {
                    if(this.players[id].ws) {
                        this.players[id].ws.close();
                    }
                }
                return;
            }
        }

        if(this.state == 'LOBBY') {
            delete this.players[ws.playerid];
            this.rebalanceteams();
            this.checkready();
            this.sendlobbystate();
        }
    }

    addplayer(ws, nickname) {
        if(this.state != 'LOBBY') return;

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
        if(this.state != 'LOBBY') return;

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
        if(this.state != 'LOBBY') return;

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
        this.sendmatchstart();
        this.startbuyphase();
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

        this.clock = 10;
        const buytimer = () => {
            this.clock--;
            if(this.clock <= 0) {
                this.startround();
            } else {
                setTimeout(buytimer, 1000);
            }
        }
        setTimeout(buytimer, 1000);

        this.sendtoroom('BUYPHASE', {});
    }

    startround() {
        this.state = 'ROUND';
        this.clock = 0;

        const roundtimer = () => {
            if(this.state == 'ROUND') {
                this.clock++;
                setTimeout(roundtimer, 1000);
            }
        }
        setTimeout(roundtimer, 1000);

        this.sendtoroom('ROUND', {});
    }

    gameclick(ws, data) {
        if(this.state != 'ROUND') return;

        let player = this.players[ws.playerid];
        if(player && !player.isdead) {
            player.targetx = data.targetx;
            player.targety = data.targety;

            player.animation = 'run';

            let dx = data.targetx - player.x;
            let dy = data.targety - player.y;
            let angle = Math.atan2(dy, dx);

            let degrees = angle * (180 / Math.PI);
            if (degrees < 0) degrees += 360;

            if (degrees >= 337.5 || degrees < 22.5) {
                player.direction = 'right';
            } else if (degrees >= 22.5 && degrees < 67.5) {
                player.direction = 'downright';
            } else if (degrees >= 67.5 && degrees < 112.5) {
                player.direction = 'down';
            } else if (degrees >= 112.5 && degrees < 157.5) {
                player.direction = 'downleft';
            } else if (degrees >= 157.5 && degrees < 202.5) {
                player.direction = 'left';
            } else if (degrees >= 202.5 && degrees < 247.5) {
                player.direction = 'upleft';
            } else if (degrees >= 247.5 && degrees < 292.5) {
                player.direction = 'up';
            } else if (degrees >= 292.5 && degrees < 337.5) {
                player.direction = 'upright';
            }

            this.checkarcollision(data, player);
        }
    }

    checkarcollision(data, player) {
        for(let id in this.players) {
            if(id == player.id) continue; //не текущий
            if(this.players[id].isdead) continue;
            if(this.players[id].team == player.team) continue; //не в нашей команде

            let thisplayer = {x: player.x, y: player.y, radius: player.classesconfig[player.classid].attackradius}; //позиция игрока И ЕГО РАДИУС АТАКИ
            let thisenemy = {x: this.players[id].x, y: this.players[id].y, radius: player.PLAYERRADIUS}; //позиция врага и стандартный радиус игрока (не атаки)

            if(player.circlecollision(thisplayer, thisenemy)) { //если этот игрок находится в нашем радиусе атаки
                if(player.pointcircle({x: data.targetx, y: data.targety}, thisenemy)) { //если мы кликнули на него
                    player.stop();
                    this.playerattack(player.id, id);
                    return;
                }
            }
        }
    }

    playerattack(playerid, enemyid) {
        let player = this.players[playerid];
        let enemy = this.players[enemyid];
        const config = player.classesconfig[player.classid];
        const thistime = Date.now();

        if(thistime - player.lastattacktime < config.cooldown) { //кулдаун не прошёл
            player.lastattacktime = thistime; //антиспам
            return;
        }

        if(player.mana < config.manacost) { //не хватает маны
            return;
        }

        player.lastattacktime = thistime;

        player.mana = Math.max(0, player.mana - config.manacost);
        enemy.hp = Math.max(0, enemy.hp - config.damage);
        if(enemy.hp == 0) { //единственный способ умереть
            player.gold += 500;
            enemy.isdead = true;
            enemy.inventory = { 1: {}, 2: {}, 3: {}, 4: {}, 5: {} };
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
        this.ticksec++;

        let data = {};
        data.players = {};
        data.towers = this.towers;

        for(let id in this.players) {
            this.players[id].playerupdate(dt, this.location, this.players); //update only every logic dynamic prorps

            const thistime = Date.now();
            let currentcooldown = 0;
            if(thistime - this.players[id].lastattacktime < this.players[id].classesconfig[this.players[id].classid].cooldown) {
                currentcooldown = thistime - this.players[id].lastattacktime;
            } else {
                currentcooldown = this.players[id].classesconfig[this.players[id].classid].cooldown;
            }

            if(this.ticksec > 29 && this.state == 'ROUND' && this.players[id].isdead == false) {
                this.players[id].hp = Math.min(this.players[id].classesconfig[this.players[id].classid].hp, this.players[id].hp + 2);
                this.players[id].mana = Math.min(this.players[id].classesconfig[this.players[id].classid].mana, this.players[id].mana + 2);
                this.players[id].gold += 1;
            }

            data.players[id] = {
                x: this.players[id].x,
                y: this.players[id].y,
                hp: this.players[id].hp,
                mana: this.players[id].mana,
                gold: this.players[id].gold,
                isdead: this.players[id].isdead,
                inventory: this.players[id].inventory,
                direction: this.players[id].direction,
                animation: this.players[id].animation,
                config: this.players[id].classesconfig[this.players[id].classid],
                currentcooldown: currentcooldown
            }
        }

        data.clock = this.clock;
        data.bluescore = this.bluescore;
        data.redscore = this.redscore;

        this.sendtoroom('UPDATEROOM', data);

        if(this.ticksec > 29) { //секунда
            this.ticksec = 0;
        }

        if(this.state == 'ROUND') {
            //проверка на победу в раунде
            if(this.towers.blue.throne.hp == 0) { //победа красных в раунде (по трону)
                this.redscore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'red'});
                return;
            }

            if(this.towers.red.throne.hp == 0) { //победа синих в раунде (по трону)
                this.bluescore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'blue'});
                return;
            }

            //если команда померла сразу делаем победу чтобы не бить трон
            let bluecount = Object.values(this.players).filter(p => p.team === 'blue' && p.isdead == false).length;
            let redcount = Object.values(this.players).filter(p => p.team === 'red'  && p.isdead == false).length;

            if(bluecount == 0) {
                this.redscore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'red'});
                return;
            }

            if(redcount == 0) {
                this.bluescore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'blue'});
                return;
            }

            //проверка на победу в игре
            if(this.bluescore == 4) {
                //победа синих
                this.sendtoroom('GAMEWIN', {team: 'blue'});
                return;
            }
            if(this.redscore == 4) {
                //победа красных
                this.sendtoroom('GAMEWIN', {team: 'red'});
                return;
                
            }
        }
    }
}

module.exports = Room;