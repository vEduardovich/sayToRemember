const express       = require('express');
const route         = express.Router();
const ip            = require('ip');
const mongoose      = require('mongoose');
const multer        = require('multer');
const multerS3      = require('multer-s3');

const useragent     = require('useragent');
const moment        = require('moment');
const utils         = require('../../commons/utils.js');
const config        = require('../../commons/config.js'); // 설정

const DB_userAccount= require('../../models/userAccount.js'); // 회원 계정 DB
const DB_forum      = require('../../models/forum.js'); // 게시판 DB
const DB_forumReply = require('../../models/forumReply.js'); // 게시판 댓글 DB

const AWS           = require('aws-sdk');
const s3            	= new AWS.S3();

// 모멘트 언어설정
moment.locale('ko');

// 서버 로컬에 저장 없이 바로 S3에 업로드
let   AWS_path = '';
const bucketName      = config.apis.aws.bucketName;
const AWS_authorize   = config.apis.aws.AWS_authorize;
const AWS_contentType = config.apis.aws.AWS_contentType_img;
AWS.config.region   	= config.apis.aws.region;

function AWS_key(req, file, cb){
  serverFileName = utils.getWhen('dbDate') + '_' + file.originalname;
  AWS_path = 'forum/'+ req.user.id + '/'+ serverFileName;
  cb(null, AWS_path);
}

const storage =
    multerS3({
      s3 : s3,
      bucket: bucketName,
      acl: AWS_authorize,
      ContentType : AWS_contentType,//multerS3.AUTO_CONTENT_TYPE
      key: AWS_key,
    })

let maxFileCount    = 10;               // 한번에 첨부 가능한 파일(이미지)의 수.
let maxFileSize     = 30 * 1000 * 1000; // 30MB 아래의 파일만 업로드 가능하도록
const upload = multer({
  storage: storage,
  limits: {
    fileSize: maxFileSize
    // filedSize: '30MB'
  }
});

route.post('/write/img', upload.single('imgFile'), (req, res)=>{
  if ( req.user.nickname === req.session.nickname ){
    let imageFile = req.file;
    res.writeHead(200, {// 이걸 꼭해줘야만 res.end()가 먹는다.
      'Content-Type': 'text/html'
    });
    res.end(AWS_path);
  }else{
    res.render('error/default', { msg : '끄지라. 이눔아.'});
  }
})

// Get : forum
route.get('/:forumName/write', utils.funcIsSignedIn, (req, res)=>{
  const forumNum = forumNumCheck(req.params.forumName);
  if(!forumNum) return res.render('error/default', { msg : '그런 포럼 없다.'});

  if (req.user){
    console.log('req.user.nickname: '+ req.user.nickname);
    if ( req.user.nickname === req.session.nickname ) {
      console.log('내 페이지');
      res.render('forum/forum_write', {
        isSignedIn    : req.session.isSignedIn,
        forumName     : req.params.forumName,
        forumNum      : forumNum,
        userNickname  : req.session.nickname,//해당 페이지의 닉네임
        level         : req.session.level,//해당 닉네임의 level
        nickname      : req.user.nickname, // 로그인을 한 계정의 nickname
      })
    } else {
      console.log('로그인은 했으나 다른 사람의 글쓰기 화면에 온 경우');
      res.render('error/default', { msg : '네 이놈! 넌 왜 다른 사람의 글을 쓰려고 하는 것이냐.'});
    }
  }
  else{
    console.log('로그인 먼저 하지?');
    res.render('error/default', { msg : '로그인부터 하지?'});
  }
})


