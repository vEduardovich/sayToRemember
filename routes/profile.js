const express       = require('express');
const ip            = require('ip');
const route         = express.Router();
const mongoose      = require('mongoose');
const request       = require('request');
const utils         = require('../commons/utils.js');
const config        = require('../commons/config'); // 설정

const DB_aSenByDate  = require('../models/aSenByDate');
const DB_aSentence   = require('../models/aSentence');
const DB_userAccount = require('../models/userAccount'); // 회원 계정 DB
const DB_userStat		 = require('../models/userStat'); // 유저 score및 랭킹

// profile 에서는 실시간으로 데이터 정보를 보여준다. 통계 데이터만 하루한번씩 처리한 후 그것과 비교해서 보여준다.

// 시작화면 - Main
route.get('/:nickname/profile', utils.funcIsSignedIn, (req, res) => {
	const dt = new Date();
	const thisYear = dt.getFullYear();


	const promise = new Promise(function(resolve, reject) { // userAccount
		const dataList = new Object();
		let userAccount = DB_userAccount.findOne({ nickname: req.params.nickname },{ tokens:0,pwd_sha256:0,salt:0,pwd:0 }).exec();
		dataList.userAccount = userAccount;
		resolve(dataList);
	});

	promise.then(function(dataList) { // aSenByDate 입력한 날짜만 사용하기때문에 counting만 했다
		const aSenByDateCount = DB_aSenByDate
			.countDocuments({ nickname: req.params.nickname ,
				createdAt : {'$gte': new Date(thisYear-1,11,31,15),'$lte': new Date(thisYear,11,31,15)}});
		dataList.aSenByDateCount = aSenByDateCount;
		return dataList;

	}).then(function(dataList) { // aSentence
		const aSentence = DB_aSentence
			.find( {nickname: req.params.nickname,
				updatedAt : {'$gte': new Date(thisYear-1,11,31,15),'$lte': new Date(thisYear,11,31,15)}}).exec();

		dataList.aSentence = aSentence;
		return dataList;

	}).then(function(dataList) { // userStat
		const userStat = DB_userStat
			.findOne( {nickname: req.params.nickname,
				updatedAt : {'$gte': new Date(thisYear-1,11,31,15),'$lte': new Date(thisYear,11,31,15)}}).exec();
		dataList.userStat = userStat;
		return dataList;
	})

	.then(function(dataList){
		const userStat = DB_userStat.find({nickname: req.params.nickname}).sort({createdAt: -1}).limit(2);
		dataList.userStat = userStat;
		return dataList;
	})
	.then(function(dataList){

		dataList.userAccount.then(userAccount=>{
			dataList.aSenByDateCount.then(aSenByDateCount=>{
				dataList.aSentence.then(aSentence=>{
					dataList.userStat.then(userStat=>{
						let iLoveCount = 0;
						let beloved_count = 0;
						let iPlayedCount = 0;
						let otherPlayedCount = 0;
						let letterCount = 0;
						let categoryStat = new Array();
						const words = new Array();

						// 카테고리 초기화
						userAccount.tags.map( (tag)=>{
							categoryStat.push({category: tag, count:0,iLove:0,beLoved:0})
						})
						aSentence.map( (aSen, idx)=>{
							let isILove = false;
							let heartLength = 0;
							aSen.beloved_count = 0;


							if (aSen.heart.length <= 1 ){
								if (!(aSen.heart[0] == null) || !(aSen.heart[0] == undefined )) {
									isILove = true;
								}
							} else if (aSen.heart.length > 1) {
								if (!(aSen.heart[0] == null) || !(aSen.heart[0] == undefined )) {
									isILove = true;
									heartLength = aSen.heart.length;
									aSen.beloved_count = aSen.heart.length;
								}else{
									heartLength = aSen.heart.length - 1; // [0]이 쓰레기 값이므로 1을 뺀다
									aSen.beloved_count = aSen.heart.length - 1;
								}
							}


							beloved_count += heartLength;
							letterCount += aSen.lenInfo;
							iPlayedCount += aSen.clicked;
							otherPlayedCount += aSen.other_clicked;

							// 만약 해당 배열 인덱스가 없다면 새로 생성한다
							if( categoryStat[aSen.tagIdx] == undefined) {
								categoryStat[aSen.tagIdx] = {count:0,iLove:0,beLoved:0};
							}
							categoryStat[aSen.tagIdx].count += 1;
							if(isILove) categoryStat[aSen.tagIdx].iLove += 1;
							categoryStat[aSen.tagIdx].beLoved += heartLength;

							aSen.engTxt_word.map( engTxt =>{
								// ★ 단어를 찾아서 해당 인덱스를 넘긴다. 없다면 -1
								// 필터처리하고 싶은게 있다면 findIndex(조건) 에 추가한다.
								const index = words.findIndex ( el => el.stem == engTxt.stem );
								if ( index != -1 ) words[index].count += 1;
								else words.push({ word: engTxt.token, tag: engTxt.tag || 'N' , stem: engTxt.stem || engTxt.token , count: 1 });
							})
						})


						const mostPlayed = aSentence.sort( (a,b)=> b.clicked - a.clicked ).slice(0,5);
						const mostBeloved = aSentence.sort( (a,b)=> b.beloved_count - a.beloved_count ).slice(0,5);
						const mostStems = words.sort( (a,b)=> b.count - a.count ).slice(0,10); // 단어 10개 뽑기
						// 혹은 대명사와 비동사 등을 빼고 만들어 보자.

						iLoveCount = userAccount.heart.my.length + userAccount.heart.other.length;

						// totalScore 계산 
						const aSenByDateScore = aSenByDateCount * config.stats.summary.byDateWeight + userAccount.counting_signin * config.stats.summary.loginWeight;  // grit 스코어 계산
						const lovedScore = beloved_count * config.stats.summary.honorWeight; // honor 계산
						const iPlayedScore = iPlayedCount * config.stats.summary.iPlayedCount; // 총 플레이수 계산
						const letterScore = letterCount * config.stats.summary.letterCount; // 총 글자수 계산
						const intellectScore = iPlayedScore + letterScore; // intellect 스코어 계산(플레이수+글자수)
						const totalScore = aSenByDateScore + lovedScore + intellectScore; // total Score
						const levelScoreStat = userAccount.stat.levelScore; // 유저 레벨스코어
						const levelStat = userAccount.stat.level; // 유저 레벨

						// 증감 비교 함수
						function compareVal( present, past){
							if( present > past ) return '▲'+ (present - past);
							else if ( present < past ) return '▼' + Math.abs(present - past);
							else return '';
						}


						// 만약 가입한지 하루밖에 안된 유저라면 랭킹 비교를 위해 [1]을 하나더 만들어준다
						if (userStat.length ==1 ) userStat[1] = userStat[0];
						const levelScore = { stat : levelScoreStat,
							statGap : compareVal(levelScoreStat, userStat[0].levelScore.stat),
							rank: userStat[1].levelScore.rank,
							rankGap : compareVal(userStat[1].levelScore.rank,userStat[0].levelScore.rank),
							ratio: userStat[1].levelScore.ratio,
							ratioGap : compareVal(userStat[1].levelScore.ratio,userStat[0].levelScore.ratio),
						};
						const level = { stat : levelStat,
							statGap : compareVal(levelStat, userStat[0].level.stat),
							rank: userStat[1].level.rank,
							rankGap : compareVal(userStat[1].level.rank,userStat[0].level.rank),
							ratio: userStat[1].level.ratio,
							ratioGap : compareVal(userStat[1].level.ratio,userStat[0].level.ratio),
						};

						const total = { stat: totalScore,
							statGap : compareVal(totalScore, userStat[0].total.stat),
							rank: userStat[1].total.rank,
							rankGap : compareVal(userStat[1].total.rank,userStat[0].total.rank),
							ratio: userStat[1].total.ratio,
							ratioGap : compareVal(userStat[1].total.ratio,userStat[0].total.ratio),
						}
						const grit = { stat: aSenByDateScore,// 근성 = 매일 문장 입력한 날수 Score
							statGap : compareVal(aSenByDateScore, userStat[0].grit.stat),
							rank: userStat[1].grit.rank,
							rankGap : compareVal(userStat[1].grit.rank,userStat[0].grit.rank),
							ratio: userStat[1].grit.ratio,
							ratioGap : compareVal(userStat[1].grit.ratio,userStat[0].grit.rank),
						}
						const honor = { stat: lovedScore,// 명예 = love를 받은 문장 Score
							statGap : compareVal(lovedScore, userStat[0].honor.stat),
							rank: userStat[1].honor.rank,
							rankGap : compareVal(userStat[1].honor.rank,userStat[0].honor.rank),
							ratio: userStat[1].honor.ratio,
							ratioGap : compareVal(userStat[1].honor.ratio,userStat[0].honor.ratio),
						}
						const intellect = { stat: intellectScore,// 지성 = 문장수 + 글자수
							statGap : compareVal(intellectScore, userStat[0].intellect.stat),
							rank: userStat[1].intellect.rank,
							rankGap : compareVal(userStat[1].intellect.rank,userStat[0].intellect.rank),
							ratio: userStat[1].intellect.ratio,
							ratioGap : compareVal(userStat[1].intellect.ratio,userStat[0].intellect.ratio),
						}

						const info_days = { count: aSenByDateCount,// 당해 매일 입력한 날 수
							avg : parseFloat((aSenByDateCount/365).toFixed(2)),
							rank: userStat[1].info_days.rank,
							rankGap : compareVal(userStat[1].info_days.rank,userStat[0].info_days.rank),
							ratio: userStat[1].info_days.ratio,
							ratioGap : compareVal(userStat[1].info_days.ratio,userStat[0].info_days.ratio),
						}

						const aSentenceCount = aSentence.length;
						const info_sentencesAvg = (aSenByDateCount) ? parseFloat((aSentenceCount/aSenByDateCount).toFixed(2)) : 0; // 0으로 나누지 못하게
						const info_sentences = { count: aSentenceCount,// 당해 총 입력한 문장 수
							countGap: compareVal(aSentenceCount, userStat[1].info_sentences.count),
							avg : info_sentencesAvg,
							rank: userStat[1].info_sentences.rank,
							rankGap : compareVal(userStat[1].info_sentences.rank,userStat[0].info_sentences.rank),
							ratio: userStat[1].info_sentences.ratio,
							ratioGap : compareVal(userStat[1].info_sentences.ratio,userStat[0].info_sentences.ratio),
						}

						const info_lettersAvg = (aSenByDateCount) ? parseFloat((letterCount/aSentenceCount).toFixed(2)) : 0;
						const info_letters = { count: letterCount,// 당해 입력한 문장중 내가 입력한 총 글자수
							countGap: compareVal(letterCount, userStat[1].info_letters.count),
							avg : info_lettersAvg,
							// avgGap: compareVal(info_lettersAvg, userStat[1].info_letters.avg),
							rank: userStat[1].info_letters.rank,
							rankGap : compareVal(userStat[1].info_letters.rank,userStat[0].info_letters.rank),
							ratio: userStat[1].info_letters.ratio,
							ratioGap : compareVal(userStat[1].info_letters.ratio,userStat[0].info_letters.ratio),
						}

						const info_playedAvg = (aSenByDateCount) ? parseFloat((iPlayedCount/aSenByDateCount).toFixed(2)) : 0;
						const info_played = { count: iPlayedCount,// 당해 문장 중 내가 play한 수
							countGap: compareVal(iPlayedCount, userStat[0].info_played.count),
							avg : info_playedAvg,
							rank: userStat[1].info_played.rank,
							rankGap : compareVal(userStat[1].info_played.rank,userStat[0].info_played.rank),
							ratio: userStat[1].info_played.ratio,
							ratioGap : compareVal(userStat[1].info_played.ratio,userStat[0].info_played.ratio),
						}

						const info_otherPlayedAvg = (aSenByDateCount) ? parseFloat((otherPlayedCount/aSenByDateCount).toFixed(2)) : 0;
						const info_otherPlayed = { count: otherPlayedCount,// 당해 다른사람이 내 문장을 play한 수
							countGap: compareVal(otherPlayedCount, userStat[0].info_otherPlayed.count),
							avg : info_otherPlayedAvg,
							rank: userStat[1].info_otherPlayed.rank,
							rankGap : compareVal(userStat[1].info_otherPlayed.rank,userStat[0].info_otherPlayed.rank),
							ratio: userStat[1].info_otherPlayed.ratio,
							ratioGap : compareVal(userStat[1].info_otherPlayed.ratio,userStat[0].info_otherPlayed.ratio),
						}

						const info_loveAvg = (aSenByDateCount) ? parseFloat((iLoveCount/aSenByDateCount).toFixed(2)) : 0;
						const info_love = { count: iLoveCount,// 내가 love한 모든 문장의 수
							countGap: compareVal(iLoveCount, userStat[0].info_love.count),
							avg : info_loveAvg,
							rank: userStat[1].info_love.rank,
							rankGap : compareVal(userStat[1].info_love.rank,userStat[0].info_love.rank),
							ratio: userStat[1].info_love.ratio,
							ratioGap : compareVal(userStat[1].info_love.ratio,userStat[0].info_love.ratio),
						}

						const info_belovedAvg = (aSenByDateCount) ? parseFloat((beloved_count/aSenByDateCount).toFixed(2)) : 0;
						const info_beloved = { count: beloved_count,// 당해 다른 사람에게에 love를 받은 문장 수
							countGap: compareVal(beloved_count, userStat[0].info_beloved.count),
							avg : info_belovedAvg,
							rank: userStat[1].info_beloved.rank,
							rankGap : compareVal(userStat[1].info_beloved.rank,userStat[0].info_beloved.rank),
							ratio: userStat[1].info_beloved.ratio,
							ratioGap : compareVal(userStat[1].info_beloved.ratio,userStat[0].info_beloved.ratio),
						}

						
						// 카테고리 count, love, beloved 랭킹
						categoryStat.map( (c, idx)=>{
							c.name	= userAccount.tags[idx];
							// userStat DB에는 해당 category가 없을 수 있다. 이럴 경우 0으로 초기화한다 18.08.07
							if (userStat[0].category[idx] == undefined){
								c.countGap = compareVal(c.count, 0); 
								c.iLoveGap = compareVal(c.iLove, 0);
								c.beLovedGap = compareVal(c.beLoved, 0);
							}else{
								c.countGap = compareVal(c.count, userStat[0].category[idx].count); 
								c.iLoveGap = compareVal(c.iLove, userStat[0].category[idx].iLove);
								c.beLovedGap = compareVal(c.beLoved, userStat[0].category[idx].beLoved);
							}
						})
						
						mostPlayed.map( (m, idx)=>{
							const index_0 = userStat[0].mostPlayed.findIndex( userStatM => userStatM._id == m.id );
							const index_1 = userStat[1].mostPlayed.findIndex( userStatM => userStatM._id == m.id );
							
							if ( index_0 != -1 && index_1 != -1 ){
								m.clickedGap = compareVal(m.clicked, userStat[0].mostPlayed[index_0].clicked);
								m.rank_played = userStat[0].mostPlayed[index_0].rank_played;
								m.rank_playedGap = compareVal(userStat[1].mostPlayed[index_1].rank_played, userStat[0].mostPlayed[index_0].rank_played);

								m.ratio_played = userStat[0].mostPlayed[index_0].ratio_played;
								m.ratio_playedGap = compareVal(userStat[1].mostPlayed[index_1].ratio_played, userStat[0].mostPlayed[index_0].ratio_played);

							} else if ( index_0 != -1 && index_1 == -1 ) {
								m.clickedGap = compareVal(m.clicked, userStat[0].mostPlayed[index_0].clicked);
								m.rank_played = userStat[0].mostPlayed[index_0].rank_played;
								m.rank_playedGap = compareVal(userStat[0].mostPlayed[index_0].rank_played, 0);

								m.ratio_played = userStat[0].mostPlayed[index_0].ratio_played;
								m.ratio_playedGap = compareVal(userStat[0].mostPlayed[index_0].ratio_played, 0);

							} else if ( index_0 == -1 && index_1 != -1 ) {
								m.clickedGap = 0;
								m.rank_played = 0; // 마지막 userStatDB에 해당 데이터가 없다면 랭크는 0이다
								m.rank_playedGap = compareVal(0, userStat[1].mostPlayed[index_1].rank_played);

								m.ratio_played = 0; // 마지막 userStatDB에 해당 데이터가 없다면 랭크는 0이다
								m.ratio_playedGap = compareVal(0, userStat[1].mostPlayed[index_1].ratio_played);

							} else if ( index_0 == -1 && index_1 == -1 ) {
								// 이런 경우는 있을 수 없다.
							}
						})

						mostBeloved.map( (m, idx)=>{
							const index_0 = userStat[0].mostBeloved.findIndex( userStatM => userStatM._id == m.id );
							const index_1 = userStat[1].mostBeloved.findIndex( userStatM => userStatM._id == m.id );
							
							if ( index_0 != -1 && index_1 != -1 ){
								m.beloved_countGap = compareVal(m.beloved_count, userStat[0].mostBeloved[index_0].beloved_count);
								m.rank_beloved = userStat[0].mostBeloved[index_0].rank_beloved;
								m.rank_belovedGap = compareVal(userStat[1].mostBeloved[index_1].rank_beloved, userStat[0].mostBeloved[index_0].rank_beloved);

								m.ratio_beloved = userStat[0].mostBeloved[index_0].ratio_beloved;
								m.ratio_belovedGap = compareVal(userStat[1].mostBeloved[index_1].ratio_beloved, userStat[0].mostBeloved[index_0].ratio_beloved);

							} else if ( index_0 != -1 && index_1 == -1 ) {
								m.beloved_countGap = compareVal(m.beloved_count, userStat[0].mostBeloved[index_0].beloved_count);
								m.rank_beloved = userStat[0].mostBeloved[index_0].rank_beloved;
								m.rank_belovedGap = compareVal(userStat[0].mostBeloved[index_0].rank_beloved, 0);

								m.ratio_beloved = userStat[0].mostBeloved[index_0].ratio_beloved;
								m.ratio_belovedGap = compareVal(userStat[0].mostBeloved[index_0].ratio_beloved, 0);

							} else if ( index_0 == -1 && index_1 != -1 ) {
								m.beloved_countGap = 0;
								m.rank_beloved = 0; // 마지막 userStatDB에 해당 데이터가 없다면 랭크는 0이다
								m.rank_belovedGap = compareVal(0, userStat[1].mostBeloved[index_1].rank_beloved);

								m.ratio_beloved = 0; // 마지막 userStatDB에 해당 데이터가 없다면 랭크는 0이다
								m.ratio_belovedGap = compareVal(0, userStat[1].mostBeloved[index_1].ratio_beloved);

							} else if ( index_0 == -1 && index_1 == -1 ) {
								// 이런 경우는 있을 수 없다.
							}
						})
						
						mostStems.map( (m, idx)=>{
							const index_0 = userStat[0].mostStems.findIndex( userStatM => userStatM.word == m.word );
							const index_1 = userStat[1].mostStems.findIndex( userStatM => userStatM.word == m.word );

							if ( index_0 != -1 && index_1 != -1 ){
								m.countGap = compareVal(m.count, userStat[0].mostStems[index_0].count);
								m.rank_stems = userStat[0].mostStems[index_0].rank_stems;
								m.rank_stemsGap = compareVal(userStat[1].mostStems[index_1].rank_stems, userStat[0].mostStems[index_0].rank_stems);

								m.ratio_stems = userStat[0].mostStems[index_0].ratio_stems;
								m.ratio_stemsGap = compareVal(userStat[1].mostStems[index_1].ratio_stems, userStat[0].mostStems[index_0].ratio_stems);

							} else if ( index_0 != -1 && index_1 == -1 ) {
								m.countGap = compareVal(m.count, userStat[0].mostStems[index_0].count);
								m.rank_stems = userStat[0].mostStems[index_0].rank_stems;
								m.rank_stemsGap = compareVal(userStat[0].mostStems[index_0].rank_stems, 0);

								m.ratio_stems = userStat[0].mostStems[index_0].ratio_stems;
								m.ratio_stemsGap = compareVal(userStat[0].mostStems[index_0].ratio_stems, 0);

							} else if ( index_0 == -1 && index_1 != -1 ) {
								m.countGap = 0;
								m.rank_stems = 0;
								m.rank_stemsGap = compareVal(0, userStat[1].mostStems[index_1].rank_stems);

								m.ratio_stems = 0;
								m.ratio_stemsGap = compareVal(0, userStat[1].mostStems[index_1].ratio_stems);

							} else if ( index_0 == -1 && index_1 == -1 ) {
								// 이런 경우는 있을 수 없다.
							}
						})

						res.render('profile', {
							userNickname		: req.params.nickname,
							gender					: userAccount.gender,
							profileAges			: makeAge(userAccount.birthday),
							tags						: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
							isSignedIn      : req.session.isSignedIn,
							nickname        : req.session.isSignedIn? req.user.nickname : '',
							thisYear				: thisYear, // 올해 정보

							level						: level,
							total						: total,
							grit						: grit, 
							honor 					: honor,	
							intellect 			: intellect, 

							info_days				: info_days,
							info_sentences	: info_sentences,
							info_letters		: info_letters, 
							info_played			: info_played, 
							info_otherPlayed:	info_otherPlayed, 
							info_love				: info_love, 
							info_beloved		: info_beloved, 

							categories			: categoryStat, // 카테고리별 object 배열

							mostPlayed			: mostPlayed, // 가장 많이 플레이된 문장 5개
							mostBeloved			: mostBeloved, // 가장 많이 beloved 받은 문장 5개
							mostStems				: mostStems, // 가장 많이 사용된 단어 10개
						});
					})
			// 	})
			// })
				})
			})
		})

	})

})

// 나이 만들기
function makeAge(birthYear){
	var dt = new Date();
	// birthYear값이 없다면 ''를 넣고 있다면 나이를 계산한다
	var ages;
	if (!birthYear || isNaN(birthYear)) ages = ''
	else ages = ' / '+ (parseInt((+dt.getFullYear()-1 - +birthYear) / 10) * 10) + 's';
	return ages;
}


module.exports = route;