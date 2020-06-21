const WebsocketClientClass = require('../lib/websocket-client-class');

const client = new WebsocketClientClass({
    url: "ws://localhost:5000",
    ttl: 16,
    heartbeat: 2,
    auth: {
        login: "hello",
        password: "hello"
    }
});

client.on('open', () => {
    console.log('EVENT: client is open');
});

client.connect().then( () => {

    console.log('client start');

    console.log('client status:', client.status);
    
    client.on('error', (error) => {
        console.log('EVENT: error');
        console.log(error);
        console.log('EVENT: client status:', client.status);
    });

    client.on('reconnecting', () => {
        console.log('EVENT: reconnecting');
        console.log('EVENT: client status:', client.status);
    });

    client.on('close', (code, reason) => {
        console.log('EVENT: close', code, reason);
        console.log('EVENT: client status:', client.status);
    });

    client.on('message', (message) => {
        console.log('EVENT: message:');
        console.log(message);
    });

    client.send('hello')

    setTimeout( () => {

        console.log('Close client');

        client.close().then( () => {
            console.log('closed');
            console.log('client status:', client.status);
        }).catch( (error) => {
            console.log('client status:', client.status);
            console.log(error);
        });

    }, 9000);


}).catch( (error) => {
    console.log('client error');
    console.log('client status:', client.status);
    console.log(error);
});