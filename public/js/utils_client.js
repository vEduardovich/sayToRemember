var db = (document.body) ? 1 : 0 // 익스플로러라면 true
var scroll = (window.scrollTo) ? 1 : 0 // 스크롤이 되고 있다면 true


function langCheck(kr= 'kr' ,en = 'en'){
    if(!getCookie('langPack')){
        setCookie('langPack', 'kr' , 365 * 10);
        return kr;
    } else {
        var langPack = getCookie('langPack');
        if(langPack == 'en') return en;
        else return kr;
    }
}

// 언어팩 가져오기
function langPack(){
    var en = { 
        "jsNotFoundAccount": "Couldn't find your SayToRemember Account",
        "jsMsgWrongPwd": "* Wrong password. Try again",
        "jsMsgOK": "OK!",
        "jsMsgEmailTaken": "* That username is taken. Try another.",
        "jsMsgNotValidFormat": "Not valid email format.",
        "jsMsgChar": "character: ",
        "jsMsgMoreChar": ", Use 8 or more characters.",
        "tooltipMsgLove": " likes",
        "tooltipSorting": "Sorting from newest to oldest",
        "tooltipSortingAlt": "Sorting from oldest to newest",
    };
    var kr = {
        "jsNotFoundAccount": "계정을 찾을 수가 없는데요!",
        "jsMsgWrongPwd": "* 비밀번호가 틀렸습니다.",
        "jsMsgOK": "좋아요!",
        "jsMsgEmailTaken": "* 이미 있는 이메일입니다. 다른 메일 주소가 필요합니다",
        "jsMsgNotValidFormat": "이상한 형식의 메일입니다",
        "jsMsgChar": "글자수: ",
        "jsMsgMoreChar": ", 8글자 이상을 넣으세요.",
        "tooltipMsgLove": "명이 좋아합니다",
        "tooltipSorting": "최신순",
        "tooltipSortingAlt": "과거순",
    };
    // 언어팩에 따라 클라의 스크립트 변경
    return langCheck(kr,en);
}


// 입력창의 최대길이 제한
function maxLengthCheck(input) {
    var val = input.value;
    if (val.length > input.maxLength) {
        input.value = val.slice(0, input.maxLength)
    }
}

// 쿠키 세팅
function setCookie(cName, cValue, expiredDay) {
    var dt = new Date();
    dt.setTime(dt.getTime() + (expiredDay * 24 * 60 * 60 * 1000));
    var expires = "expires=" + dt.toUTCString();
    document.cookie = cName + "=" + cValue + ";" + expires + ";path=/";
}

// 쿠키 얻어오기
function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "="
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    } else {
        begin += 2
    }
    var end = document.cookie.indexOf(";", begin);
    if (end == -1) end = dc.length;
    return unescape(dc.substring(begin + prefix.length, end));
}

// 페이지를 나갈때 스크롤 저장
function saveScroll() {
    if (!scroll) return
    // 글 수정시에는 항상 스크롤을 최상단으로 올리기위해
    if (getCookie('articleModify') == 1) {
        setCookie('articleModify', '0');
        return;
    }
    var now = new Date();
    now.setTime(now.getTime() + 365 * 24 * 60 * 60 * 1000);
    var x = (db) ? document.body.scrollLeft : pageXOffset;
    var y = (db) ? document.body.scrollTop : pageYOffset;
    setCookie("xy", x + "_" + y, now);
}

// 페이지를 열때 기존 쿠키에서 스크롤 위치 받아오기
function loadScroll() {
    if (!scroll) return
    var xy = getCookie("xy");
    if (!xy) return
    var ar = xy.split("_");
    if (ar.length == 2) scrollTo(parseInt(ar[0]), parseInt(ar[1]));
}


