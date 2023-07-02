const express       = require('express');
const route         = express.Router();
const mongoose      = require('mongoose');
const utils_db      = require('../../commons/utils_db.js');

const DB_aSenByDate = require('../../models/aSenByDate');
const DB_aSentence  = require('../../models/aSentence');
const DB_userAccount= require('../../models/userAccount'); // 회원 계정 DB


// 정렬 반전
route.post('/senSort', (req,res)=>{
	if(req.body.senByDateID){
		DB_aSenByDate
			.findById( req.body.senByDateID , ( err, aSenByDate )=>{
				if( !aSenByDate ) {return res.render(err);}

				aSenByDate.senSort 	= req.body.senSort; // 정렬 정보 수정
				aSenByDate.mp3s 		= req.body.mp3s; // reverse()된 파일 목록 저장
				aSenByDate.aSen_ids = aSenByDate.aSen_ids.reverse(); // DB 목록 reverse()
				// ★ 초울트라 대박. 몽고DB 값이 갱신 되지 않는 이유를 찾았다.
				// https://github.com/Automattic/mongoose/issues/1204
				// 아래와 같이 변경된 부분을 알려줘야 한다. 앞으로도 배열관련 갱신은 위 링크를 참고하자.
				aSenByDate.markModified('aSen_ids');
				aSenByDate.save();
			})
	}

	res.sendStatus(200); // ajax 성공 처리
})


// 플레이버튼을 클릭했을 때 카운팅하기
route.post('/clicked', (req, res)=>{
	console.log('req.body.who: '+req.body.who);
	// 단일 문장 재생일때 카운팅
	if( req.body.cheFn == 'repeatOne' || req.body.cheFn == 'playOne' ){
		// tagSearching이 아닐때만
		if (req.body.dayId){
			DB_aSenByDate
			.findById( req.body.dayId, ( err, aSenByDate )=>{
				if ( !aSenByDate ) res.render(err);
				if (req.body.who == 'owner') aSenByDate.total_clicked++;
				else aSenByDate.total_other_clicked++;
				aSenByDate.save();
			} )
		}
		// DB_aSentence 카운트 ++
		DB_aSentence
			.findById( req.body.senId , ( err, aSentence )=>{
				if ( !aSentence ) res.render(err);
				if (req.body.who == 'owner') aSentence.clicked++;
				else aSentence.other_clicked++;
				aSentence.save();
			})
			console.log('단일문장 재생!');
			utils_db.levelCal(req, 0, 0, 1 ); // 단일 문장 재생 레벨 계산
			console.log(req.session.levelScore);
		res.sendStatus(200);
	}

	// 전체문장 재생일때
	if( req.body.cheFn == 'repeatTotal' || req.body.cheFn == 'playTotal' ){
		let senIdsArr;
		let findThis;
		if(req.body.senIds){
			senIdsArr = req.body.senIds.split(',');
			findThis = { _id : { $in : senIdsArr } };
		} else {
			findThis = { byDate_id : mongoose.Types.ObjectId(req.body.dayId) };
		}

		DB_aSentence
			// .find( { byDate_id : mongoose.Types.ObjectId(req.body.dayId) })
			.find( findThis )
			.exec(
				(err, aSentence)=>{
					if ( err ) console.log(err);

					// 해당 날짜의 모든 문장들을 돌면서 클릭 수를 하나씩 올려준다.
					for ( aSen of aSentence ){
						if (req.body.who == 'owner') aSen.clicked++;
						else aSen.other_clicked++;
						// 이렇게 하나하나 세이브 시켜야 한다. 배열을 한번에 저장하려면 에러가 나더라 17.05.31
						aSen.save();
					}
					// tagSearching이 아닐 경우에만 DB_aSenByDate 카운트 ++
					if(req.body.dayId){
						DB_aSenByDate
							.findById( mongoose.Types.ObjectId(req.body.dayId), ( err, aSenByDate )=>{
								if ( !aSenByDate ) console.log(err);
								// 문장 수 만큼 total_clicked에 추가해준다.
								if (req.body.who == 'owner') aSenByDate.total_clicked += aSentence.length;
								else aSenByDate.total_other_clicked += aSentence.length;
								aSenByDate.save();
							})
					}

					utils_db.levelCal(req, 0, 0, aSentence.length ); // 전체 플레이 레벨 계산
				})

				res.sendStatus(200); // ajax 성공 처리
	}

})


module.exports = route;