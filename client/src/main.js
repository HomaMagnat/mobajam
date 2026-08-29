import { Renderer } from './renderer.js';

export class Main {
    constructor() {
        this.routes = {
            ROOMLIST: (data) => this.roomlist(data), //GUEST
            UPDATELOBBYSTATE: (data) => this.updatelobbystate(data),
            CHATMESSAGE: (data) => this.chatmessage(data),
            MATCHSTART: (data) => this.matchstart(data),
            GETMYID: (data) => this.getmyid(data),
            UPDATEROOM: (data) => this.updateroom(data),
            DELETEPLAYER: (data) => this.deleteplayer(data),
            BUYPHASE: (data) => this.buyphase(),
            ROUND: (data) => this.round(),
            ROUNDWIN: (data) => this.roundwin(data),
            GAMEWIN: (data) => this.gamewin(data)
        };

        this.location = [];
        this.players = {};
        this.towers = {};
        this.myid = '';
        this.roomstate = '';

        this.gamesounds = {
            attack1: new Audio('https://mobajam.hmxstudio.ru/src/sound/attack.mp3'),
            attack2: new Audio('https://mobajam.hmxstudio.ru/src/sound/attack2.mp3'),
            attack3: new Audio('https://mobajam.hmxstudio.ru/src/sound/attack3.mp3'),
            boots: new Audio('https://mobajam.hmxstudio.ru/src/sound/boots.mp3'),
            depletion: new Audio('https://mobajam.hmxstudio.ru/src/sound/depletion.mp3'),
            lose: new Audio('https://mobajam.hmxstudio.ru/src/sound/lose.mp3'),
            music: new Audio('https://mobajam.hmxstudio.ru/src/sound/music.mp3'),
            potion: new Audio('https://mobajam.hmxstudio.ru/src/sound/potion.mp3'),
            stun: new Audio('https://mobajam.hmxstudio.ru/src/sound/stun.mp3'),
            teleport: new Audio('https://mobajam.hmxstudio.ru/src/sound/teleport.mp3'),
            tower: new Audio('https://mobajam.hmxstudio.ru/src/sound/tower.mp3'),
            ultimate: new Audio('https://mobajam.hmxstudio.ru/src/sound/ultimate.mp3'),
            win: new Audio('https://mobajam.hmxstudio.ru/src/sound/win.mp3'),
            kill1: new Audio('https://mobajam.hmxstudio.ru/src/sound/kill.mp3'),
            kill2: new Audio('https://mobajam.hmxstudio.ru/src/sound/kill2.mp3'),
            kill3: new Audio('https://mobajam.hmxstudio.ru/src/sound/kill3.mp3'),
            buy: new Audio('https://mobajam.hmxstudio.ru/src/sound/buy.mp3'),
            menu: new Audio('https://mobajam.hmxstudio.ru/src/sound/menu.mp3'),
        };

        this.gamesounds.menu.loop = true;
        this.gamesounds.menu.volume = 0.1;
        this.gamesounds.music.loop = true;
        this.gamesounds.music.volume = 0.1;

        this.ui = {
            nickname: document.querySelector('.nickname'),
            rooms: document.querySelector('.rooms'),
            lobbytime: document.querySelector('.lobbytime'),
            thisroomname: document.querySelector('.thisroomname'),
            thisroomplayers: document.querySelector('.thisroomplayers'),
            playervotes: document.querySelector('.playervotes'),
            chat: document.querySelector('.chat'),
            inputmessage: document.querySelector('.inputmessage'),
            mainmenu: document.querySelector('.mainmenu'),
            lobby: document.querySelector('.lobby'),
            game: document.querySelector('.game'),
            dwwrapper: document.querySelector('.dwwrapper'),
            alonewindow: document.querySelector('.alonewindow'),
            clock: document.querySelector('.clock'),
            bluescore: document.querySelector('.bluescore'),
            redscore: document.querySelector('.redscore'),
            myhp: document.querySelector('.myhp'),
            mymana: document.querySelector('.mymana'),
            myhpvalue: document.querySelector('.myhpvalue'),
            mymanavalue: document.querySelector('.mymanavalue'),
            mycooldown: document.querySelector('.mycooldown'),
            mygold: document.querySelector('.mygold'),
            tophint: document.querySelector('.tophint'),
            shop: document.querySelector('.shop'),
            youdied: document.querySelector('.youdied'),
            blueround: document.querySelector('.blueround'),
            redround: document.querySelector('.redround'),
            bluegame: document.querySelector('.bluegame'),
            redgame: document.querySelector('.redgame'),
            Qitem: document.getElementById('qitem'),
            Witem: document.getElementById('witem'),
            Eitem: document.getElementById('eitem'),
            Ritem: document.getElementById('ritem'),
            Titem: document.getElementById('titem'),
            tooltip: document.getElementById('tooltip'),
            tooltiptitle: document.querySelector('.tooltip-title'),
            tooltipdesc: document.querySelector('.tooltip-desc'),
            buffbox: document.querySelector('.buffbox'),
        };

        window.addEventListener('click', (e) => this.globalclick(e));

        this.ui.inputmessage.addEventListener('keydown', this.checkenter);
        document.addEventListener('keydown', this.keydown);
        this.ui.shop.addEventListener('mouseover', this.shopmouseover);
        this.ui.shop.addEventListener('mousemove', this.shopmousemove);
        this.ui.shop.addEventListener('mouseout', this.shopmouseout);

        this.renderer = new Renderer(this);

        this.renderer.canvas.addEventListener('mousedown', (e) => this.gameclick(e));

        this.requestid = null;

        this.connect();
    }

