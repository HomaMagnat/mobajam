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
            'tile1': this.loadimg('src/textures/tile1.png')
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
                    const key = `class${c}_${dir}_${anim}`;
                    this.textures[key] = this.loadimg(`src/textures/${key}.png`);
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
        this.camera.x = this.main.players[this.main.myid].x;
        this.camera.y = this.main.players[this.main.myid].y;

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
                renderqueue.push({ type: 'player', x: p.x, y: p.y, texture: 'class'+p.classid+'_'+p.direction+'_'+p.animation });
            }
        }

        renderqueue.sort((a, b) => a.y - b.y); //сортировка для правильных слоёв

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
        //this.ctx.drawImage(this.textures['tile1'], isopos.x - (this.TILE_WIDTH / 2), isopos.y, this.TILE_WIDTH, this.TILE_HEIGHT);

        const spriteSheet = this.textures[obj.texture];

        if (spriteSheet && spriteSheet.complete) {
            const currentFrameIndex = Math.floor(this.animationtimer % this.TOTAL_FRAMES);

            const sourceX = currentFrameIndex * this.FRAME_SIZE;
            const sourceY = 0;

            const displayWidth = 128;
            const displayHeight = 128;

            // 4. Отрисовка с вырезанием (9 аргументов):
            this.ctx.drawImage(
                spriteSheet,
                sourceX, sourceY,             // Откуда вырезать внутри картинки (X, Y)
                this.FRAME_SIZE, this.FRAME_SIZE, // Какого размера кусок вырезать (256x256)
                isopos.x - (displayWidth / 2),    // Координата X на экране холста (центрируем)
                isopos.y - displayHeight + 32,    // Координата Y на экране холста (ставим на ноги)
                displayWidth, displayHeight       // Размер отрисовки на экране
            );
        }
    }
}