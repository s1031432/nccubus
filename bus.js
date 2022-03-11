// Telegram bot screenshot -> https://i.imgur.com/wMiFkQe.jpg
// Add me on Telegram      -> https://t.me/NCCU_bot

const jsSHA = require('jssha');
const axios = require('axios');
const express = require('express');
const getDateTime = require("./getDateTime.js");
const telegramBot = require('node-telegram-bot-api');
// fill in your telegram token
const token = process.env.telegramtoken;
const bot = new telegramBot(token, {polling: true});
// Set bus list:
// _0 -> The bus departs from the station
// _1 -> The bus returns to the station

// 捷運動物園站 往 政大一站
const zoo_nccu1_0 = ["Roosevelt Rd. Metro Bus", "236Shuttle", "BR6", "282", "66", "676", "611"]     // GO
const zoo_nccu1_1 = ["G1", "BR18", "933"]                                                           // Return
// 政大站 往 動物園站
const nccu_zoo_0 = ["933", "BR18", "G1"];
const nccu_zoo_1 = ["236Shuttle", "282", "295", "295Sub", "611", "66", "679", "BR6", "Roosevelt Rd. Metro Bus"];
// 政大一站 往 動物園站
const nccu1_zoo_0 = ["933", "G1"];
const nccu1_zoo_1 = ["Roosevelt Rd. Metro Bus", "236Shuttle", "237", "66"];
// 新光路口站的所有公車
const xinguang_0 = ["Roosevelt Rd. Metro Bus", "236Shuttle", "282", "295", "295Sub", "530", "611", "66", "676", "679", "BR11", "BR11Sub", "BR3", "BR6"];
const xinguang_1 = ["933", "S10", "S10Shuttle", "BR5", "G1"];

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

var zoo_nccu1_data = "";
var nccu_zoo_data = "";
var nccu1_zoo_data = "";
var xinguang_data = "";

