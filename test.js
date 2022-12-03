// 108753132-c5cbe95a-5f45-463f
// 7a4778be-5ebe-49d3-92de-718e6ae0ebd4

// curl --request 'POST' 
//     --url 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token' 
//         --header 'content-type: application/x-www-form-urlencoded' 
//         --data grant_type=client_credentials 
//         --data client_id=108753132-c5cbe95a-5f45-463f 
//         --data client_secret=7a4778be-5ebe-49d3-92de-718e6ae0ebd4



const request = require('request');

var tdxtoken = "";

function GetAuthorizationHeader() { 
    return new Promise( (resolve, reject) => { 
        request.post("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token",{
            headers: {
                "content-type": "application/x-www-form-urlencoded" 
            },
            body: `grant_type=client_credentials&client_id=108753132-c5cbe95a-5f45-463f&client_secret=7a4778be-5ebe-49d3-92de-718e6ae0ebd4`,
            timeout: 1500,
            }, function(error, response, body){
                try{
                    body = JSON.parse(body);
                    // console.log(body);
                    resolve(body);
                }
                catch(e){
                    console.log(e);
                    reject(e);
                }
        });
    });
}

async function getData(tdxtoken){
    return new Promise( (resolve, reject) => { 
        request(`https://tdx.transportdata.tw/api/advanced/v2/Bus/EstimatedTimeOfArrival/City/Taipei/PassThrough/Station/2415?%24top=30&%24format=JSON`,{
                headers: {"authorization": `Bearer ${tdxtoken}`},
                gzip: true,
                timeout: 1500,
            }, function(error, response, body){
                if(body.match("invalid token")){
                    console.log("ASDASD")
                    reject("invalid token");
                }
                else{
                    resolve(JSON.parse(body));
                }
        })
    })
}

async function main(){
    if(tdxtoken == ""){
        auth = GetAuthorizationHeader();
        tdxtoken = auth.access_token;
        result = await getData(tdxtoken);
        console.log(result);
    }
}

main();