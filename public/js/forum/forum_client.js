var uni_ReplyInfo;
var uni_GotReplyEditBtn;
var uni_ReplyDom;//댓글 삭제 dom을 저장
var uni_ToWriter;//댓글 수정할때 toWriter를 저장해 놓기 위해

if (window.innerWidth > 1024){
  isMobile = false;
}else{
  isMobile = true;
}
var isMobile = true;


// 맨위로 이동하기
$('.navMoveTop').hide();
$(window).scroll(function () {
  var height = $(document).scrollTop();
  if (height == 0 ){
    $('.navMoveTop').hide();
  }else{ $('.navMoveTop').show();}
});


// 로그인한 유저가 똥/뽕을 클릭한 적 있다면 isTrue클래스를 더해준다.
function isGood(){
  console.log('글 똥뽕처리');
  $('.btnArticleGoodBad').map( function (idx, el){
    if ( $(el).data('isGood') == true) $(el).addClass('isGood');
    if ( $(el).data('isBigGood') == true) $(el).addClass('isBigGood');
    // if ( $(el).data('isBigGood') == true) $(el).css('background-color','rgb(0, 153, 0)');
  })
}

$(document).ready(function () {

  isGood();//글 똥뽕 클릭처리

  var wherePage = $('#forumInfo').data('searchingTagIdx');

  if (wherePage == '9000'){// 주소복사 모듈
    var articleAddress = document.querySelectorAll('.articleAddress');//주소복사를 원하는 버튼
    
    textCopy();
    linkPopup();
    // 날짜 클릭시 주소 카피 
    function textCopy(){
      var clipboard = new ClipboardJS(articleAddress);
    }
    // 페이지 주소 복사 - 1초간 팝업 후 사라지도록
    function linkPopup(){
      $(articleAddress).popover().click(function(){
        setTimeout( function(){
            $(articleAddress).popover('hide');
          },1000);		
      });
    }
  }

  // 페이지 이동시 input창에 숫자를 넣은 후 엔터를 쳤을 때 바로 이동 시키기
  $('.inputPage').on('keydown', function(e){
    if(e.keyCode == 13){
      $('.movePage').click();
    }
  })

  replyNavPaging();// 댓글 ajax 페이징 후 모든 연출을 정상화 시키기 위해 한번더 실행시킨다
  

  //아래와 같이 클릭 안에 press를 bind해야만 click과 press를 구분해서 가져올 수 있다 18.10.27
  //뽕이 클릭되었을 때
  // $('#btnArticleGood').on('click', function(e){//마우스가 클릭되고 있거나 터치가 되고 있을때
  //   $(this).bind('mousedown touchstart', function(e){//마우스가 클릭되고 있거나 터치가 되고 있을때
  //     articleGoodBadFun(true, this);
  //   })
  // })

  // //똥이 클릭되었을 때
  // $('#btnArticleBad').on('click', function(e){//마우스가 클릭되고 있거나 터치가 되고 있을때
  //   // articleGoodBadClick()
  //   $(this).bind('mousedown touchstart', function(e){//마우스가 클릭되고 있거나 터치가 되고 있을때
  //     articleGoodBadFun(true, this);
  //   })
  // })


  $('#btnArticleGood').on('mousedown touchstart', function(e){//마우스가 클릭되고 있거나 터치가 되고 있을때
    articleGoodFun(this);
  })

  $('#btnArticleBad').on('mousedown touchstart', function(e){//마우스가 클릭되고 있거나 터치가 되고 있을때
    articleBadFun(this);
  })

  $('#btnArticleGood, #btnArticleBad').on('mouseup touchend', function(e){//마우스가 떼지거나 터치가 끝났을때
    clearGoodBad(this);
  })
})

// 단순 뽕,똥 클릭
var goodAlpha = 0;//뽕 투명도
var badAlpha = 0;//똥 투명도
var ppongTime;//setTimeout()제어
var isFirtSet = true;

