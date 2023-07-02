const express       = require('express');
const route         = express.Router();
const mongoose      = require('mongoose');

const utils         = require('../../commons/utils.js');
const utils_db      = require('../../commons/utils_db.js');
const config        = require('../../commons/config'); // 설정

const DB_aSentence  = require('../../models/aSentence');
const DB_userAccount= require('../../models/userAccount'); // 회원 계정 DB


// heart 된 문장들 모두 보여주기
function senLove(req, res, user, userAccount, myHearts ){ // myHearts는 로그인 계정 유저의 모든(my,other) hearts정보
	const nickname = !req.user ? user : req.user.nickname;

	// for Github counting module
	const today   = new Date();
	const todayIdx = utils.term(today);

	const allSenLove = userAccount.heart.my.concat( userAccount.heart.other ); // heart가 된 모든 문장 모음
	let myAllHearts;
	if (myHearts) myAllHearts = myHearts.my.concat( myHearts.other); // 내 계정이 heart한 모든 문장

	const count 					= allSenLove.length;
	const page 						= config.showPage.page; // 유저에게 보여줄 페이지
	const byDateStep 			= config.showPage.tagPage; // 하루에 보여주는 태그 문장수
	const skipByDate 			= ( page - 1 ) * byDateStep; // 스킵할 페이지
	const totalBydateCount = (!count || count == 0) ? 0 : count; // 전체 byDate 수
	const totalPage 			= Math.ceil( totalBydateCount / byDateStep ); // 전체 페이지 수

	const pageModel =  {
		page 		 					: page,
		byDateStep 				: byDateStep,
		skipByDate 				: skipByDate,
		totalBydateCount 	: totalBydateCount,
		totalPage 				: totalPage,
	}

	const githubCount = new Array(); // github counting
	const sentences = new Array(); // heart sentence IDs

	// 365일의 count를 모두 0으로 초기화
	for ( let i = 0 ; i <= 365 ; i++){
		githubCount.push( {count : 0 });
	}
	allSenLove.sort( (a,b)=> b.createdAt - a.createdAt );
	allSenLove.map( (item)=>{
		const idx = utils.term(new Date(item.createdAt_local));
		const strDate = utils.getWhen('strDate', item.createdAt);// love에는 strDate정보가 없더라. 그래서 새로 만들어 넣어야 한다.
		console.log('idx: '+ idx);
		if(githubCount && idx>-1){
			console.log(githubCount[ idx ]);
			if (githubCount[ idx ].count == 0 ){
				githubCount[ idx ] = { date : strDate, count : 1 };
			} else {
				githubCount[ idx ].count++;
			}
			sentences.push( item.sen_id );
		}
	})	
	// allSenLove.map( (item , i)=>{
	// 	var idx = utils.term(new Date(item.createdAt_local));
	// 	// 이미 값이 있다면 ++시키고 값이 없다면 1을 넣는다
	// 	githubCount[ idx ] ? githubCount[ idx ]++ : githubCount[ idx ] = 1;
	// 	// DB_aSentence에서 id 배열을 이용해 원하는 heart 문장들을 찾기 위해 만든다
	// 	sentences.push( item.sen_id );
	// })

	DB_aSentence
		.find( { _id : { $in : sentences  }})
		.exec( (err, aSentence )=>{

			// heart한 순서대로 정렬. idx를 넣기위해 정말 고생 많이함. 18.05.26
			for ( let i = 0 ; i < sentences.length ; i++ ){
				for ( let j = 0 ; j < aSentence.length ; j++){
					if ( sentences[i].toString() == aSentence[j]._id.toString() ){
						aSentence[j]._doc.heart_idx = i;
						break;
					}
				}
			}

			// 막상 문장을 찾다보면 원본을 가진 유저가 해당 문장을 지운 경우가 있다. 이럴 경우 삭제한다.
			// sentences문장 중에 aSentence에 있는 모든 문장들을 지운 후 남은 문장들의 id로 DB_aSentence에서 지우면 된다.
			// 이미 파일 삭제할때 처리했지만 만일의 경우에 대비해 여기서 한번더 처리한다
			if (aSentence.length != sentences.length){
				for ( let i=0; i < aSentence.length; i++){
					for( let j=0; j < sentences.length ; j++){
						if( aSentence[i]._id.toString() == sentences[j] ){
							try{sentences.splice( j, 1);}
							catch(e) { console.log('문장 삭제 못함');}
							break;
						}
					}
				}
					for( let i = 0 ; i < sentences.length ; i++){
						for (let j =0; j < userAccount.heart.my.length; j++){
							if ( userAccount.heart.my[j].sen_id == sentences[i] ) {
								try {userAccount.heart.my.splice(j, 1);console.log('삭제1');}
								catch(e) {  console.log('userAccount.heart.my heart 삭제 못함'); }
							}
							break;
						}
					}
					for( let i = 0 ; i < sentences.length ; i++){
						for (let j =0; j < userAccount.heart.other.length; j++){
							if ( userAccount.heart.other[j].sen_id == sentences[i] ) {
								try {userAccount.heart.other.splice(j, 1);console.log('삭제2');}
								catch(e) {  console.log('userAccount.heart.other의 heart 삭제 못함'); }
							}
							break;
						}
					}
				userAccount.markModified('heart.my');
				userAccount.markModified('heart.other');
				userAccount.save();
			}

			aSentence.sort( (a,b)=> a._doc.heart_idx - b._doc.heart_idx);
			aSentence = aSentence.slice(0, byDateStep); // .limit(byDateStep) 과 동일
			// 태그 전체 재생 파일 목록 만들기
			const senMp3s = new Array();
			aSentence.map( (item, idx)=>{
				senMp3s.push(item.mp3); // 음악 파일 push하고
			})

			// 태그 문장 전체 id 목록 만들기
			const senIds = new Array();
			aSentence.map( (item)=>{
				senIds.push(item._id); // 문장의 id를 push하고
			})

			res.render('say/sayLove', {
				cell				: githubCount,
				todayIdx		: todayIdx,
				userTags		: userAccount.tags, // 해당 nickname을 가진 유저의 tags
				tags				: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
				aSentence   : aSentence,
				senIds			: senIds.join(','),
				mp3s				: senMp3s.reverse().join(','),
				senSort			: true,
				isSignedIn  : req.session.isSignedIn,
				// isMine      : true,
				userNickname:	req.params.nickname, // 해당 페이지의 nickname
				searchingTagIdx : 10000, // Love페이지는 tagIdx 값을 10,000만으로 준다. input창의 위치값 설정 때문에
				nickname    : nickname, // 로그인을 한 계정의 nickname
				user 				: user,
				pageModel		: pageModel, // 페이지 정보 넘겨주기
				otherHearts	: myAllHearts, // 다른 사람의 love페이지에 방문했을 때 그 안에 내가 heart만 문장들만 표시되게
			});

			// 막상 문장을 찾다보면 원본을 가진 유저가 해당 문장을 지운 경우가 있다. 이럴 경우 삭제한다.
			// if (!aSen){
			// 	for( let i = 0 ; i < userAccount.heart.my.length ; i++){
			// 		if ( userAccount.heart.my[i].sen_id == item.sen_id ) {
			// 			try{ userAccount.heart.my.splice(i, 1); }
			// 			catch(e) { console.log('userAccount.heart.my의 heart 삭제 못함');}
			// 		}
			// 		userAccount.markModified('heart.my');
			// 		break;
			// 	}
			// 	for( let i = 0 ; i < userAccount.heart.other.length ; i++){
			// 		if ( userAccount.heart.other[i].sen_id == item.sen_id ) {
			// 			try {userAccount.heart.other.splice(i, 1);}
			// 			catch(e) {  console.log('userAccount.heart.other의 heart 삭제 못함'); }
			// 		}
			// 		userAccount.markModified('heart.other');
			// 		break;
			// 	}
			// 	userAccount.save();

			// } else {
			// 	// 초대박. 드디어 몽고 db의 객체 특성을 알아냈다. 18.05.25
			// 	// 이제까지 그냥 object를 추가하면 안됐는데 바로 그 구조가 일반 객체와 달랐기 때문이다
			// 	// 아래와 같이 '뽑아온 객체'는 정확히 _doc안에 들어가 있다.
			// 	// 따라서 _doc안에 새로운 obj를 추가해야 데이터가 정상적으로 적용된다!
			// 	// const tempObj = Object.assign({}, aSen._doc);
			// 	// tempObj.heart_idx = idx;
			// 	aSen._doc.heart_idx = idx;
			// 	aSentence.push(aSen);
			// }

			// if (allSenLove.length == idx + 1)
			// 	// 대에에에에에박 비동기와 동기 문제를 해결했다!! 18.05.24
			// 	return callback(aSentence);
		})

}


