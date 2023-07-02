// db 및 문장 저장에 특화된 공용 모듈
const request       = require('request');
const ip            = require('ip');
const mongoose      = require('mongoose');
const config        = require('../commons/config'); // 설정

const fs            = require('fs');
const natural 			= require("natural");
const path 					= require("path");
const AWS           = require('aws-sdk');
const utils        	= require('./utils');

const DB_aSenByDate = require('../models/aSenByDate');
const DB_aSentence  = require('../models/aSentence');
const DB_userAccount= require('../models/userAccount'); // 회원 계정 DB
const DB_userStat		= require('../models/userStat'); // 유저 score및 랭킹
const DB_signInOut  = require('../models/signInOut'); // 로그인 관리 DB

// 로그아웃용 DB
exports.DB_signInOutFuc = (req, isAlwaysSignIn, autoSignIn = false ) => {
	// local_signUp의 경우 session을 사용하지 않고 body를 사용했기 때문에 데이터를 넘길때 userAccount에 담아서 넘겼기 때문에 아래와 같이 처리해야한다. 18.09.05
	if(autoSignIn) { 
		new DB_signInOut({
			user_id             : req._id,
			user_email          : req.email,
			user_nickname       : req.nickname,
			user_display_name   : req.display_name,
			tokenVal            : req.userTokenVal,   
			os_info           	: req.os_info,
			isAlwaysSignIn      : isAlwaysSignIn,
			gender              : req.gender,
			birthday            : req.birthday,
			provider            : req.provider,
			ip_address          : ip.address(),
			signin_time         : Date.now(),
			signin_time_txt     : utils.getWhen('txtDate'),
		}).save();
		return;
	} // 자동로그인일때 처리
	if(req.user.isAlwaysSignIn) {
		req.session.isAlwaysSignIn = req.user.isAlwaysSignIn;
		isAlwaysSignIn = (req.session.isAlwaysSignIn =='true');
	}//로컬 회원가입 후 바로 로그인의 경우
	new DB_signInOut({
		user_id             : req.user._id,
		user_email          : req.user.email,
		user_nickname       : req.user.nickname,
		user_display_name   : req.user.display_name,
		tokenVal            : req.user.userTokenVal,   
		os_info           	: req.user.os_info,
		isAlwaysSignIn      : isAlwaysSignIn,
		gender              : req.user.gender,
		birthday            : req.user.birthday,
		provider            : req.user.provider,
		ip_address          : ip.address(),
		signin_time         : Date.now(),
		signin_time_txt     : utils.getWhen('txtDate'),
	}).save();
}

// 처음 회원가입 하면 바로 userStat DB를 만든다
exports.makingUserStatDB = (nickname) => {
	// 만약 stat DB가 아직 없다면 새로 만든다.
	const dt = new Date();
	new DB_userStat({
		nickname    : nickname,
		createdAt		: Date.now(),
		createdAt_local : dt.toLocaleString(),
		thisYear    : dt.getFullYear(),

		level   : { stat : 0 },
		total   : { stat : 0 },
		grit    : { stat : 0 },
		honor   : { stat : 0 },
		intellect:{ stat : 0 },

		level			: { stat : 0 },
		total			: { stat : 0 },
		grit			: { stat : 0 },
		honor			: { stat : 0 },
		intellect	: { stat : 0 },
		
		info_days           : { count: 0 },
		info_sentences      : { count: 0 },
		info_letters        : { count: 0 },
		info_played         : { count: 0 },
		info_otherPlayed    : { count: 0 },
		info_love           : { count: 0 },
		info_beloved        : { count: 0 },

		// 처음 회원가입한 유저를 위해 초기화
		category		: [{ category : 'No Category', count : 1, iLove : 0, beLoved: 0}],

	}).save();
}


