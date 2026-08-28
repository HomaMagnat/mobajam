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
            GAMECLICK: (ws, data) => this.gameclick(ws, data),
            BUY: (ws, data) => this.playerbuy(ws, data),
            USEITEM: (ws, data) => this.useitem(ws, data)
        };
        this.ticksec = 0;

        this.location = [
            {type: 'sector', texture: 'tile1', x: 0, y: 0, w: 64, h: 64, hitbox: false},

            //Твой сглаженный диагональный МИД
            {type: 'sector', texture: 'tile3', x: 6,  y: 6,  w: 8, h: 8, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 12, y: 12, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 17, y: 17, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 22, y: 22, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 27, y: 27, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 32, y: 32, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 37, y: 37, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 42, y: 42, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 47, y: 47, w: 7, h: 7, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 52, y: 52, w: 8, h: 8, hitbox: false},

            //ТОП линия
            {type: 'sector', texture: 'tile3', x: 6,  y: 6,  w: 52, h: 4, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 54, y: 6,  w: 4,  h: 52, hitbox: false},

            //БОТ линия
            {type: 'sector', texture: 'tile3', x: 6,  y: 6,  w: 4,  h: 52, hitbox: false},
            {type: 'sector', texture: 'tile3', x: 6,  y: 54, w: 52, h: 4, hitbox: false},

            {type: 'sector', texture: 'tile11', x: 55.2,  y: 55.2, w: 8, h: 8, hitbox: false}, //throne
            {type: 'sector', texture: 'tile11', x: 1.2,  y: 1.2, w: 8, h: 8, hitbox: false},

            {type: 'sector', texture: 'tile3', x: 39.2,  y: 39.2, w: 8, h: 8, hitbox: false}, //mid
            {type: 'sector', texture: 'tile3', x: 19.2,  y: 19.2, w: 8, h: 8, hitbox: false},
            
            {type: 'sector', texture: 'tile3', x: 29.2,  y: 1.2, w: 8, h: 8, hitbox: false}, //top
            {type: 'sector', texture: 'tile3', x: 55.2,  y: 29.2, w: 8, h: 8, hitbox: false},

            {type: 'sector', texture: 'tile3', x: 29.2,  y: 55.2, w: 8, h: 8, hitbox: false}, //bottom
            {type: 'sector', texture: 'tile3', x: 1.2,  y: 29.2, w: 8, h: 8, hitbox: false},

            {type: 'object', texture: 'tile10', x: 0*64,  y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 8*64,  y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 16*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 24*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 32*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 40*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 48*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 56*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 64*64, y: -1*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 72*64, y: -1*64, hitbox: false},

            {type: 'object', texture: 'tile10', x: 0*64,  y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 8*64,  y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 16*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 24*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 32*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 40*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 48*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 56*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 64*64, y: 76*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 72*64, y: 76*64, hitbox: false},

            {type: 'object', texture: 'tile10', x: 0*64,  y: 8*64,  hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 16*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 24*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 32*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 40*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 48*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 56*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 64*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 0*64,  y: 70*64, hitbox: false},

            {type: 'object', texture: 'tile10', x: 76*64, y: 8*64,  hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 16*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 24*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 32*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 40*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 48*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 56*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 62*64, hitbox: false},
            {type: 'object', texture: 'tile10', x: 76*64, y: 70*64, hitbox: false},

            {type: 'sector', texture: 'tile2', x: -16, y: -16, w: 96,  h: 16, hitbox: true},
            {type: 'sector', texture: 'tile2', x: -16, y: 64,  w: 96,  h: 16, hitbox: true},
            {type: 'sector', texture: 'tile2', x: -16, y: 0,   w: 16,  h: 64, hitbox: true},
            {type: 'sector', texture: 'tile2', x: 64,  y: 0,   w: 16,  h: 64, hitbox: true}
        ];



        //1. Точные координаты башен для полной очистки зоны вокруг них (в тайлах)
        const towerPositions = [
            {x: 42, y: 42}, {x: 58, y: 32}, {x: 32, y: 58}, // Синие
            {x: 22, y: 22}, {x: 32, y: 4},  {x: 4,  y: 32}  // Красные
        ];

        //2. Сюда сохраняем координаты, чтобы объекты не наезжали друг на друга
        let placedObjects = [];

        //Сколько ВСЕГО объектов раскидать, чтобы карта была живой, но свободной
        const TOTAL_OBJECTS_TO_SPAWN = 240;

        let spawnedCount = 0;
        let attempts = 0; 

        while(spawnedCount < TOTAL_OBJECTS_TO_SPAWN && attempts < 3000) {
            attempts++;

            //Случайная точка внутри игрового поля
            let tx = Math.floor(Math.random() * 60) + 4;
            let ty = Math.floor(Math.random() * 60) + 4;

            // --- ЗАЩИТА ТРОПИНОК, БАЗ И БАШЕН ---
            if(tx <= 12 && ty <= 12) continue;   // Спавн красных чист
            if(tx >= 51 && ty >= 51) continue;   // Спавн синих чист

            //Топ линия
            if(ty >= 5 && ty <= 10 && tx >= 5 && tx <= 58) continue;
            if(tx >= 53 && tx <= 58 && ty >= 5 && ty <= 58) continue;

            //Бот линия
            if(tx >= 5 && tx <= 10 && ty >= 5 && ty <= 58) continue;
            if(ty >= 53 && ty <= 58 && tx >= 5 && tx <= 58) continue;

            //Мид линия
            if(Math.abs(tx - ty) <= 5 && tx >= 5 && tx <= 58) continue;

            //Проходы поперек мида
            if(tx >= 29 && tx <= 33 && ty >= 12 && ty <= 51) continue;
            if(ty >= 29 && ty <= 33 && tx >= 12 && tx <= 51) continue;

            //Очистка зоны вокруг башен
            let nearTower = false;
            for(let tower of towerPositions) {
                let dist = Math.max(Math.abs(tx - tower.x), Math.abs(ty - tower.y));
                if (dist <= 4) { 
                    nearTower = true;
                    break;
                }
            }
            if(nearTower) continue;

            //Проверка, чтобы объекты не слипались в одну точку (зазор в 3 клетки)
            let tooClose = false;
            for(let oldObj of placedObjects) {
                let distance = Math.max(Math.abs(tx - oldObj.x), Math.abs(ty - oldObj.y));
                if (distance < 3) { 
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            placedObjects.push({x: tx, y: ty});
            spawnedCount++;

            let typeRoll = Math.random();

            if(typeRoll < 0.25) {
                //1. ПЕРВЫЙ ВИД ДЕРЕВА (tile7) — 25% шанс
                this.location.push({type: 'object', texture: 'tile7', x: tx * 64, y: ty * 64, hitbox: false});
                this.location.push({type: 'hitbox', x: (tx - 1) * 64, y: (ty - 1) * 64, w: 64, h: 64});
            } else if(typeRoll >= 0.25 && typeRoll < 0.50) {
                //2. ВТОРОЙ ВИД ДЕРЕВА (tile11) — ВЕРНУЛИ В ИГРУ! 25% шанс (Твой хитбокс сохранен)
                this.location.push({type: 'object', texture: 'tile12', x: tx * 64, y: ty * 64, hitbox: false});
                this.location.push({type: 'hitbox', x: (tx - 1) * 64, y: (ty - 1) * 64, w: 64, h: 64});
            } else if(typeRoll >= 0.50 && typeRoll < 0.65) {
                //3. СРЕДНИЙ КАМЕНЬ (tile5) — 15% шанс
                this.location.push({type: 'object', texture: 'tile5', x: tx * 64, y: ty * 64, hitbox: false});
                this.location.push({type: 'hitbox', x: (tx - 1) * 64, y: (ty - 1) * 64, w: 2 * 64, h: 64});
            } else if(typeRoll >= 0.65 && typeRoll < 0.75) {
                //4. БОЛЬШОЙ КАМЕНЬ (tile6) — 10% шанс
                this.location.push({type: 'object', texture: 'tile6', x: tx * 64, y: ty * 64, hitbox: false});
                this.location.push({type: 'hitbox', x: (tx - 1) * 64, y: (ty - 1) * 64, w: 2 * 64, h: 64});
            } else if(typeRoll >= 0.75 && typeRoll < 0.85) {
                //5. МАЛЕНЬКИЙ КАМЕНЬ (tile4) — 10% шанс
                this.location.push({type: 'object', texture: 'tile4', x: tx * 64 + 66, y: ty * 64, hitbox: false});
                this.location.push({type: 'hitbox', x: tx * 64, y: ty * 64, w: 32, h: 32});
            } else if(typeRoll >= 0.85 && typeRoll < 0.93) {
                //6. ТРАВКА (tile12) — НОВЫЙ ОБЪЕКТ! 8% шанс. БЕЗ хитбокса, чтобы сквозь неё ходить
                this.location.push({type: 'tile', texture: 'tile8', x: tx, y: ty, hitbox: false});
            } else {
                //7. СЛЕД НА ЗЕМЛЕ (tile13) — НОВЫЙ ОБЪЕКТ! 7% шанс. БЕЗ хитбокса, чистый декор под ногами
                this.location.push({type: 'tile', texture: 'tile9', x: tx, y: ty, hitbox: false});
            }
        }

        this.towerscopy = JSON.stringify({
            blue: {
                throne: {x: 58*64, y: 58*64, hp: 2000, maxhp: 2000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0},
                mid:    {x: 42*64, y: 42*64, hp: 1000, maxhp: 1000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0},
                top:    {x: 58*64, y: 32*64, hp: 1000, maxhp: 1000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0},
                bottom: {x: 32*64, y: 58*64, hp: 1000, maxhp: 1000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0}
            },
            red: {
                throne: {x: 4*64,  y: 4*64,  hp: 2000, maxhp: 2000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0},
                mid:    {x: 22*64, y: 22*64, hp: 1000, maxhp: 1000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0},
                top:    {x: 32*64, y: 4*64,  hp: 1000, maxhp: 1000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0},
                bottom: {x: 4*64,  y: 32*64, hp: 1000, maxhp: 1000, attackradius: 256, cooldown: 2000, damage: 20, lastattacktime: 0}
            }
        });
        this.towers = JSON.parse(this.towerscopy);

        this.shop = {
            healing: {item: 'healing', singleuse: true, price: 150}, //мелкая хилка +100 хп
            elixir: {item: 'elixir', singleuse: true, price: 150}, //мелкая манка +100 маны
            superhealing: {item: 'superhealing', singleuse: true, price: 300}, //большая хилка +250 хп
            superelixir: {item: 'superelixir', singleuse: true, price: 300}, //большая манка +250 маны
            teleport: {item: 'teleport', singleuse: false, cooldown: 60000, lastusetime: 0, price: 250}, //телепорт на базу
            boots: {item: 'boots', singleuse: false, cooldown: 45000, lastusetime: 0, price: 300}, //скорость x2 на 5 сек
            fastattack: {item: 'fastattack', singleuse: false, cooldown: 60000, lastusetime: 0, price: 700}, //куладун x0.5 на 5 сек
            ultimate: {item: 'ultimate', singleuse: false, cooldown: 45000, lastusetime: 0, price: 450}, //ульта -200 хп
            depletion: {item: 'depletion', singleuse: false, cooldown: 45000, lastusetime: 0, price: 450}, //сжирание маны -200 маны
            stun: {item: 'stun', singleuse: false, cooldown: 50000, lastusetime: 0, price: 700} //стан на 5 сек
        };

        this.clock = 0;
        this.bluescore = 0;
        this.redscore = 0;

        this.fxevents = [];
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

        this.towers = JSON.parse(this.towerscopy);
        
        for(let id in this.players) {
            const player = this.players[id];
            const config = player.classesconfig[player.classid];
            player.isdead = false;
            if(player.team == 'blue') {
                player.x = 64*64 - config.x;
                player.y = 64*64 - config.y;
            } else {
                player.x = config.x;
                player.y = config.y;
            }
            player.hp = config.hp;
            player.mana = config.mana;
            player.speed = config.speed;

            for(let item in player.inventory) {
                if(player.inventory[item] != null) {
                    if(player.inventory[item].singleuse == false) {
                        player.inventory[item].lastusetime = 0;
                    }
                }
            }
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

    playerbuy(ws, data) {
        if(this.state == 'BUYPHASE') {
            let player = this.players[ws.playerid];
            if(this.shop[data.item]) {
                if(player.gold >= this.shop[data.item].price) {
                    for(let slot in player.inventory) {
                        if(player.inventory[slot] == null) {
                            player.gold -= this.shop[data.item].price;
                            player.inventory[slot] = { ...this.shop[data.item] };

                            break;
                        }
                    }
                }
            }
        }
    }

    useitem(ws, data) {
        if(this.state != 'ROUND') return;

        let player = this.players[ws.playerid];

        if(player.isdead == true) return;

        let item = player.inventory[data.key];
        if(item != null) { //есть в инвентаре
            const thistime = Date.now();

            if(item.singleuse == true) { //одноразовый
                if(item.item == 'healing') {
                    player.hp = Math.min(player.classesconfig[player.classid].hp, player.hp + 100);
                }
                if(item.item == 'elixir') {
                    player.mana = Math.min(player.classesconfig[player.classid].mana, player.mana + 100);
                }
                if(item.item == 'superhealing') {
                    player.hp = Math.min(player.classesconfig[player.classid].hp, player.hp + 250);
                }
                if(item.item == 'superelixir') {
                    player.mana = Math.min(player.classesconfig[player.classid].mana, player.mana + 250);
                }

                player.inventory[data.key] = null;
            } else { //многоразовый
                const thistime = Date.now();

                if(thistime - item.lastusetime < item.cooldown) { //кулдаун ещё не прошёл
                    return;
                }

                if(item.item == 'teleport') {
                    const config = player.classesconfig[player.classid];
                    let outstep = 8;

                    if(player.team == 'blue') {
                        player.x = 64*64 - config.x;
                        player.y = 64*64 - config.y;
                        player.targetx = null;
                        player.targety = null;
                        player.direction = 'up';
                        player.animation = 'idle';
                        while(player.checkmapcollision(this.location) || player.checkplayercollision(this.players) || player.checktowercollision(this.towers)) {
                            player.x = 64*64 - config.x - outstep;
                            player.y = 64*64 - config.y - outstep;
                            outstep++;
                        }
                    } else {
                        player.x = config.x;
                        player.y = config.y;
                        while(player.checkmapcollision(this.location) || player.checkplayercollision(this.players) || player.checktowercollision(this.towers)) {
                            player.x = config.x + outstep;
                            player.y = config.y + outstep;
                            outstep++;
                        }
                    }

                    item.lastusetime = thistime;
                }

                if(item.item == 'ultimate') {
                    player.ultimate = 200; //применится и сбросится при следующем ударе во врага
                    player.itemused = data.key;
                }

                if(item.item == 'depletion') {
                    player.depletion = 200; //применится и сбросится при следующем ударе во врага
                    player.itemused = data.key;
                }

                if(item.item == 'boots') {
                    player.boots = thistime + 5000; //для этого игрока (в обработке скорости передвижения)
                    item.lastusetime = thistime;
                }

                if(item.item == 'fastattack') {
                    player.fastattack = thistime + 5000; //для этого игрока (в обработке кулдауна удара)
                    item.lastusetime = thistime;
                }

                if(item.item == 'stun') {
                    player.tostun = true; //применится и начнётся при следующем ударе во врага
                    player.itemused = data.key;
                }
            }
        }
    }

    gameclick(ws, data) {
        if(this.state != 'ROUND') return;

        let player = this.players[ws.playerid];
        if(player && !player.isdead) {
            if(player.stunned && Date.now() < player.stunned) {
                return;
            }
            
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
            this.checktwcollision(data, player);
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

    checktwcollision(data, player) {
        let antiteam = '';
        if(player.team == 'blue') { antiteam = 'red'; }
        if(player.team == 'red') { antiteam = 'blue'; }

        for(let tower in this.towers[antiteam]) {
            if(this.towers[antiteam][tower].hp == 0) continue;

            let thisplayer = {x: player.x, y: player.y, radius: player.classesconfig[player.classid].attackradius}; //позиция игрока И ЕГО РАДИУС АТАКИ
            let thistower = {x: this.towers[antiteam][tower].x, y: this.towers[antiteam][tower].y, radius: 128};

            if(player.circlecollision(thisplayer, thistower)) { //если эта башня находится в нашем радиусе атаки
                if(player.pointcircle({x: data.targetx, y: data.targety}, thistower)) { //если мы кликнули на неё
                    player.stop();
                    this.towerattack(player.id, antiteam, tower);
                    return;
                }
            }
        }
    }

    towerattack(playerid, antiteam, tower) {
        let player = this.players[playerid];
        let thistower = this.towers[antiteam][tower];
        const config = player.classesconfig[player.classid];
        const thistime = Date.now();

        let currentcooldown = config.cooldown;
        if(player.fastattack && thistime < player.fastattack) {
            currentcooldown = config.cooldown * 0.5;
        }

        if(thistime - player.lastattacktime < currentcooldown) {
            player.lastattacktime = thistime; //антиспам
            return;
        }

        if(player.mana < config.manacost) { //не хватает маны
            return;
        }

        if(tower == 'throne') {
            let deadtowers = 0;
            for(let twr in this.towers[antiteam]) {
                if(this.towers[antiteam][twr].hp == 0 && twr != 'throne') {
                    deadtowers++;
                }
            }
            if(deadtowers == 0) {
                return;
            }
        }

        player.animation = 'attack';

        player.lastattacktime = thistime;

        player.mana = Math.max(0, player.mana - config.manacost);
        thistower.hp = Math.max(0, thistower.hp - config.damage);
        if(thistower.hp == 0) {
            player.gold += 500;
            this.fxevents.push({type: 'tower', sound: true});
            return;
        }

        this.fxevents.push({type: 'attack' + (Math.floor(Math.random() * 3) + 1), sound: true});
    }

    playerattack(playerid, enemyid) {
        let player = this.players[playerid];
        let enemy = this.players[enemyid];
        const config = player.classesconfig[player.classid];
        const thistime = Date.now();

        let currentcooldown = config.cooldown;
        if(player.fastattack && thistime < player.fastattack) {
            currentcooldown = config.cooldown * 0.5;
        }

        if(thistime - player.lastattacktime < currentcooldown) {
            player.lastattacktime = thistime; //антиспам
            return;
        }

        if(player.mana < config.manacost) { //не хватает маны
            return;
        }

        player.animation = 'attack';

        player.lastattacktime = thistime;

        player.mana = Math.max(0, player.mana - config.manacost);
        enemy.hp = Math.max(0, enemy.hp - config.damage - player.ultimate);

        if(enemy.hp == 0) { //единственный способ умереть
            player.gold += 500;
            enemy.isdead = true;
            enemy.inventory = {
                Q: null,
                W: null,
                E: null,
                R: null,
                T: null
            };
        }

        if(player.ultimate > 0) {
            player.ultimate = 0;
            player.inventory[player.itemused].lastusetime = Date.now();
            this.fxevents.push({type: 'ultimate', sound: true});
            return;
        }

        if(player.depletion > 0) {
            enemy.mana = Math.max(0, enemy.mana - player.depletion);
            player.depletion = 0;
            player.inventory[player.itemused].lastusetime = Date.now();
            this.fxevents.push({type: 'depletion', sound: true});
            return;
        }

        if(player.tostun == true) {
            enemy.stunned = Date.now() + 5000;
            player.tostun = false;
            player.inventory[player.itemused].lastusetime = Date.now();
            this.fxevents.push({type: 'stun', sound: true});
            return;
        }

        this.fxevents.push({type: 'attack' + (Math.floor(Math.random() * 3) + 1), sound: true});
    }

    towerautoattack() {
        const thistime = Date.now();

        for (let towerteam in this.towers) {
            for (let towername in this.towers[towerteam]) {
                let tower = this.towers[towerteam][towername];
                
                if(tower.hp <= 0) continue;

                if(thistime - (tower.lastattacktime) < tower.cooldown) continue;

                for(let pid in this.players) {
                    let p = this.players[pid];

                    if(!p.isdead && p.team !== towerteam) {
                        let thistower = {x: tower.x, y: tower.y, radius: tower.attackradius};
                        let thisplayer = {x: p.x, y: p.y, radius: p.PLAYERRADIUS};
                        if(p.circlecollision(thistower, thisplayer)) {
                            if(p.hp > 10) {
                                this.players[pid].hp = Math.max(10, this.players[pid].hp - tower.damage);
                                tower.lastattacktime = thistime;

                                break;
                            }
                        }
                    }
                }
            }
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

        data.location = this.location;

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

    teamgold(team) {
        for(let id in this.players) {
            if(this.players[id].team == team) {
                this.players[id].gold += 500;
            }
        }
    }

    //roomloop
    roomupdate(dt) {
        this.ticksec++;

        this.towerautoattack();

        let data = {};
        data.players = {};
        data.towers = this.towers;

        for(let id in this.players) {
            this.players[id].playerupdate(dt, this.location, this.players, this.towers); //update only every logic dynamic prorps

            const thistime = Date.now();
            let currentcooldown = 0;

            let activecooldown = this.players[id].classesconfig[this.players[id].classid].cooldown;

            if(this.players[id].fastattack && thistime < this.players[id].fastattack) {
                activecooldown = activecooldown * 0.5;
            }

            const timePassed = thistime - this.players[id].lastattacktime;

            if(timePassed < activecooldown) {
                currentcooldown = timePassed; 
            } else {
                currentcooldown = activecooldown;
                if(this.players[id].animation == 'attack') {
                    this.players[id].animation = 'idle';
                }
            }

            if(this.ticksec > 29 && this.state == 'ROUND' && this.players[id].isdead == false) {
                this.players[id].hp = Math.min(this.players[id].classesconfig[this.players[id].classid].hp, this.players[id].hp + 2);
                this.players[id].mana = Math.min(this.players[id].classesconfig[this.players[id].classid].mana, this.players[id].mana + 4);
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
                config: { 
                    ...this.players[id].classesconfig[this.players[id].classid],
                    cooldown: activecooldown 
                },
                currentcooldown: currentcooldown
            }
        }

        data.clock = this.clock;
        data.bluescore = this.bluescore;
        data.redscore = this.redscore;

        data.fxevents = this.fxevents;

        data.thistime = Date.now();

        this.sendtoroom('UPDATEROOM', data);

        this.fxevents = [];

        if(this.ticksec > 29) { //секунда
            this.ticksec = 0;
        }

        if(this.state == 'ROUND') {
            //проверка на победу в раунде
            if(this.towers.blue.throne.hp == 0) { //победа красных в раунде (по трону)
                this.redscore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'red'});
                this.teamgold('blue');
                return;
            }

            if(this.towers.red.throne.hp == 0) { //победа синих в раунде (по трону)
                this.bluescore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'blue'});
                this.teamgold('red');
                return;
            }

            //если команда померла сразу делаем победу чтобы не бить трон
            let bluecount = Object.values(this.players).filter(p => p.team === 'blue' && p.isdead == false).length;
            let redcount = Object.values(this.players).filter(p => p.team === 'red'  && p.isdead == false).length;

            if(bluecount == 0) {
                this.redscore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'red'});
                this.teamgold('blue');
                return;
            }

            if(redcount == 0) {
                this.bluescore++;
                this.startbuyphase();
                this.sendtoroom('ROUNDWIN', {team: 'blue'});
                this.teamgold('red');
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