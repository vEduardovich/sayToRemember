// 이 파일에는 특정한 시간 간격으로 계속 수행해야하는 작업들을 넣는다.
// 진정 콜백의 대향연. 뜨거운 여름만큼 뜨거운 콜백들 ㅋ

const fs            = require('fs');
const rimraf        = require('rimraf'); // 폴더 지우는 모듈
const schedule      = require('node-schedule') // 스케쥴에 맞춰 실행시키는 모듈
const utils         = require('./utils.js');
const config        = require('./config.js');
const AWS           = require('aws-sdk');
const s3            = new AWS.S3();

const DB_aSenByDate  = require('../models/aSenByDate');
const DB_aSentence   = require('../models/aSentence');
const DB_userAccount = require('../models/userAccount'); // 회원 계정 DB
const DB_userStat		 = require('../models/userStat'); // 유저 score및 랭킹

const statArr = new Array(); // Rank 계산을 위해 만든 모든 statDB정보
let isDone = false; // rank계산을 위해 넘어가기 전에 stat DB가 모두 저장되었는지 보장하기위해


// 함수 실행
exports.dbSetting = () => {
  // 로컬에서는 off시킨다. 실서버에서만 작동시키자
  setInterval(dbBackup, 60 * 60 * 24 * 1000); // 24시간마다로 변경
  createUserStatDoc;
}

// 매일 새벽 12시마다 통계 DB를 만든다
const createUserStatDoc = schedule.scheduleJob('0 0 * * *', ()=>{
  makingStatDB( (statArr)=>{ // 유저 stat을 만든다
    makingRank(statArr);  // 유저 Rank를 만든다
  });
})


// 유저 Rank를 만든다
const mostPlayedSenList = new Array(); // Most Played Sentence Array
const mostBelovedSenList = new Array(); // Most Beloved Sentence Array
const mostStemsList = new Array(); // Most used Stems Array