// 글을 쓴 후 submit을 하면 해당 글을 DB에 저장하고 다시 보여주는 route
route.post('/register', (req, res)=>{
  if (req.user){
    if ( req.user.nickname === req.body.nickname ) {
      console.log('req.body.level: '+ req.body.level);
      const strDate     = utils.getWhen('strDate'); // 170206
      const forumNum = forumNumCheck(req.body.forumName);
      if(!forumNum) return res.render('error/default', { msg : '그런 포럼 없다.'});

      new DB_forum({
        forum_name      : req.body.forumName,//게시판 이름
        forum_num       : forumNum,//게시판 번호
        user_id         : req.user.id,
        nickname        : req.body.nickname,
        level           : req.body.level,
        ip_address      : ip.address(),
        isMobile        : (req.body.isMobile == 'true'),
        createdAt       : Date.now(),
        createdAt_txt   : new Date().toLocaleString(),// momentJS를 사용할거다. 일반 say페이지와 달리,
        updatedAt       : Date.now(),
        updatedAt_txt   : new Date().toLocaleString(),
        strDate         : strDate,
        title           : req.body.articleTitle,//글제목
        article         : req.body.articleTxt,//본문
        count           : 0,//조회 수
        reply_count     : 0,//댓글 수
        public          : 1,//0은 비공개, 1은 모두 공개, 2는 차별 공개
        police          : { count: 0, users : [] },//신고
        is_notice       : false,//공지
      }).save( (err, forum)=>{
        console.log('forum.article_num: '+ forum.article_num);
        res.json({articleNum : forum.article_num});//글번호를 넘겨준다. 클라에서는 해당 글번호로 reditect한다
      })
    } else {
      console.log('로그인은 했으나 다른 사람의 글쓰기 화면에 온 경우');
      res.render('error/default', { msg : '네 이놈! 넌 왜 다른 사람의 글을 쓰려고 하는 것이냐.'});
    }
  }
  else{
    console.log('로그인 먼저 하지?');
    res.render('error/default', { msg : '로그인부터 하지?'});
  }

})


// 댓글 페이징
route.post('/replyPaging', utils.funcIsSignedIn, (req, res)=>{
  console.log('댓글 페이징');
  const rePage = parseInt(req.body.rePage) - 1;//클라에서 rePage는 1이 더 많다.
  const reStep = parseInt(req.body.reStep);//parseInt()를 하지 않으면 mongoDB에서 인식을 못한다
  const skip = rePage * reStep;// 스킵할 댓글 페이지.
  console.log("skip: "+ skip);

  DB_forumReply.find( { article_id : mongoose.Types.ObjectId(req.body.articleId), main_reply_num: null })
    .sort ( { createdAt : -1 })
    .skip ( skip )
    .limit( reStep )
    .exec ( (err, mainReply)=>{//메인 답글을 모두 가져온다.
      if(!mainReply) return res.render('error/default', {msg:'댓글 페이징 실패 새퀴야'});
      console.log('mainReply.length:' + mainReply.length);
      DB_forumReply.find({ main_reply_num : { $in : mainReply.map( d => d.reply_num)  } }, (err, answerReply )=>{
        answerReply.map( (fr, idx)=>{//답글의 모멘트화
          fr.updatedAtMoment = moment(fr.updatedAt).fromNow();
        });

        mainReply.map( (fr, idx)=>{//댓글의 모멘트화
          fr.updatedAtMoment = moment(fr.updatedAt).fromNow();
          fr.answerArr = new Array();

          //답글을 덧글안에 배열로 추가하는 모듈
          answerReply.map( ( ar, idx)=>{
            if ( fr.reply_num == ar.main_reply_num ){
              fr.answerArr.push( ar );
            }
          })
        });

        const articleInfoObj = {
          isSignedIn  : req.session.isSignedIn,
          nickname    : req.body.nickname,//로그인한 사람의 닉네임
          writerNickname : req.body.writerNickname,//글쓴이 닉네임. 댓글에 대한 수정 및 삭제 권한을 주기 위해
          articleId   : req.body.articleId,
          mainReply   : mainReply,// 일반 댓글을 넘긴다/
          rePage      : rePage + 1,//댓글 페이지
          reStep      : reStep,//한페이지에 보여주는 댓글 수
          reCount     : req.body.reCount,//메인 댓글 수
        }
        res.render('forum/replyNavAjax', articleInfoObj );
      })

  });


})

