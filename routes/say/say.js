const express       = require('express');
const route         = express.Router();
const mongoose      = require('mongoose');
const utils         = require('../../commons/utils.js');
const utils_db      = require('../../commons/utils_db.js');
const config        = require('../../commons/config'); // 설정

const DB_aSenByDate = require('../../models/aSenByDate');
const DB_aSentence  = require('../../models/aSentence');
const DB_userAccount= require('../../models/userAccount'); // 회원 계정 DB

const AWS           = require('aws-sdk');


route.get('/', require('../everyone'));// 모두의 페이지
route.post('/moreSay', require('./say_more')); // moreSay 페이지

route.post('/love', require('./say_love')); // love 페이지
route.get('/:nickname/love', require('./say_love'));

route.get('/:nickname/profile', require('../profile')); // MyPage
route.get('/:nickname/day/:day', require('./say_day'));// Day에 따른 문장 보여주기(for SEO)

route.get('/:nickname/tag/:searchingTagIdx', require('./say_tag'));// tag 페이지
route.post('/tagSave', require('./say_tag'));
route.post('/tagRemove', require('./say_tag'));


// 기능 페이지
route.post('/senSort', require('./say_func')); // 문장정렬
route.post('/clicked', require('./say_func')); // 문장 플레이시 클릭 처리


// 로그인과 상관없이 layout과 영문장 목록을 보여주는 함수. - say
function senList(req, res, user, otherHearts = [{ sen_id:'' }]) {
	// 만약 로그인하지 않은 유저라면 익명시유저명을 넣는다
	const nickname = !req.user ? user : req.user.nickname;

	// console.log('req.session: ');
	// console.log(req.session);

	// console.log('req.session.cookie.maxAge: '+ req.session.cookie.maxAge);
	// for Github counting module
	const today   	= new Date();
	const todayIdx = utils.term(today);

	DB_aSenByDate // github 전체 count를 위해 db를 뒤진다
		.find ( { user_id    : mongoose.Types.ObjectId(req.id) } )
		.sort ( { createdAt  : -1  } )
		.exec ( (err, forGithubSens )=>{
			if ( !forGithubSens ) { console.log('forGithubSens err'); return res.render(err); }
			
			const githubCount = new Array();
			// 365일의 count를 모두 0으로 초기화
			// 12.31일 오늘. 기존 < 365로 코딩했던 것을 <= 365로 수정했다. local date와 무언가 꼬인 걸지도 모르겠다. 일단 수정했으니 나중에 자세히 보자.
			for ( let i = 0 ; i <= 365 ; i++){
				githubCount.push( {count : 0 });
			}
			// 다음 실제 문장이 입력된 날짜만 index를 구해서 해당 날짜와 count를 입력.
			forGithubSens.map( (item)=>{
				const idx = utils.term(new Date(item.createdAt_local));
				githubCount[ idx ] = { date : item.strDate, count : item.count };
				// githubCount[ idx ] = item.count;
			})

			const count 					= forGithubSens.length;
			const page 						= config.showPage.page; // 유저에게 보여줄 페이지
			const byDateStep 			= config.showPage.byDateStep; // 하루에 보여주는 페이지
			const skipByDate 			= ( page - 1 ) * byDateStep; // 스킵할 페이지
			const totalBydateCount = (!count || count == 0) ? 0 : count; // 전체 byDate 수
			const totalPage 			= Math.ceil( totalBydateCount / byDateStep ); // 전체 페이지 수

			const pageModel =  { // 만약 글이 224개고 한 화면에 10개씩 보여준다면
				page 		 					: page, // 4, 4번째 페이지를 보여주라는 명령이 왔다면
				byDateStep 				: byDateStep, // 5, 한페이지에 5개의 byDate를 보여주고
				skipByDate 				: skipByDate, // 30 = ( 4-1)* 10, 30개의 글을 skip 한 후
				totalBydateCount 	: totalBydateCount, // 224, 전체글수
				totalPage 				: totalPage, // 23, 22.4 = (224/ 10), 전체 페이지 개수는 23페이지
			}

			DB_aSenByDate
				.find ( { user_id    : mongoose.Types.ObjectId(req.id) } ) // 해당 유저의 aSenByDate 를 받아서
				.sort ( { createdAt  : -1     } )
				.skip ( 0 )
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
					// console.log('otherHearts: '+ otherHearts);
					DB_aSentence
						.find( { _id : { $in : aSenList} } ) // 해당 유저의 aSentence도 모두 받아서
							// .find().where('_id').in(aSen.aSen_ids)
							.sort( { createdAt : -1 })
							.exec( ( err, aSentence )=> {
								if ( !aSentence ) { console.log('aSentence1: '+err); return res.render(err); }
								// 로그인 하지 않은 유저의 tag정보를 만들어준다
								const tags = (!req.user) ? [config.defaultTag.tagName] : req.user.tags;
								// console.log('tags: '+ req.user.tags);
								res.render('say/say', {
									cell				: githubCount,
									todayIdx		: todayIdx,
									aSenByDate  : aSenByDate,
									aSentence   : aSentence,
									userTags		: req.tags, // 해당 nickname을 가진 유저의 tags
									tags				: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
									isSignedIn  : req.session.isSignedIn,
									// isMine      : true,
									userNickname:	req.params.nickname, // 해당 페이지의 nickname
									nickname    : nickname, // 로그인을 한 계정의 nickname
									otherHearts : otherHearts, // heart array 전달
									user 				: user,
									pageModel		: pageModel, // 페이지 정보 넘겨주기
								});
							});

			});

		})

}


