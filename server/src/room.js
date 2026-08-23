const Player = require('./player'); 

class Room {
    constructor(roomid, owner) {
        this.id = roomid;
        this.owner = owner;
        this.state = 'LOBBY';
        this.players = {};
    }

    addplayer(ws, nickname) {
        let playerid = ws.playerid;
        this.players[playerid] = new Player(playerid, ws, nickname);
    }
}

module.exports = Room;