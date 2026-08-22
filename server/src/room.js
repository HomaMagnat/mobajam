const Player = require('./player'); 

class Room {
    constructor(roomid) {
        this.id = roomid;
        this.state = 'LOBBY';
        this.players = {};
    }
}

module.exports = Room;