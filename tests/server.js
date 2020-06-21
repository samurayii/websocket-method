const WebsocketServerClass = require('../lib/websocket-server-class');

const server = new WebsocketServerClass({
    port: 5000,
    auth: true
});

server.listen().then( () => {

    console.log('server start on port 5000');


    server.on('authorization', (type, str, done) => {
        console.log(type);
        console.log(str);
        done(true);
    });



}).catch( (error) => {
    console.log('server error');
    console.log(error);
});