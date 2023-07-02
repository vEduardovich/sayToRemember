const express           = require('express');
const route             = express.Router();
const ip                = require('ip');
// const mongoose          = require('mongoose');
const useragent     		= require('useragent');
const passport          = require('../passport/passport');
const utils             = require('../commons/utils.js');
const utils_db          = require('../commons/utils_db.js');
const config            = require('../commons/config'); // 설정

const DB_userAccount    = require('../models/userAccount'); // 회원 계정 DB
const DB_signInOut      = require('../models/signInOut'); // 로그인 관리 DB


// 고백하자면 이렇게 id_c와 token을 따로 쿠키로 만들어 두개를 조합해 자동로그인하는 모듈을 조잡하고 불필요하다는 것을 인정한다.
// 어떠한 문제도 해결하지 못하고 쓸데없이 귀찮을 뿐이다. 하지만 처음에 이렇게 만들었기에 그냥 그대로 둔다. 18.08.07

// 구글 로그인
// 구글과 페북은 utils.funIsAlwaysSignin을 사용한다. 항상 로그인인지 해당 정보를 가져온다.
route.get('/in/google', utils.funIsAlwaysSignin, passport.authenticate('google', config.passport.google.scope ));
route.get('/in/google/callback',
	passport.authenticate('google', { failureRedirect: '/sign/in' }),
	(req, res)=>{
		// req.session.tags = req.user.tags; // 해당 유저가 가지고 있는 tag를 넘겨준다
		console.log('req.session.isAlwaysSignIn: '+ req.session.isAlwaysSignIn);
		if (req.session.isAlwaysSignIn == 'true') {
			res.cookie( 'id_c', req.user.id , config.cookie.token.opt10y); // 해당 유저가 발행한 토큰을 클라에 쿠키로 심는다
			res.cookie( 'token', req.user.userTokenVal , config.cookie.token.opt10y);

			req.session.cookie.maxAge = config.cookie.token.opt10y.maxAge;
			utils_db.DB_signInOutFuc(req, true);// 로그인 정보를 DB에 넣자

		} else{
			console.log('항상로그인 X');
			utils_db.DB_signInOutFuc(req, false);// 로그인 정보를 DB에 넣자
		}


		delete req.session.isAlwaysSignIn; // 이제 쿠키에 넣었으니 삭제
		utils_db.levelCal(req, 0, 0, 0, 0 ); // 레벨초기화
		if (parseInt(req.user.welcome)){
			utils_db.makeSentence(req, res, 3); // 3은 google. 
		}else{
			res.redirect('/'+ req.user.nickname);
		}
	}
);


// 페이스북 로그인
route.get('/in/facebook' , utils.funIsAlwaysSignin , passport.authenticate('facebook', config.passport.facebook.scope ) );// { scope: [ 'publish_actions', 'email', 'user_likes' ] }
route.get('/in/facebook/callback',  passport.authenticate('facebook', { failureRedirect: '/sign/in' }),
	(req, res)=>{
		if (req.session.isAlwaysSignIn == 'true') {
			res.cookie( 'id_c', req.user.id , config.cookie.token.opt10y);
			res.cookie( 'token', req.user.userTokenVal , config.cookie.token.opt10y);

			req.session.cookie.maxAge = config.cookie.token.opt10y.maxAge;
			utils_db.DB_signInOutFuc(req, true);// 로그인 정보를 DB에 넣자
		} else{
			console.log('항상로그인 X');
			utils_db.DB_signInOutFuc(req, false);// 로그인 정보를 DB에 넣자
		}
				
		delete req.session.isAlwaysSignIn; // 이제 쿠키에 넣었으니 삭제
		utils_db.levelCal(req, 0, 0, 0, 0 ); // 레벨초기화
		if (parseInt(req.user.welcome)){
			utils_db.makeSentence(req, res, 4); // 4는 페이스북.
		}else{
			res.redirect('/'+ req.user.nickname);
		}
	}
);


// 로컬 회원가입 처리
route.get('/up', utils.funcIsSignedIn, (req, res) => {
	res.render('sign/signUp');
})

route.post('/up', passport.authenticate('local_signup', { failWithError: true }),
	(req, res, next)=>{
		// 성공
		if (req.body.isAlwaysSignIn == 'true') {
			res.cookie( 'id_c', req.user.id , config.cookie.token.opt10y);
			res.cookie( 'token', req.user.userTokenVal , config.cookie.token.opt10y);

			req.session.cookie.maxAge = config.cookie.token.opt10y.maxAge;
			utils_db.DB_signInOutFuc(req, true);// 로그인 정보를 DB에 넣자
		} else{
			console.log('항상로그인 X');
			utils_db.DB_signInOutFuc(req, false);// 로그인 정보를 DB에 넣자
			// req.session.cookie.maxAge = config.cookie.token.opt12h.maxAge;
		}
		return res.json({nickname: req.user.nickname});
	},
	(err, req, res, next)=>{
		// 아래처럼 강제로 status(200)을 넘겨주니 ajax로 넘어간다
		if (req.xhr) { return res.status(200).json({nickname: ''});}
	}
);