// setTimeout을 맨처음 클릭했을 때는 interval을 1로 하여 click 정보를 빨리 가져온다.
// 하지만 1은 interval이 너무 짧아 호출비용이 크다. 그래서 그 다음부터는 interval을 10으로 바꿔준다.
var setTime;
var setAlpha;
function articleGoodFun(btnDom){//뽕처리
  var isSigned = $('#isSignedIn').val() == 'true' ;
  if (!isSigned) return;//로그인하지 않았다면 return;
  //아래는 나중에 팝업 메시지 처리 하자.
  if($('#forumInfo').data('nickname') == $('.articleNickname').text() ){ console.log('자신의 글을 추천할 수 없다.');  return;  }

  if (isFirtSet) { setTime = 1 ; setAlpha = 0.002; isFirtSet = false; }
  else {setTime = 10; setAlpha = 0.01}

  ppongTime = setTimeout( function () {
    goodAlpha += setAlpha;//0.001초마다 0.002를 더해준다. 
    $(btnDom).css('background-color',`rgba(0, 153, 0, ${goodAlpha} )`)//투명도만 바꿔준다

    if( goodAlpha >= 1 ){ return articleBigGoodBad(btnDom, 'bigGood');}//대뽕
    articleGoodFun(btnDom)
  }, setTime);
}

function articleBadFun(btnDom){//똥처리
  var isSigned = $('#isSignedIn').val() == 'true' ;
  if (!isSigned) return;//로그인하지 않았다면 return;
  if($('#forumInfo').data('nickname') == $('.articleNickname').text() ){ console.log('자신의 글을 추천할 수 없다.');  return;  }

  if (isFirtSet) { setTime = 1 ; setAlpha = 0.002; isFirtSet = false; }
  else {setTime = 10; setAlpha = 0.02}

  ppongTime = setTimeout( function () {
    badAlpha += setAlpha;
    $(btnDom).css('background-color',`rgba(0, 153, 0, ${badAlpha} )`)//투명도만 바꿔준다

    if( badAlpha >= 1 ) {return articleBigGoodBad(btnDom, 'bigBad');}//대똥
    articleBadFun(btnDom)
  }, setTime);
}

// 뽕똥 초기화
function clearGoodBad(btnDom){
  clearTimeout(ppongTime);
  if( goodAlpha > 0 && goodAlpha < 1){//뽕
    replyGoodBad(btnDom,'good');
  } else if( badAlpha > 0 && badAlpha < 1){//똥
    replyGoodBad(btnDom,'bad');
  }
  if (goodAlpha < 1 || badAlpha < 1){
    goodAlpha = 0;
    badAlpha = 0;
    isFirtSet = true;
    $(btnDom).css('background-color',`rgba(0, 153, 0, ${goodAlpha} )`)//투명도만 바꿔준다
  }
}
// 뽕/똥 처리
function replyGoodBad(btnDom, what) {

  var articleId = $('.forumTitleWrap').data('articleId');
  
  $.ajax({
    type: 'POST',
    url: '/f/'+ what,
    cache: false,
    data: {
      articleId : articleId,
    },
    success: function (d) {
      console.log('테두리 굵게!');
      isGood();//글 똥뽕 클릭처리
      var buttonArea = $(btnDom).parent();
      // if (d.goodStatus){
      //   buttonArea.children().eq(0).css('border','1px solid blue');
      // } else {
      //   buttonArea.children().eq(0).css('border','1px solid #666');
      // }
      // if (d.badStatus){
      //   buttonArea.children().eq(1).css('border','1px solid blue');
      // } else {
      //   buttonArea.children().eq(1).css('border','1px solid #666');
      // }
      buttonArea.children().eq(0).children().eq(1).text( d.goodCount );
      buttonArea.children().eq(1).children().eq(1).text( d.badCount );

      $('#pureGood').text( d.goodCount - d.badCount );

    }
  })
}

