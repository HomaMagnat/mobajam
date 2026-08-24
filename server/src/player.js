class Player {
    constructor(playerid, ws, nickname) {
        this.id = playerid; //auto
        this.ws = ws;
        this.nickname = nickname;

        this.team = null; //auto
        this.classid = null;
        this.isready = false;

        this.x = 0; this.y = 0; //setup in room
        this.targetx = null; this.targety = null;

        this.hp = 100; //setup by class
        this.mana = 100; //setup by class
        this.speed = 500; //setup by class
        this.gold = 800;
        this.isdead = false;

        this.inventory = {
            1: {},
            2: {},
            3: {},
            4: {},
            5: {}
        };

        this.classesconfig = { //cooldown - per attack ms
            1: {x: 100, y: 0, hp: 300, mana: 300, speed: 500, attackradius: 128, cooldown: 100, damage: 30, manacost: 20, hpregen: 10,},
            2: {x: 0, y: 100, hp: 300, mana: 300, speed: 300, attackradius: 128, cooldown: 100, damage: 30, manacost: 20},
            3: {x: 0, y: 0, hp: 300, mana: 300, speed: 300, attackradius: 128, cooldown: 100, damage: 30, manacost: 20},
            4: {x: 0, y: 0, hp: 300, mana: 300, speed: 300, attackradius: 128, cooldown: 100, damage: 30, manacost: 20},
            5: {x: 0, y: 0, hp: 300, mana: 300, speed: 300, attackradius: 128, cooldown: 100, damage: 30, manacost: 20}
        };

        this.lastattacktime = 0;

        this.direction = 'up';
        this.animation = 'idle';

        this.GRIDSTEP = 64; //hitboxes sizes
        this.PLAYERWIDTH = 64;
        this.PLAYERHEIGHT = 64;
        this.PLAYERRADIUS = 64;
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
        if(this.checkmapcollision(location) || this.checkplayercollision(players)) {
            this.x -= newx;
            this.stop();
        }

        this.y += newy;
        if(this.checkmapcollision(location) || this.checkplayercollision(players)) {
            this.y -= newy;
            this.stop();
        }
    }

    stop() {
        this.targetx = null;
        this.targety = null;
        this.animation = 'idle';
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
                {x: this.x, y: this.y, w: this.PLAYERWIDTH, h: this.PLAYERHEIGHT},
                {x, y, w, h}
            );
        });
    }

    checkplayercollision(players) {
        //физическое столкновение хитбоксов игроков
        for(let id in players) {
            if(id == this.id) continue;
            if(this.aabb(
                {x: this.x, y: this.y, w: this.PLAYERWIDTH, h: this.PLAYERHEIGHT},
                {x: players[id].x, y: players[id].y, w: this.PLAYERWIDTH, h: this.PLAYERHEIGHT}
            )) {
                return true;
            }
        }

        return false;
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

    pointcircle(point, circle) {
        const dx = point.x - circle.x;
        const dy = point.y - circle.y;

        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }

    playerupdate(dt, location, players) {
        this.move(dt, location, players);
    }
}

module.exports = Player;