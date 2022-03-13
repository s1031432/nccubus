function initdata(){
    data = {"zoo_nccu1":{}, "nccu_zoo":{}, "nccu1_zoo":{}, "xinguang":{}, "nccu1":{}};
    // 捷運動物園站 往 政大一站
    data.zoo_nccu1.stationID = 2442;
    data.zoo_nccu1.whiteList = [];
    data.zoo_nccu1.whiteList[0] = ["Roosevelt Rd. Metro Bus", "236Shuttle", "BR6", "282", "66", "676", "611"];
    data.zoo_nccu1.whiteList[1] = ["G1", "BR18", "933"];
    data.zoo_nccu1.title = "<pre>➡️ 動物園站(往政大)";
    data.zoo_nccu1.str = "";
    data.zoo_nccu1.lastUpdateTimeMs = (+new Date())+8*60*60*1000;

    // 政大站(麥側萊爾富) 往 動物園站
    data.nccu_zoo.stationID = 2415;
    data.nccu_zoo.whiteList = [];
    data.nccu_zoo.whiteList[0] = ["933", "BR18", "G1"];
    data.nccu_zoo.whiteList[1] = ["236Shuttle", "282", "295", "295Sub", "611", "66", "679", "BR6", "Roosevelt Rd. Metro Bus"];
    data.nccu_zoo.title = "<pre>➡️ 政大站(麥側萊爾富往動物園)";
    data.nccu_zoo.str = "";
    data.nccu_zoo.lastUpdateTimeMs = (+new Date())+8*60*60*1000;

    // 政大一站(Jason前) 往 動物園站
    data.nccu1_zoo.stationID = 1001400;
    data.nccu1_zoo.whiteList = [];
    data.nccu1_zoo.whiteList[0] = ["933", "G1"];
    data.nccu1_zoo.whiteList[1] = ["Roosevelt Rd. Metro Bus", "236Shuttle", "237", "66"];
    data.nccu1_zoo.title = "<pre>➡️ 政大一站(Jason對面往動物園)";
    data.nccu1_zoo.str = "";
    data.nccu1_zoo.lastUpdateTimeMs = (+new Date())+8*60*60*1000;

    // 新光路口站的所有公車
    data.xinguang.stationID = 1000854;
    data.xinguang.whiteList = [];
    data.xinguang.whiteList[0] = ["Roosevelt Rd. Metro Bus", "236Shuttle", "282", "295", "295Sub", "530", "611", "66", "676", "679", "BR11", "BR11Sub", "BR3", "BR6"];
    data.xinguang.whiteList[1] = ["933", "S10", "S10Shuttle", "BR5", "G1"];
    data.xinguang.title = "<pre>➡️ 新光路口(龍角前)";
    data.xinguang.str = "";
    data.xinguang.lastUpdateTimeMs = (+new Date())+8*60*60*1000;

    // 政大一(校門前)的所有公車
    data.nccu1.stationID = 1001409;
    data.nccu1.whiteList = [];
    data.nccu1.whiteList[0] = ["Roosevelt Rd. Metro Bus", "236Shuttle", "237", "282", "530", "611", "66", "676", "BR6"];
    data.nccu1.whiteList[1] = ["933", "G1"];
    data.nccu1.title = "<pre>➡️ 政大一(校門前)";
    data.nccu1.str = "";
    data.nccu1.lastUpdateTimeMs = (+new Date())+8*60*60*1000;

    return data;
}
exports.initdata = initdata;