// 대뽕/대똥일때 처리
function articleBigGoodBad(btnDom, what){
  var articleId = $('.forumTitleWrap').data('articleId');
  var buttonArea = $(btnDom).parent();
  
  $.ajax({
    type: 'POST',
    url: '/f/'+ what,
    cache: false,
    data: {
      articleId : articleId,
    },
    success: function (d) {
      console.log('d.goodStatus: '+ d.goodStatus);
      // if (d.goodStatus){
      //   buttonArea.children().eq(0).css('background-color','rgb(0, 153, 0)');
      // }else{
      //   buttonArea.children().eq(0).css('background-color','#fff');
      // }
      // if (d.badStatus){
      //   buttonArea.children().eq(1).css('background-color','rgb(0, 153, 0)');
      // }else{
      //   buttonArea.children().eq(1).css('background-color','#fff');
      // }
      buttonArea.children().eq(0).children().eq(1).text( d.goodCount );
      buttonArea.children().eq(1).children().eq(1).text( d.badCount );

      $('#pureGood').text( d.goodCount - d.badCount );
    }
  })
}


// 댓글 페이지 이동시 input창에 숫자를 넣은 후 엔터를 쳤을 때 바로 이동 시키기
function replyNavPaging(){//ajax 댓글 페이지 이동에서도 사용해야 해서 함수로 만든다.
  // 삭제된 덧글의 background-color를 회색으로 바꿔준다
  $('.replyArticleArea, .answerArticleArea').map( (idx, dom)=>{
    if ($(dom).data('replyIsDeleted') == true){
      // $(dom).css('background-color','#aaa');
      $(dom).children().eq(1).css({fontStyle : 'italic', color: '#aaa' });
    }
  })

  // 글목록에서 삭제된 글의 background-color를 회색으로 바꿔준다
  $('.articleContent').map( (idx, dom)=>{
    if ($(dom).data('articleIsDeleted') == true){
      // $(dom).css('background-color','#aaa');
      // $(dom).children().first().css('font-style','italic');
      $(dom).children().first().css({fontStyle : 'italic', color: '#aaa' });
    }
  })

  $('.inputRePage').on('keydown', function(e){
    if(e.keyCode == 13){
      $('.moveRePage').click();
    }
  })
}

function openPopup(replyDomEl){
	uni_ReplyDom = replyDomEl;
  $.magnificPopup.open({// 글삭제 창 띄우기
    items: {
      src:'#deletePopup', // a(href='#tagList')로 만들고 이 부분을 없애도 된다.
      type: 'inline',
      modal: false,
      closeBtnInside: true,
    },
    alignTop: window.innerWidth < 680 , // 화면해상도에 맞춰 popup align 결정
    fixedContentPos: true,
  })
}

// Delete창 닫기버튼(Cancel)
function noMsgPopup(){
  $("#forumInfo").data("replyId",'');//댓글 id 초기화
	$.magnificPopup.proto.close.call($('#deletePopup')); // 삭제 팝업창 닫기
}
// 문장 Delete 실행
function yesMsgPopup(){
  $.magnificPopup.proto.close.call($('#deletePopup')); // 삭제 팝업창 닫기
  var id = $('#forumInfo').data('replyId');//댓글id가 있다면 댓글 삭제. 없다면 글 삭제로 인식
  id ? replyDelete(id) : articleDelete($('.forumTitleWrap').data('articleId'));
  $('#forumInfo').data('replyId','');//댓글 id삭제
}


