import { expect } from "chai";
import { WebsocketMethodServerClass } from "../../index";
import { WebsocketMethodClientClass } from "../../index";

describe("Index", function () {

    it("create client<->server connection", function(done) {

        this.slow(10000);
        this.timeout(10000);

        const client_config = {
            url: "ws://localhost:5005/websocket"
        };
        const server_config = {
            port: 5005,
            prefix: "/websocket"
        };
        
        const server = new WebsocketMethodServerClass(server_config);
        const client = new WebsocketMethodClientClass(client_config);

        server.listen().then( () => {
            
            server.once("open", () => {

                expect(server.info.connections).to.equal(1);

                client.close().then( () => {

                    expect(client.status).to.equal("close");

                    server.close().then( () => {
                        setTimeout( () => {
                            done();
                        }, 1000);
                    });

                });
            });
    
            client.connect();

        });

    });

});