// ★ 개별 글 + 글 목록
route.get('/:forumName', utils.funcIsSignedIn, (req, res) => {
  const nickname = !req.user ? 'anonymous' : req.user.nickname;
  let user = !req.user ? 'anonymous' : 'other';//글목록은 owner개념이 없으므로 기본값을 other로 한다.

  const forumName = req.params.forumName;
  const forumNum = forumNumCheck(forumName);
  const forunNameTxt = forumNameCheck(forumName);
  if(!forumNum) return res.render('error/default', { msg : '그런 포럼 없다.'});

  let page = 0;
  if( req.query.page) {//페이지 정보가 있다면
    if( !isNaN(parseInt(req.query.page)) ){//page값이 숫자라면 !isNaN()
      page = parseInt(req.query.page) - 1;
      if (page < 0 ) page = 0;
    }
  }
  let step = config.articlePage.articleStep;// 한번에 보여줄 글수. 클라에서 설정하지 않았다면 서버 기본 설정값으로 대체
  if( req.query.step) {
    if( !isNaN(parseInt(req.query.step)) ){
      step = parseInt(req.query.step);
      if (step < 10  || step > 50 ) step = config.articlePage.articleStep;
    }
  }

  let num = 0;//글번호
  if (!req.query.num){//만약 req.query.num이 없다면 글목록만 보여준다.
    showArticleList(0, num);//0은 글목록만 보여준다.
  }else{//req.query.num이 있다면 글목록과 함께 해당 글도 찾아서 보여준다
    if( !isNaN(parseInt(req.query.num)) ){
      num = parseInt(req.query.num);
    }
    showArticleList(1, num);//1은 글목록과 글을 함께 보여준다
  }


  //글목록이 메인이다. 항상 글목록은 보여줘야한다. 글은 req.query.num이 있을때만 보여주면 된다.
  //글목록 보여주는 모듈
  function showArticleList(what, num ){
    DB_forum
    .countDocuments({ forum_num : forumNum }, (err, articleCount)=>{
      console.log('page: '+ page);
      DB_forum
        .find ( { forum_num : forumNum } )
        .sort ( { createdAt  : -1 } )
        .skip ( step * page )//스킵할 페이지
        .limit( step )
        .exec ( ( err, articles )=> {
          if ( articles ){// 결과로 나온 문장이 없어도 화면을 정상적으로 보여주기 위해
            articles.map( (f, idx)=>{
              f.createdAtMoment = moment(f.createdAt).fromNow();
            });
          }

          // res.render()로 넘긴 객체 정보
          const articleInfo = {
            isSignedIn  : req.session.isSignedIn,
            searchingTagIdx : config.searchingTagIdx.articleList,//9000
            userTags		: req.tags, // 해당 nickname을 가진 유저의 tags
            nickname    : nickname, // 로그인을 한 계정의 nickname
            forumName   : forumName,
            forumNameTxt: forunNameTxt,
            forumNum    : forumNum,
            userLevelScore: req.session.levelScore,
            userLevel   : req.session.level,
            user        : user,
            articles    : articles,//해당 글 전체를 넘기기
            page        : page + 1,//현재 페이지
            step        : step,//한번에 보여줄 문장수
            articleCount: articleCount,//전체 글 수
          };

          if(what != 1){//글목록만 보여준다면
            res.render('forum/forum', articleInfo );
          }else{//글목록과 글을 함께 보여줘야 한다면
            showArticle(req, num, obj=>{
              console.log(obj.status);
              articleInfo.reCount       = obj.reCount,//메인 댓글 수
              articleInfo.rePage        = obj.rePage,//댓글 페이지
              articleInfo.reStep        = obj.reStep,//댓글 페이지 스텝
              articleInfo.countDoc      = obj.countDoc,//총 댓글 수
              articleInfo.user          = obj.user,
              articleInfo.f             = obj.f;// 해당 글을 넘긴다
              articleInfo.status        = obj.status;//글의 good 상태
              articleInfo.forumReply    = obj.forumReply;// 모든 댓글을 넘겨준다
              articleInfo.mainReply     = obj.mainReply;// 일반 댓글 전체를 넘겨준다
              articleInfo.createdAt     = obj.createdAt;// 글쓴 날짜
              articleInfo.updatedAt     = obj.updatedAt;// 글수정한 날짜
              res.render('forum/forum', articleInfo );
            } )
          }

        });
    } )
  }
})

  // 글 읽기 모듈
  function showArticle(req, num, callback){
    console.log('num: '+ num);
    DB_forum.findOne( { article_num : num }, (err, article) => {
      if ( !article ) { return res.render('error/default', { msg : '해당 글이 없다. 임마 정신차리라.'}); }
      //조회수 올려주는 함수
      function articleCount(article){
        article.count += 1;
        article.save();
      }

      // 뽕/똥 유저 목록 처리
      function goodCheck(articleStatus){
        const index = articleStatus.findIndex( user => user == req.user.id );
        return (index != -1) ? true : false;//한줄로 줄일 수 있지만 하지 않는다 ㅋ
      }

      const status = { good : false, bad : false, bigGood : false, bigBad : false };

      if (req.user){
        // if ( req.user.nickname != article.nickname ){//글쓴 본인이 아닐때만
          status.good      = goodCheck(article.score.good);//로그인한 유저가 해당글을 good 했는가
          status.bad       = goodCheck(article.score.bad);//로그인한 유저가 해당글을 bad 했는가
          status.bigGood   = goodCheck(article.score.bigGood);//로그인한 유저가 해당글을 대뽕 했는가
          status.bigBad    = goodCheck(article.score.bigBad);//로그인한 유저가 해당글을 대똥 했는가
        // }
      }else{
        articleCount(article);// 카운트를 1올려준다.
      }



      // 댓글 뿌려주기 결정
      let rePage = 0;//댓글 페이지
      if( req.query.rePage) {//댓글 페이지 정보가 있다면
        if( !isNaN(parseInt(req.query.rePage)) ){//rePage 값이 숫자라면 !isNaN()
          rePage = parseInt(req.query.rePage) - 1;
          if (rePage < 0 ) rePage = 0;
        }
      }
    
      let reStep = config.articlePage.replyStep;// 한번에 보여줄 댓글 수.
      if( req.query.reStep) {
        if( !isNaN(parseInt(req.query.reStep)) ){
          reStep = parseInt(req.query.reStep);
          if (reStep < 10  || reStep > 50 ) reStep = config.articlePage.replyStep;
        }
      }
      const skip = rePage * reStep;//스킵할 댓글 페이지

      // main_reply_num 값이 null인 것만 찾는다. 답글이 아닌 일반 댓글만 가져오기 위해서다
      DB_forumReply.countDocuments( { article_id : mongoose.Types.ObjectId(article.id) }, (err, countDoc)=>{

        // 댓글 페이징을 위해 메인 댓글의 갯수가 필요하다
        DB_forumReply.countDocuments ( { article_id : mongoose.Types.ObjectId(article.id), main_reply_num: null }, (err, mainReplyCount)=>{
          DB_forumReply.find( { article_id : mongoose.Types.ObjectId(article.id), main_reply_num: null })
            .sort ( { createdAt : -1 })
            .skip ( skip )
            .limit( reStep )
            .exec ( (err, mainReply)=>{//메인 답글을 모두 가져온다.
            const nickname = !req.user ? 'anonymous' : req.user.nickname;
            const user = (nickname == article.nickname ) ? 'owner' : 'other';
    
            // 현재 mainReply를 모두 가져온 후 그 reply_num으로 다시 forumReply에서 검색해서 해당 문장들을 가져오도록했다. 이제 이것을 편집해서 배열로 mainReply에 넣어주고 그것을 jade에서 알맞게 뿌려주도록 하자.
            DB_forumReply.find({ main_reply_num : { $in : mainReply.map( d => d.reply_num)  } }, (err, answerReply )=>{
              const createdAt = moment(article.createdAt).fromNow();//모멘트가 알아서 ~(초분)전을 알려준다.
              answerReply.map( (fr, idx)=>{//답글의 모멘트화
                fr.updatedAtMoment = moment(fr.updatedAt).fromNow();
              });
    
              mainReply.map( (fr, idx)=>{//댓글의 모멘트화
                fr.updatedAtMoment = moment(fr.updatedAt).fromNow();
                fr.answerArr = new Array();
    
                //답글을 덧글안에 배열로 추가하는 모듈
                answerReply.map( ( ar, idx)=>{
                  if ( fr.reply_num == ar.main_reply_num ){
                    fr.answerArr.push( ar );
                  }
                })
              });
    
  
              const articleInfoObj = {
                countDoc    : countDoc,//총 댓글 수
                f           : article,// 해당 글을 넘긴다
                status      : status ,//로그인한 유저가 해당글을 good/bigGood했는가 등등 상태정보
                mainReply   : mainReply,// 일반 댓글을 넘긴다/
                // answerReply : answerReply,// 답글을 넘겨준다
                createdAt   : createdAt,// 글쓴 날짜
                updatedAt   : article.updatedAt,// 글수정한 날짜
                user        : user,
                rePage      : rePage + 1,//댓글 페이지
                reStep      : reStep,//한페이지에 보여주는 댓글 수
                reCount     : mainReplyCount,//댓글 페이징을 위한 메인 댓글 수
              }
              callback( articleInfoObj );
            })
          });
        })
      } )
    })

  };


