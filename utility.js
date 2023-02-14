export function parseURLPath(url){
    return url.split('?')[0];
}

export function parseURLArgs(url){
    let vars = url.split('?')[1].split('&');
    let response = [];
    for(let v in vars){
        let arg = vars[v].split('=');
        response[arg[0]] = arg[1];
    }
    return response;
}

export function getJSON(obj){
    try{
        return JSON.parse(obj.toString());
    }catch{
        return {};
    }
}

export function updateGridBot(order_id, user_id, instrument_token){
    let bot_id = pendingOrders[order_id];
    let bot = gridbots[bot_id];
    
}

export function sendMail(to, subject, text){
    let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to,
        subject,
        text
    };
    mailer.sendMail(mailOptions, function(err, data) {
        if (err) {
            console.log("Error " + err);
            return {success:false, error:"Some error occured."};
        } else {
            return {success:true};
        }
    });
}

export async function sendMailOTP(to){
    let otp = Math.floor(Math.random(100)*1000000);
    let mailOptions = {
        from: process.env.MAIL_USERNAME,
        to: to,
        subject: 'One Time Password for GridBot',
        text: 'Your One Time Password for GridBot is ' + otp
    };
    await mailer.verify();
    await mailer.sendMail(mailOptions, function(err, data) {
        if (err) {
            console.log("Error " + err);
            return {success:false, error:"Some error occured. Please re-send the OTP."};
        } else {
            return {success:true, otp};
        }
    });
}