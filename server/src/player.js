class Player {
    constructor(playerid, ws, nickname) {
        this.id = playerid;
        this.ws = ws;
        this.nickname = nickname;

        this.team = null;
        this.classid = null;
        this.isready = false;

        this.x = 0; this.y = 0; //setup in room
        this.targetx = null; this.targety = null;

        this.hp = 100; //setup by class
        this.mana = 100; //setup by class
        this.gold = 800;
        this.speed = 500; //setup by class
        this.isdead = false;

        this.classesconfig = {
            1: {hp: 300, mana: 300, speed: 500, radius: 128, cooldown: 100, manacost: 20, damage: 30, x: 0, y: 0},
            2: {hp: 300, mana: 300, speed: 300, radius: 128, cooldown: 100, manacost: 20, damage: 30, x: 0, y: 0},
            3: {hp: 300, mana: 300, speed: 300, radius: 128, cooldown: 100, manacost: 20, damage: 30, x: 0, y: 0},
            4: {hp: 300, mana: 300, speed: 300, radius: 128, cooldown: 100, manacost: 20, damage: 30, x: 0, y: 0},
            5: {hp: 300, mana: 300, speed: 300, radius: 128, cooldown: 100, manacost: 20, damage: 30, x: 0, y: 0}
        };
        this.defualtraduis = 64;

        this.playercollide = null;
        this.lastattacktime = 0;

        this.GRIDSTEP = 64;
        this.PLAYERWIDTH = 64;
        this.PLAYERHEIGHT = 64;
    }

    move(dt, location, players) {
        if(this.targetx === null || this.targety === null) return;

        let dx = this.targetx - this.x;
        let dy = this.targety - this.y;

        let distance = Math.hypot(dx, dy);

        if(distance < 10) {
            //this.x = this.targetx;
            //this.y = this.targety;
            this.stop();
            return;
        }

        let angle = Math.atan2(dy, dx);

        let newx = this.speed * dt * Math.cos(angle);
        let newy = this.speed * dt * Math.sin(angle);

        this.x += newx;
        if(this.checkmapcollision(location) || this.checkplayercollision(players).result) {
            this.x -= newx;
            this.stop();
        }

        this.y += newy;
        if(this.checkmapcollision(location) || this.checkplayercollision(players).result) {
            this.y -= newy;
            this.stop();
        }
    }

    stop() {
        this.targetx = null;
        this.targety = null;
    }

    checkmapcollision(location) {
        const hitboxes = location.filter(item => item.hitbox === true || item.type === 'hitbox');

        return hitboxes.some(hitbox => {
            let x = hitbox.x;
            let y = hitbox.y;
            let w = hitbox.w || 1;
            let h = hitbox.h || 1;
        
            if (hitbox.type !== 'hitbox') {
                x = x * this.GRIDSTEP;
                y = y * this.GRIDSTEP;
                w = w * this.GRIDSTEP;
                h = h * this.GRIDSTEP;
            }

            return this.aabb(
                { x: this.x, y: this.y, w: this.PLAYERWIDTH, h: this.PLAYERHEIGHT },
                { x, y, w, h }
            );
        });
    }

    checkplayercollision(players) {
        //физическое столкновение моделек
    }

    aabb(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    circlecollision(c1, c2) {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const rSum = c1.radius + c2.radius;

        return (dx * dx + dy * dy) < (rSum * rSum);
    }

    playerupdate(dt, location, players) {
        this.move(dt, location, players);
    }

    gameclick(data) {
        this.targetx = data.targetx;
        this.targety = data.targety;
    }

    playerhit(playerid) {

    }
}

module.exports = Player;