// 덧글 및 답글 등록
function replySubmit(_this, what){
  var mainReplyNum;//답글이 달린 메인 댓글 번호
  var replyTxt;//textarea Element
  var forumInfo = $('#forumInfo');

  if (!what){// 일반 댓글 달기라면
    replyTxt = $('#writeReply');
  } else {// 답글 달기라면
    $(_this).parent().parent().toggle();//댓글쓰기 창을 먼저 닫자.

    replyTxt = $(_this).parent().parent().find('#writeReply');//textarea Element
    mainReplyNum = $(_this).data('replyNum');//답글이 달린 메인 댓글 번호

  } 

  //최소한 한글자 이상 댓글을 입력했다면
  if( replyTxt.val().trim().length > 0){
    var articleId = $('.forumTitleWrap').data('articleId');
    var replyTxtVal = replyTxt.val();

    var toWriter = $(_this).parent().parent().find('.toWriter').text();//답글을 누구에게 보낼지
    if (toWriter){//답글의 답글 달기 일때만 실행
      toWriter = `<span class='toWriter'>${toWriter}</span>`;
      replyTxtVal = toWriter + replyTxtVal;
    }

    var writerNickname = $('.articleNickname').text();
    var nickname = forumInfo.data('nickname');//로그인 유저 닉네임
    var level = forumInfo.data('level');//로그인한 유저의 레벨

    $.ajax({
      type: 'POST',
      url: '/f/registerReply',
      cache: false,
      data: {
        isMobile			: isMobile,//화면이 1200보다 작으면 모바일로 체크
        articleId     : articleId,//글id
        replyTxt 	    : replyTxtVal,//댓글 내용
        // writerNickname: writerNickname,//글쓴이 닉네임
        nickname      : nickname,//로그인한 닉네임
        level         : level,
        forumName			: forumInfo.data('forumName'),//게시판 이름
        forumNum			: forumInfo.data('forumNum'),//게시판 번호
        mainReplyNum  : mainReplyNum,//메인 댓글 번호. mainReplyNum 값이 있다면 일반 댓글이 아닌 답글이다
        toWriter      : toWriter,//누구을 향한 답글인가
        // isMainReply   : mainReplyNum ? false : true,
      },
      success: function (d) {
        var replyLength = $('.replyCount>span');
        replyLength.text(parseInt( replyLength.text()) + 1 );//댓글 갯수 올려주기
        var countSentence = $('.countSentence');
        countSentence.text(parseInt( countSentence.text()) + 1 );//상단 댓글 갯수 줄이기

        // 아래에서 일반 댓글과 답글로 분기한다.
        // * ajax설명 * 18.10.23
        // replySubmit()에 answer1을 넣어주는데, 즉, '일반댓글'과 '일반댓글에 대한 답글'은 answer1으로 주고
        // '답글에 대한 답글'일 경우에만 answer2로 준다. 이것으로 append 위치가 나눠짐을 염두하자.
        // 참고로 what은 일반댓글과 답글의 구분이다. answer1과 answer2는 '무엇에 대한 답글'인지에 대한 구분이다.
        if (!what){//일반 댓글이라면
          var html = 
          `<div class='mainReply'>
            <div class='mainReplyArea'>
              <div data-id="${d.id}" data-reply-is-deleted ='${d.isDeleted}' class="replyArticleArea">
                <div class="replyNicknameArea">
                  <span class="replyNickname">${nickname}</span>
                  <i class="levelIcon">Lv.${level}</i>
                  <!--<div class="btnReplyGoodBad">
                    <button class="btnReplyGood">뿅</button>
                    <button class="btnReplyBad">똥</button>
                  </div>-->
                </div>
                <div id="replyArticleTxt" class="replyArticleTxt">${replyTxtVal}</div>
                  <div class="replyInfo">
                    <span class="articleInfoFirst"> ${d.createdAt}</span>
                    <span class="articleInfo">&nbsp|</span>
                    <button onclick="" class="police">신고</button>
                    <button onclick="answerToggle(this)" class="answerEdit">답글</button>
                    <button onclick='openPopup($(this).parent().parent());$("#forumInfo").data("replyId", "${d.id}")' class="replyEdit">삭제</button>
                    <button onclick='replyEdit(this)' class="replyEdit">수정</button>
                  </div>
                </div>
                <div id="replyWriteArea" class="answerWriteArea">
                  <textarea placeholder="답글을 입력하세요." onkeyup="checkTextArea(this)" id="writeReply" class="writeAnswer"></textarea>
                  <div class="answerWriteInfo">
                    <div class="replyLetterCheck">
                      <div id="checkLenInfo" class="checkLenInfo">0</div>
                      <div class="totalLength">/ 300</div>
                    </div>
                    <button onclick="replySubmit(this,'answer1')" data-reply-num="${d.replyNum}" id="replySubmitBtn" class="replySubmitBtn">작성완료</button>
                  </div>
                </div>
              </div>
            </div>
            <!-- 아래의 구조를 유념해야한다 -->
            <div class="answerReply"></div>
          `
          replyTxt.val('');
          $('#checkLenInfo').text('0');
          $('.replyArticleWrap').prepend(html);
          var height = $('.replyArticleArea').first().offset().top - (window.innerHeight/2) + $('.replyArticleArea').first().height();// 해당 문장이 있는 위치로 스크롤 이동
          $('html, body').animate( { scrollTop : height } );
          $('.replyArticleArea').first().css('background-color','#889D84');
          $('.replyArticleArea').first().animate({
            'background-color': "#fff"
          }, 800); // jQuery Color Plug-in을 따로 설치
        
        } else {// 답글이라면
          //위 일반댓글과 답글에는 가져오는 정보에서 많은 차이가 있다. 수정시 염두하자. 18.10.23
          var html = 
          `
            <div class="answerArea">
              <div class="answerIcon">ㄴ</div>
              <div data-id="${d.id}" class="answerArticleArea">
                <div class="replyNicknameArea">
                  <span class="replyNickname">${nickname}</span>
                  <i class="levelIcon">Lv.${level}</i>
                  <!--<div class="btnReplyGoodBad">
                    <button class="btnReplyGood">뿅</button>
                    <button class="btnReplyBad">똥</button>
                  </div>-->
                </div>
                <div id="replyArticleTxt" class="replyArticleTxt">${replyTxtVal}</div>
                  <div class="replyInfo">
                    <span class="articleInfoFirst"> ${d.createdAt}</span>
                    <span class="articleInfo">&nbsp|</span>
                    <button onclick="" class="police">신고</button>
                    <button onclick="answerToggle(this)" class="answerEdit">답글</button>
                    <button onclick='openPopup($(this).parent().parent());$("#forumInfo").data("replyId", "${d.id}")' class="replyEdit">삭제</button>
                    <button onclick='replyEdit(this, "answer2")' class="replyEdit">수정</button>
                  </div>
                </div>
                <div id="replyWriteArea" class="answerWriteArea">
                  <div class="toWriter">@${nickname}</div>
                  <textarea placeholder="답글을 입력하세요." onkeyup="checkTextArea(this)" id="writeReply" class="writeAnswer writeAnswer2"> </textarea>
                  <div class="answerWriteInfo">
                    <div class="replyLetterCheck">
                      <div id="checkLenInfo" class="checkLenInfo">0</div>
                      <div class="totalLength">/ 300</div>
                    </div>
                    <button onclick="replySubmit(this,'answer2')" data-reply-num="${mainReplyNum}" id="replySubmitBtn" class="replySubmitBtn">작성완료</button>
                  </div>
                </div>
              </div>
          `
          replyTxt.val('');
          $('#checkLenInfo').text('0');
          var addedAnswerDom;
          if( what == 'answer1') {//댓글에 답글 달기라면
            addedAnswerDom = $(_this).parent().parent().parent().parent().next();
          }else if( what == 'answer2') { // 답글에 답글 달기. 댓글에 답글을 다는 글쓰기창과 답글에 답글을 다는 글쓰기 창의 구조가 다르다 ㅜ
            addedAnswerDom = $(_this).parent().parent().parent().parent();
          }
          // $(html).insertAfter( addedAnswerDom );
          addedAnswerDom.append(html);
          // addedAnswerDom.find('.writeAnswer2').val('@'+ d.toWriter + ' ');//이유는 모르겠지만 textarea에 기본 문자를 넣어도 dom에는 추가되어 있지만 실제로 화면에는 나타나지 않아 고민하다가 그냥 스크립트로 해당 textarea에 문자를 뿌려버렸다.

          //ajax로 추가했기 때문에 아래처럼 부모로 이동한 후 다시 자식으로 가야 마지막 dom을 정상적으로 찾는다.
          var lastAddedDom = addedAnswerDom.children().last().find('.answerArticleArea');

          // var height = $('.replyArticleArea').first().offset().top - (window.innerHeight/2) + $('.replyArticleArea').first().height();// 해당 문장이 있는 위치로 스크롤 이동
          var height = lastAddedDom.offset().top - (window.innerHeight/2) + lastAddedDom.height();
          $('html, body').animate( { scrollTop : height } );

          lastAddedDom.css('background-color','#889D84');
          lastAddedDom.animate({
            'background-color': 'rgb(245,245,245)'
          }, 800);
        }

        //만약 글쓴이가 글을 썼다면
        if (writerNickname == nickname){
          $('.replyArticleTxt').addClass('writer');//글자색 변경
        }
      },
    });
    
  }
}