// Get : write page
route.get('/:nickname', utils.funcIsSignedIn, (req, res) => {
	// req.user.id = (req.user) ? req.user.id :'';
	DB_userAccount.findOne( { nickname : req.params.nickname }, (err, userAccount) => { // nickname으로 유저 문장들을 모두 찾아서
		if ( !userAccount ) { return res.render('error/default', { msg : '1We can\'t find your account.'}); }
		req.id = userAccount._id; // 해당 닉넴 유저의 id
		req.tags = userAccount.tags; // 해당 닉넴 유저의 tags
		console.log(userAccount.tags);
		if ( !req.user ) {
				// 로그인 하지 않은 유저
				senList(req, res, 'anonymous' );

		} else {
				if ( req.user.nickname === req.params.nickname ) { // passport를 통해 로그인한 유저가 자기 페이지에 들어온 거라면
					console.log('닉네임과 로그인 유저가 일치!');
					senList(req, res, 'owner');

				} else { // 로그인은 했지만 to페이지로 들어온 유저가 자기가 아니고 다른 유저라면
					console.log('로그인은 했지만 다른 사람의 to페이지에 방문한 유저');
					DB_userAccount.findById( mongoose.Types.ObjectId(req.user.id), (err, user)=>{
						senList(req, res, 'other', user.heart.other );

					})
				}
		}
	});
});


route.post('/tts', (req, res)=>{
	if ( req.user || req.body.nickname == 'everyone'){ // 유저가 로그인 했는데, everyone 추가 18.06.18
		console.log('req.user.nickname: '+ req.body.nickname);
		if (req.body.nickname == 'everyone') {
			DB_userAccount
				.findOne({ nickname: 'everyone'}, (err, everyone)=>{
					req.user = everyone;
					return utils_db.makeSentence(req, res, 1); // everyone페이지 예외처리
				})
		}
		else {
			if (req.body.nickname == req.user.nickname){
				utils_db.makeSentence(req, res, 1); // 1은 문장 처음 입력
			} else {
				console.log('req.user.id: '+ req.user.id);
				console.log('넌 입력할 수 없어');}
		}
	}
})

