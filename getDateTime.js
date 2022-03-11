function getDateTime(TS) {
    var D = new Date(TS);
    var y = D.getFullYear();
    var M = (D.getMonth() + 1);
    if (M == '0' || M == '1' || M == '2' || M == '3' || M == '4' || M == '5' || M == '6' || M == '7' || M == '8' || M == '9')
        M = "0" + M;
    var d = D.getDate();
    if (d == '0' || d == '1' || d == '2' || d == '3' || d == '4' || d == '5' || d == '6' || d == '7' || d == '8' || d == '9')
        d = "0" + d;
    var h = ((D.getHours()) % 24);
    if (h == '0' || h == '1' || h == '2' || h == '3' || h == '4' || h == '5' || h == '6' || h == '7' || h == '8' || h == '9')
        h = "0" + h;
    var m = D.getMinutes();
    if (m == '0' || m == '1' || m == '2' || m == '3' || m == '4' || m == '5' || m == '6' || m == '7' || m == '8' || m == '9')
        m = "0" + m;
    var s = D.getSeconds();
    if (s == '0' || s == '1' || s == '2' || s == '3' || s == '4' || s == '5' || s == '6' || s == '7' || s == '8' || s == '9')
        s = "0" + s;
    var DateTime = y + '/' + M + '/' + d + ' ' + h + ':' + m + ':' + s;
    return DateTime;
}
exports.getDateTime = getDateTime;