// Design module
var senBG; // 문장 배경색 저장을 위해

$(document).ready(function () {
  
  var engTxt = $('#engTxtarea'); // 텍스트박스에 입력된 영어 문장
	var optEng = $('#optEng'); // Eng CheckBox
  var senTxt = $('.senTxt'); // 영어 문장들
  
  // 페이지를 처음 열면 실행되는 것들
	engTxt.focus(); // 페이지를 열면 처음부터 textarea에 문장 입력 상태가 되도록
	heartColor(); // heart색 바꿔주자

	
	// Eng, Kor 쿠키 설정
	if ( !getCookie('optEng') ) setCookie('optEng',1, 365);
	if ( !getCookie('optKor') ) setCookie('optKor',1, 365);

  // 시작-------------------------------영문 설정 쿠기 읽어오기
	if (getCookie('optEng') == 0 && getCookie('ci') == 0) { // 어두운 테마일때
		console.log('어두운 테마');
		optEng.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
		senTxt.removeClass('senTxtVisible').addClass('senTxtHidden1');
	} else if (getCookie('optEng') == 1 && getCookie('ci') == 0) {
		optEng.removeClass('glyphicon-unchecked').addClass('glyphicon-check');
		senTxt.removeClass('senTxtHidden1').addClass('senTxtVisible');
	}
	if (getCookie('optEng') == 0 && getCookie('ci') == 1) { // 밝은 테마일때
		console.log('밝은테마');
		optEng.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
		senTxt.removeClass('senTxtVisible').addClass('senTxtHidden2');
	} else if (getCookie('optEng') == 1 && getCookie('ci') == 1) {
		optEng.removeClass('glyphicon-unchecked').addClass('glyphicon-check');
		senTxt.removeClass('senTxtHidden2').addClass('senTxtVisible');
	}

	var optKor = $('#optKor'); // Kor CheckBox
	var senKorTxt = $('.senKorTxt'); // 번역 문장들
	if (getCookie('optKor') == 0) {
		optKor.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
		senKorTxt.hide();
	} else if (getCookie('optKor') == 1 && getCookie('ci') == 0) { // 어두운 테마일때
		optKor.removeClass('glyphicon-unchecked').addClass('glyphicon-check');
		senKorTxt.show();
	}
  // 끝-------------------------------영문 설정 쿠기 읽어오기
  

	// 시작-------------------------------CI 설정 쿠기 읽어오기
	var svgCI = '';
	var ciIcon = $('.ciIcon');
	if (+getCookie('ci') == 0) { // CI 흑백이라면
		console.log('흑백의 focus');
		ciIcon.children().children().attr('fill','#8d9c8b')
		engTxt.css({
			'overflow': 'hidden',
			'margin': '0px auto',
			'border-color': 'rgba(115, 134, 112, 0.8)',
			'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.075) inset, 0 0 8px rgba(115, 134, 112, 0.6)',
			'outline': '0 none'
		});
	} else {
		// $('.ciIcon').attr('src', '/img/icon/ci.png');
		// console.log('칼라의 focus');
		ciIcon.children().children().eq(0).attr('fill','#4CACE2');
		ciIcon.children().children().eq(1).attr('fill','#E61673');
		ciIcon.children().children().eq(2).attr('fill','#EA5514');
		ciIcon.children().children().eq(3).attr('fill','#FBC600');
		ciIcon.children().children().eq(4).attr('fill','#4CACE2');
		ciIcon.children().children().eq(5).attr('fill','#4CACE2');
		ciIcon.children().children().eq(6).attr('fill','#EA5514');
		ciIcon.children().children().eq(7).attr('fill','#9CC816');
		engTxt.css({
			'overflow': 'hidden',
			'margin': '0px auto',
			'border-color': 'rgba(106, 199, 88, 0.8)',
			'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.075) inset, 0 0 8px rgba(106, 199, 88, 0.6)',
			'outline': '0 none'
		});
	}
	// 끝-------------------------------CI 설정 쿠기 읽어오기
})



// 영어 문장 하나를 직접 클릭했을 때 숨기는 function
function senTxtVisible(_this) {
	var senTxt = $(_this);
	if (senTxt.hasClass('senTxtVisible')) {
		if (getCookie('ci') == 0) { // 어두운 테마라면
			senTxt.removeClass('senTxtVisible').addClass('senTxtHidden1');
		} else { // 밝은 테마라면
			senTxt.removeClass('senTxtVisible').addClass('senTxtHidden2');
		}
	} else {
		senTxt.removeClass('senTxtHidden1').removeClass('senTxtHidden2').addClass('senTxtVisible'); // 테마 상관없이 클래스 삭제
	}
}

