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
            item1: document.getElementById('item1'),
            item2: document.getElementById('item2'),
            item3: document.getElementById('item3'),
            item4: document.getElementById('item4'),
            item5: document.getElementById('item5')
        };

        window.addEventListener('click', (e) => this.globalclick(e));

        this.ui.inputmessage.addEventListener('keydown', this.checkenter);

        this.renderer = new Renderer(this);

        this.renderer.canvas.addEventListener('mousedown', (e) => this.gameclick(e));

        this.requestid = null;

        this.connect();
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
        if (event.key === 'Enter') {
            this.sendmessage();
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
        e.preventDefault();

        const scale = this.renderer.scalefactor;

        const virtualclickX = e.offsetX / scale;
        const virtualclickY = e.offsetY / scale;

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
        this.ws = new WebSocket('wss://mobajam.hmxstudio.ru:9080');
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
    }

    getmyid(data) {
        this.myid = data.myid;
    }

    deleteplayer(data) {
        delete this.players[data.id];
    }

    buyphase() {
        this.ui.tophint.textContent = 'ВРЕМЯ ЗАКУПКИ';
        //this.ui.shop.style.display = 'block';
        this.ui.youdied.style.display = 'none';
    }

    round() {
        this.ui.tophint.textContent = 'РАУНД';
        this.ui.shop.style.display = 'none';
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
        this.ui.bluegame.style.display = 'none';
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
    }

    createroom() {
        if(this.ui.nickname.value.trim() === '') {
            this.nicknamewarn();
            return;
        }
        let type = 'CREATEROOM';
        let data = {nickname: this.ui.nickname.value.trim()};
        this.serversend(type, data);
    }

    matchmaking() {
        if(this.ui.nickname.value.trim() === '') {
            this.nicknamewarn();
            return;
        }
        let type = 'MATCHMAKING';
        let data = {nickname: this.ui.nickname.value.trim()};
        this.serversend(type, data);
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
    }

    ready() {
        this.serversend('READY', {});
    }

    buy(item) {
        this.serversend('BUY', {item: parseInt(item)});
    }

    //update data logic from server 30 tickrate
    updateroom(data) {
        for(const [playerid, serverprops] of Object.entries(data.players)) {
            if (this.players[playerid]) {
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

        this.ui.myhp.style.width = ((data.players[this.myid].hp / data.players[this.myid].config.hp) * 100) + '%';
        this.ui.mymana.style.width = ((data.players[this.myid].mana / data.players[this.myid].config.mana) * 100) + '%';
        this.ui.mycooldown.style.width = ((data.players[this.myid].currentcooldown / data.players[this.myid].config.cooldown) * 100) + '%';
        this.ui.mygold.textContent = data.players[this.myid].gold;

        this.ui.myhpvalue.textContent = data.players[this.myid].hp + ' / ' + data.players[this.myid].config.hp;
        this.ui.mymanavalue.textContent = data.players[this.myid].mana + ' / ' + data.players[this.myid].config.mana;

        /*for(let item in data.players[this.myid].inventory) {
            if(data.players[this.myid].inventory[item] == true) {
                this.ui['item'+item].style.opacity = 1;
            } else {
                this.ui['item'+item].style.opacity = 0;
            }
        }*/

        if(data.players[this.myid].isdead) {
            this.ui.youdied.style.display = 'block';
        }
    }
}

let main = new Main(); //полоски