function getData(mode){
    console.log(`getData(${mode});`)
    if(mode == "zoo_nccu1"){
        var stationID = 2442;
        var whiteList0 = zoo_nccu1_0;
        var whiteList1 = zoo_nccu1_1;
        var str = "<pre>➡️ 動物園站(往政大)";
    }
    else if(mode == "nccu_zoo"){
        var stationID = 2415;
        var whiteList0 = nccu_zoo_0;
        var whiteList1 = nccu_zoo_1;
        var str = "<pre>➡️ 政大站(往動物園)";
    }
    else if(mode == "nccu1_zoo"){
        var stationID = 1001400;
        var whiteList0 = nccu1_zoo_0;
        var whiteList1 = nccu1_zoo_1;
        var str = "<pre>➡️ 政大一站(往動物園)";
    }
    else if(mode == "xinguang"){
        var stationID = 1000854;
        var whiteList0 = xinguang_0;
        var whiteList1 = xinguang_1;
        var str = "<pre>➡️ 新光路口(龍角前)";
    }
    // Call ptx API to get bus data(json)
    // More infomation: https://ptx.transportdata.tw/MOTC/?urls.primaryName=%E5%85%AC%E8%BB%8AV2#/Bus%20Advanced(By%20Station)/CityBusApi_EstimatedTimeOfArrival_ByStation_2880
    axios.get(`https://ptx.transportdata.tw/MOTC/v2/Bus/EstimatedTimeOfArrival/City/Taipei/PassThrough/Station/${stationID}?%24top=30&%24format=JSON`,{
        headers: GetAuthorizationHeader(),
    }).then((res)=>{
        // console.log(res.data);
        // v--- sort by StopStatus & EstimateTime ---v
        for(var i=0;i<res.data.length-1;i++){
            for(var j=i+1;j<res.data.length;j++){
                if( (res.data[i].EstimateTime == undefined && res.data[j].EstimateTime != undefined) || (res.data[i].StopStatus > 1 && res.data[j].StopStatus < 2) ){
                    var temp = res.data[i];
                    res.data[i] = res.data[j];
                    res.data[j] = temp;
                }
            }
        }
        for(var i=0;i<res.data.length-1;i++){
            for(var j=i+1;j<res.data.length;j++){
                if(res.data[j].EstimateTime < res.data[i].EstimateTime){
                    var temp = res.data[i];
                    res.data[i] = res.data[j];
                    res.data[j] = temp;
                }
            }
        }
        // ^--- sort by StopStatus & EstimateTime ---^
        let result = [str,"--"];
        for(var i=0;i<res.data.length;i++){
            if( (whiteList0.indexOf(res.data[i].RouteName.En)>-1 && res.data[i].Direction==0)  || (whiteList1.indexOf(res.data[i].RouteName.En)>-1 && res.data[i].Direction==1)){
                str = `${res.data[i].RouteName.Zh_tw}`;
                if(res.data[i].StopStatus == 0){
                    str = res.data[i].EstimateTime < 180 ? `✅ ${str} - 即將進站` : `✅ ${str} - 約${parseInt(res.data[i].EstimateTime/60)}分`;
                }
                else if(res.data[i].StopStatus == 1){
                    if(res.data[i].EstimateTime){
                        str = res.data[i].EstimateTime < 180 ? `✅ ${str} - 即將進站` : `✅ ${str} - 約${parseInt(res.data[i].EstimateTime/60)}分（尚未發車）`;
                    }
                    else if(res.data[i].EstimateTime == undefined){
                        str = `💤 ${str} - 尚未發車`;
                    }
                }
                else if(res.data[i].StopStatus == 2){
                    str = `⚠️ ${str} - 交管不停靠`;
                }
                else if(res.data[i].StopStatus == 3){
                    str = `❌ ${str} - 末班車已過`;
                }
                else if(res.data[i].StopStatus == 4){
                    str = `❌ ${str} - 今日未營運`;
                }
                if(res.data[i].IsLastBus){
                    str += ` 🔴末班車！`;
                }
                result.push(str);
            }
        }
        result.push(`--`);
        result.push(`資料最後更新時間：\n${getDateTime.getDateTime(new Date(((+new Date())+8*60*60*1000)))}`);
        console.log(`${mode} data update</pre>`)
        if(mode == "zoo_nccu1"){
            zoo_nccu1_data = result.join("\n");
        }
        else if(mode == "nccu_zoo"){
            nccu_zoo_data = result.join("\n");
        }
        else if(mode == "nccu1_zoo"){
            nccu1_zoo_data = result.join("\n");
        }
        else if(mode == "xinguang"){
            xinguang_data = result.join("\n");
        }
    });
}
bot.onText(/\/start$/, (msg) => {
    console.log(msg);
    const chatId   = msg.chat.id;
    let   replyMsg = `Hi, ${msg.chat.last_name}${msg.chat.first_name}(${msg.chat.username})\nmsg.chat.id:${chatId}`
    bot.sendMessage(chatId, replyMsg);
});
bot.onText(/\/zoo_nccu1$/, (msg) => {
    bot.sendMessage(msg.chat.id, zoo_nccu1_data, {parse_mode: 'HTML'});
});
bot.onText(/\/nccu_zoo$/, (msg) => {
    bot.sendMessage(msg.chat.id, nccu_zoo_data, {parse_mode: 'HTML'});
});
bot.onText(/\/nccu1_zoo$/, (msg) => {
    bot.sendMessage(msg.chat.id, nccu1_zoo_data, {parse_mode: 'HTML'});
});
bot.onText(/\/xinguang$/, (msg) => {
    bot.sendMessage(msg.chat.id, xinguang_data, {parse_mode: 'HTML'});
});
getData("zoo_nccu1");
getData("nccu_zoo");
getData("nccu1_zoo");
getData("xinguang");
setInterval(getData, 20000, "zoo_nccu1");
setInterval(getData, 20000, "nccu_zoo");
setInterval(getData, 20000, "nccu1_zoo");
setInterval(getData, 20000, "xinguang");

var app = express();
var packageInfo = require('./package.json');
app.get('/', function (req, res) {
    res.json({ version: packageInfo.version });
});
app.listen(process.env.PORT || 5000, function () {
    console.log('Server is running...');
});