// Telegram bot screenshot -> https://raw.githubusercontent.com/s1031432/nccubus/master/screenshot.jpg
// Add me on Telegram      -> https://t.me/NCCU_bot

const jsSHA = require('jssha');
const fetch = require('node-fetch');
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
function requestBusData(url) {
    return fetch(url, {
        headers: GetAuthorizationHeader(),
        gzip: true,
        timeout: 1500,
    }).then(response => response.json());
}
function getData(mode){
    return new Promise( resolve => { 
        // Call ptx API to get bus data(json)
        // More infomation: https://ptx.transportdata.tw/MOTC/?urls.primaryName=%E5%85%AC%E8%BB%8AV2#/Bus%20Advanced(By%20Station)/CityBusApi_EstimatedTimeOfArrival_ByStation_2880
        let NewTaipeiAPI = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/NewTaipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`;
        let TaipeiApi = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`;
        let urls = [NewTaipeiAPI, TaipeiApi];
        let promises = urls.map(url => requestBusData(url));
        Promise.all(promises)
        .then( responses => {
            body = responses[0].concat(responses[1]);
            body = sortBusData(body);
            // console.log(body);
            let result = [data[mode].title,"--"];
            if(mode == "xinguang" || mode == "nccu1"){
                for(var i=0;i<body.length;i++)
                    result.push( getEachBusContent(body[i]) );
            }
            else{
                for(var i=0;i<body.length;i++)
                    if( (data[mode].whiteList[0].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==0)  || (data[mode].whiteList[1].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==1))
                        result.push( getEachBusContent(body[i]) );
                result.push(`--`)
                for(var i=0;i<body.length;i++)
                    if( ! ((data[mode].whiteList[0].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==0)  || (data[mode].whiteList[1].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==1)) )
                        result.push( getEachBusContent(body[i]) );
            }
            let nowMs = (+new Date())+8*60*60*1000;
            // update each bus data lastUpdateTime
            data[mode].lastUpdateTimeMs = nowMs;
            if( result[result.length-1] != `--`)
                result.push(`--`)
            result.push(`<code>資料最後更新時間\n${getDateTime.getDateTime(new Date(data[mode].lastUpdateTimeMs))}</code>`);
            console.log(`-- ${getDateTime.getDateTime(new Date(data[mode].lastUpdateTimeMs))} ${mode} data update`);
            // update each bus data content
            data[mode].str = result.join("\n");
            resolve(data[mode].str);
        }).catch( err => {
            console.log("-- Promise.all()", err);
            resolve(`${data[mode].str}\n❗️ PTX伺服器錯誤，資料無法更新。`);
        });
    });
}
function getEachBusContent(body){
    let str = `${body.RouteName.Zh_tw}`;
    if(body.StopStatus == 0){
        if(body.EstimateTime >= 30)
            str = body.EstimateTime < 120 ? `✅ ${str} - 即將進站` : `✅ ${str} - 約${parseInt(body.EstimateTime/60)}分`;
        else if(body.EstimateTime < 30)
            str = `✅ ${str} - 進站中`;
    }
    else if(body.StopStatus == 1){
        if(body.EstimateTime >= 30)
            str = body.EstimateTime < 120 ? `✅ ${str} - 即將進站` : `✅ ${str} - 約${parseInt(body.EstimateTime/60)}分(尚未發車)`;
        else if(body.EstimateTime < 30)
            str = `✅ ${str} - 進站中`;
        else if(body.EstimateTime == undefined)
            str = `💤 ${str} - 尚未發車`;
    }
    else if(body.StopStatus == 2)
        str = `⚠️ ${str} - 交管不停靠`;
    else if(body.StopStatus == 3)
        str = `❌ ${str} - 末班車已過`;
    else if(body.StopStatus == 4)
        str = `❌ ${str} - 今日未營運`;
    if(body.IsLastBus)
        str += ` 🔴末班車！`;
    return str;
}
function sortBusData(body){
    // sort data by StopStatus & EstimateTime
    // --sort by StopStatus
    var temp = "for swap";
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if( body[i].StopStatus > body[j].StopStatus){
                temp = body[i];
                body[i] = body[j];
                body[j] = temp;
            }
        }
    }
    // --sort by EstimateTime undefined or not undefined
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if( (body[i].EstimateTime == undefined && body[j].EstimateTime != undefined) ){
                temp = body[i];
                body[i] = body[j];
                body[j] = temp;
            }
        }
    }
    // --sort by EstimateTime
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if(body[j].EstimateTime < body[i].EstimateTime){
                temp = body[i];
                body[i] = body[j];
                body[j] = temp;
            }
        }
    }
    for(var i=0;i<body.length-1;i++){
        for(var j=i+1;j<body.length;j++){
            if( (body[i].EstimateTime == undefined && body[j].EstimateTime == undefined || parseInt(body[i].EstimateTime/60) == parseInt(body[j].EstimateTime/60)) && ( body[i].StopStatus == body[j].StopStatus ) ){
            // if( ( body[i].StopStatus > 0 && body[j].StopStatus > 0 && body[i].StopStatus == body[j].StopStatus && body[i].EstimateTime == undefined && body[j].EstimateTime == undefined ) || ( body[i].StopStatus == 0 && body[j].StopStatus == 0 && parseInt(body[i].EstimateTime/60) == parseInt(body[j].EstimateTime/60) ) ){
                if( isStr1BiggerThanStr2(body[i].RouteName.Zh_tw, body[j].RouteName.Zh_tw) ){
                    temp = body[i];
                    body[i] = body[j];
                    body[j] = temp;
                }
            }
        }
    }
    return body;
}
function isStr1BiggerThanStr2(str1, str2){
    // "66", "676"
    if( !( isNaN( parseInt(str1) ) || isNaN( parseInt(str2) ) ) ){
        if( !isNaN(str1) && !isNaN(str2) )
            return parseInt(str1) > parseInt(str2);
        if(parseInt(str1) == parseInt(str2))
            return str1.length > str2.length
        return parseInt(str1) > parseInt(str2)
    }
    // "綠1", "66"
    if( (isNaN(str1) && !isNaN(str2)) || (!isNaN(str1) && isNaN(str2)) )
        return isNaN(str1);
    // "棕6", "棕8", "通勤21", "通勤22"
    if( str1[0] == str2[0] )
        return isStr1BiggerThanStr2(str1.substring(1), str2.substring(1));
    // "綠1", "棕9"
    return str1 > str2;    
}
function isDataUpdated(mode){
    // check data is fresh
    let nowMs = (+new Date())+8*60*60*1000;
    if( nowMs - data[mode].lastUpdateTimeMs >= 15*1000 || data[mode].str.length < 1)
        return false;
    return true;
}
function isStopUpdateAtNight(){
    // 02:00 ~ 05:00 don't call api
    let now = getDateTime.getDateTime(new Date((+new Date())+8*60*60*1000));
    let hours = now[11]+now[12];
    if((Number(hours) < 5 && Number(hours) > 1) )
        return true;
    return false;
}
bot.onText(/\/start$/, (msg) => {
    let replyMsg = [];
    replyMsg.push("<code><b><u>/start</u></b></code>\n介紹及指令說明。\n");
    replyMsg.push("<code><b><u>/server</u></b></code>\n查看伺服器狀況。\n");
    replyMsg.push("<code><b><u>/zoo_nccu1</u></b></code>\n查看捷運動物園站（往政大方向）的公車到站時間。上半部為<b>有停靠政大一站</b>的公車。\n");
    replyMsg.push("<code><b><u>/nccu_zoo</u></b></code>\n查看政大站（麥側萊爾富）的公車到站時間。上半部為<b>有停靠捷運動物園站</b>的公車。\n");
    replyMsg.push("<code><b><u>/nccu1_zoo</u></b></code>\n查看政大一站（Jason超市）的公車到站時間。上半部為<b>有停靠捷運動物園站</b>的公車。\n");
    replyMsg.push("<code><b><u>/xinguang</u></b></code>\n查看停靠新光路口站（龍角）的公車到站時間。\n");
    replyMsg.push("<code><b><u>/nccu1</u></b></code>\n查看政大一站（校門口）的公車到站時間。\n");
    replyMsg.push("<b>⚠️ 注意</b>");
    replyMsg.push("本服務佈署於Heroku雲端伺服器，串接PTX API取得資料後，透過Telegram Bot呈現到站資訊，資料準確性及服務穩定性可能會因為PTX API及相關雲端服務的狀況而受到影響。\n");
    replyMsg.push("📎 專案Github");
    replyMsg.push("https://github.com/s1031432/nccubus");
    replyMsg = replyMsg.join("\n");
    bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
});
bot.onText(/\/server$/, (msg) => {
    let replyMsg = [];
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
        if(isStopUpdateAtNight()){
            let replyMsg = "深夜時間(02:00~05:00)，到站時間停止更新。";
            bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
        }
        if(isDataUpdated(mode)){
            bot.sendMessage(msg.chat.id, data[mode].str, {parse_mode: 'HTML'});
            return;
        }
        bot.sendMessage(msg.chat.id, "資料更新中⋯", {parse_mode: 'HTML'});
        let replyMsg = await getData(mode);
        bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
    }
    else if( !(msg.text == "/server" && msg.text == "/start") ){
        bot.sendMessage(process.env.adminID, `${msg.chat.last_name}${msg.chat.first_name}(${msg.chat.username})\n--\n${msg.text}`);
    }
});
const app = express();
app.get('/', async function (req, res) {
    for(var i=0;i<Object.keys(data).length;i++)
        await getData(Object.keys(data)[i]);
    res.redirect("https://t.me/NCCU_bot");
});
app.listen(process.env.PORT || 5000, async function () {
    for(var i=0;i<Object.keys(data).length;i++)
        await getData(Object.keys(data)[i]);
    console.log(`-- ${serverStartTime} Server is running...`);
});