<div align="center">
    <img src="https://img.shields.io/github/languages/code-size/s1031432/nccubus">
    <img src="https://img.shields.io/github/repo-size/s1031432/nccubus">
    <img src="https://img.shields.io/github/package-json/v/s1031432/nccubus">
    <img src="https://img.shields.io/github/languages/top/s1031432/nccubus">
    <br>
    <img src="https://img.shields.io/github/forks/s1031432/nccubus">
    <img src="https://img.shields.io/github/stars/s1031432/nccubus">
    <img src="https://img.shields.io/github/commit-activity/w/s1031432/nccubus">
    <img src="https://img.shields.io/github/license/s1031432/nccubus">
    <img src="https://img.shields.io/github/last-commit/s1031432/nccubus">
    <img src="https://img.shields.io/github/issues/s1031432/nccubus">
    <br>
    <img src="https://img.shields.io/badge/Node.js-v14.18.1-brightgreen">
    <img src="https://img.shields.io/badge/Express-v4.17.3-brightgreen">
    <img src="https://img.shields.io/badge/jssha-v3.2.0-brightgreen">
    <img src="https://img.shields.io/badge/node--telegram--bot--api-v0.56.0-brightgreen">
</div>
<!-- PROJECT LOGO -->
<div align="center">
  <p align="center">
    <br />
    <a href="https://t.me/NCCU_bot">Demo on Telegram</a>
    ·
    <a href="mailto:108753132@nccu.edu.tw">Report bug or feature</a>
  </p>
</div>

<!-- ABOUT THE PROJECT -->
## About The Project
政大常用公車路線查詢(Telegram Bot)

## Telegram Bot Command List
<table>
    <tr>
        <td>Command</td><td>Describe</td>
    </tr>
    <tr>
        <td><b><u><a>/start</a></u></b></td><td>介紹及指令說明。</td>
    </tr>
    <tr>
        <td><b><u><a>/server</a></u></b></td><td>查看伺服器狀況。</td>
    </tr>
    <tr>
        <td><b><u>/zoo_nccu1</u></b></td><td>查看捷運動物園站到政大一站（校門口）公車到站時間。只會顯示有停靠政大一站的公車，有些公車（如295, 679）雖不停靠政大一站（校門口），但<b>會停靠新光路口</b>，或是<b>極度繞路（如棕11）</b>，就不會被列出。</td>
    </tr>
    <tr><td><b><u>/nccu_zoo</u></b></td><td>查看政大站（麥側萊爾富）到捷運動物園站的公車到站時間。查看政大站（麥側萊爾富）到捷運動物園站的公車到站時間。有些公車（如530）雖有停靠政大站（麥側萊爾富），但<b>不會停靠捷運動物園站</b>，或是<b>極度繞路（如棕11）</b>，就不會被列出。</td></tr>
    <tr><td><b><u>/nccu1_zoo</u></b></td><td>查看政大一站（Jason超市對面）到捷運動物園站的公車到站時間。只會顯示會停靠捷運動物園站的公車，有些公車（如530）雖會停靠政大一站（Jason超市對面），但<b>不會停靠捷運動物園站</b>，就不會被列出。</td></tr>
    <tr><td><b><u>/xinguang</u></b></td><td>查看停靠新光路口站（龍角前）的所有公車到站時間。</td></tr>
    <tr><td><b><u>/nccu1</u></b></td><td>查看政大一站（校門口）的所有公車到站時間。</td></tr>
</table>

## Built With

* [Telegram](https://web.telegram.org/k/)
* [Heroku](https://dashboard.heroku.com/)
* [Node.js](https://nodejs.org/en/)
* [Express](https://expressjs.com/zh-tw/)
* [PTX API](https://ptx.transportdata.tw/PTX/)

<!-- GETTING STARTED -->
## Getting Started

### Create a Telegram bot 
[BotFather](https://t.me/botfather)

### Sign up and get ptx API ID&Key
[PTX API](https://ptx.transportdata.tw/PTX/)

### Run Telegram bot on local server or you can deploy to the Cloud
#### don't forget to change Telegram Bot Token, PTX APPKEY & APPID
```sh
    git clone git@github.com:s1031432/nccubus.git
    cd nccubus
    npm install
    npm start
```
### Demo on Telegram screenshot
<img src="https://i.imgur.com/ako16i7.jpg" alt="screenshot" style="width:360px;"/>
<img src="https://i.imgur.com/vEQqufy.jpg" alt="qrcode" style="width:360px;"/>

<!-- CONTACT -->
## Contact

黃翊唐 - [Facebook](https://fb.com/ty80517) - 108753132@nccu.edu.tw
