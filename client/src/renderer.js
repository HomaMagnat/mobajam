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
            'tile1': this.loadimg('src/textures/tile1.png'),
            'test': this.loadimg('https://media.discordapp.net/attachments/1246825599713148992/1541563905736843295/class1_downright_run_red.png?ex=6a8e0cc4&is=6a8cbb44&hm=523d7568a19575497e00b945ad846734e008225da5ecc76460338977e2ef91ee&=&format=webp&quality=lossless')
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
        const classes = [1, 2, 3, 4, 5];
        const directions = ['up', 'down', 'left', 'right', 'upleft', 'upright', 'downleft', 'downright'];
        const animations = ['idle', 'run', 'attack'];

        classes.forEach(c => {
            directions.forEach(dir => {
                animations.forEach(anim => {
                    const key = `class${c}_${dir}_${anim}_blue`;
                    this.textures[key] = this.loadimg(`src/textures/${key}.png`);

                    const key2 = `class${c}_${dir}_${anim}_red`;
                    this.textures[key2] = this.loadimg(`src/textures/${key2}.png`);
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

        //стереть со сбросом
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        //синхронизация камеры рендера с текущим игроком
        if(this.main.players[this.main.myid]) {
            this.camera.x = this.main.players[this.main.myid].x;
            this.camera.y = this.main.players[this.main.myid].y;
        }

        let renderqueue = []; //всё что надо отрендерить

        this.main.location.forEach(obj => { //объекты из карты
            renderqueue.push({
                ...obj,
                x: obj.x * this.GRID_STEP,
                y: obj.y * this.GRID_STEP
            });
        });

        for(let id in this.main.players) { //игроки
            let p = this.main.players[id];
            if(!p.isdead) {
                renderqueue.push({type: 'player', texture: 'class'+p.classid+'_'+p.direction+'_'+p.animation+'_'+p.team, ...p});
            }
        }

        renderqueue.sort((a, b) => {
            if(a.type === 'tile' && b.type !== 'tile') return -1;
            if(b.type === 'tile' && a.type !== 'tile') return 1;

            return a.y - b.y;
        }); //сортировка для правильных слоёв

        renderqueue.forEach(obj => { //отрисовка каждого объекта
            let isopos = this.flattoiso(obj.x, obj.y); //преобразование плоских координат в изометрические

            if(obj.type == 'tile') {
                this.drawtile(obj, isopos);
            }
            if(obj.type == 'sector') {
                this.drawsector(obj, isopos);
            }
            if(obj.type == 'player') {
                this.drawplayer(obj, isopos);
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

    drawsector(obj, isopos) { //сектор залитый тайлами
        
    }

    drawplayer(obj, isopos) {
        this.ctx.drawImage(this.textures['tile1'], isopos.x - (this.TILE_WIDTH / 2), isopos.y, this.TILE_WIDTH, this.TILE_HEIGHT);

        const spriteSheet = this.textures['test']; //obj.texture

        if(spriteSheet && spriteSheet.complete) {
            const currentFrameIndex = Math.floor(this.animationtimer % this.TOTAL_FRAMES);

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
}