// Get : write page
route.get('/:nickname/love', utils.funcIsSignedIn, (req, res) => {
	console.log('req.isSignedIn: '+ req.isSignedIn);

	DB_userAccount.findOne( { nickname : req.params.nickname }, (err, userAccount) => { // nickname으로 유저 문장들을 모두 찾아서
		if ( !userAccount ) { return res.render('error/default', { msg : '1We can\'t find your account.'}); }

		if ( !req.user ) {
				// 로그인 하지 않은 유저
				console.log('여기가 1');
				senLove(req, res, 'anonymous', userAccount );

		} else {
				if ( req.user.nickname === req.params.nickname ) { // passport를 통해 로그인한 유저가 자기 페이지에 들어온 거라면
					console.log('닉네임과 로그인 유저가 일치!');
					DB_userAccount.findById( req.user.id , (err, user) => {
						senLove(req, res, 'owner', userAccount, user.heart );
					})
				} else { // 로그인은 했지만 to페이지로 들어온 유저가 자기가 아니고 다른 유저라면, myNickname을 넘겨야 한다.
					DB_userAccount.findById( req.user.id , (err, user) => {
						console.log('로그인은 했지만 다른 사람의 to페이지에 방문한 유저');
						senLove(req, res, 'other', userAccount, user.heart );
					})
				}
		}
	});
});