// 번역된 문장 하나를 직접 클릭했을 때 숨기는 function
function senKorTxtVisible(_this) {
	var senKorTxt = $(_this);
	var tagInfo = senKorTxt.children().first(); // 태그는 따로 처리
	if (senKorTxt.hasClass('senTxtVisible')) {
		if (getCookie('ci') == 0) { // 어두운 테마라면
			senKorTxt.removeClass('senTxtVisible').addClass('senTxtHidden1');
		} else { // 밝은 테마라면
			senKorTxt.removeClass('senTxtVisible').addClass('senTxtHidden2');
		}
		tagInfo.css('visibility', 'hidden'); // 태그도 숨기고
	} else {
		senKorTxt.removeClass('senTxtHidden1').removeClass('senTxtHidden2').addClass('senTxtVisible');
		tagInfo.css('visibility', 'visible'); // 태그를 다시 보이게 한다
	}
}

// 시작 ----------------------------상단 옵션 : ajax때분에 따로 빼서 만듦
$(document).on('click', 'label[for=optEng]', function () { // 영어 문장 전체를 보이거나 숨기게 하는 함수
	var optEng = $('#optEng'); // Eng CheckBox
	var senTxt = $('.senTxt'); // 영어 문장들
	if (getCookie('optEng') == 1) {
		// if( !$('#engCheck').is(':checked') ){
		setCookie('optEng', 0, 365);
		optEng.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
		if (getCookie('ci') == 0) {
			senTxt.removeClass('senTxtVisible').addClass('senTxtHidden1');
		} else {
			senTxt.removeClass('senTxtVisible').addClass('senTxtHidden2');
		}
	} else {
		setCookie('optEng', 1, 365);
		optEng.removeClass('glyphicon-unchecked').addClass('glyphicon-check');
		senTxt.removeClass('senTxtHidden1').removeClass('senTxtHidden2').addClass('senTxtVisible');
	}
})

// 번역된 문장(한글) 전체를 보이거나 숨기게 하는 함수
$(document).on('click', 'label[for=optKor]', function () {
	var optKor = $('#optKor'); // Kor CheckBox
	var senKorTxt = $('.senKorTxt'); // 번역 문장들

	if (getCookie('optKor') == 1) {
		setCookie('optKor', 0, 365);
		optKor.removeClass('glyphicon-check').addClass('glyphicon-unchecked');
		senKorTxt.hide();
	} else {
		setCookie('optKor', 1, 365);
		optKor.removeClass('glyphicon-unchecked').addClass('glyphicon-check');
		senKorTxt.removeClass('senTxtHidden1').removeClass('senTxtHidden2').addClass('senTxtVisible');
		senKorTxt.show();
	}
})

$(document).on('click', '.optBox', function () { // 옵션아이콘이 포커스를 잃으면 옵션상자 보이지 않게 하기.
	$('.optBox').hide();
})
// 끝 ------------------------------------------------상단 옵션 : ajax때분에 따로 빼서 만듦


// CI 클릭했을 때
// 기억! 함수전달 방식은 onclick에서 꼭 this로 전달해야만 해당 this가 전달된다.
// 그것없이 this를 사용하면 window 전체가 this안에 들어온다.
function ciClick(_this) { 
	var ciImg = $(_this);

	var senTxt = $('.senTxt'); // 영어 문장들
	var senKorTxt = $('.senKorTxt'); // 번역 문장들

	if (getCookie('ci') == 0) {
		console.log('Light!');
		setCookie('ci', 1, 365);
		ciImg.attr('src', '../../img/ci.svg');
		// ciImg.children().children().eq(0).attr('fill','#4CACE2');
		// ciImg.children().children().eq(1).attr('fill','#E61673');
		// ciImg.children().children().eq(2).attr('fill','#EA5514');
		// ciImg.children().children().eq(3).attr('fill','#FBC600');
		// ciImg.children().children().eq(4).attr('fill','#4CACE2');
		// ciImg.children().children().eq(5).attr('fill','#4CACE2');
		// ciImg.children().children().eq(6).attr('fill','#EA5514');
		// ciImg.children().children().eq(7).attr('fill','#9CC816');
		// console.log('밝아졌다');
		$('#engTxtarea').css({
			'overflow': 'hidden',
			'margin': '0px auto',
			'border-color': 'rgba(106, 199, 88, 0.8)',
			'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.075) inset, 0 0 8px rgba(106, 199, 88, 0.6)',
			'outline': '0 none'
		});

	} else {
		console.log('Dark');
		setCookie('ci', 0, 365);
		ciImg.attr('src', '../../img/ci_gray.svg');
		// ciImg.children().children().attr('fill','#8E9D8C');
		// console.log('어두운 CI');
		$('#engTxtarea').css({
			'overflow': 'hidden',
			'margin': '0px auto',
			'border-color': 'rgba(115, 134, 112, 0.8)',
			'box-shadow': '0 1px 1px rgba(0, 0, 0, 0.075) inset, 0 0 8px rgba(115, 134, 112, 0.6)',
			'outline': '0 none'
		});

	}
	heartColor();
}



