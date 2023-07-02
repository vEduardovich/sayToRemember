const express       = require('express');
const route         = express.Router();
const mongoose      = require('mongoose');
const utils         = require('../../commons/utils.js');
const config        = require('../../commons/config'); // 설정

const DB_aSenByDate = require('../../models/aSenByDate');
const DB_aSentence  = require('../../models/aSentence');
const DB_userAccount= require('../../models/userAccount'); // 회원 계정 DB



// heart 된 문장들 모두 보여주기
function moreSayLove(req, res, user, userAccount, myHearts ){ // myHearts는 로그인 계정 유저의 모든(my,other) hearts정보
	const nickname = !req.user ? user : req.user.nickname;

	const allSenLove = userAccount.heart.my.concat( userAccount.heart.other ); // heart가 된 모든 문장 모음
	let myAllHearts;
	if (myHearts) myAllHearts = myHearts.my.concat( myHearts.other); // 내 계정이 heart한 모든 문장


	const page = parseInt(req.body.page); // 유저에게 보여줄 페이지
	const byDateStep = parseInt(req.body.byDateStep);
	const newBydate = parseInt(req.body.newBydate);
	let skipByDate = newBydate +( page - 1 ) * byDateStep; // 스킵할 페이지

	const totalBydateCount = parseInt(req.body.totalBydateCount); // 전체 byDate 수
	const totalPage = Math.ceil( totalBydateCount / byDateStep ); // 전체 페이지 수

	const pageModel =  { // 만약 글이 224개고 한 화면에 10개씩 보여준다면
		page 		 		: page, // 4, 4번째 페이지를 보여주라는 명령이 왔다면
		byDateStep 	: byDateStep, // 10, 한페이지에 10개의 byDate를 보여주고
		skipByDate 	: skipByDate, // 30 = ( 4-1)* 10, 30개의 글을 skip 한 후
		totalBydateCount : totalBydateCount, // 224, 전체글수
		totalPage 	: totalPage, // 23, 22.4 = (224/ 10), 전체 페이지 개수는 23페이지
	}


	const githubCount = new Array(); // github counting
	const sentences = new Array(); // heart sentence IDs

	allSenLove.sort( (a,b)=> b.createdAt - a.createdAt );
	allSenLove.map( (item , i)=>{
		// 이미 값이 있다면 ++시키고 값이 없다면 1을 넣는다
		// DB_aSentence에서 id 배열을 이용해 원하는 heart 문장들을 찾기 위해 만든다
		sentences.push( item.sen_id );
	})
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
								try {userAccount.heart.my.splice(j, 1);console.log('삭제');}
								catch(e) {  console.log('userAccount.heart.my heart 삭제 못함'); }
							}
							break;
						}
					}
					for( let i = 0 ; i < sentences.length ; i++){
						for (let j =0; j < userAccount.heart.other.length; j++){
							if ( userAccount.heart.other[j].sen_id == sentences[i] ) {
								try {userAccount.heart.other.splice(j, 1);console.log('삭제');}
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
			// console.log('skipByDate: '+skipByDate);
			// console.log('byDateStep: '+byDateStep);
			// console.log('aSentence1: '+ aSentence);
			
			aSentence = aSentence.splice(skipByDate, byDateStep); // ★ skip(skipByDate), limit(byDateStep) 과 동일
			// console.log('aSentece: '+ aSentence);
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

			res.render('say/moreSayLove', {
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
				otherHearts	: myAllHearts, // 다른 사람의 love페이지에 방문했을 때 그 안에 내가 heart만 문장들만 표시되게
				user 				: user,
				pageModel		: pageModel, // 페이지 정보 넘겨주기
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
			// 	// ★ 초대박. 드디어 monogodb의 객체 특성을 알아냈다. 18.05.25
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

// more 버튼을 눌렀을 때 실행
function moreSay(req, res, user, otherHearts = { sen_id:'' }) {
	const nickname = !req.user ? user : req.user.nickname;

	const page = parseInt(req.body.page); // 유저에게 보여줄 페이지
	const byDateStep = parseInt(req.body.byDateStep);
	const newBydate = parseInt(req.body.newBydate);
	console.log('newBydate: '+ newBydate );
	let skipByDate = newBydate +( page - 1 ) * byDateStep; // 스킵할 페이지

	console.log('skipByDate: '+ skipByDate);
	const totalBydateCount = parseInt(req.body.totalBydateCount); // 전체 byDate 수
	const totalPage = Math.ceil( totalBydateCount / byDateStep ); // 전체 페이지 수

	const pageModel =  { // 만약 글이 224개고 한 화면에 10개씩 보여준다면
		page 		 		: page, // 4, 4번째 페이지를 보여주라는 명령이 왔다면
		byDateStep 	: byDateStep, // 10, 한페이지에 10개의 byDate를 보여주고
		skipByDate 	: skipByDate, // 30 = ( 4-1)* 10, 30개의 글을 skip 한 후
		totalBydateCount : totalBydateCount, // 224, 전체글수
		totalPage 	: totalPage, // 23, 22.4 = (224/ 10), 전체 페이지 개수는 23페이지
	}

	DB_aSenByDate
		.find ( { user_id    : mongoose.Types.ObjectId(req.user.id) } ) // 해당 유저의 aSenByDate 를 받아서
		.sort ( { createdAt  : -1 } )
		.skip ( skipByDate )
		.limit( byDateStep )
		.exec( ( err, aSenByDate )=> {
			if ( !aSenByDate ) { console.log('aSenByDate: '+err); return res.render(err); }

			// 아래 몇 줄을 만들기 위해 오늘의 전력을 소비했다 18.03.20
			const aSenList = new Array();
			aSenByDate.map( (sentences, idx)=>{ // 그날의 모든 문장들을 가져온 후
				sentences.aSen_ids.map( (aSen)=>{ // 문장들을 하나하나 뽑아
					aSenList.push(aSen); // 배열 하나에 몰아넣는다.
				})
			})

			DB_aSentence
				.find( { _id : { $in : aSenList} } ) // 해당 유저의 aSentence도 모두 받아서
					// .find().where('_id').in(aSen.aSen_ids)
					.sort( { createdAt : -1 })
					.exec( ( err, aSentence )=> {
						if ( !aSentence ) { console.log('aSentence1: '+err); return res.render(err); }

						const tags = (!req.user) ? [config.defaultTag.tagName] : req.tags; 
						res.render('say/moreSay', {
							aSenByDate  : aSenByDate,
							aSentence   : aSentence,
							userTags		: tags, // 해당 nickname을 가진 유저의 tags
							tags				: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
							isSignedIn  : req.session.isSignedIn,
							// isMine      : true,
							nickname    : nickname, // 페이지 내에 nickname을 넣어 수정삭제등 권한부여에 접근성 용이하도록
							otherHearts : otherHearts, // heart array 전달
							user 				: user,
							pageModel		: pageModel, // 페이지 정보 넘겨주기
						});
					});
		});
}


// function moreSay(req, res, user) {

// 	const nickname = !req.user ? user : req.params.nickname;
// 	const page = parseInt(req.query.page); // 유저에게 보여줄 페이지
// 	const byDateStep = parseInt(req.query.byDateStep);
// 	const skipByDate = ( page - 1 ) * byDateStep; // 스킵할 페이지
// 	const totalBydateCount = parseInt(req.query.totalBydateCount); // 전체 byDate 수
// 	const totalPage = Math.ceil( totalBydateCount / byDateStep ); // 전체 페이지 수

// 	const pageModel =  { // 만약 글이 224개고 한 화면에 10개씩 보여준다면
// 		page 		 		: page, // 4, 4번째 페이지를 보여주라는 명령이 왔다면
// 		byDateStep 	: byDateStep, // 10, 한페이지에 10개의 byDate를 보여주고
// 		skipByDate 	: skipByDate, // 30 = ( 4-1)* 10, 30개의 글을 skip 한 후
// 		totalBydateCount : totalBydateCount, // 224, 전체글수
// 		totalPage 	: totalPage, // 23, 22.4 = (224/ 10), 전체 페이지 개수는 23페이지
// 	}

// 	DB_aSenByDate
// 		.find ( { user_id    : mongoose.Types.ObjectId(req.user.id) } ) // 해당 유저의 aSenByDate 를 받아서
// 		.sort ( { createdAt  : -1 } )
// 		.skip ( skipByDate )
// 		.limit( byDateStep )
// 		.exec( ( err, aSenByDate )=> {
// 			if ( !aSenByDate ) { console.log('aSenByDate: '+err); return res.render(err); }

// 			// 아래 몇 줄을 만들기 위해 오늘의 전력을 소비했다 18.03.20
// 			const aSenList = new Array();
// 			aSenByDate.map( (sentences, idx)=>{ // 그날의 모든 문장들을 가져온 후
// 				sentences.aSen_ids.map( (aSen)=>{ // 문장들을 하나하나 뽑아
// 					aSenList.push(aSen); // 배열 하나에 몰아넣는다.
// 				})
// 			})

// 			DB_aSentence
// 				.find( { _id : { $in : aSenList} } ) // 해당 유저의 aSentence도 모두 받아서
// 					// .find().where('_id').in(aSen.aSen_ids)
// 					.sort( { createdAt : -1 })
// 					.exec( ( err, aSentence )=> {
// 						if ( !aSentence ) { console.log('aSentence1: '+err); return res.render(err); }
// 						res.render('say/moreSay', {
// 							aSenByDate  : aSenByDate,
// 							aSentence   : aSentence,
// 							isSignedIn  : req.isSignedIn,
// 							isMine      : true,
// 							nickname    : nickname, // 페이지 내에 nickname을 넣어 수정삭제등 권한부여에 접근성 용이하도록
// 							user 				: user,
// 							pageModel		: pageModel, // 페이지 정보 넘겨주기
// 						});
// 					});
// 		});
// }


// Get : write page
// route.get('/:nickname/moreSay', utils.funcIsSignedIn, (req, res) => {
// 	console.log('req.isSignedIn: '+ req.isSignedIn);
// 	DB_userAccount.findOne( { nickname : req.params.nickname }, (err, userAccount) => { // nickname으로 유저 문장들을 모두 찾아서
// 		if ( !userAccount ) { return res.render('error/default', { msg : 'We can\'t find your account.'}); }
// 		req.user.id = userAccount._id;
// 		if ( !req.user ) {
// 				// 로그인 하지 않은 유저
// 				moreSay(req, res, 'anonymous');

// 		} else {
// 				if ( req.user.nickname === req.params.nickname ) { // passport를 통해 로그인한 유저가 자기 페이지에 들어온 거라면
// 					console.log('닉네임과 로그인 유저가 일치!');
// 					moreSay(req, res, 'owner');

// 				} else { // 로그인은 했지만 to페이지로 들어온 유저가 자기가 아니고 다른 유저라면
// 					console.log('로그인은 했지만 다른 사람의 to페이지에 방문한 유저');
// 					moreSay(req, res, 'other');
// 				}
// 		}
// 	});
// });


// 태그 검색의 more버튼을 눌렀을 때
function moreSayTag(req, res, user, otherHearts = { sen_id:'' }){

	const nickname = !req.user ? user : req.user.nickname;
	console.log('.user.: '+ user);
	const page = parseInt(req.body.page); // 유저에게 보여줄 페이지
	const byDateStep = parseInt(req.body.byDateStep);
	const newBydate = parseInt(req.body.newBydate);
	let skipByDate = newBydate +( page - 1 ) * byDateStep; // 스킵할 페이지

	const totalBydateCount = parseInt(req.body.totalBydateCount); // 전체 byDate 수
	const totalPage = Math.ceil( totalBydateCount / byDateStep ); // 전체 페이지 수
	const pageModel =  { // 만약 글이 224개고 한 화면에 10개씩 보여준다면
		page 		 		: page, // 4, 4번째 페이지를 보여주라는 명령이 왔다면
		byDateStep 	: byDateStep, // 10, 한페이지에 10개의 byDate를 보여주고
		skipByDate 	: skipByDate, // 30 = ( 4-1)* 10, 30개의 글을 skip 한 후
		totalBydateCount : totalBydateCount, // 224, 전체글수
		totalPage 	: totalPage, // 23, 22.4 = (224/ 10), 전체 페이지 개수는 23페이지
	}
	DB_aSentence // user_id와 tagIdx로 원하는 문장을 찾은 후
		.find ( { user_id    	: mongoose.Types.ObjectId(req.user.id),
							tagIdx			: req.searchingTagIdx,
					} )
		.sort ( { createdAt  : -1     } )
		.skip ( skipByDate )
		.limit( byDateStep )
		.exec( ( err, aSentence )=> {
			if ( !aSentence ) { console.log('aSentence: '+err);}

			// 태그 전체 재생 파일 목록 만들기
			const senMp3s = new Array();
			aSentence.map( (item)=>{
				senMp3s.push(item.mp3); // 음악 파일 push하고
			})

			// 태그 문장 전체 id 목록 만들기
			const senIds = new Array();
			aSentence.map( (item)=>{
				senIds.push(item._id); // 문장의 id를 push하
			})

			const tags = (!req.user) ? [config.defaultTag.tagName] : req.tags; 
			res.render('say/moreSayTag', {
				userTags		: tags, // 해당 nickname을 가진 유저의 tags
				tags				: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
				searchingTagIdx	: req.searchingTagIdx, // 유저가 요청한 카테고리 tagIdx
				aSentence   : aSentence,
				senIds			: senIds.join(','),
				mp3s				: senMp3s.reverse().join(','),
				senSort			: true,
				isSignedIn  : req.session.isSignedIn,
				isMine      : true,
				userNickname:	req.params.nickname, // 해당 페이지의 nickname
				nickname    : nickname, // 로그인을 한 계정의 nickname
				otherHearts : otherHearts, // heart array 전달
				user 				: user,
				pageModel		: pageModel, // 페이지 정보 넘겨주기
			});
		});

}


// Post : write page
route.post('/moreSay', utils.funcIsSignedIn, (req, res) => {
	console.log('req.isSignedIn: '+ req.isSignedIn);
	// console.log('req.body.nickname: '+ req.params.nickname);
	// pageNickname에는 유저가 접근하는 페이지의 nickname 정보가 들어있다

	DB_userAccount.findOne( { nickname : req.body.pageNickname }, (err, userAccount) => { // nickname으로 유저 문장들을 모두 찾아서
		if ( !userAccount ) { return res.render('error/default', { msg : '5We can\'t find your account.'}); }
		// req.user.id = userAccount._id;
		req.tags = userAccount.tags;
		req.searchingTagIdx = req.body.searchingTagIdx; // 검색을 원하는 태그의 idx를 넘긴다.

		if ( !req.user ) {
				// 로그인 하지 않은 유저
				if(req.searchingTagIdx == 'undefined') moreSay(req, res, 'anonymous');
				else if(parseInt(req.searchingTagIdx) == 10000) moreSayLove(req, res, 'anonymous', userAccount );
				else moreSayTag(req, res, 'anonymous');

		} else {
				if ( req.user.nickname === req.body.nickname ) { // passport를 통해 로그인한 유저가 자기 페이지에 들어온 거라면
					console.log('닉네임과 로그인 유저가 일치!');
					if(req.searchingTagIdx == 'undefined') moreSay(req, res, 'owner');
					else if(parseInt(req.searchingTagIdx) == 10000) moreSayLove(req, res, 'owner', userAccount);
					else moreSayTag(req, res, 'owner');
					

				} else { // 로그인은 했지만 to페이지로 들어온 유저가 자기가 아니고 다른 유저라면
					console.log('로그인은 했지만 다른 사람의 to페이지에 방문한 유저');
					DB_userAccount.findById( mongoose.Types.ObjectId(req.user.id), (err, user)=>{
						if(req.searchingTagIdx == 'undefined') moreSay(req, res, 'other', user.heart.other);
						else if(parseInt(req.searchingTagIdx) == 10000) moreSayLove(req, res, 'other', userAccount, user.heart );
						else moreSayTag(req, res, 'other', user.heart.other);
					})

				}
		}
	});
});

module.exports = route;