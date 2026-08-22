export class Main {
    constructor() {
        this.routes = {
            ROOMLIST: (data) => this.roomlist(data)
        };

        this.connect();

        window.addEventListener('click', (e) => this.globalclick(e));
    }

    globalclick(e) {
        const target = e.target.closest('[data-action]');
        if(!target) return;

        const action = target.dataset.action;
        const id = target.dataset.id;

        if(typeof this[action] === 'function') {
            this[action](id, e);
        } else {
            console.warn(`Method ${action} is not implemented in UI class`);
        }
    }

    connect() {
        this.ws = new WebSocket('wss://mobajam.hmxstudio.ru:9080');
        //this.ws.onopen = () => this.onopen();
        this.ws.onmessage = (event) => this.ondata(event.data);

        this.ws.onclose = (event) => {
          console.log('Disconnected');
        };

        this.ws.onerror = (error) => {
          console.error('Connection Error: ', error);
          this.ws.close();
        };
    }

    ondata(rawdata) { //ПРИНЯТЬ ОТВЕТ (от сервера)
        let jsondata = JSON.parse(rawdata);
        let type = jsondata.type;
        let data = jsondata.data;

        if(this.routes[type]) {
            this.routes[type](data);
        }
    }

    serversend(type, data) { //ОТПРАВИТЬ ЗАПРОС (на сервер)
        if(this.ws.readyState === WebSocket.OPEN) {
            let jsondata = {type: type, data: data};
            let rawdata = JSON.stringify(jsondata);
            this.ws.send(rawdata);
        }
    }

    roomlist(data) {
        console.log(data);
    }
}

let main = new Main();