// 댓글 삭제
function replyDelete(replyId){
  // var replyArticleArea = $(replyEditBtn).parent().parent();
  var articleId = $('.forumTitleWrap').data('articleId');

  $.ajax({
    type: 'POST',
    url: '/f/deleteReply',
    cache: false,
    data: {
      replyId   : replyId,
      articleId : articleId,
    },
    success: function (d) {
      // 클라에서 댓글 개수 줄이는 모듈 주석처리. 18.10.15
      // var replyLength = $('.replyCount>span');
      // replyLength.text(parseInt( replyLength.text()) - 1 );//댓글 갯수 줄이기
      // var countSentence = $('.countSentence');
      // countSentence.text(parseInt( countSentence.text()) - 1 );//상단 댓글 갯수 줄이기

      uni_ReplyDom.css('background-color','#aaa');
      uni_ReplyDom.animate({//댓글의 경우. 이와같이 해당 dom에 대한 클라정보가 필요하다. 그래서 전역변수에 저장해놓고 사용한다
        'background-color': "rgb(245,245,245)"
      }, 500); // jQuery Color Plug-in

      setTimeout(() => {
        var replyArticleTxt = uni_ReplyDom.find('#replyArticleTxt');// Textarea
        var replyInfo = uni_ReplyDom.find('.replyInfo');// replyInfo

        replyArticleTxt.css({'font-style':'italic', 'color':'rgb(170,170,170)'});
        replyArticleTxt.removeClass('writer');
        replyArticleTxt.text(d.replyText);//서버에서 받은 삭제된 댓글입니다를 클라에 뿌려준다.

        replyInfo.children().eq(5).remove();//5부터 지워야 4가 남아있다. 1부터 지우면 계속 1을 지워야 한다
        replyInfo.children().eq(4).remove();
        replyInfo.children().eq(3).remove();
        replyInfo.children().eq(2).remove();
        replyInfo.children().eq(1).remove();        
        // uni_ReplyDom.remove();
      }, 500);
    }
  })
}

