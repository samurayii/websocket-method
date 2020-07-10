import { expect } from "chai";
import { WebsocketMethodServerClass } from "../../lib/server/websocket-method-server-class";
import { IWebsocketServerConfig } from "../../lib/interfaces/websocket-server-config";
import { IWebsocketMethodServerClass } from "../../lib/interfaces/websocket-method-server-class";
import { IWebsocketClientConfig } from "../../lib/interfaces/websocket-client-config";
import { WebsocketMethodClientClass } from "../../lib/client/websocket-method-client-class";

describe("WebsocketMethodServerClass<->WebsocketMethodClientClass", function () {

    describe("WebsocketMethodServerClass<->WebsocketMethodClientClass (WS protocol)", function () {

        describe("WebsocketMethodServerClass<->WebsocketMethodClientClass (not Auth)", function () {

            it("client<->server start/stop", function(done) {
    
                this.slow(10000);
                this.timeout(10000);
    
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket"
                };
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client1 = new WebsocketMethodClientClass(client_config);
                const client2 = new WebsocketMethodClientClass(client_config);
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client1 = new WebsocketMethodClientClass(client_config);
                const client2 = new WebsocketMethodClientClass(client_config);
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
                const test_message = "test message";
    
                server.listen().then( () => {
    
                    client.connect().then( () => {
                    
                        server.once("method:test", (body, headers, connection_method) => {

                            expect(test_message).to.equal(body);
                            expect(headers).to.deep.equal({
                                "header1": "header-value1"
                            });
                            expect(connection_method.id).not.equal(undefined);
        
                            client.close().then( () => {
                                server.close().then( () => {
                                    setTimeout( () => {
                                        done();
                                    }, 1000);
                                });
                            });
                        });
        
                        client.send("test", test_message, {
                            "header1": "header-value1"
                        });
        
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
                const test_message = "test message";
    
                server.listen().then( () => {
    
                    client.connect().then( () => {
                    
                        server.once("method:test", (body, headers, connection_method) => {
        
                            expect(test_message).to.equal(body);
                            expect(headers).to.deep.equal({
                                "header1": "header-value1"
                            });
                            expect(connection_method.id).not.equal(undefined);
        
                            client.once("method:test-server", (body, headers) => {

                                expect("test from server").to.equal(body);
                                expect(headers).to.deep.equal({
                                    "header1": "header-value1-from-server"
                                });

                                client.close().then( () => {
                                    server.close().then( () => {
                                        setTimeout( () => {
                                            done();
                                        }, 1000);
                                    });
                                });
                            });
        
                            server.send("test-server", "test from server", {
                                "header1": "header-value1-from-server"
                            }, connection_method.id);
        
                        });
        
                        client.send("test", test_message, {
                            "header1": "header-value1"
                        });
        
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client1 = new WebsocketMethodClientClass(client_config);
                const client2 = new WebsocketMethodClientClass(client_config);
    
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

                            client1.once("method:test-server", (body, headers) => {
                                expect("test from server").to.equal(body);
                                expect(headers).to.deep.equal({
                                    "header1": "header-value1-from-server"
                                });
                                client1.close();
                                complete();
                            });
    
                            client2.once("method:test-server", (body, headers) => {
                                expect("test from server").to.equal(body);
                                expect(headers).to.deep.equal({
                                    "header1": "header-value1-from-server"
                                });
                                client2.close();
                                complete();
                            });

                            server.send("test-server", "test from server", {
                                "header1": "header-value1-from-server"
                            });
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
    
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

        describe("WebsocketMethodServerClass<->WebsocketMethodClientClass (Auth login/password)", function () {
    
            it("client<->server start/stop", function(done) {
    
                this.slow(10000);
                this.timeout(10000);
    
                const server_config: IWebsocketServerConfig = {
                    port: 5005,
                    prefix: "/websocket",
                    auth: true
                };
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
    
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
    
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
    
        describe("WebsocketServerMethodClass<->WebsocketMethodClientClass (Auth token)", function () {
          
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
                
                const server: IWebsocketMethodServerClass = new WebsocketMethodServerClass(server_config);
                const client = new WebsocketMethodClientClass(client_config);
    
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

});