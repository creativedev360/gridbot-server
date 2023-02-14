import { createServer } from 'https';
import { parse } from 'url';
import { config } from 'dotenv';
import wss_info from './wss_info.js';
import wss_ticker from './wss_ticker.js';
import { KiteConnect } from "kiteconnect";
import express from 'express';
import session from 'express-session';
import router from './router.js';
import mysql from 'mysql';
import nodemailer from 'nodemailer';


import {broadcastOHLC} from './ticker.js';

//Configuring DotEnv
config()

global.mailer = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: false,
    secureConnection: false,
    logger: false,
    debug: false,
    ignoreTLS: true,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    }
});


global.db_conn = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db_conn.connect(function(err) {
    if (err) throw err;
    console.log("Connected to the Database!");
});

const sessionParser = session({
    secret: process.env.SESSION_SECRET, 
    saveUninitialized: true, 
    resave: true,
    cookie:{
        expires: 86400*1000,
        maxAge: 86400*1000
    }
});
const app = express()
app.use(sessionParser)
app.use(express.json())

// Add headers
app.use((req, res, next) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.status(200);
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    next();
  });

//Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Something broke!')  
})
//Handle Routes
app.use('/', router);

global.instruments = new Set([
    /*
    "NSE:TCS",
    "NSE:SBIN"
    */
])

global.instruments_subscriptions = {
    
}

//Ready Instruments List
global.instruments_list = {

}
    
//Hold the Connections and clients
global.connections = {
    /*
    user_id:[]
    */
}

global.gridbots = {
    /*
    bot_id: {
        bot_id: uuidv4(),
        user_id: user_id,
        account_id: account_id,
        name: name,
        instrument_token: xxxx,
        orders:[
            {
                order_id: xxxx,
                transaction_type: BUY/SELL,
                price_level: xx
            },
            {
                order_id: xxxx,
                transaction_type: BUY/SELL,
                price_level: xx
            }
        ],
        currentGridLevel: XX, //NOT IN DATABASE
        gridGap: xx,
        qty: xx,
        numGrids: xx,
        range_low: xx,
        range_high: xx,
        historical_data: [  //NOT IN DATABASE
            time: xxxx,
            open:xx,
            high:xx,
            low:xx,
            close:xx
        ]
    }
    */
}

global.pendingOrders = {
    /*
    order_id : gridbot_id
    */
}

global.kite_clients = {
    /*
    user_id:{
        'email' : response.email,
        'user_name' : response.user_name,
        'access_token' : response.access_token,
        'api_key' : response.api_key,
        'api_secret' : process.env.KITE_API_SECRET
    }
    */
}

global.clients = {
    /*
    user_id:{
        email: response.email,
        user_name: response.user_name,
        accounts:{
            account1:{
                broker: KITE/FYERS,
                broker_user_id: user_id,
                api_key: response.api_key,
                api_secret: response.api_secret
            },
            account2:{
                broker: KITE/FYERS,
                broker_user_id: user_id,
                api_key: response.api_key,
                api_secret: response.api_secret
            }
        }
        
        kite_user_id: kite_user_id,
        fyers_user_id: fyers_user_id
    }
    */
}

global.historical_data = {
    /*
    instrument_token: {
        data: {},
        last_updated: yyyy-mm-dd
    }
    */
}

const server = app.listen(process.env.GRIDBOT_SERVER_PORT);

//Handle WebScoket Requests
server.on('upgrade', function upgrade(request, socket, head) {
    //Authenticate the requests.
    let sess = null;
    sessionParser(request, {}, function(){
        const { pathname } = parse(request.url);
        switch(pathname){
            case '/info':
                //Only for fetching Historical Data.
                wss_info.handleUpgrade(request, socket, head, function done(ws) {
                    wss_info.emit('connection', ws, request);
                    });
                break;
            case '/ticker':
                wss_ticker.handleUpgrade(request, socket, head, function done(ws) {
                    wss_ticker.emit('connection', ws, request);
                    });
                break;
            default:
                socket.destroy();
                break;
        }
    });

    // if(!sess){
    //     socket.send({type:'logout'});
    //     socket.destroy();
    // }

    
  });


global.tickerHandler = new KiteConnect({
    api_key : process.env.KITE_API_KEY
});

console.log("System admin is required to log in through this URl for Ticker and Historical Data to work \n" + tickerHandler.getLoginURL())

// setInterval(broadcastOHLC,1000);