function makingRank(statArr){
  // 큰순서로 정렬
  const levelSort = statArr.slice().sort((a,b)=> b.level.stat - a.level.stat );
  const levelScoreSort = statArr.slice().sort((a,b)=> b.levelScore.stat - a.levelScore.stat );
  const totalSort = statArr.slice().sort((a,b)=> b.total.stat - a.total.stat );
  const gritSort = statArr.slice().sort((a,b)=> b.grit.stat - a.grit.stat );
  const honorSort = statArr.slice().sort((a,b)=> b.honor.stat - a.honor.stat );
  const intellectSort = statArr.slice().sort((a,b)=> b.intellect.stat - a.intellect.stat );
  const info_daysSort = statArr.slice().sort((a,b)=> b.info_days.count - a.info_days.count );
  const info_sentencesSort = statArr.slice().sort((a,b)=> b.info_sentences.count - a.info_sentences.count );
  const info_lettersSort = statArr.slice().sort((a,b)=> b.info_letters.count - a.info_letters.count );
  const info_playedSort = statArr.slice().sort((a,b)=> b.info_played.count - a.info_played.count );
  const info_otherPlayedSort = statArr.slice().sort((a,b)=> b.info_otherPlayed.count - a.info_otherPlayed.count );
  const info_loveSort = statArr.slice().sort((a,b)=> b.info_love.count - a.info_love.count );
  const info_belovedSort = statArr.slice().sort((a,b)=> b.info_beloved.count - a.info_beloved.count );


  // ★ Ranking의 핵심
  statArr.map( aSen => {
    // level Raking
    const levelRank = levelSort.map( s => s.level.stat).indexOf(aSen.level.stat)+ 1; // ★ 값이 같으면 같은 랭킹으로 한다
    aSen.level.rank = levelRank;
    aSen.level.ratio = parseFloat(levelRank*100 /statArr.length).toFixed(0);

    // levelScore Raking
    const levelScore = levelScoreSort.map( s => s.levelScore.stat).indexOf(aSen.levelScore.stat)+ 1; // ★ 값이 같으면 같은 랭킹으로 한다
    aSen.levelScore.rank = levelScore;
    aSen.levelScore.ratio = parseFloat(levelScore*100 /statArr.length).toFixed(0);

    // total Raking
    const totalRank = totalSort.map( s => s.total.stat).indexOf(aSen.total.stat)+ 1; // ★ 값이 같으면 같은 랭킹으로 한다
    aSen.total.rank = totalRank;
    aSen.total.ratio = parseFloat(totalRank*100 /statArr.length).toFixed(0);

    // grit Raking
    const gritRank = gritSort.map( s => s.grit.stat).indexOf(aSen.grit.stat)+ 1;
    aSen.grit.rank = gritRank;
    aSen.grit.ratio = parseFloat(gritRank*100 /statArr.length).toFixed(0);

    // honor Ranking
    const honorRank = honorSort.map( s => s.honor.stat).indexOf(aSen.honor.stat)+ 1;
    aSen.honor.rank = honorRank;
    aSen.honor.ratio = parseFloat(honorRank*100 /statArr.length).toFixed(0);

    // intellect Ranking
    const intellectRank = intellectSort.map( s => s.intellect.stat).indexOf(aSen.intellect.stat)+ 1;
    aSen.intellect.rank = intellectRank;
    aSen.intellect.ratio = parseFloat(intellectRank*100 /statArr.length).toFixed(0);


    // info_days Ranking
    const info_daysRank = info_daysSort.map( s => s.info_days.count).indexOf(aSen.info_days.count)+ 1;
    aSen.info_days.rank = info_daysRank;
    aSen.info_days.ratio = parseFloat(info_daysRank*100 /statArr.length).toFixed(0);

    // info_sentences Ranking
    const info_sentencesRank = info_sentencesSort.map( s => s.info_sentences.count).indexOf(aSen.info_sentences.count)+ 1;
    aSen.info_sentences.rank = info_sentencesRank;
    aSen.info_sentences.ratio = parseFloat(info_sentencesRank*100 /statArr.length).toFixed(0);

    // info_letters Ranking
    const info_lettersRank = info_lettersSort.map( s => s.info_letters.count).indexOf(aSen.info_letters.count)+ 1;
    aSen.info_letters.rank = info_lettersRank;
    aSen.info_letters.ratio = parseFloat(info_lettersRank*100 /statArr.length).toFixed(0);

    // info_played Ranking
    const info_playedRank = info_playedSort.map( s => s.info_played.count).indexOf(aSen.info_played.count)+ 1;
    aSen.info_played.rank = info_playedRank;
    aSen.info_played.ratio = parseFloat(info_playedRank*100 /statArr.length).toFixed(0);

    // info_otherPlayed Ranking
    const info_otherPlayedRank = info_otherPlayedSort.map( s => s.info_otherPlayed.count).indexOf(aSen.info_otherPlayed.count)+ 1;
    aSen.info_otherPlayed.rank = info_otherPlayedRank;
    aSen.info_otherPlayed.ratio = parseFloat(info_otherPlayedRank*100 /statArr.length).toFixed(0);

    // info_love Ranking
    const info_loveRank = info_loveSort.map( s => s.info_love.count).indexOf(aSen.info_love.count)+ 1;
    aSen.info_love.rank = info_loveRank;
    aSen.info_love.ratio = parseFloat(info_loveRank*100 /statArr.length).toFixed(0);

    // info_beloved Ranking
    const info_belovedRank = info_belovedSort.map( s => s.info_beloved.count).indexOf(aSen.info_beloved.count)+ 1;
    aSen.info_beloved.rank = info_belovedRank;
    aSen.info_beloved.ratio = parseFloat(info_belovedRank*100 /statArr.length).toFixed(0);


  // 각 유저가 가지고 있는 모든 문장들을 하나의 배열로 따로 저장한후
    aSen.mostPlayed.map( el =>{ mostPlayedSenList.push(el) });
    aSen.mostBeloved.map( el =>{ mostBelovedSenList.push(el) });
    aSen.mostStems.map( stem => mostStemsList.push(stem));

  });


  const mostPlayedSenSort = mostPlayedSenList.slice().sort((a,b)=> b.clicked - a.clicked );
  const mostBelovedSenSort = mostBelovedSenList.slice().sort((a,b)=> b.beloved_count - a.beloved_count );
  const mostStemsSort = mostStemsList.slice().sort( (a,b)=> b.count - a.count );
  // mostPlayed Rank & Ratio
  mostPlayedSenList.map( aSen =>{
    const mostPlayedSenRank = mostPlayedSenSort.map( s => s.clicked ).indexOf(aSen.clicked)+ 1;
    aSen.rank_played = mostPlayedSenRank;
    aSen.ratio_played = parseFloat(mostPlayedSenRank*100 /mostPlayedSenList.length).toFixed(0);
  })


  // mostBeloved Rank & Ratio
  mostBelovedSenList.map( aSen =>{
    const mostBelovedSenRank = mostBelovedSenSort.map( s => s.beloved_count ).indexOf(aSen.beloved_count)+ 1;
    aSen.rank_beloved = mostBelovedSenRank;
    aSen.ratio_beloved = parseFloat(mostBelovedSenRank*100 /mostBelovedSenList.length).toFixed(0);
  })

  // mostStemsList Rank & Ratio
  mostStemsList.map( (stem)=>{
    const stemsRank = mostStemsSort.map( s => s.count ).indexOf(stem.count)+ 1;
    stem.rank_stems = stemsRank;
    stem.ratio_stems = parseFloat(stemsRank*100 /mostStemsList.length).toFixed(0);
  })

  statArr.map( aSen =>{
    // 모든 rank 완료. DB에 저장하자.
    new DB_userStat(aSen).save();
  })
}