// Github 카운팅한 후 셀 색깔 진하게 하기 (문장추가)
function githubCellColorDarker(){
	var todayCell = $('.todayCell').prev();
	var todayCount = parseInt($('.todayCell').prev().text()); // 오늘 날짜의 카운트를 가져와서
	todayCount = isNaN( todayCount ) ? 0 : todayCount; // 정수화 시킨후
	var increasedCount = todayCount + 1;
	if ( todayCount != 0 && todayCount < 10 ){
		todayCell.removeClass('proDay'+todayCount).addClass('proDay'+increasedCount);
		$('.todayCell').prev().text(increasedCount);
	} else if ( todayCount == 0 ){
		todayCell.removeClass('proDayNone').addClass('proDay1');
		$('.todayCell').prev().text('1');
	} else if( todayCount >= 10 ){ // 이미 카운트가 10보다 큰 경우
		$('.todayCell').prev().text(increasedCount);
	}
}

// Github 카운팅한 후 셀 색깔 옅게하기 (문장삭제)
function githubCellColorLighter(){
	var todayCell = $('.todayCell').prev();
	var todayCount = parseInt($('.todayCell').prev().text()); // 오늘 날짜의 카운트를 가져와서
	todayCount = isNaN( todayCount ) ? 0 : todayCount; // 정수화 시킨후
	var decreasedCount = todayCount - 1;
	if ( todayCount >= 2 && todayCount <= 10 ){
		todayCell.removeClass('proDay'+todayCount).addClass('proDay'+decreasedCount);
		$('.todayCell').prev().text(decreasedCount);
	} else if ( todayCount == 1 ){
		todayCell.removeClass('proDay1').addClass('proDayNone');
		$('.todayCell').prev().text('0');
	} else if( todayCount > 10 ){ // 이미 카운트가 10보다 큰 경우
		$('.todayCell').prev().text(decreasedCount);
	}
}

// 문장 위에 마우스가 올라갔을 때 문장 배경색 변경
function senBGByHover(){
	$('.aSen').on('mouseenter', function(e){
		senBG = $(this).css('background-color'); // 전역변수에 배경색 넣어놓고
		$(this).css({'background-color':'#eee', 'box-shadow': 'none'});
	})
	$('.aSen').on('mouseleave', function(e){
		$(this).css({'background-color':senBG , 'box-shadow': '0px 1px 3px rgba(0,0,0,.1),0 1px 3px rgba(0,0,0,.18)'}); // 마우스가 떠나면 원래 문장배경색으로 복원
	})
}



