export class Renderer {
    constructor(main) {
        this.main = main;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');

        this.TILE_WIDTH = 128;
        this.TILE_HEIGHT = 64;
        this.VIRTUAL_WIDTH = 1920;
        this.GRID_STEP = 64;

        this.textures = { //sprites, images, assets
            'tile1': this.loadimg('src/textures/tile1.png')
        };

        this.camera = { x: 0, y: 0 }; 

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    loadimg(src) {
        let img = new Image();
        img.src = src;
        return img;
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
        //стереть со сбросом
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        //синхронизация камеры рендера с текущим игроком
        //this.camera.x = this.main.players[this.main.myid].x;
        //this.camera.y = this.main.players[this.main.myid].y;

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
                renderqueue.push({ type: 'player', x: p.x, y: p.y, texture: 'class'+p.classid });
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

    }

    drawtile(obj, isopos) {
        this.ctx.drawImage(this.textures[obj.texture], isopos.x - (this.TILE_WIDTH / 2), isopos.y, this.TILE_WIDTH, this.TILE_HEIGHT);
    }

    drawsector(obj, isopos) { //сектор залитый тайлами

    }

    drawplayer(obj, isopos) {

    }
}