// 이미지 삭제처리
route.post('/write/imgDelete', (req, res)=>{
  console.log('req.body.imgFileName: '+req.body.imgFileName);
  try{
    const params = {
      Bucket: 'saytoremember',
      Key: req.body.imgFileName,
    };
    // S3 안에 파일 삭제
    s3.deleteObject (params, function(err, data) {
      if (err) console.log('File deleted error : ' + err)
      console.log('이미지 삭제 서버쪽도 성공');
      // else console.log('File deleted successfully');
    })

  } catch (e) { console.log(e.message);}
})

// 글 수정
route.get('/editArticle/:articleId', (req,res)=>{
  DB_forum
    .findOne({ _id : mongoose.Types.ObjectId( req.params.articleId )}, (err, article)=>{
      if(!article) {return res.render('error/default', { msg : '그런 문장따위 없다. 너 어디서 온 놈이야?'});}
      console.log('req.query: '+ req.session.nickname);
      if( req.session.nickname === article.nickname ){
        res.render('forum/forum_article_edit',{
          isSignedIn  : req.session.isSignedIn,
          f           : article,// 해당 글을 넘긴다
          nickname    : req.session.nickname,//로그인한 사람의 닉네임
        })
      } else {
        res.render('error/default',{msg: '꺼지라 쉬끼야'});
      }
    });
})