// 로그인 ID 처리
route.get('/in', utils.funcIsSignedIn, (req, res, next) => {
	res.render('sign/signIn'); // 로그인 되어 있다면 루트로 이동시키고 없다면 정상적으로 render
})
route.post('/in', utils.funcIsSignedIn, (req, res) => {
	DB_userAccount.findOne( { email : req.body.inputEmail }, (err, userAccount)=>{
		if ( !userAccount ) { // 일치하는 ID가 없다
			console.log('userAccount: '+err); 
			return res.json({status:406});
			// return res.redirect('/sign/in'); 
		}
		else{
			req.session.signinEmail         = userAccount.email;    // email이 일치했을 경우 이메일 정보를 세션에 넣는다.
			req.session.signinDisplayName   = userAccount.display_name; // 화면에 유저 이름을 보여주기 위해 display_name을 세션에 저장
			req.session.isAlwaysSignIn      = req.body.isAlwaysSignIn; // on이라면 on 전달. off일 경우 false 전달
			res.redirect('/sign/in/pwd');
	}});
})

// 로그인 password 처리
route.get('/in/pwd', (req, res) => {
	if(req.session.signinEmail){ // email이 일치했을 경우
		req.session.signinDisplayName || (req.session.signinDisplayName = req.session.signinEmail.split('@')[0]);
		// console.log('req.session.signinDisplayName: '+ req.session.signinDisplayName);
		res.render('sign/signInPwd', {email : req.session.signinEmail, displayName : req.session.signinDisplayName, isAlwaysSignIn: req.session.isAlwaysSignIn });
	}else{
		console.log('아이디를 먼저 입력해야합니다.');
		res.redirect('/');
	}
})
// ★ 굉장히 중요한 체크 - 함수에서 사용하는 ()는 줄바꿈에 절대 유의하라. 오늘(170410) 코딩 중 아래 줄을 계속 인식하지 못해 엄청 고생했는데
// 결국 문제는 ()의 줄바꿈 문제였다. 괄호의 짝이 맞을 경우 에러 메시지도 없이 아예 인식을 못하는 노드의 버그 같다. 이유는 정확히 모르겠다.
// 어쨌든 함수의 괄호를 사용할 때에는 줄바꿈에 절대 유의한다.
route.post('/in/pwd', passport.authenticate('local_signin', { failWithError: true }),
	(req, res, next)=>{
		// 성공
		if (req.xhr){
			if (req.session.isAlwaysSignIn == 'true') {
				console.log('항상 로그인 옵션 켜짐');
				res.cookie( 'id_c', req.user.id , config.cookie.token.opt10y);
				res.cookie( 'token', req.user.userTokenVal , config.cookie.token.opt10y);

				req.session.cookie.maxAge = config.cookie.token.opt10y.maxAge;
				utils_db.DB_signInOutFuc(req, true);// 로그인 정보를 DB에 넣자
				// This user won't have to log in for a year
			} else{
				console.log('항상로그인 X');
				utils_db.DB_signInOutFuc(req, false);// 로그인 정보를 DB에 넣자
			}

			// req.session.tags = req.user.tags; // 해당 유저가 가지고 있는 tag를 넘겨준다
			delete req.session.signinEmail; // 로그인이 성공했으므로 로그인용 email 세션은 지운다.
			delete req.session.signinDisplayName; // display_name 세션도 지운다.
			delete req.session.isAlwaysSignIn;// 항상로그인 정보도 지운다.

			utils_db.levelCal(req, 0, 0, 0, 0 ); // 레벨초기화
			return res.json({nickname: req.user.nickname});
		}
	},
	(err, req, res, next)=>{
		console.log('err: '+ err);
		// 아래처럼 강제로 status(200)을 넘겨주니 ajax로 넘어간다
		if (req.xhr) { return res.status(200).json({nickname: ''});}
	}
)



route.get('/out', (req,res)=> {
	if ( req.isAuthenticated() ) {
		const agent = useragent.parse(req.headers['user-agent']);
		const osInfo = agent.os.toString() + agent.device.toString() + agent.family.toString();

		res.cookie('tagIdx', config.defaultTag.tagIdx, config.cookie.token.opt10y.maxAge);
		res.cookie('tagName', config.defaultTag.tagName, config.cookie.token.opt10y.maxAge); // No Category 문구 수정할때 정신없겠네 ;;

		DB_userAccount.findById( req.user.id , (err, userAccount)=>{
			if(!userAccount) console.log('여기서 에러');

			let machine_idx   = userAccount.tokens.findIndex( e => e.os_info == osInfo && e.tokenVal == req.user.userTokenVal ); // token 값을 읽어와서
			if ( machine_idx != -1 ){ // 일치하는게 있다면 DB에서 
				userAccount.tokens.splice( machine_idx , 1 ); // DB에서 기존 token을 삭제
				console.log('DB에서 machineId와 tokenVal이 동시에 일치하는 토큰을 삭제');
			}
			userAccount.markModified('tokens');
			userAccount.save();

			DB_signInOut
			.findOne( { user_id : req.user.id })//일반 로그인시에로 로그아웃했을 때 기록을 남기기 위해
			.sort( { signin_time   : -1 }) // 가장 최근에 로그인한 userID의 signout에 시간을 넣는다.
				.exec( ( err, signInOut ) => {
					if(err) console.log(err);
					if ( signInOut ) { // signInOut DB가 있다면 - DB를 못찾는 경우 에러방지용
						console.log(signInOut);
						signInOut.signout_time = Date.now();
						signInOut.signout_time_txt = utils.getWhen('txtDate');
						signInOut.save();
					}
					res.clearCookie('id_c'); // 자동 로그인 용 id 삭제
					res.clearCookie('token'); // 자동 로그인 용 토큰 쿠기 삭제

					req.session.destroy();
					req.logout();
					res.redirect('/');
				})
		})
	} else {
		console.log('아직 로그인을 하지 않았습니다');
		res.redirect('/');
	}
})




module.exports = route;