// 모든 유저들의 stat을 만든다
function makingStatDB (cb2) {
  const dt = new Date();
  const thisYear = dt.getFullYear();
  // 유저의 모든 nickname을 뽑은 후 callback으로 db에 넘긴다
  function sendNickname (userAccount, callback){
    userAccount.map( user => callback(user) );
  }

  DB_userAccount.find({},{ tokens:0,pwd_sha256:0,salt:0,pwd:0 }).exec( (err, userAccount)=>{ // 필요없는 필드만 제거한 후 모든 유저를 가져온다

    sendNickname ( userAccount, (user)=>{
      const userNickname = user.nickname;

      DB_aSenByDate.countDocuments({ nickname : userNickname, createdAt : {'$gte': new Date(thisYear-1,11,31,15),'$lte': new Date(thisYear,11,31,15)}},(err,aSenByDateCount)=>{
        DB_aSentence.find( {nickname: userNickname, updatedAt : {'$gte': new Date(thisYear-1,11,31,15),'$lte': new Date(thisYear,11,31,15)}}).exec((err,aSentence)=>{
          DB_aSenByDate.countDocuments( {nickname: userNickname}, (err, byDateTotalCount )=>{
            DB_aSentence.find( {nickname: userNickname}).exec( (err, totalaSen)=>{

              let iLoveCount = 0;
              let beloved_count = 0;
              let iPlayedCount = 0;
              let otherPlayedCount = 0;
              let letterCount = 0;
              let categoryStat = new Array();
              const words = new Array();

              // 카테고리 초기화
              user.tags.map( (tag)=>{
                categoryStat.push({category: tag, count:0,iLove:0,beLoved:0})
              })

              // Sentence 데이터 처리
              aSentence.map( (aSen)=>{
                let isILove = false;
                let heartLength = 0;
                aSen.beloved_count = 0;

                // aSen.beloved_count는 각 문장별 beloved_count를 넣기위해 만들었고
                // heartLength는 모든 beloved를 더한 값을 구하기 위해 만들었다
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

                categoryStat[aSen.tagIdx].count += 1;
                if(isILove) categoryStat[aSen.tagIdx].iLove += 1;
                categoryStat[aSen.tagIdx].beLoved += heartLength;

                aSen.engTxt_word.map( engTxt =>{
                  // ★ 단어를 찾아서 해당 인덱스를 넘긴다. 없다면 -1
                  const index = words.findIndex ( el => el.stem == engTxt.stem );
                  if ( index != -1 ) words[index].count += 1;
                  else words.push({ word: engTxt.token, tag: engTxt.tag || 'N' , stem: engTxt.stem || engTxt.token , count: 1 });
                })
              })


              // 모든 문장의 played, belobed, stems Ranking을 결정하려 한다. 모든 데이터가 필요없으므로 필요한 데이터만 가공해 사용한다
              const mostSenList = new Array();
              aSentence.map( (aSen)=>{
                // console.log(aSen.engTxt, aSen.beloved_count);
                const senListObj = { _id: aSen._id ,
                  user_id   : aSen.user_id,
                  nickname  : aSen.nickname,
                  createdAt : aSen.createdAt,
                  is_secret : aSen.is_secret,
                  strDate   : aSen.strDate,
                  byDate_id : aSen.byDate_id,
                  engTxt    : aSen.engTxt,
                  clicked   : aSen.clicked,
                  beloved_count: aSen.beloved_count,
                }
                mostSenList.push(senListObj);
              })

              const mostPlayed = mostSenList.sort( (a,b)=> b.clicked - a.clicked ); // 가장 많이 플레이된 모든 문장
              const mostBeloved = mostSenList.sort( (a,b)=> b.beloved_count - a.beloved_count ); // 가장 많이 love받은 모든 문장
              const mostStems = words.sort( (a,b)=> b.count - a.count ); // 모든 단어 순위
              // 혹은 대명사와 비동사 등을 빼고 만들어 보자. splice(0,5)는 제거했다. 모든 문장의 랭킹을 결정한다


              iLoveCount = user.heart.my.length + user.heart.other.length;

              const levelScore = user.stat.levelScore; // 최종 levelScore
              const level = user.stat.level;// 최종 user level

              
              // 당해 스코어 계산
              const aSenByDateScore = aSenByDateCount * config.stats.summary.byDateWeight;
              const lovedScore = beloved_count * config.stats.summary.honorWeight; // honor 계산
              const iPlayedScore = iPlayedCount * config.stats.summary.iPlayedCount; // 총 플레이수 계산
              const letterScore = letterCount * config.stats.summary.letterCount; // 총 글자수 계산
              const intellectScore = iPlayedScore + letterScore; // intellect 스코어 계산(플레이수+글자수)
              const totalScore = aSenByDateScore + lovedScore + intellectScore; // Total Score
              const aSentenceCount = aSentence.length // 당해 입력한 총 문장 수. 평균을 구하기 위해

              const statObj = {
                nickname		: userNickname,
                createdAt		: Date.now(),
                createdAt_local : new Date().toLocaleString(),
                thisYear    : (new Date()).getFullYear(), // 쓸데없지만 중요한 정보기에 따로 만들어 넣는다

                levelScore: { stat : levelScore },// 오랜 시간동안 내가 내 자시노가 쌓아온 것들의 Score
                level			: { stat : level },
                total			: { stat : totalScore },// 그 한해, 나의 모든 활동에 대한 Score
                grit			: { stat : aSenByDateScore }, // 근성 = 매일 문장 입력한 날수 Score + 로그인한 날수
                honor			: { stat : lovedScore }, // 명예 = love를 받은 문장 Score
                intellect	: { stat : intellectScore }, // 지성 = 문장수 + 글자수

                info_days       : { count: aSenByDateCount,
                  avg: (isNaN(parseFloat(aSenByDateCount/365)) ? 0 : parseFloat(aSenByDateCount/365).toFixed(2) )
                  },// 당해 매일 입력한 날 수
                info_sentences  : { count: aSentenceCount,
                  avg: (isNaN(parseFloat(aSentenceCount/aSenByDateCount)) ? 0 : parseFloat(aSentenceCount/aSenByDateCount).toFixed(2) )
                  },// 당해 총 입력한 문장 수
                info_letters    : { count: letterCount,
                  avg: (isNaN(parseFloat(letterCount/aSentenceCount)) ? 0 : parseFloat(letterCount/aSentenceCount).toFixed(2) )
                  },// 당해 입력한 문장중 내가 입력한 총 글자수
                info_played     : { count: iPlayedCount,
                  avg: (isNaN(parseFloat(iPlayedCount/aSentenceCount)) ? 0 : parseFloat(iPlayedCount/aSentenceCount).toFixed(2) )
                  },// 당해 문장 중 내가 play한 수
                info_otherPlayed: { count: otherPlayedCount,
                  avg: (isNaN(parseFloat(otherPlayedCount/aSentenceCount)) ? 0 : parseFloat(otherPlayedCount/aSentenceCount).toFixed(2) )
                  },// 당해 문장 중 다른 사람이 내 문장을 play한 수
                info_love       : { count: iLoveCount,
                  avg: (isNaN(parseFloat(iLoveCount/aSentenceCount)) ? 0 : parseFloat(iLoveCount/aSentenceCount).toFixed(2) )
                  },// 내가 love한 모든 문장의 수
                info_beloved    : { count: beloved_count,
                  avg: (isNaN(parseFloat(beloved_count/aSentenceCount)) ? 0 : parseFloat(beloved_count/aSentenceCount).toFixed(2) )
                  },// 당해 다른 사람에게에 love를 받은 문장 수

                category        : categoryStat, // Category Infomation

                mostPlayed			: mostPlayed, // 가장 많이 플레이된 문장
                mostBeloved			: mostBeloved, // 가장 많이 beloved 받은 문장
                mostStems				: mostStems, // 가장 많이 사용된 단어

              }
              statArr.push(statObj) // Rank 계산을 위해 push해 놓는다

              // ★ 종료시점을 파악하기 위해 배열이 가득찼는지를 확인한 후 최종 return! 18.07.26 지옥에서 찾아내다!!!
              if(userAccount.length == statArr.length) isDone = true;
              if(isDone) return cb2(statArr);
            });

          }); // 누적

        })

      });

    })
  });


}