// heart에서 love로 이름 바꿈. 18.05.23
route.post('/love', utils.funcIsSignedIn, (req,res)=>{
	console.log('req.isSignedIn: '+ req.isSignedIn);

	// console.log(req.body.itemId);
	// console.log(req.body.myNickname);
	// console.log(req.body.nickname);
	const itemId = req.body.itemId;
	const isHearting = parseInt(req.body.isHearting);
	console.log('isHearting: '+ isHearting);
	if ( req.session.isSignedIn || req.body.nickname =='everyone') { // everyone 예외처리
		if (req.body.nickname =='everyone') req.body.myNickname = req.body.nickname; // everyone의 love페이지에 넣기

		DB_userAccount
		.findOne({ nickname: req.body.myNickname}, (err,userAccount)=>{
			if(!userAccount) console.log('유저가 없네?');

			DB_aSentence
				.findById( itemId , (err, aSentence)=>{
					if(!aSentence) console.log('문장이 없네?');
					const heartObj = { user_id : userAccount.id, user_nickname: req.body.nickname ,
														createdAt : Date.now(), createdAt_local: new Date().toLocaleString() };

					function hearting(sentences, who){
						if ( isHearting ){ // heart를 on 했을 때
							// userAccout DB에 문장 정보를 넣고
							sentences.push({ sen_id : itemId, user_nickname: req.body.nickname , createdAt: Date.now(),	createdAt_local: new Date().toLocaleString() });
							// aSentence DB에 유저 정보를 넣는다
							if (who) { // 글을 쓴 사람이 자기 문장을 heart한 거라면
								aSentence.heart[0] = heartObj;
							} else { // 다른 사람이 문장을 heart한 거라면
								if(aSentence.heart == '' || aSentence.heart == 'undefined'){ // 이전에 아무도 heart 한 적이 없는 문장이라면
									// aSentence.heart[0] = { user_id: '', createdAt: ''};
									aSentence.heart[1] = heartObj;
								}else{ // 이전에 한번이라도 heart 한 적이 있는 문장이라면 그냥 push
									aSentence.heart.push(heartObj);
								}

							}
							utils_db.levelCal(req, 0, 0, aSentence.length, 1 ); 
						}
						else { // heart를 off 했을 때
							// findIndex 엄청나군.
							let foundItem = sentences.findIndex( i=> i.sen_id == itemId );
							// 새로 수정한 문장을 해당 index 위치에 바꿔넣는다.
							try{sentences.splice( foundItem, 1);}
							catch(e){console.log('지울 sen_id가 없음'+e);}
							
							if (who){ // 본인이 본인의 문장을 heart 했을 때
								console.log('여기는 들어왔다');

								// aSentence.heart[0] = {};
								aSentence.heart.splice(0, 1, null); // 삭제
							} else { // 다른 사람의 문장을 heart했을 때
								let foundItem = aSentence.heart.findIndex( (i, idx)=> { if(idx) return i.user_id == userAccount.id });
								try{
									console.log('foundItem: '+ foundItem);
									aSentence.heart.splice(foundItem, 1); // 삭제
								}catch(e){console.log('heart 문장 삭제 안됨'+e);}

								// for ( let i = 1; i < aSentence.heart.length; i++){
								// 	if ( aSentence.heart[i].user_id == userAccount.id ){ // user_id를 찾아서
								// 		console.log('유저 삭제');
								// 		try{
								// 			aSentence.heart.splice(i, 1); // 삭제
								// 		}catch(e){console.log('heart 문장 삭제 안됨'+e);}
								// 		break;
								// 	}
								// }

							}
						}

					}
					console.log('req.body.user: '+ req.body.user);
					if(req.body.user == 'true'){ // 본인이 본인의 문장을 heart 했을 때
						hearting(userAccount.heart.my, 1);
					} else { // 다른 사람의 문장을 heart했을 때
						hearting(userAccount.heart.other, 0);
					}
					aSentence.markModified('heart');
					aSentence.save();
					
					userAccount.markModified('heart.my');
					userAccount.markModified('heart.other');
					userAccount.save();
			})

	})

	res.sendStatus(200);
	}
})



module.exports = route;