// 글 삭제
function articleDelete(articleId){
  var forumName = $('#forumInfo').data('forumName');
  // var articleId = $(articleEditBtn).parent().data('articleId');
  $.ajax({
    type: 'POST',
    url: '/f/deleteArticle',
    cache: false,
    data: {
      articleId : articleId,
    },
    success: function (d){
      location.href='/f/'+ forumName;
    }
  })
}

// 글 수정
function articleEdit(articleEditBtn){
  var articleId = $(articleEditBtn).parent().data('articleId');
  
  $.ajax({
    type:'GET',
    url: '/f/editArticle',
    cache: false,
    data:{
      articleId : articleId,
    },
    success: function (d){
      //글수정 성공
      location.href='/f/editArticle/'+articleId; 
    }
  })
}

// 댓글 수정 - 클라이언트
function replyEdit(replyEditBtn, what){
  if($('.replyEditInfo').length > 0){
    //이미 수정을 클릭한 적 있다
    // console.log('이미 수정을 클릭한 적 있다');
  }else{
    var replyArticleArea = $(replyEditBtn).parent().parent();//글 id가 있는 dom
    var replyTextarea = $(replyEditBtn).parent().prev();

    //글쓴이의 경우 댓글을 초록색으로 유지해야 하므로 아래와 같이 만든다
    var isWriter = false;
    if (replyTextarea.hasClass('writer')) isWriter = true;
    else isWriter = false;

    if (what){//answer2라면 답글에 답글 달기다.
      uni_ToWriter = replyTextarea.children().first().text();//댓글 수정 전에 toWriter의 text를 저장해놓는다. for replySave(), replyCancel()
      $( `<span class='toWriter'>${uni_ToWriter}</span>`).insertAfter( replyTextarea.parent().find('.replyNicknameArea') );
      replyTextarea.children().first().remove();
    }
    replyTextarea.contents().unwrap().wrap('<textarea class="writeReplyEdit"></textarea>');// 해당 태그를 textarea태그로 바꾸기 코드


    // replyTextarea.remove();//글 dom 삭제
    uni_ReplyInfo = $(replyEditBtn).parent();
    $(replyEditBtn).parent().remove();// 수정 삭제 버튼 dom 삭제
    // $(replyEditBtn).parent().hide();// 수정 삭제 버튼 hide
    var html = 
    `<div class='replyEditInfo'>
    <button onclick="replySave(this,${isWriter})" class="replyEdit">저장</button>
    <button onclick="replyCancel(this,${isWriter})" class="replyEdit">취소</button>
    </div>`;
    replyArticleArea.append(html);
    replyArticleArea.find('.writeReplyEdit').focus();

    // $(html).insertAfter( replyArticleArea.parent().parent().find('#replyArticleTxt') );
  }
  // remove()를 해서 dom이 이동을 하여 수정할때 잘못된 값이 append 되는 것이다.
  // remove()가 아닌 hide와 show를 이용해보자. 이것도 잘 안되면 apppend를 조절하자. 1차 답댓글까지는 무조건 자연스럽게 개발해야한다.
}