// 매 시간마다 DB백업
const dbBackup = () => {
    const child_process = require('child_process'); // command 실행을 위한 include
    const fileName = 'STR_' + utils.getWhen('dbDate');
    const filePath = config.db.out + fileName +'.tar.gz';
    // DB백업
    const child = child_process.execFile('mongodump', [
        '--host', config.db.host,
        '--port', config.db.port,
        '--out',  config.db.out +fileName,
    ]);
    child.stderr.on('data', (data) => { });
    child.on('exit', (code1) => {
        console.log(`Child exited with code ${code1}`);
        // 백업한 DB를 압축
        const child2 = child_process.execFile('tar', [
            '-cvzf', filePath,
            '-C', config.db.out,// 경로 지정. 마지막 폴더만 압축
            fileName,
        ]);
        child2.stderr.on('data', (data) => {});
        child2.on('exit', (code2) => {
            console.log(`Child exited with code ${code1}`);

            // 이제 압축한 파일을 S3에 올리자
            const bucketName        = config.apis.aws.bucketName;
            const AWS_path          = 'database/'+ fileName+'.tar.gz'; // saytoremember/database/fileName.tar.gz 으로 저장
            const AWS_authorize     = 'private'; // 외부에서 접근 못하고 나만 접근할수있게
            const AWS_contentType   = 'application/x-gzip'; // 압축파일
            AWS.config.region   	= config.apis.aws.region;

            const params = {
                Bucket      : bucketName,
                Key         : AWS_path,
                ACL         : AWS_authorize,
                ContentType : AWS_contentType,

                Body: fs.createReadStream(filePath),
            };

            s3.upload(params, function(err, uploadedMP3) {
                if (err) console.log('s3 err : '+err)

                // DB압축 파일 저장이 완료된 후에는
                else{
                    // S3에 올렸으니 이제 로컬에 있는 mp3 파일을 지운다.
                    try{
                        fs.existsSync( filePath ) && fs.unlinkSync( filePath );
                    } catch(e){console.log(e.message);}
                    // 그리고 로컬에 있는 폴더까지 모두 지운다.
                    try{
                        fs.existsSync ( config.db.out + fileName ) && rimraf( config.db.out + fileName, ()=>'');
                    } catch(e){console.log(e.message);}

                }
            })

        });
    });
}