//  Level 계산 후 다시 session과 DB에 저장하는 모듈
exports.levelCal = (req, byDate = 0 ,lenInfo = 0, playingCount = 0, loveCount = 0 ) => {
	if(req.user){
		DB_userAccount.findById(mongoose.Types.ObjectId(req.user.id), (err, userAccount)=>{
			const total_aSenByDateScore = byDate * config.stats.summary.byDateWeight;// 입력한 날짜
			const total_letterScore = lenInfo * config.stats.summary.letterCount; // 총 글자수 계산
			const total_iPlayedScore = playingCount * config.stats.summary.iPlayedCount; // 총 플레이수 계산
			const total_loveScore = loveCount * config.stats.summary.iLoveWeight; // 내가 love를 했을 때도 레벨업 계산에 넣자
	
			req.session.levelScore = userAccount.stat.levelScore + total_aSenByDateScore + total_letterScore + total_iPlayedScore + total_loveScore; 
			req.session.level = Math.floor( req.session.levelScore / config.stats.level_criteria ); 
			req.session.save();//★ session은 꼭 save()를 해줘야만 값이 갱신된다.
			userAccount.stat.levelScore = req.session.levelScore;
			userAccount.stat.level = req.session.level;
			userAccount.markModified('stat');
			userAccount.save();
		})
	}
}