// 클릭이 많이 된 문장의 배경색을 바꿔준다. 
function senBGByCount(){
	$('.senTxt').map( function(err, senTxt){
		var countClked = $(senTxt).data('clicked');
		var aSen = $(senTxt).parent().parent();
		// console.log(countClked);
		if ( countClked <= 3 ) {
		} else if ( countClked <= 6 ) {
			aSen.css('background-color','#fffffa');
		}else if ( countClked <= 9 ) {
			aSen.css({ 'background-color':'#fffff5'});
		}else if ( countClked <= 12 ) {
			aSen.css('background-color','fffff0');
		}else if ( countClked <= 15 ) {
			aSen.css('background-color','#ffffea');
		}else if ( countClked <= 18 ) {
			aSen.css('background-color','#ffffe5');
		}else if ( countClked <= 21 ) {
			aSen.css('background-color','#fffaff');
		}else if ( countClked <= 24 ) {
			aSen.css('background-color','#fff7ff');
		}else if ( countClked <= 27 ) {
			aSen.css('background-color','#fff4ff');
		}else if ( countClked <= 30 ) {
			aSen.css('background-color','#fff1ff');
		}else if ( countClked <= 50 ) {
			aSen.css('background-color','#ffece9');
		}else {
			aSen.css({'background-color':'#ffe5e4'});
		}
	})
}

	// 핑크, 노란색 계열
	// $('.senTxt').map( function(err, senTxt){
	// 	var countClked = $(senTxt).data('clicked');
	// 	var aSen = $(senTxt).parent().parent();
	// 	console.log(countClked);
	// 	if ( countClked == 0 ) {
	// 	} else if ( countClked <= 1 ) {
	// 		aSen.css('background-color','#fffafa'); // #cfe9da
	// 	}else if ( countClked <= 2 ) {
	// 		aSen.css('background-color','#fffff0');
	// 	}else if ( countClked <= 3 ) {
	// 		aSen.css('background-color','#fff5ee');
	// 	}else if ( countClked <= 4 ) {
	// 		aSen.css('background-color','#fffaf0');
	// 	}else if ( countClked <= 5 ) {
	// 		aSen.css('background-color','#fff0f5');
	// 	}else if ( countClked <= 6 ) {
	// 		aSen.css('background-color','#fdf5e6');
	// 	}else if ( countClked <= 7 ) {
	// 		aSen.css('background-color','#faf0e6');
	// 	}else if ( countClked <= 8 ) {
	// 		aSen.css('background-color','#f5f5dc');
	// 	}else if ( countClked <= 9 ) {
	// 		aSen.css('background-color','#fffacd');
	// 	}else if ( countClked <= 10 ) {
	// 		aSen.css('background-color','#ffefd5');
	// 	}else {
	// 		aSen.css('background-color','#ffc0cb');
	// 	}
	// })

	// $('.createdAt').map( function(err, day){
	// 	// data-total_clicked
	// 	var totalClked = $(day).data('total_clicked');
	// 	var aDay = $(day).parent().parent();
	// 	console.log(totalClked);
	// 	console.log($(aDay));
	// 	$(aDay).css('background-color','#fff0f5');
	// })
	// $('.inferiorDay').map ( function(err, upperDay ) {
	// 	$(upperDay).css('background-color','#fff0f5');
	// })


// heart수에 따라 색을 빠꿔주는 모듈
function heartColor(){
	var heartIcon = $('.heartIcon');

	heartIcon.map(  function (idx, item) {
		// console.log(item);
		var item = $(item);
		// console.log(item.data('count'));
		// console.log(item.data('who'));
		var count = parseInt(item.attr('data-count'));
		var who = parseInt(item.attr('data-who'));
		// rgb(103, 149, 103) rgb(229, 57, 53) rgb(239, 83, 80)
		// heart를 다른 사람도 클릭했을 때만 책을 다양화한다.
		// 주인만 heart했거나 아무도 heart 안했을 때에는 본래색 유지
		// if (who == 1 || who == 2 || who == 3 || who == 4 || who == 5 || who == 6 ||who == 7 || who == 8  ) {
		if (who && +getCookie('ci') == 1 ) {
				if (count == 0)				item.css('color','#888');			
				else if (count == 1)	item.css('color','#4cace2');
				else if (count == 2)	item.css('color','#4cace2');
				else if (count == 3)	item.css('color','#fbc600');
				else if (count == 4)	item.css('color','#dce775');
				else if (count == 5)	item.css('color','#ffd54f');
				else if (count == 6)	item.css('color','#ffb74d');
				else if (count >= 7 && count < 10)		item.css('color','#ff8a65');
				else if (count >= 10 && count < 15)		item.css('color','#ffca28');
				else if (count >= 15 && count < 20)		item.css('color','#ffa726');
				else if (count >= 20 && count < 30)		item.css('color','#ff7043');
				else if (count >= 30 && count < 50)		item.css('color','#ab47bc');
				else if (count >= 50 && count < 100)	item.css('color','#9c27b0');
				else if (count >= 100 && count < 200)	item.css('color','#03a9f4');
				else if (count >= 200 && count < 300)	item.css('color','#ff1744');
				else if(count >= 300 && count >= 300)	item.css('color','#d50000');
			// $(item).css('color',`rgba( ${239 -int} ,  ${83-int}, ${80- int}, 1 )`);
			} else {
				if (count == 0) item.css('color','#888');
				else item.css('color','#679667');
			}
		}
	);
}