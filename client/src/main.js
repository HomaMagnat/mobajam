import { Renderer } from './renderer.js';

export class Main {
    constructor() {
        this.routes = {
            ROOMLIST: (data) => this.roomlist(data), //GUEST
            UPDATELOBBYSTATE: (data) => this.updatelobbystate(data),
            CHATMESSAGE: (data) => this.chatmessage(data),
            MATCHSTART: (data) => this.matchstart(data),
            GETMYID: (data) => this.getmyid(data),
            UPDATEROOM: (data) => this.updateroom(data)
        };

        this.location = [{type: 'tile', texture: 'tile1', x: 0, y: 0}, {type: 'tile', texture: 'tile1', x: 1, y: 0}, {type: 'tile', texture: 'tile1', x: 1, y: 1}];
        this.players = {};
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
        };

        window.addEventListener('click', (e) => this.globalclick(e));

        this.ui.inputmessage.addEventListener('keydown', this.checkenter);

        this.renderer = new Renderer(this);

        this.renderer.canvas.addEventListener('mousedown', (e) => this.gameclick(e));

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
    }

    //game
    mainloop = () => { //game cycle
        this.renderer.renderframe();
        requestAnimationFrame(this.mainloop);
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
        requestAnimationFrame(this.mainloop);
    }

    getmyid(data) {
        this.myid = data.myid;
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
    }
}

let main = new Main();