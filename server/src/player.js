class Player {
    constructor(playerid, ws, nickname) {
        this.id = playerid;
        this.ws = ws;
        this.nickname = nickname;

        this.team = null;
        this.classid = null;
        this.isready = false;

        this.x = 0; this.y = 0;
        this.targetx = null; this.targety = null;
        this.hp = 100;
        this.mana = 100;
        this.gold = 800;
        this.speed = 500;
        this.isdead = false;
    }

    move(dt) {
        if(this.targetx === null || this.targety === null) return;

        let dx = this.targetx - this.x;
        let dy = this.targety - this.y;

        let distance = Math.hypot(dx, dy);

        if(distance < 10) {
            this.x = this.targetx;
            this.y = this.targety;
            this.targetx = null;
            this.targety = null;
            return;
        }

        let angle = Math.atan2(dy, dx);

        this.x += this.speed * dt * Math.cos(angle);
        this.y += this.speed * dt * Math.sin(angle);
    }

    playerupdate(dt) {
        this.move(dt);
    }
}

module.exports = Player;