export class Renderer {
    constructor(main) {
        this.main = main;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.TILE_WIDTH = 128;
        this.TILE_HEIGHT = 64;
        this.VIRTUAL_WIDTH = 1920;
        this.GRID_STEP = 64;

        this.animationtimer = 0;
        this.ANIMATION_SPEED = 0.15;
        this.TOTAL_FRAMES = 8;
        this.FRAME_SIZE = 256;

        this.textures = { //sprites, images, assets
            'tile1': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile1.png'),
            'tile2': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile2.png'),
            'tile3': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile3.png'),
            'tile4': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile4.png'),
            'tile5': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile5.png'),
            'tile6': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile6.png'),
            'tile7': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile7.png'),
            'tile8': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile8.png'),
            'tile9': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile9.png'),
            'tile10': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile10.png'),
            'tile11': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile11.png'),
            'tile12': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile12.png'),
            'tile13': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile13.png'),
            'tile14': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile14.png'),
            'tile15': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile15.png'),
            'tile16': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile16.png'),
            'tile17': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile17.png'),
            'tile18': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile18.png'),
            'tile19': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile19.png'),
            'tile20': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tile20.png'),
            'tower_blue': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tower_blue.png'),
            'tower_red': this.loadimg('https://mobajam.hmxstudio.ru/src/textures/tower_red.png')
        };

        this.preloadplayersprites();

        this.camera = { x: 0, y: 0 }; 

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    loadimg(src) {
        let img = new Image();
        img.src = src;
        return img;
    }

    preloadplayersprites() {
        const classes = [1];
        const directions = ['up', 'down', 'left', 'right', 'upleft', 'upright', 'downleft', 'downright'];
        const animations = ['idle', 'run', 'attack'];

        classes.forEach(c => {
            directions.forEach(dir => {
                animations.forEach(anim => {
                    const key = `class${c}_${dir}_${anim}_blue`;
                    this.textures[key] = this.loadimg(`https://mobajam.hmxstudio.ru/src/textures/${key}.png`);

                    const key2 = `class${c}_${dir}_${anim}_red`;
                    this.textures[key2] = this.loadimg(`https://mobajam.hmxstudio.ru/src/textures/${key2}.png`);
                });
            });
        });
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;

        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.scalefactor = window.innerWidth / this.VIRTUAL_WIDTH;
        this.virtualHeight = window.innerHeight / this.scalefactor;

        this.ctx.scale(this.scalefactor * dpr, this.scalefactor * dpr);
    }

    renderframe() {
        this.animationtimer += this.ANIMATION_SPEED;

        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        if(this.main.players[this.main.myid]) {
            this.camera.x = this.main.players[this.main.myid].x;
            this.camera.y = this.main.players[this.main.myid].y;
        }

        let renderqueue = [];

        this.main.location.forEach(obj => {
            if (obj.type === 'sector') {
                for (let tx = 0; tx < obj.w; tx++) {
                    for (let ty = 0; ty < obj.h; ty++) {
                        let flatX = (obj.x + tx) * this.GRID_STEP;
                        let flatY = (obj.y + ty) * this.GRID_STEP;
                        let isopos = this.flattoiso(flatX, flatY);
                        this.ctx.drawImage(this.textures[obj.texture], isopos.x - (this.TILE_WIDTH / 2), isopos.y, this.TILE_WIDTH, this.TILE_HEIGHT);
                    }
                }
            } else if (obj.type === 'tile') {
                let isopos = this.flattoiso(obj.x * this.GRID_STEP, obj.y * this.GRID_STEP);
                this.drawtile(obj, isopos);
            } else if (obj.type === 'object') {
                renderqueue.push({
                    type: 'object',
                    texture: obj.texture,
                    x: obj.x,
                    y: obj.y
                });
            }
        });

        for(let id in this.main.players) {
            let p = this.main.players[id];
            if(!p.isdead) {
                renderqueue.push({type: 'player', texture: 'class1_'+p.direction+'_'+p.animation+'_'+p.team, ...p});
            }
        }

        for(let team in this.main.towers) {
            for(let tower in this.main.towers[team]) {
                if(this.main.towers[team][tower].hp != 0) {
                    renderqueue.push({type: 'tower', team: team, ...this.main.towers[team][tower]});
                }
            }
        }

        renderqueue.sort((a, b) => a.y - b.y);

        renderqueue.forEach(obj => {
            let isopos = this.flattoiso(obj.x, obj.y);

            if(obj.type == 'player') {
                this.drawplayer(obj, isopos);
            }
            if(obj.type == 'tower') {
                this.drawtower(obj, isopos);
            }
            if(obj.type == 'object') {
                this.drawobject(obj, isopos);
            }
        });
}

    flattoiso(flatX, flatY) {
        let offsetX = flatX - this.camera.x; //CAMERA
        let offsetY = flatY - this.camera.y;

        let isoX = (offsetX - offsetY) + (this.VIRTUAL_WIDTH / 2);
        let isoY = (offsetX + offsetY) * 0.5 + (this.virtualHeight / 2);

        return { x: isoX, y: isoY };
    }

    isotoflat(isoX, isoY) {
        let x = isoX - (this.VIRTUAL_WIDTH / 2);
        let y = isoY - (this.virtualHeight / 2);

        let flatX = (x + 2 * y) / 2 + this.camera.x;
        let flatY = (2 * y - x) / 2 + this.camera.y;

        return { x: flatX, y: flatY };
    }

    drawtile(obj, isopos) {
        this.ctx.drawImage(this.textures[obj.texture], isopos.x - (this.TILE_WIDTH / 2), isopos.y, this.TILE_WIDTH, this.TILE_HEIGHT);
    }

    drawobject(obj, isopos) {
        const img = this.textures[obj.texture];

        if(img && img.complete) {
            const width = img.naturalWidth;
            const height = img.naturalHeight;

            this.ctx.drawImage(
                img,
                isopos.x - (width / 2),
                isopos.y - height + 32,
                width,
                height
            );
        }
    }

    drawplayer(obj, isopos) {
        //this.ctx.drawImage(this.textures['tile1'], isopos.x - (this.TILE_WIDTH / 2), isopos.y, this.TILE_WIDTH, this.TILE_HEIGHT);

        const spriteSheet = this.textures[obj.texture]; //obj.texture

        if(spriteSheet && spriteSheet.complete) {
            let currentFrameIndex = Math.floor(this.animationtimer % this.TOTAL_FRAMES);
            if(obj.animation == 'attack') {
               currentFrameIndex = Math.floor(this.animationtimer % 6);
            }

            const sourceX = currentFrameIndex * this.FRAME_SIZE;
            const sourceY = 0;

            const displayWidth = 256;
            const displayHeight = 256;

            this.ctx.drawImage(
                spriteSheet,
                sourceX, sourceY,
                this.FRAME_SIZE, this.FRAME_SIZE,
                isopos.x - (displayWidth / 2),
                isopos.y - displayHeight + 92,
                displayWidth, displayHeight
            );

            this.ctx.font = 'bold 24px helvetica';
            this.ctx.fillStyle = 'white';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(obj.nickname, isopos.x, isopos.y - 164); //nickname

            const barwidth = 200;
            const barheight = 20;
            const padding = 4;

            if(obj.config) {
                this.ctx.fillStyle = 'black'; //mana bar
                this.ctx.fillRect(isopos.x - (barwidth / 2) - padding, isopos.y - 128 - padding, barwidth + padding*2, barheight + padding);
                this.ctx.fillStyle = 'blue';
                this.ctx.fillRect(isopos.x - (barwidth / 2), isopos.y - 132, ((obj.mana / obj.config.mana) * 200), barheight);

                this.ctx.fillStyle = 'black'; //hp bar
                this.ctx.fillRect(isopos.x - (barwidth / 2) - padding, isopos.y - 132 - barheight - padding, barwidth + padding*2, barheight + padding*2);
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(isopos.x - (barwidth / 2), isopos.y - 132 - barheight, ((obj.hp / obj.config.hp) * 200), barheight);

                this.ctx.font = 'bold 16px helvetica';
                this.ctx.fillStyle = 'white';
                this.ctx.fillText(obj.mana + ' / ' + obj.config.mana, isopos.x, isopos.y - 113);

                this.ctx.font = 'bold 18px helvetica';
                this.ctx.fillText(obj.hp + ' / ' + obj.config.hp, isopos.x, isopos.y - 136);
            }
        }
    }

    drawtower(obj, isopos) {
        //this.ctx.drawImage(this.textures['tile2'], isopos.x - (256 / 2), isopos.y, 256, 128);
        this.ctx.drawImage(this.textures['tower_'+obj.team], isopos.x - (512 / 2), isopos.y - 512+128, 512, 512);

        const barwidth = 200;
        const barheight = 20;
        const padding = 4;

        this.ctx.fillStyle = 'black'; //hp bar
        this.ctx.fillRect(isopos.x - (barwidth / 2) - padding, isopos.y - 132 - barheight - padding, barwidth + padding*2, barheight + padding*2);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(isopos.x - (barwidth / 2), isopos.y - 132 - barheight, ((obj.hp / obj.maxhp) * 200), barheight);

        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 18px helvetica';
        this.ctx.fillText(obj.hp + ' / ' + obj.maxhp, isopos.x, isopos.y - 136);
    }
}