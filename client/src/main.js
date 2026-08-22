export class Main {
    constructor() {

    }

    serversend(type, data) {
        let jsondata = {type: type, data: data};
        let rawdata = JSON.stringify(jsondata);
        this.ws.send(rawdata);
    }

    ondata(rawdata) {
        let jsondata = JSON.parse(rawdata);
        let type = jsondata.type;
        let data = jsondata.data;
    }
}