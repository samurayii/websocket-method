import { expect } from "chai";
import { WebsocketServerClass } from "../../lib/server/websocket-server-class";
import { WebsocketClientClass } from "../../lib/client/websocket-client-class";
import { IWebsocketServerConfig } from "../../lib/interfaces/websocket-server-config";
import { IWebsocketClientConfig } from "../../lib/interfaces/websocket-client-config";
import { IWebsocketServerClass } from "../../lib/interfaces/websocket-server-class";
import { IConnectionClass } from "../../lib/interfaces/connection-class";
import { resolve } from "path";

describe("WebsocketServerClass<->WebsocketClientClass", function () {

    describe("WebsocketServerClass<->WebsocketClientClass (WS protocol)", function () {

        describe("WebsocketServerClass<->WebsocketClientClass (not Auth)", function () {

            it("client<->server start/stop", function(done) {
    
                this.slow(10000);
                this.timeout(10000);
    
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
    
                server.listen().then( () => {
                    
                    server.close().then( () => {
                        setTimeout( () => {
                            done();
                        }, 1000);
                    });
    
                });
            });
          
            it("create client<->server connection", function(done) {
        
                this.slow(10000);
                this.timeout(10000);
    
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket"
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
    
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
    
            it("create client<->server 2 connections", function(done) {
        
                this.slow(10000);
                this.timeout(10000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket"
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client1 = new WebsocketClientClass(client_config);
                const client2 = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    client1.connect().then( () => {
    
                        expect(server.info.connections).to.equal(1);
    
                        client2.connect().then( () => {
    
                            expect(server.info.connections).to.equal(2);
    
                            client1.close().then( () => {
    
                                client2.close().then( () => {
                                    server.close().then( () => {
                                        setTimeout( () => {
                                            done();
                                        }, 1000);
                                    });
                                });
    
                            });
    
                        });
    
                    });
    
                });
        
            });
    
            it("create client<->server 2 connections (drop)", function(done) {
        
                this.slow(10000);
                this.timeout(10000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket",
                    reconnect_interval: 2
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client1 = new WebsocketClientClass(client_config);
                const client2 = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    client1.connect().then( () => {
    
                        expect(server.info.connections).to.equal(1);
    
                        client2.connect().then( () => {
    
                            expect(server.info.connections).to.equal(2);
    
                            let total_drop = 0;
    
                            const drop = () => {
                                total_drop++;
                                if (total_drop >= 2) {
                                    client1.close().then( () => {
                                        client2.close().then( () => {
                                            setTimeout( () => {
                                                done();
                                            }, 1000);
                                        });
            
                                    });
                                }
                            };
    
                            client1.once("close", () => {
                                drop();
                            });
    
                            client2.once("close", () => {
                                drop();
                            });
    
                            server.close();
    
                        });
    
                    });
    
                });
        
            });
    
            it("client<->server send message", function(done) {
        
                this.slow(5000);
                this.timeout(5000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket"
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
                const test_message = "test message";
    
                server.listen().then( () => {
    
                    client.connect().then( () => {
                    
                        server.once("message", (message: unknown) => {
        
                            expect(test_message).to.equal(message);
        
                            client.close().then( () => {
                                server.close().then( () => {
                                    setTimeout( () => {
                                        done();
                                    }, 1000);
                                });
                            });
                        });
        
                        client.send(test_message);
        
                    });
    
                });
    
            });
    
            it("client<->server echo message", function(done) {
        
                this.slow(5000);
                this.timeout(5000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket"
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
                const test_message = "test message";
    
                server.listen().then( () => {
    
                    client.connect().then( () => {
                    
                        server.once("message", (message: unknown, connection: IConnectionClass) => {
        
                            expect(test_message).to.equal(message);
        
                            client.once("message", (message: unknown) => {
                                expect(test_message).to.equal(message);
                                client.close().then( () => {
                                    server.close().then( () => {
                                        setTimeout( () => {
                                            done();
                                        }, 1000);
                                    });
                                });
                            });
        
                            server.send(message, connection.id);
        
                        });
        
                        client.send(test_message);
        
                    });
    
                });
    
            });
    
            it("client<->server broadcast message", function(done) {
        
                this.slow(5000);
                this.timeout(5000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket"
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client1 = new WebsocketClientClass(client_config);
                const client2 = new WebsocketClientClass(client_config);
                const test_message = "test message";
    
                server.listen().then( () => {
    
                    client1.connect().then( () => {
    
                        expect(server.info.connections).to.equal(1);
    
                        client2.connect().then( () => {
    
                            expect(server.info.connections).to.equal(2);
    
                            let total_message_count = 0;
    
                            const complete = () => {
    
                                total_message_count ++;
    
                                if (total_message_count >= 2) {
                                    server.close().then( () => {
                                        setTimeout( () => {
                                            done();
                                        }, 1000);
                                    });
                                }
    
                            };
    
                            client1.once("message", (message: unknown) => {
                                expect(test_message).to.equal(message);
                                client1.close();
                                complete();
                            });
    
                            client2.once("message", (message: unknown) => {
                                expect(test_message).to.equal(message);
                                client2.close();
                                complete();
                            });
    
                            server.send(test_message);
    
                        });
    
                    });
    
                });
    
            });
    
            it("client<->server reconnect 2 attempts", function(done) {
        
                this.slow(15000);
                this.timeout(15000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket",
                    reconnect_interval: 2
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    client.connect().then( () => {
    
                        expect(server.info.connections).to.equal(1);
    
                        let reconnect_attempts = 0;
    
                        const reconnect = () => {
    
                            reconnect_attempts++;
    
                            if (reconnect_attempts >= 2) {
                                client.close().then( () => {
                                    setTimeout( () => {
                                        done();
                                    }, 1000);
                                });
                            }
    
                        };
    
                        client.on("reconnecting", () => {
                            expect(client.status).to.equal("reconnecting");
                            reconnect();
                        });
    
                        server.close();
    
                    });
    
                });
    
            });
    
            it("client<->server reconnect 2 attempts (connecting)", function(done) {
        
                this.slow(25000);
                this.timeout(25000);
                
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket",
                    reconnect_interval: 2
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    client.connect().then( () => {
    
                        expect(server.info.connections).to.equal(1);
    
                        let reconnect_attempts = 0;
    
                        const reconnect = () => {
    
                            reconnect_attempts++;
    
                            if (reconnect_attempts >= 2) {
    
                                client.removeAllListeners("reconnecting");
    
                                client.once("open", () => {
    
                                    expect(client.status).to.equal("open");
    
                                    client.close().then( () => {
    
                                        setTimeout( () => {
    
                                            server.close().then( () => {
                                                setTimeout( () => {
                                                    done();
                                                }, 1000);
                                            });
    
                                        }, 1000);
    
                                    });
    
                                });
    
                                server.listen();
     
                            }
    
                        };
    
                        client.on("reconnecting", () => {
                            expect(client.status).to.equal("reconnecting");
                            reconnect();
                        });
    
                        server.close();
    
                    });
    
                });
    
            });
    
        });
    
        describe("WebsocketServerClass<->WebsocketClientClass (Auth login/password)", function () {
    
            it("client<->server start/stop", function(done) {
    
                this.slow(10000);
                this.timeout(10000);
    
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket",
                    auth: true
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
    
                server.listen().then( () => {
                    
                    server.close().then( () => {
                        setTimeout( () => {
                            done();
                        }, 1000);
                    });
    
                });
            });
          
            it("create client<->server connection", function(done) {
        
                this.slow(10000);
                this.timeout(10000);
    
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket",
                    auth: {
                        login: "user",
                        password: "password"
                    }
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket",
                    auth: true
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    server.once("authorization", (type_auth, auth_string, callback) => {
    
                        expect("Basic").to.equal(type_auth);
                        expect("user:password").to.equal((Buffer.from(auth_string, "base64")).toString("utf8"));                  
    
                        callback(true);
    
                    });
                    
                    client.once("open", () => {
    
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
    
            it("create client<->server connection (access denied)", function(done) {
        
                this.slow(10000);
                this.timeout(10000);
    
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket",
                    auth: {
                        login: "user",
                        password: "password"
                    }
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket",
                    auth: true
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    server.once("authorization", (type_auth, auth_string, callback) => {     
                        
                        expect("Basic").to.equal(type_auth);
                        expect("user:password").to.equal((Buffer.from(auth_string, "base64")).toString("utf8")); 
    
                        callback(false);
    
                    });
            
                    client.connect().catch( () => {
    
                        expect(client.status).to.equal("close");
    
                        server.close().then( () => {
                            setTimeout( () => {
                                done();
                            }, 1000);
                        });
                    });
    
                });
    
            });
    
        });
    
        describe("WebsocketServerClass<->WebsocketClientClass (Auth token)", function () {
          
            it("create client<->server connection", function(done) {
        
                this.slow(10000);
                this.timeout(10000);
    
                const client_config: IWebsocketClientConfig = {
                    url: "ws://localhost:5005/websocket",
                    auth: {
                        token: "token"
                    }
                };
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket",
                    auth: true
                };
                
                const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
                const client = new WebsocketClientClass(client_config);
    
                server.listen().then( () => {
    
                    server.once("authorization", (type_auth, auth_string, callback) => {
    
                        expect("Bearer").to.equal(type_auth);
                        expect("token").to.equal(auth_string);                  
    
                        callback(true);
    
                    });
                    
                    client.once("open", () => {
    
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

    });

    describe("WebsocketServerClass<->WebsocketClientClass (WSS protocol)", function () {

        it("client<->server start/stop", function(done) {
    
            this.slow(10000);
            this.timeout(10000);

            const server_config: IWebsocketServerConfig = {
                port: 5005,
                prefix: "/websocket",
                protocol: "wss",
                key: resolve(__dirname, "./devhost.key"),
                cert: resolve(__dirname, "./devhost.crt")
            };
            
            const server: IWebsocketServerClass = new WebsocketServerClass(server_config);

            server.listen().then( () => {
                
                server.close().then( () => {
                    setTimeout( () => {
                        done();
                    }, 1000);
                });

            });
        });

        it("create client<->server connection", function(done) {
        
            this.slow(10000);
            this.timeout(10000);

            const client_config: IWebsocketClientConfig = {
                url: "wss://localhost:5005/websocket",
                reject_unauthorized: false
            };
            const server_config: IWebsocketServerConfig = {
                port: 5005,
                prefix: "/websocket",
                protocol: "wss",
                key: resolve(__dirname, "./devhost.key"),
                cert: resolve(__dirname, "./devhost.crt")
            };
            
            const server: IWebsocketServerClass = new WebsocketServerClass(server_config);
            const client = new WebsocketClientClass(client_config);

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

});