// 글을 수정한 후 해당 글을 DB에 저장하고 다시 보여주는 route
route.post('/registerEdit', (req, res)=>{
  DB_forum
    .findOne({ _id : mongoose.Types.ObjectId( req.body.articleId )}, ( err, article )=>{
      if(!article) { return res.render('error/default', {msg: '그런 문장 없다.'}); }
      if( req.session.nickname === article.nickname ){
        article.ip_address      = ip.address();
        article.title_deleted   = article.title;//이전 글제목 백업한 후,
        article.title           = req.body.articleTitle;//글제목
        article.article_deleted = article.article;//이전 글 본문 백업한 후,
        article.article         = req.body.articleTxt;//본문
        article.isMobile       = (req.body.isMobile == 'true');
        article.updatedAt       = Date.now();
        article.updatedAt_txt   = new Date().toLocaleString();
        article.save( (err, forum)=>{
          console.log('forum.article_num: '+ forum.article_num);
          res.json({articleNum : forum.article_num});//글번호를 넘겨준다. 클라에서는 해당 글번호로 reditect한다
        })
      } else{
        res.render('error/default', {msg: '너 누구냐?'});
      }
    })
})

// 글 삭제
route.post('/deleteArticle', (req, res)=>{
  DB_forum
    .findOne({ _id : mongoose.Types.ObjectId( req.body.articleId )}, (err, article)=>{
      if(!article) { return res.render('error/default', { msg : '그런 문장따위 없다. 너 어디서 온 놈이야?'});}

      console.log('req.session.nickname: '+ req.session.nickname);
      if( req.session.nickname === article.nickname ){
        if (article.reply_count <= 0 ){ //댓글이 없을 때는 그냥 글을 지운다.
          article.remove();
        } else{//만약 댓글이 있다면 삭제된 글이라는 걸 보여준다. 18.10.15
          article.isDeleted	      = true;//글이 삭제된 것인지 확인. 권한때문에.
          article.title_deleted   = article.title;//이전 글제목 백업한 후,
          article.title           = '삭제된 글';//글제목
          article.article_deleted = article.article;//이전 글 본문 백업한 후,
          article.article         = '내용이 삭제되었습니다.';//본문
          article.save();
        }

        res.sendStatus(200);
      } else {
        res.render('error/default',{msg: '꺼지라 쉬끼야'});
      }
    });
})


