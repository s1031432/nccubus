// Telegram bot screenshot -> https://raw.githubusercontent.com/s1031432/nccubus/master/screenshot.jpg
// Add me on Telegram      -> https://t.me/NCCU_bot

// const jsSHA = require('jssha');
const request = require('request');
const fetch = require('node-fetch');
const express = require('express');
const getDateTime = require("./getDateTime.js");
const telegramBot = require('node-telegram-bot-api');
const clock = ["🕛", "🕐", "🕑", "🕒", "🕓", "🕔", "🕕", "🕖", "🕗", "🕘", "🕙", "🕚"];
// fill in your telegram token
const secret = require("./secret.json");
const client_id = secret.client_id || process.env.client_id;
const client_secret = secret.client_secret || process.env.client_secret;
const tgtoken = secret.tgtoken || process.env.tgtoken;
const bot = new telegramBot(tgtoken, {polling: true});

var tdxtoken = "";
var data = require('./busdata.json');
var serverStartTime = getDateTime.getDateTime(new Date((+new Date())+60*1000));
var serverCalledCount = 0;
var apiCalledCount = 0;

function GetAuthorizationHeader() {
    return new Promise( (resolve, reject) => { 
        request.post("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token",{
            headers: {
                "content-type": "application/x-www-form-urlencoded" 
            },
            body: `grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`,
            timeout: 1500,
            }, function(error, response, body){
                try{
                    body = JSON.parse(body);
                    // console.log(body);
                    resolve(body.access_token);
                }
                catch(e){
                    console.log(e);
                    reject(e);
                }
        });
    });
}
function requestBusData(url, tdxtoken) {
    // console.log(tdxtoken);
    return fetch(url, {
        headers: {"authorization": `Bearer ${tdxtoken}`},
        gzip: true,
        timeout: 1500,
    }).then(response => response.json());
}
function getData(mode, tdxtoken){
    return new Promise( resolve => {
        apiCalledCount += 2;
        // Call tdx API to get bus data(json)
        // More infomation: https://tdx.transportdata.tw/api-service/swagger
        
        // let NewTaipeiAPI = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/NewTaipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`;
        let NewTaipeiAPI = `https://tdx.transportdata.tw/api/advanced/v2/Bus/EstimatedTimeOfArrival/City/NewTaipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`;
        // let TaipeiApi = `https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`;
        let TaipeiApi = `https://tdx.transportdata.tw/api/advanced/v2/Bus/EstimatedTimeOfArrival/City/Taipei/PassThrough/Station/${data[mode].stationID}?%24top=30&%24format=JSON`;
        let urls = [NewTaipeiAPI, TaipeiApi];
        let promises = urls.map(url => requestBusData(url, tdxtoken));
        Promise.all(promises)
        .then( responses => {
            body = responses[0].concat(responses[1]);
            body = sortBusData(body);
            let result = [data[mode].title,"--"];
            if(mode == "zoo_nccu1" || mode == "nccu_zoo" || mode == "nccu1_zoo"){
                for(var i=0;i<body.length;i++)
                    if( (data[mode].whiteList[0].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==0)  || (data[mode].whiteList[1].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==1))
                        result.push(getEachBusContent(mode, body[i]) );
                result.push(`--`)
                for(var i=0;i<body.length;i++)
                    if( ! ((data[mode].whiteList[0].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==0)  || (data[mode].whiteList[1].indexOf(body[i].RouteName.En)>-1 && body[i].Direction==1)) )
                        result.push(getEachBusContent(mode, body[i]) );
            }
            else{
                for(var i=0;i<body.length;i++)
                    result.push( getEachBusContent(mode, body[i]) );
            }
            let nowMs = (+new Date())+60*1000;
            // update each bus data lastUpdateTime
            data[mode].lastUpdateTimeMs = nowMs;
            if( result[result.length-1] != `--`)
                result.push(`--`)
            result.push(`<code>${clock[new Date(data[mode].lastUpdateTimeMs).getHours()%12]} 資料最後更新時間\n${clock[(new Date(data[mode].lastUpdateTimeMs).getHours()+1)%12]} ${getDateTime.getDateTime(new Date(data[mode].lastUpdateTimeMs))}</code>`);
            console.log(`-- ${getDateTime.getDateTime(new Date(data[mode].lastUpdateTimeMs))} ${mode} data update`);
            // update each bus data content
            data[mode].str = result.join("\n");
            resolve(data[mode].str);
        }).catch( err => {
            console.log("-- Promise.all()", err);
            resolve(`${data[mode].str}\n<b>❗️ PTX伺服器錯誤，資料無法更新。</b>`);
        });
    });
}
function getEachBusContent(mode, body){
    let str = body.RouteName.Zh_tw;
    if(mode == `nccu1` && body.RouteName.Zh_tw == "237"){
        if(body.Direction == 0)
            str += "(往東門)";
        else
            str += "(往動物園)";
    }
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
    if( str1.length > 5 || str2.length > 5)
        return str1.length > str2.length;
    return str1 > str2;
}
function isDataUpdated(mode){
    // check data is fresh
    let nowMs = (+new Date())+60*1000;
    if( nowMs - data[mode].lastUpdateTimeMs >= 15*1000 || data[mode].str.length < 1)
        return false;
    return true;
}
function isStopUpdateAtNight(){
    // 02:00 ~ 05:00 don't call api
    let now = getDateTime.getDateTime(new Date((+new Date())+60*1000));
    let hours = now[11]+now[12];
    if((Number(hours) < 5 && Number(hours) > 1) )
        return true;
    return false;
}
bot.onText(/\/start$/, (msg) => {
    let replyMsg = [];
    replyMsg.push("/start\n介紹及指令說明。\n");
    replyMsg.push("/server\n查看伺服器狀況。\n");
    replyMsg.push("/zoo_nccu1\n查看捷運動物園站（往政大方向）的公車到站時間。上半部為<b>有停靠政大一站</b>的公車。\n");
    replyMsg.push("/nccu_zoo\n查看政大站（麥側萊爾富）的公車到站時間。上半部為<b>有停靠捷運動物園站</b>的公車。\n");
    replyMsg.push("/nccu1_zoo\n查看政大一站（Jason超市）的公車到站時間。上半部為<b>有停靠捷運動物園站</b>的公車。\n");
    replyMsg.push("/xinguang\n查看停靠新光路口站（龍角）的公車到站時間。\n");
    replyMsg.push("/nccu1\n查看政大一站（校門口）的公車到站時間。\n");
    replyMsg.push("<b>⚠️ 注意</b>");
    replyMsg.push("❗️免責聲明\n　　本服務佈署於Amazon Web Services, AWS雲端伺服器，串接運輸資料流通服務平臺Transport Data eXchange ,TDX API取得資料後，再透過Telegram Bot呈現即時到站資訊，資料準確性及服務穩定性可能會因TDX API及相關雲端服務的狀況而受到影響。\n");
    replyMsg.push("📎 專案Github");
    replyMsg.push("https://github.com/s1031432/nccubus");
    replyMsg = replyMsg.join("\n");
    bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
});
bot.onText(/\/server$/, (msg) => {
    let replyMsg = [];
    replyMsg.push(`伺服器上次啟動時間`);
    replyMsg.push(`<code>${getDateTime.getDateTime(serverStartTime)}</code>\n`);
    replyMsg.push(`啟動後API被呼叫次數`);
    replyMsg.push(`<code>${apiCalledCount}</code>\n`);
    replyMsg.push(`啟動後指令被呼叫次數`);
    replyMsg.push(`<code>${serverCalledCount}</code>\n`);
    replyMsg = replyMsg.join("\n");
    bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
});
bot.on('message', async (msg) => {
    serverCalledCount += 1;
    let mode = msg.text.substring(1);
    console.log(msg.chat);
    if( Object.keys(data).indexOf(mode) > -1 ){
        // if(isStopUpdateAtNight()){
        //     let replyMsg = `${data[mode].str}\n❗️ <code>深夜時段(02:00~05:00)\n❗️ 到站時間停止更新</code>`;
        //     bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
        //     return;
        // }
        if(isDataUpdated(mode)){
            let replyMsg = data[mode].str;
            bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
            return;
        }
        bot.sendMessage(msg.chat.id, "資料更新中⋯", {parse_mode: 'HTML'});
        if(tdxtoken==""){
            tdxtoken = await GetAuthorizationHeader();
        }
        let replyMsg = await getData(mode, tdxtoken);
        if(replyMsg == "invalid token"){
            tdxtoken = await GetAuthorizationHeader();
            let replyMsg = await getData(mode, tdxtoken);
        }
        bot.sendMessage(msg.chat.id, replyMsg, {parse_mode: 'HTML'});
    }
    bot.sendMessage(`${msg.chat.id}`, `${msg.chat.last_name}${msg.chat.first_name}(${msg.chat.username})\n--\n${msg.text}`);
});
const app = express();
app.get('/', async function (req, res) {
    res.redirect("https://t.me/NCCU_bot");
});
app.listen(5000, async function () {
    tdxtoken = await GetAuthorizationHeader();
    console.log(`-- ${serverStartTime} Server is running...`);
    for(var i=0;i<Object.keys(data).length;i++)
        await getData(Object.keys(data)[i], tdxtoken);
});