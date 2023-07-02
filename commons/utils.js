const sha256        = require('sha256'); // 암호화 sha256 사용
const ip            = require('ip');
const useragent     = require('useragent');
const config        = require('../commons/config'); // 설정
const uitls_db			= require('./utils_db')
const DB_userAccount= require('../models/userAccount'); // 회원 계정 DB


// 랜덤 수 만들기
const randRange = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 날짜 차이 구하기. 매년 1월 1일부터 계산한 날짜수.
exports.term = (studyDay) => {
	const thisYear  = new Date().getFullYear();
	const firstDay  = new Date ( thisYear, 0, 1 ) ;
	const term    = Math.ceil((studyDay - firstDay) / ( 60 * 60 * 24 * 1000 ));
	return term;
}

// UID 만들기
exports.uid = (strLen)=> {
	let strUID = new String;
	let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	while (strLen > 0) {
		strUID += alphabet.charAt(randRange(0, alphabet.length - 1));
		strLen--
	}
	return strUID;
}

exports.sha256 = sha256;

// 날짜구하기 모듈, 형식 '16-11-20 (오전 2:19)'
exports.getWhen = (settingTime, dt = new Date()) => {
	// let dt          = new Date();
	let year        = dt.getFullYear() % 100; // 뒤에 2자리만 구하기위해
	let month       = dt.getMonth() + 1;
	let day         = dt.getDate();
	let monthEng    = '';
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
	month < 10 ? month = '0' + month.toString() : month = month.toString();
	day < 10 ?   day = '0' + day.toString()     : day = day.toString();
	let fullDate    = year.toString() + '.' + month.toString() + '.' + day.toString();
	let hour        = dt.getHours();
	let min         = dt.getMinutes();
	min < 10 ? min  = '0' + min.toString() : min = min.toString();
	let sec         = dt.getSeconds();
	let fullTime    = hour + ':' + min.toString();
	let fullTimeEnglish = hour + 'h' + min.toString() + 'm' + sec.toString(); // DB백업용 폴더이름
	let nowDay = dt.getDay(); // 요일 확인. 일요일 0, 월요일 1, ..., 토요일 6
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
	let txtNum      = fullDate + ' (' + hour + ':' + min.toString() + ')';
	let numWhen     = fullDate + ' (' + fullTime + ')';
	let dbWhen      = fullDate + '_' + fullTimeEnglish; // DB백업용 폴더이름
	let strDate     = year.toString() + month.toString() + day.toString(); // 170206
	let strDateTxt  = day.toString() + '-' + monthEng + '-' + dt.getFullYear().toString() + ' ' + nowDay; // 05-Mar-2017
	switch (settingTime) {
		case 'numDate'      : return numWhen;
		case 'txtDate'      : return txtNum;
		case 'dbDate'       : return dbWhen;
		case 'strDate'      : return parseInt(strDate);
		case 'strDateTxt'   : return strDateTxt;
		default             : return Date.now();
	}
}

// 지난 날짜에 따라 게시판 글에 New 아이콘 붙이기
exports.makeNewIcon = (item, day) => {
	var nowDate = Date.now();
	if ((nowDate - item.updatedAt) < 1000 * 60 * 60 * 24 * day) {
		return true;
	}
}

// 배열에 clean() 메서드 추가. 만약 clean('')와 같이 사용할 경우 배열내 ''값은 모두 제거된다.
Array.prototype.clean = function (deleteValue) {
	for (var i = 0; i < this.length; i++) {
		if (this[i] == deleteValue) {
			this.splice(i, 1);
			i--;
		}
	}
	return this;
};