// 댓글을 쓴 후 작성완료를 클릭하면 해당 글을 DB에 저장하고 다시 보여주는 route
route.post('/registerReply', (req, res)=>{
  if (req.user){
    if ( req.user.nickname === req.body.nickname ) {
      const strDate     = utils.getWhen('strDate'); // 170206
      const forumNum    = forumNumCheck(req.body.forumName);
      if(!forumNum) return res.render('error/default', { msg : '그런 포럼 없다.'});

      DB_forum
        .findById( mongoose.Types.ObjectId(req.body.articleId), (err, article )=>{
          if(!article) { return res.render('error/default',{msg: '그런 문장따위 없어'});}
          article.reply_count += 1;//댓글 수 올려준 후
          article.save();//저장
        })

      new DB_forumReply({
        forum_name      : req.body.forumName,//게시판 이름
        forum_num       : forumNum,//게시판 번호
        user_id         : req.user.id,
        nickname        : req.user.nickname,
        level           : req.body.level,
        ip_address      : ip.address(),
        isMobile        : (req.body.isMobile == 'true'),
        createdAt       : Date.now(),
        createdAt_txt   : new Date().toLocaleString(),
        updatedAt       : Date.now(),
        updatedAt_txt   : new Date().toLocaleString(),
        strDate         : strDate,
        replyTxt        : req.body.replyTxt,//댓글 내용
        main_reply_num  : req.body.mainReplyNum ? parseInt(req.body.mainReplyNum) : undefined,//메인 댓글 번호
        article_id      : mongoose.Types.ObjectId(req.body.articleId),//글 ID
        public          : 1,//0은 비공개, 1은 모두 공개, 2는 차별 공개
        police          : { count: 0, users : [] },//신고
      }).save( (err, forumReply)=>{
        if(err)console.log(err);

        const createdAt = moment(forumReply.createdAt).fromNow();//모멘트 적용
        res.json({
          id          : forumReply.id,
          replyNum    : forumReply.reply_num,
          toWriter    : forumReply.nickname,
          createdAt   : createdAt,
          level       : req.session.level,// 유저레벨
        })
      })
    } else {
      console.log('로그인은 했으나 다른 사람의 글쓰기 화면에 온 경우');
      res.render('error/default', { msg : '네 이놈! 넌 왜 다른 사람의 글을 쓰려고 하는 것이냐.'});
    }
  }
  else{
    console.log('로그인 먼저 하지?');
    res.render('error/default', { msg : '로그인부터 하지?'});
  }

})

