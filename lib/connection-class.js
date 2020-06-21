const uuid = require('uuid');
const EventEmitter = require('events');

module.exports = class ConnectionClass extends EventEmitter {
    
    constructor (ws) {

        super();

        this._id = uuid.v4();
        this._ws = ws;

        this._ws.on('message', (message) => {
            this.emit('message', message);
        });





    }

    get id () {
        return this._id;
    }

    get protocol () {
        return this._ws.protocol;
    }

    send (message) {

    }

}