exports.funcIsSignedIn = (req, res, next) => {
	
	if ( req.isAuthenticated() ){
		req.isSignedIn = true;
		// DB_userAccount.findById( req.signedCookies.id_c , ( err, userAccount ) =>{
			DB_userAccount.findById( req.user.id , ( err, userAccount ) =>{
				if( !userAccount ) {
					try{
						res.clearCookie('tokens');
					} catch(e){ console.log('There is no tokens');}
					next();
				} else {
					console.log('여기는 일반로그인');
					// 이전에는 funcIsSignedIn()이 각 route 파일마다 들어있었다. 그래서 관리가 어려웠다.
					// 이에 utils.js에 이 함수를 넣고 exports하여 사용하도록 바꿨다.
					// 일단은 유저의 tags정보만 세션으로 넘겨 언제나 사용가능하게 했다. 18.04.30
					// 나중에 프로필 사진이나 중요한 유저 정보들이 항상 필요할 경우 이 함수에 session으로 넣어 처리하자.
					
					if(!req.session.isSignedIn)	req.session.isSignedIn = true;
					if(!req.session.nickname)	req.session.nickname = userAccount.nickname; // 해당 유저의 nickname을 넘겨준다
					if(!req.session.levelScore) req.session.levelScore = userAccount.stat.levelScore;// 해당유저의 levelScore
					if(!req.session.level) req.session.level = userAccount.stat.level;// 해당유저의 levelScore
					// req.user.id 안에 해당 유저의 id가 들어있다. 따라서 따로 myID같은 세션을 만들 필요가 없다
					req.session._garbage = Date();
					req.session.touch();
				}
		})
		next();
	} else {
		console.log('로그인 상태가 아냐');
		if ( req.signedCookies.id_c ) {
			console.log('쿠키를 이용해 로그인');
			DB_userAccount.findById( req.signedCookies.id_c , ( err, userAccount ) =>{
				if( !userAccount ) {
					try{
						console.log('1');
						res.clearCookie('id_c');
						res.clearCookie('token');

					} catch (e){ console.log('There is no cookies');}
					next();
				} else {
					// let token_idx   = userAccount.tokens.findIndex( e => e.token === req.signedCookies.token ); // token 값을 읽어와서
					const agent = useragent.parse(req.headers['user-agent']);
					const osInfo = agent.os.toString() + agent.device.toString() + agent.family.toString();

					const userTokenVal = exports.sha256(exports.uid(16));
					const userToken = { os_info : osInfo , tokenVal : userTokenVal, ip : ip.address(), date : Date.now(), date_txt : exports.getWhen('txtDate') };
					const machine_idx   = userAccount.tokens.findIndex( e => e.os_info == osInfo && e.tokenVal == req.signedCookies.token ); // token 값을 읽어와서
					// const machine_idx   = userAccount.tokens.map( e => console.log('e.tokenVal: '+ e.tokenVal) ); // token 값을 읽어와서

					console.log('2');
					console.log(4444);
					if ( machine_idx !== -1 ){ // 유저가 해당 기기의 정보를 가지고 있다면
						req.login( userAccount, (err)=>{ // 자동 로그인 시켜야지.
							console.log('자동로그인 성공!');
							console.log('5'); // 아래 코드는 로그인 할때마다 새로운 token을 생성하는 작업
							userAccount.tokens.splice( machine_idx , 1 ); // 유저 DB에서 기존 token을 삭제
							userAccount.counting_signin++;
							userAccount.tokens.push( userToken ); 
							req.session.cookie.maxAge = config.cookie.token.opt10y.maxAge;
							// res.clearCookie('token'); // PC에서 해당 token을 삭제
							res.cookie('token', userTokenVal , config.cookie.token.opt10y); // PC에 새로 생성한 token입력
							userAccount.markModified('tokens');
							userAccount.save();

							userAccount.os_info = osInfo;
							userAccount.userTokenVal = userTokenVal;
							uitls_db.DB_signInOutFuc(userAccount, true, true);//로그인 정보를 db에 넣기

							if(!req.session.isSignedIn)	req.session.isSignedIn = true; // 로그인 세션을 만든다. 이걸 이제서야 만들다디. 18.10.25
							if(!req.session.nickname)	req.session.nickname = userAccount.nickname; // 해당 유저의 nickname을 넘겨준다
							if(!req.session.levelScore) req.session.levelScore = userAccount.stat.levelScore;// 해당유저의 levelScore
							if(!req.session.level) req.session.level = userAccount.stat.level;// 해당유저의 levelScore
							
							next();
							// res.redirect('/');
						} )
					} else { // userID는 있는데 id_c가 일치하지 않는다면
						console.log('3');
							res.clearCookie('id_c');  // 토큰을 지워야지
							res.clearCookie('token');
							next();
					}
				}
			})
		} else{
			console.log('4');
			res.clearCookie('id_c');  // 토큰을 지워야지
			res.clearCookie('token');
			next();
		}
	}

}

exports.funIsAlwaysSignin = (req, res, next)=> { // 항상 로그인 옵션을 활성화 했는지 아닌지 ?= 즉, queryString으로 보내준다. 이걸 저장하는 모듈이다.
	req.session.isAlwaysSignIn = req.query.isAlwaysSignIn;  // session에 저장하여 token저장을 막기위해
	req.session.save();
	next();
}


// 닉네임 만드는 모듈
exports.makeNickname = (makingNick, i)=>{
	let lastNick;
	if(i==0){ // 처음 닉넴을 만들어 중복확인할때
		function addUid(makingNick){
			makingNick = makingNick + exports.uid(4);
			makingNick = makingNick.slice(0, 5);
			return makingNick;
		}
		if ( makingNick.length <= 4){
			lastNick = addUid(makingNick);
		} else {
			lastNick = makingNick;
		}
	} else{ // 이미 중복된 닉넴이 있어 한번 더 닉넴을 만들어 확인할때
		lastNick = makingNick + exports.uid(1);
	}
	return lastNick;
}

// 닉넴이 중복하지 않을 때까지 반복하는 모듈
exports.decideNickname = (tmpNick, i, callback)=> {
		const query = DB_userAccount.findOne({nickname: tmpNick});
		const promise = query.exec();

		promise.then((foundNick)=>{
				i++;
				if (foundNick){
						tmpNick = exports.makeNickname(tmpNick, i);
						// 재귀함수로 nickname이 중복 안될때까지 돌린다.
						return exports.decideNickname( tmpNick, i, callback); // return을 하면 mongodb의 duplicate key 에러가 뜨지 않는다.
				}else{
						console.log('중복된게 없다');
				}
				return callback(tmpNick);
		}  )
}