// 글 삭제
route.post( '/senDel', ( req, res ) => {
	DB_aSentence
		.findById( req.body.senID , (err, aSen)=>{
			if (!aSen) console.log('넌 지울수 없어');
			if (req.body.nickname == 'everyone') { // everyone페이지 예외처리
				DB_userAccount
					.findOne({ nickname: 'everyone'}, (err, everyone)=>{
						req.user = everyone;
						return deleteSentence(req, res);
					})
			}else{
				if (aSen.user_id.toString() == req.user.id) deleteSentence(req, res);
				else console.log('넌 지울수 없어');
			}
		})

	// 이제 신원이 보장되었으니 지우자. 삭제한다해도 LevelScore를 떨어뜨리지 않는다
	function deleteSentence(req,res){
		console.log('req.body.senByDateID: '+ req.body.senID);
		DB_aSenByDate
			.findById( { _id : req.body.senByDateID }, ( err, aSenByDate ) => {
				if ( !aSenByDate ) { return res.render('error/default', { msg : 'no aSenByDate'}); }
				if ( aSenByDate.count == 1 ) {  // 만약 aSenByDate가 문장을 하나만 가지고 있다면
						aSenByDate.remove();        // 해당 aSenByDate를 지워버린다.
						// aSenByDate.deleteOne();			// 새로운 mongoDB용 명령어. remove()대신 사용하란다. 18.09.05
						aSenByDate.count = 0;       // 클라이언트 전달용으로 count는 0으로 세팅.
				} else {                        // 그렇지 않고 여러 mp3s를 가지고 있다면
						aSenByDate.count--;         // 먼저 카운트 한개를 줄이고
						let tmpFoundMp3 = aSenByDate.mp3s.indexOf( req.body.senIDMp3 ); // mp3s배열에서 찾아서
						console.log('삭제할 파일 : '+ req.body.senIDMp3);
						aSenByDate.mp3s.splice( tmpFoundMp3 , 1 );                      // 삭제한다.
						aSenByDate.markModified('mp3s');
				}
				DB_aSentence
					.findByIdAndRemove( req.body.senID , ( err, aSentence ) => { // 이제 마지막 해당 영문장을 삭제한다.
						if ( !aSentence ) { return res.render('error/default', { msg : 'no aSentence'}); }
						const sentences = new Array();
						// idx가 0안에 null값이 있을 경우 user_id가 없다. 하지만 idx 1에는 값이 있고 user_id가 있을 수 있으므로 아래와 같이 처리한다.
						aSentence.heart.map( (item, idx)=>{
							try{
								if(idx){
									if(item.user_id) sentences.push(item.user_id)
								} else {
									sentences.push(item.user_id); // _id로 하면 '부호가 사라지게 push할 수 있다
								}
							}catch(e){ console.log('삭제user_id 못찾겠다.');}
						}) 
						// 이 문장을 heart한 모든 유저의 계정을 찾아 해당 문장을 지운다
						if (sentences){
							DB_userAccount
								.find( { _id : { $in : sentences } })
								.exec( (err, userAccounts )=>{
									// 이 문장을 heart했던 모든 유저를 찾은 후
									// console.log('heart유저가 이놈이야: '+ userAccounts);
									for ( let i=0 ; i < userAccounts.length ; i++){
										for ( let j=0; j < userAccounts[i].heart.my.length ; j++ ){
											// console.log('userAccounts[i].heart.my[j].sen_id: '+ userAccounts[i].heart.my[j].sen_id);
											if ( userAccounts[i].heart.my[j].sen_id == req.body.senID ){
												try{userAccounts[i].heart.my.splice( j, 1);}
												catch(e){console.log('heart문장 지우지 못했어'+ e);}
												break;
											}
										}
										for ( let j=0; j < userAccounts[i].heart.other.length ; j++ ){
											// console.log('userAccounts[i].heart.other[j].sen_id: '+ userAccounts[i].heart.other[j].sen_id);
											if ( userAccounts[i].heart.other[j].sen_id == req.body.senID ){
												console.log('들어왔다');
												try{userAccounts[i].heart.other.splice( j, 1);console.log('index: '+j);}
												catch(e){console.log('heart문장 지우지 못했어'+ e);}
												break;
											}
										}
										userAccounts[i].markModified('heart.my'); // 이햐 이렇게 i처리하면 되는구나
										userAccounts[i].markModified('heart.other'); // 이햐 이렇게 i처리하면 되는구나
										userAccounts[i].save();
									}

								})
						}

						try{
							const s3     = new AWS.S3();
							const params = {
								Bucket: 'saytoremember',
								Key: 'sound/'+ req.body.senIDMp3,
							};
							// S3 안에 파일 삭제
							s3.deleteObject (params, function(err, data) {
								if (err) console.log('File deleted error : ' + err)
								// else console.log('File deleted successfully');
							})

						} catch (e) { console.log(e.message);}

						// 수정 전 문장의 id로 해당 index를 구한후
						let tmpFoundaSenObj = aSenByDate.aSen_ids.indexOf( aSentence._id );
						// 새로 수정한 문장을 해당 index 위치에 바꿔넣는다.
						aSenByDate.aSen_ids.splice( tmpFoundaSenObj, 1);
						aSenByDate.markModified('aSen_ids');

						aSenByDate.save( (err)=>{  // 그리고 save()시켜야 DB에 저장된다.
							res.json( {mp3s : aSenByDate.mp3s , count : aSenByDate.count });
						});
					});
			})

	}
});


// 글 수정 후 저장
route.post('/senModifyOK', ( req, res ) => {
	// console.log('req.user.id: '+ req.user.id);
	DB_aSentence
		.findById( req.body.senID , (err, aSen)=>{
			console.log('1');
			if (!aSen) console.log('수정할 문장없어');
			if (req.body.nickname == 'everyone') { // everyone페이지 예외처리
				console.log('2');
				DB_userAccount
					.findOne({ nickname: 'everyone'}, (err, everyone)=>{
						req.user = everyone;
						return utils_db.makeSentence(req, res, 2);
					})
			}else{
				if (aSen.user_id.toString() == req.user.id) utils_db.makeSentence(req, res, 2); // 2는 문장 수정
				else console.log('넌 수정할 수 없어');
			}
		})
})


module.exports = route;