// 댓글 수정 - 서버
function replySave(replyEditBtn, isWriter){
  var replyArticleArea = $(replyEditBtn).parent().parent();//글 id가 있는 dom
  // var replyTextarea = $(replyEditBtn).parent().prev();
  var replyTextarea= $(replyEditBtn).parent().parent().find('.writeReplyEdit');//textarea
  var replyTxtVal;

  if (uni_ToWriter){//답글에 답글이라면
    var toWriter = `<span class='toWriter'>${uni_ToWriter}</span>`;
    replyTxtVal = toWriter + replyTextarea.val();//toWriterDom에 유저 정보가 있다면 추가된다.
    uni_ToWriter = null;
    replyArticleArea.find('.toWriter').remove();//toWriter Dom도 삭제
  } else {//toWriter가 없다면. 즉 일반 댓글이나, 댓글에 대한 답글이라면
    replyTxtVal = replyTextarea.val();
  }

  toWriterDom = ''; //추가시켰으니 null로 초기화한다.
    $.ajax({
      type: 'POST',
      url: '/f/editReply',
      cache: false,
      data: {
        replyId   : replyArticleArea.data('id'),
        replyTxt  : replyTxtVal,
      },
      success: function (d) {
        replyTextarea.remove();
        if (isWriter){//만약 글쓴이가 수정한 거라면 글색깔을 초록색으로
          replyArticleArea.append('<div class="replyArticleTxt writer" id="replyArticleTxt">'+replyTxtVal+'</div>');//변경된 텍스트 적용하기.
        }else{
          replyArticleArea.append('<div class="replyArticleTxt" id="replyArticleTxt">'+replyTxtVal+'</div>');//변경된 텍스트 적용하기.
        }
        $(replyEditBtn).parent().remove();
        replyArticleArea.append(uni_ReplyInfo);
      }
    })
}