// 댓글 수정
route.post('/editReply', (req, res)=>{
  DB_forumReply
    .findOne({ _id : mongoose.Types.ObjectId(req.body.replyId)}, (err, forumReply)=>{
      if(!forumReply) { return res.render('error/default',{msg: '그런 문장따위 없어'});}
      if( req.session.nickname === forumReply.nickname){
        forumReply.replyTxt_deleted = forumReply.replyTxt;//이전 댓글 내용을 백업한 후,
        forumReply.replyTxt         = req.body.replyTxt;//댓글 내용변경
        forumReply.updatedAt        = Date.now();
        forumReply.updatedAt_txt    = new Date().toLocaleString();
        forumReply.save();
        const updatedAt = moment(forumReply.updatedAt).fromNow();//모멘트 적용
        res.json({ updatedAt : updatedAt });
      }else{
        res.render('error/default',{msg: '꺼지라 쉬끼야'});
      }
    });
})


// 댓글 삭제
route.post('/deleteReply', (req, res)=>{
  console.log('아이디 : '+ req.body.replyId);
  DB_forumReply
    .findOne({ _id : mongoose.Types.ObjectId(req.body.replyId)}, (err, forumReply)=>{
      if(!forumReply) { return res.render('error/default',{msg: '그런 댓글따위 없어'});}

      if( req.session.nickname === forumReply.nickname){
        forumReply.isDeleted	      = true;//댓글이 삭제된 것인지 확인.
        forumReply.replyTxt_deleted = forumReply.replyTxt;//이전 댓글 내용을 백업한 후,
        forumReply.replyTxt = '삭제된 댓글입니다';
        forumReply.save();
        res.json( {replyText : forumReply.replyTxt});
      }else{
        res.render('error/default',{msg: '꺼지라 쉬끼야'});
      }
    });
})

route.post('/good', (req,res)=>{
  let goodStatus = false;
  let badStatus  = false;

  if(req.user){
    DB_forum.findById( mongoose.Types.ObjectId(req.body.articleId), (err, article)=>{
      if(!article) return res.render('error/default', {msg: '뽕처리할 글이 없다'});
      if(req.session.nickname === article.nickname) return res.render('error/default', {msg: '자기글은 추천 불가'});

      const goodIndex = article.score.good.findIndex( user => user == req.user.id );
      const badIndex  = article.score.bad.findIndex(  user => user == req.user.id );
      if (goodIndex != -1 ) {
        article.score.good.splice( goodIndex, 1);//유저가 있다면 잘라낸다.
        goodStatus = false;
      } else {
        article.score.good.push(req.user.id);//유저가 없다면 추가한다.
        goodStatus = true;
      }

      if (badIndex != -1 ) {//bad가 true였다면 유저를 없애고 false를 넘겨준다. 기본값이 false다.
        article.score.bad.splice( badIndex, 1);
      }
      article.score.markModified('good');//good유저 정보 update;
      article.score.markModified('bad');
      article.save();
      res.json({
        goodStatus  : goodStatus,
        goodCount   : article.score.good.length + article.score.bigGood.length * 10,
        badStatus   : badStatus,
        badCount    : article.score.bad.length + article.score.bigBad.length * 10,
      });
    })
  }
})

// 뽕과 똥 처리를 어떻게 모듈로 뽑아야 좋을지 모르겠다. 뽑을 수록 복잡해져 그만둔다. 18.10.29
route.post('/bad', (req,res)=>{
  let goodStatus = false;
  let badStatus  = false;

  if(req.user){
    DB_forum.findById( mongoose.Types.ObjectId(req.body.articleId), (err, article)=>{
      if(!article) return res.render('error/default', {msg: '뽕처리할 글이 없다'});
      if(req.session.nickname === article.nickname) return res.render('error/default', {msg: '자기글은 추천 불가'});

      const goodIndex = article.score.good.findIndex( user => user == req.user.id );
      const badIndex  = article.score.bad.findIndex(  user => user == req.user.id );

      if (badIndex != -1 ) {
        article.score.bad.splice( badIndex, 1);//유저가 있다면 잘라낸다.
        badStatus = false;
      } else {
        article.score.bad.push(req.user.id);//유저가 없다면 추가한다.
        badStatus = true;
      }

      if (goodIndex != -1 ) {
        article.score.good.splice( goodIndex, 1);
      }
      article.score.markModified('good');//good유저 정보 update;
      article.score.markModified('bad');
      article.save();
      res.json({
        goodStatus  : goodStatus,
        goodCount   : article.score.good.length + article.score.bigGood.length * 10,
        badStatus   : badStatus,
        badCount    : article.score.bad.length + article.score.bigBad.length * 10,
      }); 
    })
  }
})

