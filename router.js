import express from 'express';
import { KiteConnect } from 'kiteconnect';
import {OAuth2Client} from 'google-auth-library';

import {sendMailOTP, sendMail} from './utility.js';

const router = express.Router();

//Handle Kite Login
router.get('/kite_login', function (req, res) {
    res.redirect(307, `https://kite.zerodha.com/connect/login?v=3&api_key=${process.env.KITE_API_KEY}`);
    return res.end();
 });

//Handle Kite Redirects
router.get('/kite_login_redirect', function (req, res) {
    let sess =  req.session;
    console.log(sess);
    if(req.query.status){
        let kc = new KiteConnect({
            api_key: process.env.KITE_API_KEY,
            });
        kc.generateSession(req.query.request_token, process.env.KITE_API_SECRET)
            .then(function (response) {
                if(response.user_id == process.env.ADMIN_USER_ID){
                    tickerHandler = kc;
                    //return res.end(JSON.stringify({'type':'login','success':true, 'access_token':response.access_token}));
                }if(true){
                    let client = {
                        'user_id' : response.user_id,
                        'user_name' : response.user_name,
                        'email' : response.email,
                        'access_token' : response.access_token,
                        'api_key' : response.api_key,
                        'api_secret' : process.env.KITE_API_SECRET
                    }
                    kite_clients[sess.user_id] = client;
                    clients[sess.user_id] == undefined ? clients[sess.user_id] = {kite_user_id:client.user_id} : clients[sess.user_id].kite_user_id = client.user_id;
                    sess.email = response.email
                    sess.kite = client
                    return res.end(JSON.stringify({'type':'login','success':true, 'access_token':response.access_token}));
                }
            })
            .catch(function (err) {
                console.log(err);
                return res.end();
            });
    }
    else return res.end();
 });

//Handle Kite Postbacks
router.post('/kite_postback', function (req, res) {
    let client = kite_clients[req.body.user_id];
    let kc = new KiteConnect();
    if(kc.validatePostback(req.body, client.api_secret)){
        updateGridBot(req.body.order_id, req.body.user_id, req.body.instrument_token);
        let response = {
            'type':'order_status_update',
            'order_id':args.order_id,
            'status':args.status
        };
        for(ws in connections[args.user_id]){
            ws.send(response);
        }
    }
    return;
 });

//Send Normal Email OTP and Registration OTP
router.post('/send_email_otp', function (req, res) {
    let sess = req.session;
    if('register' in req.body){
        let response = sendMailOTP(req.body.register.email);
        if(response.success){
            sess.register = req.body.register
            sess.otp_cred = {
                email: req.body.register.email,
                otp: response.otp
            }
            delete response.otp
        }
        res.end(JSON.stringify(response));
    }
    else if('temp_email' in req.body){
        let response = sendMailOTP(req.body.temp_email);
        sess.otp_cred = {
            email: req.body.temp_email,
            otp: response.otp
        }
        res.end(JSON.stringify(response));
    }
});

//Verify Email OTP and Register User
router.post('/verify_email_otp', function (req, res){
    let sess = req.session;
    if(sess.otp_cred.otp == req.body.otp && sess.otp_cred.email == req.body.email){
        if('register' in sess){
            var sql = "     INSERT INTO clients (email, email_verified, user_name) VALUES ?";
            let user = {
                email: register.email,
                email_verified: true,
                name: register.name,
            }
            var values = [
                [user.email, user.email_verified, user.name],
            ];

            db_conn.query(sql, [values], function (err, result) {
                if (err){
                    if(err.code=='ER_DUP_ENTRY'){
                        sess.user = user
                        return res.end(JSON.stringify({success:true, user: user, new_user: false}))
                    }else{
                        console.error(eror)
                        return res.end(JSON.stringify({success:false, error: error}));
                    }
                }else{
                    sess.user = user
                    return res.end(JSON.stringify({success:true, user: user, new_user: true}))
                }
            });
        } else if('temp_email' in req.body){
            res.end(JSON.stringify({success: true}));
        }
    }else{
        res.end(JSON.stringify({success: false}));
    }
});


//Handle Registration via Website
router.post('/register', function (req, res) {
    let sess =  req.session;
    console.log(sess)
    if('user' in sess){
        res.end(JSON.stringify({success:true, user: sess.user, new_user: false}))
    }else{
        const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);
        async function verify(){
            const ticket = await client.verifyIdToken({
                idToken: req.body.credential,
                audience: process.env.OAUTH_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            var sql = "INSERT INTO clients (email, email_verified, user_name, picture) VALUES ?";
            let user = {
                email: payload.email,
                email_verified: payload.email_verified,
                name: payload.name,
                picture: payload.picture
            }
            var values = [
                [user.email, user.email_verified, user.name, user.picture],
            ];

            db_conn.query(sql, [values], function (err, result) {
                if (err){
                    if(err.code=='ER_DUP_ENTRY'){
                        sess.user = user
                        return res.end(JSON.stringify({success:true, user: user, new_user: false}))
                    }else{
                        console.error(eror)
                        return res.end(JSON.stringify({success:false, error: error}));
                    }
                }else{
                    sess.user = user
                    return res.end(JSON.stringify({success:true, user: user, new_user: true}))
                }
            });
        }
        verify().catch(function(error){
            console.error(error);
            return res.end(JSON.stringify({success:false, error: error}));
        });
    }
 });


//Handle Login / Registration via Google
router.post('/social_login/google', function (req, res) {
    let sess =  req.session;
    console.log(sess)
    if('user' in sess){
        res.end(JSON.stringify({success:true, user: sess.user, new_user: false}))
    }else{
        const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);
        async function verify(){
            const ticket = await client.verifyIdToken({
                idToken: req.body.credential,
                audience: process.env.OAUTH_CLIENT_ID,
            });
            const payload = ticket.getPayload();

            var sql = "INSERT INTO clients (email, email_verified, user_name, picture) VALUES ?";
            let user = {
                email: payload.email,
                email_verified: payload.email_verified,
                name: payload.name,
                picture: payload.picture
            }
            var values = [
                [user.email, user.email_verified, user.name, user.picture],
            ];

            db_conn.query(sql, [values], function (err, result) {
                if (err){
                    if(err.code=='ER_DUP_ENTRY'){
                        sess.user = user
                        return res.end(JSON.stringify({success:true, user: user, new_user: false}))
                    }else{
                        console.error(eror)
                        return res.end(JSON.stringify({success:false, error: error}));
                    }
                }else{
                    sess.user = user
                    return res.end(JSON.stringify({success:true, user: user, new_user: true}))
                }
            });
        }
        verify().catch(function(error){
            console.error(error);
            return res.end(JSON.stringify({success:false, error: error}));
        });
    }
 });

 export default router;