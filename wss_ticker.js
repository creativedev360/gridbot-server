import { WebSocketServer } from 'ws';
import { parseURLArgs, getJSON } from './utility.js';
import { broadcastOHLC } from './ticker.js';
import { config } from 'dotenv';
config()

const wss_ticker = new WebSocketServer({ noServer: true });

wss_ticker.on('connection', function connection(ws) {
    // let args = parseURLArgs(request.url);
    // let user_id = args.user_id;
    // connections[user_id].push(ws);

    ws.on('message', function message(data) {
        let msg = getJSON(data);
        switch(msg.type){
            case 'subscribe':
                msg.instruments.forEach(instrument => {
                    instruments.add(instrument);
                });
                break;
            
        }
    });

    ws.on('close', function close(){
        // connections[user_id].delete(ws);
    });
});

setInterval(broadcastOHLC,process.env.TICKER_TIME_MS);
export default wss_ticker;