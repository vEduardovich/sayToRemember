const express       = require('express');
const route         = express.Router();
const mongoose      = require('mongoose');
const utils         = require('../../commons/utils.js');
const config        = require('../../commons/config'); // 설정

const DB_aSentence  = require('../../models/aSentence');
const DB_userAccount= require('../../models/userAccount'); // 회원 계정 DB


// tag searching function
function senTagList(req, res, user, otherHearts = { sen_id:'' }){
	const nickname = !req.user ? user : req.user.nickname;
	// if (req.params.nickname == 'everyone') console.log('tags: '+ tags);
	
	// for Github counting module
	const today   = new Date();
	const todayIdx = utils.term(today);
	try{
		DB_aSentence // user_id와 tagIdx로 원하는 문장을 찾은 후
		.find ( { user_id    	: mongoose.Types.ObjectId(req.id),
							tagIdx			: req.searchingTagIdx,
						} )
		.sort ( { createdAt  : -1     } )
		.exec ( (err, forGithubSens )=>{
			if ( !forGithubSens ) { console.log('forGithubSens err'); return res.render(err); }

			const githubCount = new Array();
			// 365일의 count를 모두 0으로 초기화
			for ( let i = 0 ; i <= 365 ; i++){
				githubCount.push( {count : 0 });
			}
			// 다음 실제 문장이 입력된 날짜만 index를 구해서 해당 날짜와 count를 입력.
			forGithubSens.map( (item)=>{
				const idx = utils.term(new Date(item.createdAt_local));
				
				if(githubCount?.count){
					if (githubCount[ idx ].count == 0 ){
						githubCount[ idx ] = { date : item.strDate, count : 1 };
					} else {
						githubCount[ idx ].count++;
					}
				}
			})
			// forGithubSens.map( (item)=>{
			// 	var idx = utils.term(new Date(item.createdAt_local));
			// 	// 이미 값이 있다면 ++시키고 값이 없다면 1을 넣는다
			// 	githubCount[ idx ] ? githubCount[ idx ]++ : githubCount[ idx ] = 1;
			// })

			const count 					= forGithubSens.length;
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

			DB_aSentence // user_id와 tagIdx로 원하는 문장을 찾은 후
				.find ( { user_id    	: mongoose.Types.ObjectId(req.id),
									tagIdx			: req.searchingTagIdx,
							} )
				.sort ( { createdAt  : -1     } )
				// .skip ( 0 )
				.limit( byDateStep )
				.exec( ( err, aSentence )=> {
					if ( !aSentence ) { console.log('aSentence: '+err); return res.render(err); }

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

					// const tags = (!req.user) ? [config.defaultTag.tagName] : req.user.tags; 
					res.render('say/sayTag', {
						cell				: githubCount,
						todayIdx		: todayIdx,
						userTags		: req.tags, // 해당 nickname을 가진 유저의 tags
						tags				: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
						searchingTagIdx	: req.searchingTagIdx, // 유저가 요청한 카테고리 tagIdx
						aSentence   : aSentence,
						senIds			: senIds.join(','),
						mp3s				: senMp3s.reverse().join(','),
						senSort			: true,
						isSignedIn  : req.session.isSignedIn,
						// isMine      : true,
						userNickname:	req.params.nickname, // 해당 페이지의 nickname
						nickname    : nickname, // 로그인을 한 계정의 nickname
						otherHearts : otherHearts, // heart array 전달
						user 				: user,
						pageModel		: pageModel, // 페이지 정보 넘겨주기
					});
				});

		})
	} catch(err) { console.log(err) }

}


// Get / category : searching page
route.get('/:nickname/tag/:searchingTagIdx', utils.funcIsSignedIn, (req, res) => {
	console.log('req.isSignedIn: '+ req.isSignedIn);

	DB_userAccount.findOne( { nickname : req.params.nickname }, (err, userAccount) => {
		if ( !userAccount ) { return res.render('error/default', { msg : '2We can\'t find your account.'}); }
		req.id = userAccount._id; // 해당 닉넴 유저의 id
		req.tags = userAccount.tags; // 해당 닉넴 유저의 tags
		req.searchingTagIdx = req.params.searchingTagIdx; // 검색을 원하는 태그의 idx를 넘긴다.
		if ( !req.user ) {
				// 로그인 하지 않은 유저
				senTagList(req, res, 'anonymous');

		} else {
				if ( req.user.nickname === req.params.nickname ) { // passport를 통해 로그인한 유저가 자기 페이지에 들어온 거라면
					console.log('닉네임과 로그인 유저가 일치!');
					senTagList(req, res, 'owner');

				} else { // 로그인은 했지만 to페이지로 들어온 유저가 자기가 아니고 다른 유저라면
					console.log('로그인은 했지만 다른 사람의 to페이지에 방문한 유저');
					DB_userAccount.findById( mongoose.Types.ObjectId(req.user.id), (err, user)=>{
						senTagList(req, res, 'other', user.heart.other );
					})					
				}
		}
	});
});


