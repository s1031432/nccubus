// Telegram bot screenshot -> https://i.imgur.com/wMiFkQe.jpg
// Add me on Telegram      -> https://t.me/NCCU_bot

const jsSHA = require('jssha');
const request = require('request');
const express = require('express');
const getDateTime = require("./getDateTime.js");
const telegramBot = require('node-telegram-bot-api');
// fill in your telegram token
const token = process.env.telegramtoken;
const bot = new telegramBot(token, {polling: true});

data = require('./busdata.json');
serverStartTime = getDateTime.getDateTime(new Date((+new Date())+8*60*60*1000));
serverCalledCount = 0;

function GetAuthorizationHeader() {
    // Get AppID & AppKey: https://ptx.transportdata.tw/PTX/
    const AppID  = process.env.ptxappid;
    const AppKey = process.env.ptxappkey;
    var GMTString = new Date().toGMTString();
    var ShaObj = new jsSHA('SHA-1', 'TEXT');
    ShaObj.setHMACKey(AppKey, 'TEXT');
    ShaObj.update('x-date: ' + GMTString);
    var HMAC = ShaObj.getHMAC('B64');
    var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';
    return { 'Authorization': Authorization, 'X-Date': GMTString ,'Accept-Encoding': 'gzip'}; 
}


function getData(mode){
    console.log(`getData(${mode})`);
    // Call ptx API to get bus data(json)
    // More infomation: https://ptx.transportdata.tw/MOTC/?urls.primaryName=%E5%85%AC%E8%BB%8AV2#/Bus%20Advanced(By%20Station)/CityBusApi_EstimatedTimeOfArrival_ByStation_2880
    return new Promise( resolve => { 
        request(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`,{
            headers: GetAuthorizationHeader(),
            gzip: true,
            timeout: 1500,
        }, function(error, response, body){
            try{
                if(error){
                    console.log("-- ERROR: ", mode);
                    getData(mode);
                }
                else{
                    body = JSON.parse(body);
                    body = sortBusData(body);
                    // console.log(body);
                    let result = [data[mode].title,"--"];
                    for(var i=0;i<body.length;i++){
                        if( (data[mode].whiteList[0].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==0)  || (data[mode].whiteList[1].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==1)){
                            str = `${body[i].RouteName.Zh_tw}`;
                            if(body[i].StopStatus == 0){
                                if(body[i].EstimateTime >= 30){
                                    str = body[i].EstimateTime < 120 ? `✅ ${str} - 即將進站` : `✅ ${str} - 約${parseInt(body[i].EstimateTime/60)}分`;
                                }
                                else if(body[i].EstimateTime < 30){
                                    str = `✅ ${str} - 進站中`;
                                }
                            }
                            else if(body[i].StopStatus == 1){
                                if(body[i].EstimateTime >= 30){
                                    str = body[i].EstimateTime < 120 ? `✅ ${str} - 即將進站` : `✅ ${str} - 約${parseInt(body[i].EstimateTime/60)}分（尚未發車）`;
                                }
                                else if(body[i].EstimateTime < 30){
                                    str = `✅ ${str} - 進站中`
                                }
                                else if(body[i].EstimateTime == undefined){
                                    str = `💤 ${str} - 尚未發車`;
                                }
                            }
                            else if(body[i].StopStatus == 2){
                                str = `⚠️ ${str} - 交管不停靠`;
                            }
                            else if(body[i].StopStatus == 3){
                                str = `❌ ${str} - 末班車已過`;
                            }
                            else if(body[i].StopStatus == 4){
                                str = `❌ ${str} - 今日未營運`;
                            }
                            if(body[i].IsLastBus){
                                str += ` 🔴末班車！`;
                            }
                            result.push(str);
                        }
                    }
                    let nowMs = (+new Date())+8*60*60*1000;
                    // update each bus data lastUpdateTime
                    data[mode].lastUpdateTimeMs = nowMs;
                    result.push(`--`);
                    result.push(`資料最後更新時間\n${getDateTime.getDateTime(new Date(data[mode].lastUpdateTimeMs))}</pre>`);
                    console.log(`-- ${getDateTime.getDateTime(new Date(data[mode].lastUpdateTimeMs))} ${mode} data update`)
                    // update each bus data string
                    data[mode].str = result.join("\n");
                    resolve(data[mode].str);
                }
            }
            catch(e){
                console.log(e);
            }
        });
    });
}
function sortBusData(body){
    // sort data by StopStatus & EstimateTime
    // --sort by StopStatus
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if( body[i].StopStatus > body[j].StopStatus){
                var temp = body[i];
                body[i] = body[j];
                body[j] = temp;
            }
        }
    }
    // --sort by EstimateTime undefined or not undefined
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if( (body[i].EstimateTime == undefined && body[j].EstimateTime != undefined) ){
                var temp = body[i];
                body[i] = body[j];
                body[j] = temp;
            }
        }
    }
    // --sort by EstimateTime
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if(body[j].EstimateTime < body[i].EstimateTime){
                var temp = body[i];
                body[i] = body[j];
                body[j] = temp;
            }
        }
    }
    return body;
}
function isDataUpdated(mode){
    // check data is fresh
    let nowMs = (+new Date())+8*60*60*1000;
    try{
        if( nowMs - data[mode].lastUpdateTimeMs >= 25*1000 || data[mode].str.length < 1)
            return false;
        return true;
    }
    catch(e){
        console.log(e);
        return e;
    }
}
function isStopUpdateInNight(){
    // 02:00 ~ 05:00 don't call api
    let now = getDateTime.getDateTime(new Date((+new Date())+8*60*60*1000));
    let hours = now[11]+now[12];
    if((Number(hours) < 5 && Number(hours) > 1) ){
        return true;
    }
    return false;
}
bot.onText(/\/start$/, (msg) => {
    var replyMsg = "";
    replyMsg += "<code><b><u>/start</u></b></code>\n介紹及指令說明。\n\n";
    replyMsg += "<code><b><u>/server</u></b></code>\n查看伺服器狀況。\n\n";
    replyMsg += "<code><b><u>/zoo_nccu1</u></b></code>\n查看捷運動物園站到政大一站(校門口)公車到站時間。只會顯示有停靠政大一站的公車，有些公車(如295, 679)雖不停靠政大一站(校門口)，但會停靠新光路口，就不會被列出。\n\n";
    replyMsg += "<code><b><u>/nccu_zoo</u></b></code>\n查看政大站(麥側萊爾富)到捷運動物園站的公車到站時間。有些公車(如530)雖有停靠政大站(麥側萊爾富)，但不會停靠捷運動物園站，或是極度繞路(如棕11)，就不會被列出。\n\n";
    replyMsg += "<code><b><u>/nccu1_zoo</u></b></code>\n查看政大一站(Jason超市對面)到捷運動物園站的公車到站時間。只會顯示會停靠捷運動物園站的公車，有些公車(如530)雖有停靠政大一站(Jason超市對面)，但不會停靠捷運動物園站，就不會被列出。\n\n";
    replyMsg += "<code><b><u>/xinguang</u></b></code>\n查看停靠新光路口站的<b>所有公車</b>到站時間。\n\n";
    replyMsg += "<code><b><u>/nccu1</u></b></code>\n查看政大一站(校門口)的<b>所有公車</b>到站時間。\n\n";
    replyMsg += "<b>⚠️ 注意</b>\n"
    replyMsg += "本服務佈署於Heroku雲端伺服器，串接PTX API取得資料後，透過Telegram Bot呈現到站資訊，資料準確性及服務穩定性可能會因為PTX API及相關雲端服務的狀況而受到影響。\n\n";
    replyMsg += "📎 專案Github\n"
    replyMsg += "https://github.com/s1031432/nccubus"
    bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
});
bot.onText(/\/server$/, (msg) => {
    var replyMsg = [];
    replyMsg.push(`伺服器上次啟動時間`);
    replyMsg.push(`<code>${getDateTime.getDateTime(serverStartTime)}</code>\n`);
    replyMsg.push(`伺服器啟動後呼叫次數`);
    replyMsg.push(`<code>${serverCalledCount}</code>\n`);
    replyMsg = replyMsg.join("\n");
    bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
});
bot.on('message', async (msg) => {
    let mode = msg.text.substring(1);
    if( Object.keys(data).indexOf(mode) > -1 ){
        serverCalledCount += 1;
        if(isStopUpdateInNight()){
            let replyMsg = "深夜時間(02:00~05:00)，到站時間停止更新。";
            bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
            bot.sendMessage(msg.chat.id, data[mode].str, {parse_mode: 'HTML'});
            return;
        }
        if(isDataUpdated(mode)){
            bot.sendMessage(msg.chat.id, data[mode].str, {parse_mode: 'HTML'});
            return;
        }
        try{
            bot.sendMessage(msg.chat.id, "資料更新中⋯", {parse_mode: 'HTML'});
            let replyMsg = await getData(mode);
            bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
        }
        catch(e){
            console.log(e);
            bot.sendMessage(msg.chat.id, `🔴 伺服器錯誤，請稍後再試。`, {parse_mode: 'HTML'});
        }
    }
    else if( !(msg.text == "/server" || msg.text == "/start") ){
        bot.sendMessage(process.env.adminID, `${msg.chat.last_name}${msg.chat.first_name}(${msg.chat.username})\n--\n${msg.text}`);
    }
});

var app = express();
var packageInfo = require('./package.json');
app.get('/', function (req, res) {
    res.json({ version: packageInfo.version, addme: "t.me/NCCU_bot" });
});
app.listen(process.env.PORT || 5000, async function () {
    for(var i=0;i<Object.keys(data).length;i++){
        await getData(Object.keys(data)[i]);
    }
    console.log(`-- ${serverStartTime} Server is running...`);
});