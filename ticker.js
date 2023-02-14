import wss_ticker from './wss_ticker.js';
import { WebSocket } from 'ws';

export function broadcastOHLC(){
    let arr = Array.from(instruments);
    let chunk = 500; //Kite API LIMIT
    let n = Math.ceil(arr.length/chunk);
    for(let i=0; i<n; i++){
        let splicedArr = arr.splice(0,chunk);
        tickerHandler.getOHLC(splicedArr)
            .then((response)=>{
                let res = JSON.stringify({
                    type: 'OHLC',
                    data: response,
                    time: new Date()
                });
                wss_ticker.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                    client.send(res);
                    }
                });
            }).catch((err)=>{
                console.error(err);
            });
    }
}