// 새로 만든 카테고리를 저장
route.post('/tagSave', utils.funcIsSignedIn, (req, res)=>{
	console.log('req.isSignedIn: '+ req.isSignedIn);

	if ( req.body.nickname == 'everyone' ){ // everyone 페이지 예외처리
		DB_userAccount.findOne( { nickname : req.body.nickname }, (err, userAccount) => {
			if ( !userAccount ) { return res.render('error/default', { msg : '3We can\'t find your account.'}); }
			console.log(req.body.tagIdx);
			console.log(req.body.tagName);
			userAccount.tags[parseInt(req.body.tagIdx)]= req.body.tagName;
			// req.session.tags = userAccount.tags; // 새로 바뀐 tag정보를 넣어준다
			// console.log(req.session.tags);
			userAccount.markModified('tags');
			userAccount.save( (err)=>{res.sendStatus(200); });
		});
	} else
	if ( req.user.nickname === req.body.nickname) {
		DB_userAccount.findOne( { nickname : req.body.nickname }, (err, userAccount) => {
			if ( !userAccount ) { return res.render('error/default', { msg : '3We can\'t find your account.'}); }
			console.log(req.body.tagIdx);
			console.log(req.body.tagName);
			userAccount.tags[parseInt(req.body.tagIdx)]= req.body.tagName;
			userAccount.markModified('tags');
			userAccount.save( (err)=>{
				// DB_aSentence
				// 	.find ( { tagIdx    : req.body.tagIdx } ) // tagIdx가 같은 모든 문장을 찾아서
				// 	.exec( ( err, aSentence )=> {
				// 		if ( !aSentence ) { console.log('aSentence: '+err); return res.render(err); }
				// 		aSentence.map( ( aSen )=>{
				// 			aSen.tagName = req.body.tagName;
				// 			aSen.save();
				// 		})
				// 	});
				res.sendStatus(200); // ajax 성공 처리
			});

		});
	}
})

// 카테고리를 삭제
route.post('/tagRemove', utils.funcIsSignedIn, (req, res)=>{
	console.log('req.isSignedIn: '+ req.isSignedIn);
	if ( req.body.nickname == 'everyone' ){ // everyone 페이지 예외처리
		DB_userAccount.findOne( { nickname : req.body.nickname }, (err, userAccount) => {
			if ( !userAccount ) { return res.render('error/default', { msg : '3We can\'t find your account.'}); }
			console.log(req.body.tagIdx);
			console.log(req.body.tagName);
			userAccount.tags[parseInt(req.body.tagIdx)]= req.body.tagName;
			// req.session.tags = userAccount.tags; // 새로 바뀐 tag정보를 넣어준다
			userAccount.markModified('tags');
			userAccount.save( (err)=>{res.sendStatus(200); });
		});
	} else
	if ( req.user.nickname === req.body.nickname ) {
		DB_userAccount.findOne( { nickname : req.body.nickname }, (err, userAccount) => {
			if ( !userAccount ) { return res.render('error/default', { msg : '4We can\'t find your account.'}); }
			console.log(req.body.tagIdx);
			delete userAccount.tags[parseInt(req.body.tagIdx)];
			// req.session.tags = userAccount.tags; // 새로 바뀐 tag정보를 넣어준다

			userAccount.markModified('tags');
			userAccount.save( (err)=>{

				DB_aSentence
					.find ( { tagIdx    : req.body.tagIdx } ) // tagIdx가 같은 모든 문장을 찾아서
					.exec( ( err, aSentence )=> {
						if ( !aSentence ) { console.log('aSentence: '+err); return res.render(err); }
						aSentence.map( ( aSen )=>{
							aSen.tagIdx = '0';
							aSen.save();
						})
						res.sendStatus(200); // ajax 성공 처리
					});
			});
		});
	}
})


module.exports = route;