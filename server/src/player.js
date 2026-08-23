class Player {
    constructor(playerid, ws, nickname) {
        this.id = playerid;
        this.ws = ws;
        this.nickname = nickname;
        
        this.team = null;
        this.class = null;
        this.isready = null;

        this.x = 0; this.y = 0;
        this.hp = 100;
        this.mana = 100;
        this.gold = 800;
        this.isdead = false;
        this.speed = 250;
    }
}

module.exports = Player;