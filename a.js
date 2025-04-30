const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server }); //SocketServer Equiv.

//Key :
// 101:bool - Client requesting play / pause from server
// 102:bool - Client acknowledgement of play / pause
// 103:latency - Client sends back timestamp of acknowledgement
// 300:userId - server sending userId to clients
// 301:bool:timestamp - server sending play pause to client
// 302:timstamp - sync phones with server
// 303:timestamp 
// 420:pingback - ping for latency
//

function lat_calc(sv_ts,sv_ack_ts,cl_ts,cl_ack_ts) {
    return (sv_ts - sv_ack_ts) - ((cl_ts - cl_ack_ts) * 0.5)
}
let bbl = [];
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.userId = wss.clients.size;
    ws.send(`300:${ws.userId}`);
    //Latency testing code
    //ws.send(`302:${Date.now()}`);
    ws.send(`303:${Date.now()}`);	
    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        let code = message.toString().split(":")[0];
        let data = message.toString().split(":")[1];
        if (code === "101") {
		wss.clients.forEach(client=>client.send(`301:${data}:${Math.max.apply(null,bbl)-bbl.at(client.userId-1)}`));
		
            //wss.clients.forEach(client => client.send(`301:${data}:${Date.now()}`));
           //  wss.clients.forEach(client => client.send(`301:${data}:${Math.abs(Math.max.apply(null, bbl) * 2) + Date.now()}`));
        } else if (code === "105") {
	    ws.send(`305:${Date.now()}`)
        } else if (code === "102") {
            console.log(`Client ${ws.userId} Playing : ${data}`);
        } else if (code == "103") {
            bbl.push((Date.now()-parseInt(data)));
        } else {
          console.log("You're Gae ...")
        }
    });

    ws.on('close', () => {
        console.log(`Client ${ws.userId} disconnected`);
        wss.clients.forEach(function each(client) {
	  bbl.splice((ws.userId-1), 1);
          if (client.userId > ws.userId) {
            client.userId--;
            client.send(`300:${client.userId}`);
          }
        })
    });
});

server.listen(5000, () => {
    console.log('WebSocket server is listening on port 5000');
});