    playsound(id) {
        let sound = this.gamesounds[id];
        if(sound) {
            sound.currentTime = 0;
            sound.play().catch(e => {});
        }
    }

    //global ui
    globalclick(e) {
        const target = e.target.closest('[data-action]');
        if(!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;

        if(typeof this[action] === 'function') {
            this[action](id, e);
        } else {
            console.warn(`Method ${action} is not implemented in UI class`);
        }
    }

    nicknamewarn() {
        const input = this.ui.nickname;
        input.classList.add('input-error');
        setTimeout(() => {
            input.classList.remove('input-error');
        }, 100); 
    }

    switchscreen(screen) {
        this.ui.mainmenu.style.display = 'none';
        this.ui.lobby.style.display = 'none';
        this.ui.game.style.display = 'none';
        this.ui[screen].style.display = 'block';
    }

    checkenter = (event) => {
        if(event.key === 'Enter') {
            this.sendmessage();
        }
    }

    shopmouseover = (e) => {
        const product = e.target.closest('.product');
        if(!product) return;

        const title = product.getAttribute('data-title');
        const desc = product.getAttribute('data-description');

        if(title && desc) {
            this.ui.tooltiptitle.textContent = title;
            this.ui.tooltipdesc.textContent = desc;
            this.ui.tooltip.classList.add('active');
        }
    }

    shopmousemove = (e) => {
        this.ui.tooltip.style.left = `${e.clientX - 5}px`;
        this.ui.tooltip.style.top = `${e.clientY - 5}px`;
    }

    shopmouseout = (e) => {
        const product = e.target.closest('.product');
        if(!product) return;

        this.ui.tooltip.classList.remove('active');
    }

    keydown = (e) => {
        if(document.activeElement === this.ui.inputmessage) return;
        if(e.code == 'KeyQ') {
            this.useitem('Q');
        }
        if(e.code == 'KeyW') {
            this.useitem('W');
        }
        if(e.code == 'KeyE') {
            this.useitem('E');
        }
        if(e.code == 'KeyR') {
            this.useitem('R');
        }
        if(e.code == 'KeyT') {
            this.useitem('T');
        }
    }

    showdisconnect() {
        this.ui.dwwrapper.style.display = 'block';
        this.ui.rooms.innerHTML = '';
        this.ui.chat.innerHTML = '';
        if(this.requestid) {
            cancelAnimationFrame(this.requestid);
            this.requestid = null;
        }
        this.players = {};
        this.towers = {};

        const chatbox = document.querySelector('.chatbox');
        const cbwrapper = document.querySelector('.cbwrapper');
        cbwrapper.appendChild(chatbox); 

    }

    //game
    mainloop = () => { //game cycle
        this.renderer.renderframe();
        this.requestid = requestAnimationFrame(this.mainloop);
    }

    gameclick(e) {
        if(e.target !== this.ui.inputmessage) {
            this.ui.inputmessage.blur();
        }
        e.preventDefault();

        const scale = this.renderer.scalefactor;

        const virtualclickX = e.offsetX / scale;
        const virtualclickY = e.offsetY / scale;

        this.myclick = {
            virtualclickX, virtualclickY
        };

        const flattarget = this.renderer.isotoflat(virtualclickX, virtualclickY);

        this.serversend('GAMECLICK', {
            targetx: Math.floor(flattarget.x),
            targety: Math.floor(flattarget.y)
        });
    }

    reconnect() {
        this.connect();
        this.ui.dwwrapper.style.display = 'none';
    }

    //ws
    connect() {
        this.ws = new WebSocket('wss://mobajam.hmxstudio.ru:9082');
        //this.ws.onopen = () => this.onopen();
        this.ws.onmessage = (event) => this.ondata(event.data);

        this.ws.onclose = (event) => {
            this.onclose();
        };

        this.ws.onerror = (error) => {
            console.error('Connection Error: ', error);
            this.ws.close();
        };
    }

    ondata(rawdata) { //ПРИНЯТЬ ОТВЕТ (от сервера)
        let jsondata = JSON.parse(rawdata);
        let type = jsondata.type;
        let data = jsondata.data;

        if(this.routes[type]) {
            this.routes[type](data);
        }
    }

    serversend(type, data) { //ОТПРАВИТЬ ЗАПРОС (на сервер)
        if(this.ws.readyState === WebSocket.OPEN) {
            let jsondata = {type: type, data: data};
            let rawdata = JSON.stringify(jsondata);
            this.ws.send(rawdata);
        }
    }

    onclose() {
        this.switchscreen('mainmenu');
        this.showdisconnect();

        this.gamesounds.music.pause();

        this.gamesounds.menu.currentTime = 0;
        this.gamesounds.menu.play();
    }

    exitlobby() {
        this.ws.close();
    }

    //from server methods (get)
    //GUEST
    roomlist(data) {
        this.ui.rooms.innerHTML = '';
        for(const [roomid, room] of Object.entries(data)) {
            this.ui.rooms.insertAdjacentHTML('beforeend', `<div class="room"><div class="roomname"></div><div class="roomplayers">${room.playersnumber}/10</div><div class="login" data-action="joinroom" data-id="${roomid}">ВОЙТИ</div></div>`);
            let roomname = this.ui.rooms.lastElementChild.querySelector('.roomname');
            roomname.textContent = 'ЛОББИ ' + room.owner;
        }
        console.log(data);
    }

    //PLAYER (CLIENT DATA ROUTER)
    updatelobbystate(data) {
        this.switchscreen('lobby');

        this.ui.thisroomname.textContent = data.owner;
        this.ui.thisroomplayers.textContent = data.playersnumber + '/10';
        this.ui.playervotes.textContent = data.playersready + '/' + data.playersnumber;

        document.querySelectorAll('.playerslot').forEach(el => {
            el.style.opacity = '0.3';
        });
        document.querySelectorAll('.playernick').forEach(el => {
            el.textContent = 'СВОБОДНО';
        });
        document.querySelectorAll('.readymark').forEach(el => {
            el.style.display = 'none';
        });

        for(const [playerid, player] of Object.entries(data.playerslist)) {
            let playerslot = document.getElementById(player.team + player.classid);
            playerslot.style.opacity = '1';
            playerslot.querySelector('.playernick').textContent = player.nickname;
            if(player.isready == true) {
                playerslot.querySelector('.readymark').style.display = 'block';
            }

            this.players[playerid] = player; //static sync
        }

        if(data.playersnumber < 2) {
            this.ui.alonewindow.style.opacity = '1';
            setTimeout(() => {
                this.ui.alonewindow.style.opacity = '0';
            }, 3000);
        } else {
            this.ui.alonewindow.style.opacity = '0';
        }

        this.location = data.location;
    }

    chatmessage(data) {
        let msgelement = document.createElement('div');
        msgelement.textContent = data.msg;
        msgelement.classList.add('message');
        
        this.ui.chat.appendChild(msgelement);
        this.ui.chat.scrollTop = this.ui.chat.scrollHeight;
    }

    matchstart(data) {
        this.switchscreen('game');

        const chatbox = document.querySelector('.chatbox');
        const gamechat = document.querySelector('.gamechat');
        gamechat.appendChild(chatbox); 

        this.requestid = requestAnimationFrame(this.mainloop);
        
        this.gamesounds.menu.pause();

        this.gamesounds.music.currentTime = 0;
        this.gamesounds.music.play();
    }

    getmyid(data) {
        this.myid = data.myid;
    }

    deleteplayer(data) {
        delete this.players[data.id];
    }

    buyphase() {
        this.ui.tophint.textContent = 'ВРЕМЯ ЗАКУПКИ';
        this.ui.shop.style.display = 'block';
        this.ui.youdied.style.display = 'none';
        this.roomstate = 'BUYPHASE';
    }

    round() {
        this.ui.tophint.textContent = 'РАУНД';
        this.ui.shop.style.display = 'none';
        this.roomstate = 'ROUND';
    }

    roundwin(data) {
        if(data.team == 'blue') {
            this.ui.blueround.style.display = 'block';
            setTimeout(() => {
                this.ui.blueround.style.display = 'none';
            }, 4000);
        }
        if(data.team == 'red') {
            this.ui.redround.style.display = 'block';
            setTimeout(() => {
                this.ui.redround.style.display = 'none';
            }, 4000);
        }

        if(data.team == this.players[this.myid].team) {
            this.playsound('win');
        } else {
            this.playsound('lose');
        }
    }

    gamewin(data) {
        if(data.team == 'blue') {
            this.ui.bluegame.style.display = 'block';
        }
        if(data.team == 'red') {
            this.ui.redgame.style.display = 'block';
        }
        this.ws.close();
    }

    hidewin() {
        this.ui.bluegame.style.display = 'none';
        this.ui.redgame.style.display = 'none'; //ай ай ай лошара в билд пошло
    }

    //to server methods (send)
    //GUEST
    joinroom(roomid) {
        if(this.ui.nickname.value.trim() === '') {
            this.nicknamewarn();
            return;
        }
        let type = 'JOINROOM';
        let data = {nickname: this.ui.nickname.value.trim(), roomid: roomid};
        this.serversend(type, data);

        this.gamesounds.music.pause();

        this.gamesounds.menu.currentTime = 0;
        this.gamesounds.menu.play();
    }

    createroom() {
        if(this.ui.nickname.value.trim() === '') {
            this.nicknamewarn();
            return;
        }
        let type = 'CREATEROOM';
        let data = {nickname: this.ui.nickname.value.trim()};
        this.serversend(type, data);

        this.gamesounds.music.pause();

        this.gamesounds.menu.currentTime = 0;
        this.gamesounds.menu.play();
    }

    matchmaking() {
        if(this.ui.nickname.value.trim() === '') {
            this.nicknamewarn();
            return;
        }
        let type = 'MATCHMAKING';
        let data = {nickname: this.ui.nickname.value.trim()};
        this.serversend(type, data);

        this.gamesounds.music.pause();

        this.gamesounds.menu.currentTime = 0;
        this.gamesounds.menu.play();
    }

    //PLAYER (SERVER DATA ROUTER)
    selectslot(id) {
        let team = '';
        let classid = parseInt(id);
        if(classid > 0 && classid < 6) { //blue
            team = 'blue';
        }
        if(classid > 5 && classid < 11) { //red
            team = 'red';
            classid = classid-5;
        }

        this.serversend('SELECTSLOT', {team: team, classid: classid});
    }

    sendmessage() {
        let message = this.ui.inputmessage.value.trim();
        if(message != '') {
            this.serversend('SENDMESSAGE', {message: message});
        }
        this.ui.inputmessage.value = '';
        this.ui.inputmessage.blur();
    }

    ready() {
        this.serversend('READY', {});
    }

    buy(item, e) {
        this.serversend('BUY', {item: item});

        let buybtn = e.target;
        let price = parseInt(buybtn.textContent);

        if(this.players[this.myid].gold >= price) {
            if(Object.values(this.players[this.myid].inventory).includes(null)) {
                this.playsound('buy');
            }
        }
    }

    useitem(key) {
        let thisitem = this.players[this.myid].inventory[key];
        if(thisitem != null && this.roomstate == 'ROUND') {
            if(thisitem.item == 'teleport' && thisitem.lastusetime == 0) {
                this.playsound('teleport');
            }
            if(thisitem.item == 'boots' && thisitem.lastusetime == 0) {
                this.playsound('boots');
            }
            if(thisitem.item == 'healing') {
                this.playsound('potion');
            }
            if(thisitem.item == 'elixir') {
                this.playsound('potion');
            }
            if(thisitem.item == 'superhealing') {
                this.playsound('potion');
            }
            if(thisitem.item == 'superelixir') {
                this.playsound('potion');
            }
        }
        this.serversend('USEITEM', {key: key});
    }

    //update data logic from server 30 tickrate
    updateroom(data) {
        for(const [playerid, serverprops] of Object.entries(data.players)) {
            if(this.players[playerid]) {
                this.players[playerid] = {
                    ...this.players[playerid],
                    ...serverprops
                };
            }
        }

        this.towers = data.towers;

        const minutes = Math.floor(data.clock / 60);
        const seconds = data.clock % 60;

        this.ui.clock.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        this.ui.bluescore.textContent = data.bluescore;
        this.ui.redscore.textContent = data.redscore;

        let myplayer = data.players[this.myid];

        this.ui.myhp.style.width = ((myplayer.hp / myplayer.config.hp) * 100) + '%';
        this.ui.mymana.style.width = ((myplayer.mana / myplayer.config.mana) * 100) + '%';
        this.ui.mycooldown.style.width = ((myplayer.currentcooldown / myplayer.config.cooldown) * 100) + '%';
        this.ui.mygold.textContent = myplayer.gold;

        this.ui.myhpvalue.textContent = myplayer.hp + ' / ' + myplayer.config.hp;
        this.ui.mymanavalue.textContent = myplayer.mana + ' / ' + myplayer.config.mana;

        let inventory = myplayer.inventory;
        for(let item in inventory) {
            if(inventory[item] == null) {
                this.ui[item+'item'].querySelector('.itemicon').style.background = 'none';
                this.ui[item+'item'].querySelector('.itemicon').textContent = '';
                this.ui[item+'item'].querySelector('.itemicon').style.outline = 'none';
                this.ui[item+'item'].querySelector('.itemcooldown').style.width = '0%';
            } else {
                this.ui[item+'item'].querySelector('.itemicon').style.background = 'url(https://mobajam.hmxstudio.ru/src/textures/'+inventory[item].item+'.png)';
                if(inventory[item].singleuse == true) {
                    this.ui[item+'item'].querySelector('.itemicon').textContent = '';
                    this.ui[item+'item'].querySelector('.itemcooldown').style.width = '0%';
                    this.ui[item+'item'].querySelector('.itemicon').style.outline = 'none';
                } else {
                    const timepassed = data.thistime - inventory[item].lastusetime;
                    const itemcooldown = inventory[item].cooldown;

                    if(timepassed < itemcooldown) {
                        const timeleftsec = Math.ceil((itemcooldown - timepassed) / 1000);

                        const percentleft = ((itemcooldown - timepassed) / itemcooldown) * 100;

                        this.ui[item+'item'].querySelector('.itemicon').textContent = timeleftsec;
                        this.ui[item+'item'].querySelector('.itemcooldown').style.width = percentleft + '%';
                    } else {
                        this.ui[item+'item'].querySelector('.itemicon').textContent = '';
                        this.ui[item+'item'].querySelector('.itemcooldown').style.width = '0%';
                        this.players[this.myid].inventory[item].lastusetime = 0;
                    }

                    if(myplayer.itemused != '') {
                        if(item == myplayer.itemused) {
                            this.ui[item+'item'].querySelector('.itemicon').style.outline = '2px solid white';
                        } else {
                            this.ui[item+'item'].querySelector('.itemicon').style.outline = 'none';
                        }
                    } else {
                        this.ui[item+'item'].querySelector('.itemicon').style.outline = 'none';
                    }
                }
            }
        }

        this.ui.buffbox.textContent = '';

        if(data.thistime < myplayer.boots) {
            this.ui.buffbox.textContent = 'Эффект скорости: '+Math.ceil((myplayer.boots - data.thistime) / 1000)+'с';
        }

        if(data.thistime < myplayer.fastattack) {
            this.ui.buffbox.textContent = 'Быстрая атака: '+Math.ceil((myplayer.fastattack - data.thistime) / 1000)+'с';
        }

        if(data.thistime < myplayer.stunned) {
            this.ui.buffbox.textContent = 'Вы оглушены: '+Math.ceil((myplayer.stunned - data.thistime) / 1000)+'с';
        }

        if(data.fxevents.length > 0) {
            data.fxevents.forEach(fx => {
                if(fx.sound == true) {
                    this.playsound(fx.type);
                }
                if(fx.visual == true) {

                }
            });
        }

        if(myplayer.isdead) {
            this.ui.youdied.style.display = 'block';
        }
    }
}

let main = new Main(); //полоски