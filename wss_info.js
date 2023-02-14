import { KiteConnect } from 'kiteconnect';
import { WebSocketServer } from 'ws';
import { parseURLArgs, getJSON } from './utility.js';
const wss_info = new WebSocketServer({ noServer: true });

wss_info.on('connection', function connection(ws, req) {
    const args = parseURLArgs(req.url);
    console.log(req.session);

    ws.on('message', function message(data) {
        let msg = getJSON(data);
        let response = undefined;
        let d = new Date();
        let today = d.toLocaleDateString();
        switch(msg.type){
            case 'getHistoricalData':
                //Send Historical Data for the instrument token for last 30 days as requested by the User.
                response = historical_data[msg.instrument_token];
                if(response!=undefined && response.last_updated==today){
                    ws.send(JSON.stringify({
                        type:'historical_data',
                        instrument:msg.instrument_token,
                        data: response.data
                    }));
                }
                else{
                    d = new Date(d - 1*24*60*60*1000)
                    let to_date = d.toISOString().split('T')[0] + " 03:30:00";
                    d = new Date(d - 365*24*60*60*1000)
                    let from_date = d.toISOString().split('T')[0] + " 09:00:00";
                    tickerHandler.getHistoricalData(msg.instrument_token, "day", from_date, to_date)
                        .then((response)=>{
                            response = response.map((candle)=>{
                                return {
                                    time:candle.date.toISOString().split('T')[0],
                                    open:candle.open,
                                    high:candle.high,
                                    low:candle.low,
                                    close:candle.close,
                                    volume:candle.volume
                                }
                            });
                            historical_data[msg.instrument_token] = {data: response, last_updated: today};
                            ws.send(JSON.stringify({
                                type:'historical_data',
                                instrument:msg.instrument_token,
                                data: response
                            }));
                        })
                        .catch((err)=>{
                            console.error(err);
                        });
                }
                break;

            case 'getInstruments':
                response = instruments_list;
                if(response!=undefined && response.last_updated==today){
                    ws.send(JSON.stringify({
                        type:'instruments_list',
                        data: response.data
                    }));
                }
                else{
                    tickerHandler.getInstruments()
                        .then((response)=>{
                            instruments_list = {data: response, last_updated: today}
                            ws.send(JSON.stringify({
                                type:'instruments_list',
                                data: response
                            }));
                        });
                }
                break;

            case 'getGridBot':
                //TODO => Fetch the gridbot asked by the user.
                break;

            case 'getGridBots':
                //TODO => Fetch gridbots saved by the User on the Website.
                break;

            case 'pauseGridBot':
                //TODO => Pause the GridBot sent by the user.
                break;
            
            case 'pauseAllGridBots':
                //TODO => Pause all the GridBots made by the user.
                break;
            
            case 'resumeGridBot':
                //TODO => Resume the GridBot sent by the user.
                break;
            
            case 'resumeAllGridBots':
                //TODO => Resume all the GridBots sent by the user.
                break;

            case 'deleteGridBot':
                //TODO => Delete the GridBot sent by the user.
                break;

            case 'deleteAllGridBots':
                //TODO => Delete all the GridBots made by the user.
                break;

            case 'modifyGridBot':
                //TODO => Modify the GridBot sent by the user.
                break;
            
            case 'createGridBot':
                //TODO => Create a new GridBot for the user.
                break;
        }
    });
    
});
export default wss_info;