// 대뽕과 대똥은 한번 준 적이 있어도 반복해서 줄 수 있도록 하자.
route.post('/bigGood', (req, res)=>{
  if(req.user){
    DB_userAccount.findById( mongoose.Types.ObjectId(req.user.id) , (err, userAccount)=>{
      console.log('대뽕에 들어왔따');
      const strDate   = utils.getWhen('strDate'); // 170206
      const strDateIdx= userAccount.bigGoodBad_list.findIndex( day => day == strDate)//이미 대뽕/대똥을 썼는지 체크
      if(strDateIdx == -1){// 아직 대뽕/대똥을 안썼다면
        console.log('아직 대뽕똥을 안썼다.');
        userAccount.bigGoodBad_list.push(strDate);
        userAccount.markModified('bigGoodBad_list');
        userAccount.save();
        DB_forum.findById( mongoose.Types.ObjectId(req.body.articleId), (err, article)=>{
          if(!article) return res.render('error/default', {msg: '뽕처리할 글이 없다'});
          if(req.session.nickname === article.nickname) return res.render('error/default', {msg: '자기글은 추천 불가'});

          article.score.bigGood.push(req.user.id);//유저가 없다면 추가한다.
          article.score.markModified('bigGood');//good유저 정보 update;
          article.save();
          res.json({
            goodCount   : article.score.good.length + article.score.bigGood.length * 10,
            badCount    : article.score.bad.length + article.score.bigBad.length * 10,
          });
        })
      } else {// 이미 썼다면 아무것도 할게 없다.
        console.log('대뽕,똥을 썼다');
        res.json({
          goodStatus: false,
        });
      }

    } )
  }
})

route.post('/bigBad', (req, res)=>{

  if(req.user){
    DB_userAccount.findById( mongoose.Types.ObjectId(req.user.id) , (err, userAccount)=>{
      console.log('대똥에 들어왔따');
      const strDate   = utils.getWhen('strDate'); // 170206
      const strDateIdx= userAccount.bigGoodBad_list.findIndex( day => day == strDate)//이미 대뽕/대똥을 썼는지 체크
      if(strDateIdx == -1){// 아직 대뽕/대똥을 안썼다면
        console.log('아직 대뽕똥을 안썼다');
        userAccount.bigGoodBad_list.push(strDate);
        userAccount.markModified('bigGoodBad_list');
        userAccount.save();
        
        DB_forum.findById( mongoose.Types.ObjectId(req.body.articleId), (err, article)=>{
          if(!article) return res.render('error/default', {msg: '뽕처리할 글이 없다'});
          if(req.session.nickname === article.nickname) return res.render('error/default', {msg: '자기글은 추천 불가'});

          article.score.bigBad.push(req.user.id);//유저가 없다면 추가한다.
          article.score.markModified('bigBad');
          article.save();
          res.json({
            goodCount   : article.score.good.length + article.score.bigGood.length * 10,
            badCount    : article.score.bad.length + article.score.bigBad.length * 10,
          });
        })
      } else {// 이미 썼다면 아무것도 할게 없다.
        console.log('대뽕,똥을 썼다');
        res.json({
          badStatus : false,
        });
      }

    } )

  }

})


// forum 번호 알아내기. 나중에 config로 빼내자.
function forumNumCheck(forumName){
  let forumNum;//forum 번호
  switch(forumName){
    case 'general-discussion': forumNum = 1;break;
  }
  return forumNum;
}
// forum 이름 text
function forumNameCheck(forunName){
  let forumNameTxt;
  switch(forunName){
    case 'general-discussion': forumNameTxt = '자유게시판';break;
  }
  return forumNameTxt;
}

module.exports = route;