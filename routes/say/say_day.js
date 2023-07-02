const express       = require('express');
const route         = express.Router();
const mongoose      = require('mongoose');

const utils         = require('../../commons/utils.js');
const config        = require('../../commons/config'); // 설정

const DB_aSenByDate = require('../../models/aSenByDate');
const DB_aSentence  = require('../../models/aSentence');
const DB_userAccount= require('../../models/userAccount'); // 회원 계정 DB


function senDayList(req, res, user, otherHearts = { sen_id:'' }){
	const nickname = !req.user ? user : req.user.nickname;

	// for Github counting module
	const today   = new Date();
	const todayIdx = utils.term(today);

	DB_aSenByDate.findOne( { nickname : req.params.nickname, strDate : req.params.day }, (err, aSenByDate) => {
		DB_aSentence // user_id와 tagIdx로 원하는 문장을 찾은 후
			.find ( { user_id    	: mongoose.Types.ObjectId(req.userId), strDate : req.params.day } )
			.sort ( { createdAt  	: -1     } )
			.exec ( (err, aSentence )=>{
				if ( !aSentence || aSentence[0] == undefined ) { return res.render('error/default', { msg : 'There is no sentence.'}); }
				const githubCount = new Array();
				// 365일의 count를 모두 0으로 초기화
				for ( let i = 0 ; i <= 365 ; i++){
					githubCount.push( {count : 0 });
				}
				// say_day 페이지의 github은 하루뿐이므로 그냥 하드코딩한다.
				let idx= utils.term(new Date(aSentence[0].createdAt_local));
				// if (aSentence.length == 1 ){// aSentence가 1개뿐일때는 배열이 아닌 객체로 리턴하기 때문에 ㅡ,ㅡ;
				// 	idx = utils.term(new Date(aSentence[0].createdAt_local));
				// }else if(aSentence.length >= 1){
				// 	idx = utils.term(new Date(aSentence[0].createdAt_local));
				// }
				githubCount[parseInt(idx)] = { date : req.params.day, count : aSentence.length};
				
				const tags = (req.user == undefined) ? [config.defaultTag.tagName] : req.user.tags; 

				res.render('say/sayDay', {
					cell				: githubCount,
					todayIdx		: todayIdx,
					userTags		: req.userTags, // 해당 nickname을 가진 유저의 tags
					tags				: tags, // 내 자신의 tags
					itemByDate	: aSenByDate, // say.js의 aSenByDate를 itemByDate로 변경. 왜냐면 하루의 데이터만 가져오기 때문에.
					aSentence   : aSentence,
					isSignedIn  : req.session.isSignedIn,
					// isMine      : true,
					userNickname:	req.params.nickname, // 해당 유저의 닉넴
					searchingTagIdx : 9999, // day검색
					nickname    : nickname, // 로그인을 한 계정의 nickname
					otherHearts : otherHearts, // heart array 전달
					user 				: user,
					strDate			: req.params.day, // 해당 날짜 정보도 전달
					senNum			: req.query.sn, // 해당 문장의 번호. 클라에서 받아 처리해야 한다!
				});
			})

		})
}


// Get / 해당 날짜의 문장만 보여주기
route.get('/:nickname/day/:day', utils.funcIsSignedIn, (req, res) => {
	console.log('req.isSignedIn: '+ req.isSignedIn);
	DB_userAccount.findOne ( {nickname : req.params.nickname}, (err, userAccount)=>{
		if ( !userAccount ) { return res.render('error/default', { msg : 'We can\'t find your account.'}); }

			req.userId = userAccount._id; // 해당 닉넴 유저의 id
			req.userTags = userAccount.tags; // 해당 닉넴 유저의 tag

			// 로그인 하지 않은 유저
			if ( !req.user ) {
				// res.render('say/sayDay',{ hello: '안녕@.@!', day: req.params.day});
				console.log('로그인하지 않은 유저');
				senDayList(req, res, 'anonymous');
	
			} else {
				if ( req.user.nickname === req.params.nickname ) { // passport를 통해 로그인한 유저가 자기 페이지에 들어온 거라면
					console.log('닉네임과 로그인 유저가 일치!');
					senDayList(req, res, 'owner');

				} else { // 로그인은 했지만 to페이지로 들어온 유저가 자기가 아니고 다른 유저라면
					console.log('로그인은 했지만 다른 사람의 to페이지에 방문한 유저');
					DB_userAccount.findById( mongoose.Types.ObjectId(req.user.id), (err, user)=>{
						senDayList(req, res, 'other', user.heart.other );
					})					
				}
			}
		});

});


module.exports = route;