// 날짜구하기 모듈, 형식 '16-11-20 (오전 2:19)'
// settingTime값이
// txtDate 라면 txtWhen(게시판 날짜 표시)
// numDate 라면 numWhen() '16-11-20 (14:19)'
// dbDate 라면 dbWhen(db덤프만들때 폴더이름에 들어가는 용도) 형식은 16.11.26_11h17m
// strDate 라면 170206 클라에서 날짜를 비교해 뿌져주기 위한 용도
// strDateTxt 라면 17.02.06 Mon.
function getWhen(settingTime) {
    var dt          = new Date();
    var year        = dt.getFullYear() % 100; // 뒤에 2자리만 구하기위해
    var month       = dt.getMonth() + 1;
    var day         = dt.getDate();
    var monthEng    = '';  
    switch(month){
        case 1 :  monthEng = 'Jan'; break;
        case 2 :  monthEng = 'Feb'; break;
        case 3 :  monthEng = 'Mar'; break;
        case 4 :  monthEng = 'Apr'; break;
        case 5 :  monthEng = 'May'; break;
        case 6 :  monthEng = 'Jun'; break;
        case 7 :  monthEng = 'Jul'; break;
        case 8 :  monthEng = 'Aug'; break;
        case 9 :  monthEng = 'Sep'; break;
        case 10:  monthEng = 'Oct'; break;
        case 11:  monthEng = 'Nov'; break;
        case 12:  monthEng = 'Dec'; break;
    }
    month   = (month < 10) ? '0' + month.toString() : month.toString();
    day     = (day < 10) ? '0' + day.toString() : day.toString();
    var fullDate    = year.toString() + '.' + month.toString() + '.' + day.toString();
    var hour        = dt.getHours();
    var min         = dt.getMinutes();
    min < 10 ? min  = '0' + min.toString() : min = min.toString();
    var sec         = dt.getSeconds();
    var fullTime    = hour + ':' + min.toString();
    var fullTimeEnglish = hour + 'h' + min.toString() + 'm' + sec.toString(); // DB백업용 폴더이름
    var nowDay = dt.getDay(); // 요일 확인. 일요일 0, 월요일 1, ..., 토요일 6
    switch (nowDay) {
        case 0 : nowDay = 'Sun.'; break;
        case 1 : nowDay = 'Mon.'; break;
        case 2 : nowDay = 'Tue.'; break;
        case 3 : nowDay = 'Wed.'; break;
        case 4 : nowDay = 'Thu.'; break;
        case 5 : nowDay = 'Fri.'; break;
        case 6 : nowDay = 'Sat.'; break;
    }
    
    if (hour >= 12) {
        hour != 12 ? hour -= 12 : hour; // 12시는 오후로 표시하기위해
        hour = '오후 ' + hour.toString();
    } else {
        hour = '오전 ' + hour.toString();
    }
    var txtNum      = fullDate + ' (' + hour + ':' + min.toString() + ')';
    var numWhen     = fullDate + ' (' + fullTime + ')';
    var dbWhen      = fullDate + '_' + fullTimeEnglish; // DB백업용 폴더이름
    var strDate     = year.toString() + month.toString() + day.toString(); // 170206
    var strDateTxt  = day.toString() + '-' + monthEng + '-' + dt.getFullYear().toString() + ' ' + nowDay; // 05-Mar-2017
    switch (settingTime) {
        case 'numDate'      : return numWhen;
        case 'txtDate'      : return txtNum;
        case 'dbDate'       : return dbWhen;
        case 'strDate'      : return parseInt(strDate);
        case 'strDateTxt'   : return strDateTxt;
        default             : return Date.now();
    }
}

// 글자수 300자 체크
function checkTextArea(checkLen) {
    var checkLen        = $(checkLen);
    var checkLenInfo    = checkLen.parent().find('.checkLenInfo');
    //textarea에서 키를 입력할 때마다 동작 - 글자수 제한
    var limitTxtLen = 300;
    var msgLen = 0;
    
    msgLen = checkLen.val().length;
    if (msgLen <= limitTxtLen) {
        checkLenInfo.text('');
        checkLenInfo.css("color", "#999");
    } else {
        checkLen.val(checkLen.val().slice(0, limitTxtLen));
        checkLenInfo.css("color", "#dd1818");
        // checkLenInfo.css("color", "#dd1818").css('visibility','visible');
    }
    if( !msgLen) msgLen = 0; // grammarly 확장 모듈처럼 서비스 자체 태그를 수정하는 못된 놈들에 대비한 코드
    checkLenInfo.text(msgLen);
}

// 클라이언트에서 즉시 json파일을 저장하는 모듈. Download JSON을 클릭하면 저장이 된다.
// jsonSaveFile(저장을 원하는 json데이터, 저장 클릭을 표시하는 클라이언트 element)
function jsonSaveFile(jsonArr, elementName ){
    var toDownloadData = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataMagnitudeRatio));
    var toDownload = document.querySelector('.scriptMagnitudeRatio');
    console.log(toDownload);
    var aEle = document.createElement('a');
    aEle.href = 'data:'+ toDownloadData;
    aEle.download = 'data.json';
    aEle.text = 'Download JSON';
    toDownload.appendChild(aEle);
}