// 형태소 분석
function makingMorpheme(engTxt, sourceLang, callback){

	if ( sourceLang == config.apis.naver.ko ){ // 우리말일 경우 한국어 형태소 분석.
		// koreanMorpheme(engTxt, (engTxt_word)=> callback(engTxt_word) );
	} else if (sourceLang != config.apis.naver.en ) { // 원문장이 영어가 아니라면 단순 split해서 return
		const tempArr = new Array();
		const regExp = /[\{\}\[\]\/?.,;:|\)*~`!^\-_+<>@\#$%&\\\=\(\'\"]/gi;
		engTxt.split(' ').map( (d) => {
			const str = regExp.test(d) ? d.replace(regExp, '') : d; // 특수문자 제거를 위해
			tempArr.push( {token: str.toLowerCase(), tag: 'N'})
		});
		return callback(tempArr);
	} else{ // 영어 문장일 경우 형태소 분석
		englishMorpheme(engTxt, (engTxt_word)=> callback(engTxt_word) );
	}

}

// 영문 naturalJS 모듈
function englishMorpheme(engTxt, callback){
	const base_folder = path.join(path.dirname(require.resolve("natural")), "brill_pos_tagger");
	const rulesFilename = base_folder + "/data/English/tr_from_posjs.txt";
	const lexiconFilename = base_folder + "/data/English/lexicon_from_posjs.json";
	const defaultCategory = 'N';
	const tokenizer = new natural.TreebankWordTokenizer();
	// const sentence = tokenizer.tokenize("my your dog hasn't any fleas.");
	const sentence = tokenizer.tokenize(engTxt);
	const lexicon = new natural.Lexicon(lexiconFilename, defaultCategory);
	const rules = new natural.RuleSet(rulesFilename);
	const tagger = new natural.BrillPOSTagger(lexicon, rules);
	const taggedWords = tagger.tag(sentence).taggedWords;
	// 모든 단어들을 LancasterStemmer 처리한다. LancasterStemmer 값이 같다면 d.token을 보여준다.
	taggedWords.map( d => {
		d.stem = natural.LancasterStemmer.stem(d.token); // stem 넣기(어원분석)
		d.token = d.token.toLowerCase(); // token 소문자 처리
	});
	return callback(taggedWords);
}

// 한글 형태소 분석. 현재는 속도가 많이느리다. 18.07.18
function koreanMorpheme(engTxt, callback){
	const koalanlp = require('koalanlp'); // Import
	const engTxt_word = new Array();

	let API = koalanlp.API; // Tagger/Parser Package 지정을 위한 목록
	let POS = koalanlp.POS; // 품사 관련 utility
	try{
		koalanlp.initialize({
			packages: [API.TWITTER], // 품사분석(POS Tagging)을 위해서, 은전한닢 사용
			version: "1.9.2", // 사용하는 KoalaNLP 버전 (1.9.2 사용)
			javaOptions: ["-Xmx4g"],
			// debug: true // Debug output 출력여부
		}).then(function(){
			// 품사분석기 이용법
			let tagger = new koalanlp.Tagger(API.TWITTER);

			// POS Tagging
			tagger.tag(engTxt)
				.catch(function(error){
						console.error(error);
				}).then(function(taggedAsync){
					taggedAsync.map(s => { s.words.map( k=> { k.morphemes.map( m=> {

						// console.log(m);
						const temp = new Object();
						temp.token = m.surface;
						temp.tag = m.tag;
						temp.rawTag = m.rawTag;

						engTxt_word.push(temp);
					}) }) });
					return callback(engTxt_word); // 최종 분석된 한국어 형태소 분석 결과 리턴
				});
		});
	} catch(e){
		// 만약 실패한다면 split하는 것도 의미가 없다. 그냥 빈 배열을 return하자
		return callback(engTxt_word);
	}
}


// 일반 입력과 글수정 모두에서 공통으로 사용하는 문장 입력 전체 모듈
exports.makeSentence = (req,res, whatModule) => {
	// -------------------------글생성 및 글수정 모듈 공통
	let engTxt;
	if ( whatModule == 1 || whatModule == 2 ) engTxt = req.body.engTxt;
	else if ( whatModule == 3 ) engTxt = 'Welcome to SayToRemember from Google!';// google sign up
	else if( whatModule == 4) engTxt = 'Welcome to SayToRemember from FaceBook!';// facebook sign up
	else engTxt = "Welcome to SayToRemember";// local sign up

	const lenInfo = engTxt.length;// 글자길이

	// 네이버 개발자 설정
	const client_id     = config.apis.naver.client_id;
	const client_secret = config.apis.naver.client_secret;
	const client_id_papago     = config.apis.naver.client_id_papago;
	const client_secret_papago = config.apis.naver.client_secret_papago;

	// 언어 감지를 시작한다
	function detectLang(callback){
		let speaker; // tts에서 언어에 따라 읽어주는 speaker설정
		let sourceLang; // 번역 source
		let targetLang; // 번역 target

		const detectLangs = {
			url : config.apis.naver.api_detect_url,
			form : { 'query' : engTxt },
			headers : {'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret},
		}

		request.post(detectLangs, (error, response, langName )=>{
			if (!error && response.statusCode == 200) {

				// 감지된 언어로 소스를 결정
				sourceLang = JSON.parse(langName).langCode;
				targetLang = config.apis.naver.ko; // 기본 번역은 한글로 한다

				switch(sourceLang){
					case 'ko': speaker = config.apis.naver.speaker_ko;
						// 입력된 언어가 한국어일 경우 번역결과를 영어로 바꿈.
						targetLang = config.apis.naver.en;
						break; // 한국어
					case 'ja':  speaker = config.apis.naver.speaker_ja; break; // 일본어
					case 'zh-cn': speaker = config.apis.naver.speaker_zh_cn; break; // 중국어 간체
					case 'zh-tw': speaker = config.apis.naver.speaker_zh_tw; break; // 중국어 번체
					case 'hi': speaker = config.apis.naver.speaker_en; break; // 힌두어
					case 'en': speaker = config.apis.naver.speaker_en; break; // 영어
					case 'es': speaker = config.apis.naver.speaker_es; break; // 스페인어
					case 'fr': speaker = config.apis.naver.speaker_en; break; // 프랑스어
					case 'de': speaker = config.apis.naver.speaker_en; break; // 독일어
					case 'pt': speaker = config.apis.naver.speaker_en; break; // 포루트갈어
					case 'vi': speaker = config.apis.naver.speaker_en; break; // 베트남어
					case 'id': speaker = config.apis.naver.speaker_en; break; // 인도네시아어
					case 'th': speaker = config.apis.naver.speaker_en; break; // 태국어
					case 'ru': speaker = config.apis.naver.speaker_en; break; // 러시아어
					case 'unk': speaker =config.apis.naver.speaker_en; break; // 알수없음
				}
				callback(speaker, sourceLang, targetLang);

			} else {
				res.status(response.statusCode).end();
				console.log('error2 = ' + response.statusCode);
			}
		})
	}

	// 받아온 언어정보를 이용해 작업한다
	detectLang( (speaker, sourceLang, targetLang)=>{
		// 멍청한 네이버 때문에 어쩔 수 없이 아래와 같이 만듦
		if (sourceLang == 'zh-cn') sourceLang = 'zh-CN';
		if (sourceLang == 'zh-tw') sourceLang = 'zh-TW';


		// ---- AWS에 저장
		// 파파고 유료화되며 설정이 많이 바뀌어 모두 업데이트 했다 18.07.04
		// 현재 tts만 유료모듈을 사용중. 번역및 언어감지는 여전히 naver developer계정을 사용
		const api_tts_url   = config.apis.naver.api_tts_url;
		const tts_options = {
			url     : api_tts_url,
			form: {
					speaker   : speaker,
					speed     : config.apis.naver.tts_speed,
					text      : engTxt,
			},
			headers : { 'X-NCP-APIGW-API-KEY-ID' : client_id_papago, 'X-NCP-APIGW-API-KEY' : client_secret_papago }
		};
		const s3            	= new AWS.S3();
		const bucketName      = config.apis.aws.bucketName;
		const AWS_authorize   = config.apis.aws.AWS_authorize;
		const AWS_contentType = config.apis.aws.AWS_contentType;
		AWS.config.region   	= config.apis.aws.region;

		const fileName = utils.getWhen('dbDate') +'_'+ utils.uid(8);
		const filePath = './public/sound/' + fileName +'.mp3';
		const writeStream   = fs.createWriteStream(filePath);
		const AWS_path = 'sound/'+ req.user.id + '/'+ fileName +'.mp3'; // saytoremember/sound/[req.user.id]/[fileName] 으로 저장

		// 먼저 파일을 저장한 후 그 파일을 S3에 올려야 한다.
		const exe = request.post(tts_options).pipe(writeStream);

		let translatedTxt = new Object(); // 번역 완료된 문장이 들어온다.

		const api_trans_url = config.apis.naver.api_trans_url;
		const trans_options = {
			url     : api_trans_url,
			form    : {'source': sourceLang , 'target': targetLang, 'text': engTxt,},
			headers : {'X-Naver-Client-Id': client_id, 'X-Naver-Client-Secret': client_secret}
		};
		request.post( trans_options, ( error, response, translated_sen ) => {
			if ( !error && response.statusCode == 200 ) {
				translatedTxt = JSON.parse(translated_sen); // 번역처리!
			} else {
				translatedTxt = '';
				console.log('번역이 되지 않았어');
			}
		});

		// 파일 저장이 완료되면
		exe.on( 'finish', ()=> {

			const params = {
				Bucket: bucketName,
				Key: AWS_path,
				ACL: AWS_authorize,
				ContentType : AWS_contentType,
				Body: fs.createReadStream(filePath),
				// Body: fs.createWriteStream(filePath),
			};
			s3.upload(params, function(err, uploadedMP3) {
				if (err) console.log('s3 err : '+err)

				// mp3 저장이 완료된 후에는
				else{
					// mp3 파일을 S3에 올렸으니 이제 로컬에 있는 mp3 파일을 지운다.
					try{
						fs.existsSync( filePath ) && fs.unlinkSync( filePath );
					} catch(e){console.log(e.message);}
					const userIP      = ip.address(); // 유저 IP가져오기
					let tempTranKor = '';
					try { // 가끔 에러가 나서 try catch한다. 그리고 try..catch안에서는 let을 쓰면 안된다. 블럭 박으로 나가는 순간 사라진다.
						tempTranKor = translatedTxt.message.result.translatedText;
					} catch( e ){
						console.log(e.message);
					}

					makingMorpheme(engTxt, sourceLang, (engTxt_word)=>{
						// 만약 문장을 처음 입력하는 거라면, 또는 구글,페북,로컬 회원가입이라면
						if (whatModule == 1 || whatModule == 3 || whatModule == 4 || whatModule == 5){
							// let when        = utils.getWhen('txtDate'); // 현재 날짜를 보기좋게 가공해서
							const strDate     = utils.getWhen('strDate'); // 170206
							const strDateTxt  = utils.getWhen('strDateTxt'); // 17.02.06 Mon.

							tagIdx = (req.body.tagIdx == '' || isNaN(req.body.tagIdx) ) ? 0 : parseInt(req.body.tagIdx);
							DB_aSenByDate
								.findOne( { strDate : strDate, user_id : req.user.id  } , (err, aSenByDate)=>{
									if( !aSenByDate ){ // 만약 기존 입력한 데이터의 날짜가 없다면 DB를 만든다.
									new DB_aSenByDate({
										user_id         : mongoose.Types.ObjectId(req.user.id),
										email           : req.user.email,
										nickname        : req.user.nickname,
										createdAt				: Date.now(),
										createdAt_local : new Date().toLocaleString(),
										strDate         : strDate,
										strDateTxt      : strDateTxt,
										count           : 1,
										mp3s            : req.user.id + '/'+ fileName +'.mp3',
										senSort					: true,
									}).save( (err, aSenByDate) => { // DB를 만든 후 해당 _id를 실제 글에 넣는다.
										if ( !aSenByDate ) { return res.render('error/default', { msg : 'no aSenByDate'}); }

										if (req.body.nickname != 'everyone') { exports.levelCal(req, 1, lenInfo, 0 );}
										

										new DB_aSentence({
											user_id         : mongoose.Types.ObjectId(req.user.id),
											email           : req.user.email,
											nickname        : req.user.nickname,
											byDate_id       : aSenByDate._id, // 이렇게 넣어 날짜와 글을 연결한다. 게시판의 글과 덧글처럼.
											ip_address      : userIP,
											createdAt				: Date.now(),
											createdAt_local : new Date().toLocaleString(),
											updatedAt				: Date.now(),
											updatedAt_local : new Date().toLocaleString(),
											strDate         : strDate,
											tagIdx          : tagIdx, // Category Index
											mp3             : req.user.id + '/'+ fileName +'.mp3',
											fileName        : fileName +'.mp3',
											is_secret       : false,
											engTxt          : engTxt,
											engTxt_word     : engTxt_word, // 문장을 단어로 쪼개서 저장하기
											korTxt          : tempTranKor,
											lenInfo         : lenInfo,
											}).save( (err, aSentence, count) => {
												if ( !aSentence ) { return res.render('error/default', { msg : err}); }
												aSenByDate.aSen_ids.push(aSentence._id);
												aSenByDate.markModified('aSen_ids');
												aSenByDate.save();

												aSentence.tagName				= req.body.tagName, // 클라에서 받은 태그 이름을 다시 넘겨준다. 클라 출력용.
												aSentence.count         = aSenByDate.count;
												aSentence.total_clicked = aSenByDate.total_clicked;
												aSentence.total_other_clicked	= aSenByDate.total_other_clicked;
												aSentence.mp3s          = aSenByDate.mp3s;
												aSentence.userNickname	= req.user.nickname; // 해당 유저의 날짜 페이지를 만들기 위해
												aSentence.strDate				= strDate;
												aSentence.strDateTxt    = strDateTxt; // strDateTxt는 DB저장할 필요없어 dic으로 추가해 넘긴다.
												aSentence.isIncludeDate = 1; // 날짜가 포함된 데이터는 1로
												aSentence.senSort 			= aSenByDate.senSort; // 굳이 할필요 없지만...훗날 확장성을 위해 180315

												if (whatModule == 1) res.render('say/dayAjax', aSentence);
												else res.redirect('/'+req.user.nickname);// 회원가입하여 들어온 유저일 경우 redirect
											});
									})
								} else { // 날짜가 있다면 날짜 아래 글만 넣는다.
									DB_aSenByDate
										.findOne( { strDate : strDate, user_id : mongoose.Types.ObjectId(req.user.id) } , (err, aSenByDate)=>{
											if ( !aSenByDate ) { return res.render('error/default', { msg : 'no aSenByDate'}); }

											aSenByDate.count++;
											aSenByDate.mp3s.push(req.user.id + '/'+ fileName +'.mp3');

											new DB_aSentence({
												user_id         : mongoose.Types.ObjectId(req.user.id),
												email           : req.user.email,
												nickname        : req.user.nickname,
												byDate_id       : aSenByDate._id,
												ip_address      : userIP,
												createdAt				: Date.now(),
												createdAt_local : new Date().toLocaleString(),
												updatedAt_local : new Date().toLocaleString(),
												strDate         : strDate,
												tagIdx          : tagIdx,
												mp3             : req.user.id + '/'+ fileName +'.mp3',
												fileName        : fileName +'.mp3',
												is_secret       : false,
												engTxt          : engTxt,
												engTxt_word     : engTxt_word, // 문장을 단어로 쪼개서 저장하기
												korTxt          : tempTranKor,
												lenInfo         : lenInfo,
											}).save( (err, aSentence, count) => {
													if ( !aSentence ) { return res.render('error/default', { msg : err}); }
													if (req.body.nickname != 'everyone') { exports.levelCal(req, 0, lenInfo, 0 ); }

													aSenByDate.aSen_ids.push(aSentence._id);
													aSenByDate.markModified('aSen_ids');
													aSenByDate.save();

													aSentence.tagName				= req.body.tagName,
													aSentence.count         = aSenByDate.count;
													aSentence.mp3s          = aSenByDate.mp3s.toString();
													aSentence.strDateTxt    = strDateTxt; // strDateTxt는 DB저장할 필요없어 dic으로 추가해 넘긴다.
													aSentence.isIncludeDate = 0; // 날짜 없이 영어 문장만 있는 데이터는 0으로 넘겨준다.
													res.render('say/senAjax', aSentence);
												});
											});
										}
								})
						}

						// 그렇지 않고 문장을 수정할때라면
						else if (whatModule == 2){
							DB_aSenByDate
								.findById( { _id : req.body.senByDateID }, (err, aSenByDate) => {
									if ( !aSenByDate ) { return res.render('error/default', { msg : 'no aSenByDate'}); }
										let mp3 = req.user.id + '/'+ fileName +'.mp3';

										// 단순 arr[xx] = xx; 로는 배열값이 바뀌지 않는다. 왜그런지는 모른다. 알아내는데 몇시간이 걸렸는지 모른다 17.02.22
										// 어떻게 해결하면 좋을까 고민하다 push함수가 먹히는 걸 보고 함수를 이용해 바꿔보기로 한다.
										let tmpFoundMp3 = aSenByDate.mp3s.indexOf( req.body.senIDMp3 ); // mp3s배열에서 예전 파일을 찾아서
										aSenByDate.mp3s.splice( tmpFoundMp3, 1, mp3 );  // 파일명을 교체한다. 일반 '='을 사용하면 들어가지 않는다.
										// console.log('교체 완료된 mp3s:'+aSenByDate.mp3s);
										aSenByDate.markModified('mp3s');

										const tagIdx = (req.body.tagIdx == '' || isNaN(req.body.tagIdx) ) ? 0 : parseInt(req.body.tagIdx);

										DB_aSentence.findById( { _id : req.body.senID }, (err, aSentence)=>{
											if ( !aSentence ) { return res.render('error/default', { msg : 'no aSentence'}); }

											// 글자를 수정했다해도 이전 노력을 버리지 않는다. 따라서 aSentece.lenInfo만큼을 빼지않는다.
											if (req.body.nickname != 'everyone') exports.levelCal(req, 0, lenInfo, 0 );// 새로운 문장의 길이를 더하기만 한다.

											aSentence.ip_address     = userIP;
											aSentence.updatedAt      = Date.now(); // 글을 수정한 날짜를 넣고
											aSentence.updatedAt_local  = new Date().toLocaleString();
											aSentence.mp3            = mp3;
											aSentence.fileName       = fileName +'.mp3' ;
											aSentence.engTxt         = req.body.engTxt ;
											aSentence.engTxt_word    = engTxt_word,
											aSentence.korTxt         = tempTranKor ;
											aSentence.lenInfo        = lenInfo;
											aSentence.tagIdx         = tagIdx,
											aSentence.save( (err)=>{
												if (err) return console.log(err);
												// 수정 전 문장의 id로 해당 index를 구한후
												let tmpFoundaSenObj = aSenByDate.aSen_ids.indexOf( aSentence._id );
												// 새로 수정한 문장을 해당 index 위치에 바꿔넣는다.
												aSenByDate.aSen_ids.splice( tmpFoundaSenObj, 1, aSentence._id);
												aSenByDate.markModified('aSen_ids');
												aSenByDate.save( (err)=>{
													res.json({ aSentence : aSentence , mp3s : aSenByDate.mp3s, aSenByDate_id : aSenByDate._id } );
												});
											})
										})
									})
							}
					} );


				}

			});
		});
	})
}