// 댓글 수정 취소
function replyCancel(replyEditBtn, isWriter){
  var replyArticleArea = $(replyEditBtn).parent().parent();//글 id가 있는 dom
  var replyTextarea= $(replyEditBtn).parent().parent().find('.writeReplyEdit');//textarea
  //글쓴이의 경우 댓글을 초록색으로 유지해야 하므로 아래와 같이 만든다
  if (isWriter) {
    replyTextarea.contents().unwrap().wrap('<div class="replyArticleTxt writer" id="replyArticleTxt"></div>');
  } else {
    replyTextarea.contents().unwrap().wrap('<div class="replyArticleTxt" id="replyArticleTxt"></div>');
  }

  if (uni_ToWriter){//toWriter가 없다면. 즉 일반 댓글이나, 댓글에 대한 답글이라면
    var toWriter = `<span class='toWriter'>${uni_ToWriter}</span>`;
    replyTextarea.prepend(toWriter);//위 textarea=> div로 바뀐 dom에 prepend로 toWriter를 추가한다
    uni_ToWriter = null;
    replyTextarea.remove();//toWriter Dom도 삭제
  } 

  $(replyEditBtn).parent().remove();
  
  replyArticleArea.append(uni_ReplyInfo);//8분전|신고|답글 수정,삭제 버튼 등이 들어있는 Dom을 다시 추가한다
  uni_GotReplyEditBtn = null;
}

// 답글쓰기 창열기
function answerToggle(_this){
  $(_this).parent().parent().next().toggle();
  $(_this).parent().parent().next().find('#writeReply').focus();//텍스트창에 포커스 주기
  // $(_this).parent().parent().append(html);
  // $(_this).parent().parent().css('color','red');
}


//댓글 다음 페이지 가기
function naviRePageFun(writerNickname, nickname, article_id, rePage, reStep, reCount){
  $('.replyArticleWrap').children().remove();
  $.ajax({
    type: 'POST',
    url: '/f/replyPaging',
    cache: false,
    data: {
      writerNickname: writerNickname,//글쓴이 닉네임
      nickname    : nickname,//로그인한 유저 닉네임
      articleId   : article_id,
      rePage      : rePage,
      reStep      : reStep,
      reCount     : reCount,
    },
    success: function (d) {
      $('.replyArticleWrap').append(d);
      document.getElementsByClassName('writeReply')[0].scrollIntoView();//해당 dom으로 바로 이동
      // var height = $('.mainReply').first().offset().top - (window.innerHeight/2) + $('.mainReply').first().height();
      // $('html, body').animate( { scrollTop : height } );
      
      replyNavPaging();//ajax후 함수및 연출

      var forumInfo = $('#forumInfo');
      // ajax로 댓글 페이징 했을 때 주소창 값을 댓글 페이징 값으로 바꿔주자
      if (window.history.replaceState) {
        var forumName = forumInfo.data('forumName');
        var articleNum = $('.forumTitleWrap').data('articleNum');
        var page = forumInfo.data('page');
        var step = forumInfo.data('step');

        var url = `/f/${forumName}?num=${articleNum}&page=${page}&step=${step}&rePage=${rePage}&reStep=${reStep}`;
        // window.history.replaceState(statedata, title, url);
        window.history.replaceState({}, null, url);
      }
    }
  })
}

