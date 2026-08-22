const Player = require('./player'); 

class Room {
    constructor() {
        this.state = 'LOBBY';
        this.players = {};
    }
}

module.exports = Room;