var selectedSen = new Object();
var noTagIdx = 0;
var noTagName = 'No Category';
// 설정된 언어가져오기
var lang = langPack();

$(document).ready(function () {
	var wherePage = $('.categorySearchWindow').data('searchingTagIdx');
	// 시작 세팅
	visibleHeart(); // heart on 된 것들이 항상 보이도록
	
	// say페이지거나 day페이지일 경우 날짜를 클릭하면 주소 복사하기
	if (wherePage == 'undefined' || wherePage == '9999'){
		var linkAddress = document.querySelectorAll('.linkAddress');
		console.log('9999페이지');
		textCopy(); // 주소 카피
		linkPopup();
	}

	// 날짜 클릭시 주소 카피 
	function textCopy(){
		var clipboard = new ClipboardJS(linkAddress);
	}

	// 페이지 주소 복사 - 1초간 팝업 후 사라지도록
	function linkPopup(){
		$(linkAddress).popover().click(function(){
			console.log('실행!');
			setTimeout( function(){
					$(linkAddress).popover('hide');
				},1000);		
		});
	}

	// 맨위로 이동하기
	$('.navMoveTop').hide();
	$(window).scroll(function () {
		var height = $(document).scrollTop();
		if (height == 0 ){
			$('.navMoveTop').hide();
		}else{ $('.navMoveTop').show();}
	});

	// 시작-------------------------------Submit 버튼을 눌렀을 때 처리
	var engTxt = $('#engTxtarea'); // 텍스트박스에 입력된 영어 문장

	var submitBtn = $('#submitBtn');
	var senInfo = $('#senInfo');
	
	function ajaxEngSen(_this) {
		_this = $(_this);

		var check = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
		console.log(engTxt.val())
		var isHangul = check.test(engTxt.val());// 문장에 한글이 포함되어 있는지 확인
		if(isHangul) alert('한글은 입력할수 없습니다');

		// 문장이 서버에 저장될때까지 추가 문장 입력이 없도록 막기
		engTxt.css('cursor','not-allowed');
		engTxt.disabled = true;
		submitBtn.css('cursor','not-allowed');
		
		$.ajax({
			type: 'POST',
			url: '/tts',
			data: {
				nickname: senInfo.data('nickname'),
				engTxt: engTxt.val(),
				lenInfo: $('#checkLenInfo').text(), // 글자수
				tagIdx: getCookie('tagIdx'), // 카테고리 인덱스 넘기기
				tagName : getCookie('tagName'), // 클라이언트에서 보여주기 위해 넘기는 태그 이
			},
			success: function (data) {
				var isIncludeDate = $('#hiddenAjaxInfo', data).data('isIncludeDate'); // 대박!
				var inferiorDay = $('.inferiorDay').first();
				var contentWrap = $('.contentWrap');
				var pageInfo = $('#pageInfo');
				if (isIncludeDate == 1) { // 만약 날짜가 포함된 ajax라면
					contentWrap.prepend(data);
					contentWrap.find('.aSen').first().css('background-color', '#b2dec5');
					contentWrap.find('.aSen').first().animate({
						backgroundColor: "#fff"
					}, 800);
					pageInfo.data('newBydate', parseInt(pageInfo.data('newBydate')) + 1); // more를 클릭했을 때 문장목록을 올바로 갱신하기 위해
					console.log('	$("#pageInfo").data("newBydate"): '+	$('#pageInfo').data('newBydate'));
				} else { // 영어 문장만 포함된 ajax면
					var forMp3s = $('.upperDay').first().find('.forMp3s');
					var mp3s = $('#hiddenAjaxInfo', data).data('mp3s');
					forMp3s.data('mp3s', mp3s ); // 전체 문장 저장을 위해 prepend된 문장을 추가하여 .mp3s의 값 교체

					var count = $('#hiddenAjaxInfo', data).data('count'); // 대박!
					$('.countSentence').first().text(count);
					// $('.tagInfo').text()
					// $(data).hide().prependTo('.inferiorDay').fadeIn('slow'); // fadeIn()으로 나타나게.
					inferiorDay.prepend(data);
					inferiorDay.children().first().css('background-color', '#b2dec5');
					inferiorDay.children().first().animate({
						'background-color': "#fff"
					}, 800); // jQuery Color Plug-in을 따로 설치해야만 돌아간다ㅜ
				}
				submitBtn.blur();
				engTxt.val('');
				engTxt.css('background-color', '#fff');
				submitBtn.css('cursor','pointer');
				engTxt.css('cursor','text')
				$('.checkLenInfo').text('0');

				senBGByHover(); // 문장 위에 마우스가 올라갔을 때 문장 배경색 변경
				githubCellColorDarker(); // Github 카운팅한 후 셀 색깔 진하게 하기
				tooltipShow(); // PC화면에서만 툴팁보이도록
				tooltipSetTimeOut(_this); // tooltip 1초만 보이고 사라지게
				linkAddress = document.querySelectorAll('.linkAddress'); // linkAddress객체들을 새로 가져온다
				textCopy();// 날짜를 클릭하면 클립보드에 복사 
				linkPopup();// Copied!라는 팝업이 뜨도록
			}
		});
	};

	engTxt.on('keydown', function (e) {
		if (e.keyCode == 13) {
			if ($('#engTxtarea').val().trim()) { // null checking
				ajaxEngSen(this);
				e.preventDefault();
			}
		} else { // 엔터일때에는 border가 빨간색으로 바뀌지 않게.
			setTimeout(function () {
				engTxt.css({
					'backgroundColor': '#fff'
				});
			}, 350);
		}
		engTxt.css({
			'backgroundColor': '#eff4ee'
		});
	})

	submitBtn.on('click', function (e) {
		if ($('#engTxtarea').val().trim()) { // null checking
			ajaxEngSen(this);
			e.preventDefault();
		}
	});
	// 끝-------------------------------Submit 버튼을 눌렀을 때 처리

	senBGByCount(); // 카운팅마다 문장BG 바꿔주기
	senBGByHover(); // 마우스 롤오버시 문장 배경색 바꾸기


	// 시작--------------------------글 수정 완료 후 엔터를 치거나 Sayv를 할때
	function modifyOKExe(lenInfo) {
		var engTxtMo = $('#engTxtareaModify');
		var tagInfo = $('#optSelectTag>.tagInfo');

		// console.log('***** 서버에 보내기 전');
		// console.log('nickname: '+ senInfo.data('nickname'));
		// console.log('engTxt: '+ engTxtMo.val());
		// console.log('senId: '+ senInfo.data('senId'));
		// console.log('senByDateID: '+ senInfo.data('senByDateId'));
		// console.log('senIDMP: '+ senInfo.data('senIdMp3'));
		// console.log('전체 음성파일 : '+ selectedSen.parent().prev().find('.forMp3s').data('mp3s'));
		try{
			$.ajax({
				type: 'POST',
				url: '/senModifyOK',
				data: {
					nickname		: senInfo.data('nickname'),
					engTxt			: engTxtMo.val(),
					senID				: senInfo.data('senId'),
					senByDateID	: senInfo.data('senByDateId'),
					senIDMp3		: senInfo.data('senIdMp3'),
					lenInfo			: lenInfo, // 글자수
					tagIdx			: tagInfo.data('tagIdx'), // 카테고리 인덱스 넘기기
				},
				success: function (d) {
					selectedSen.find('.senTxt').text(d.aSentence.engTxt); // 수정된 영문장을 바꾸고
					selectedSen.find('.senKorTxt').text(d.aSentence.korTxt); // 번역된 한글문장도 바꾸고
					selectedSen.find('.senKorTxt').append('<i class="tagInfo"><i>'); // 이렇게 tagInfo도 넣고
					
					// tagIdx가 0이면 카테고리 이름 표시하지 않기
					// if( parseInt(tagInfo.data('tagIdx')) ){
					// 	selectedSen.find('.tagInfo').text( tagInfo.text());
					// }else {
					// 	selectedSen.find('.tagInfo').text('');
					// }
					// 아래와 같이 .optionIcon을 함께 갱신하지 않아 문장을 수정할때 데이터가 꼬였었다. 이걸로 만 하루를 날렸다. 고생끝. 18.05.31
					selectedSen.find('.repeatIconSmall, .speakIconSmall, .optionIcon')
						.data('itemId', d.aSentence._id )
						.data('itemByDate', d.aSenByDate_id )
						// ★ data 태그는 아래와 같이 해야만 실제로 갱신된다 ㅠ 또 죽을 고생 18.05.31
						.attr('data-file', d.aSentence.mp3 ) // 음성파일 데이터 변경.
	
					// selectedSen.find('.repeatIconSmall, .speakIconSmall').text(d.aSentence.mp3);
					// selectedSen.css('border','2px solid red');
					// console.log('');
					// console.log('***** 서버에서 받은 정보');
					// console.log('nickname: '+ senInfo.data('nickname'));
					// console.log('engTxt: '+ d.aSentence.engTxt);
					// console.log('senId: '+ d.aSentence._id);
					// console.log('senByDateID: '+ d.aSenByDate_id);
					// console.log('senIDMP: '+ d.aSentence.mp3);
					// console.log('목록에 들어간mp3 : '+ selectedSen.find('.speakIconSmall').data('file'));
					// console.log('전체 음성파일 : '+d.mp3s.toString());
	
					// window.location.href=window.location.href;
					// selectedSen.load(selectedSen);
					// 전체 음성파일 바꾸기. 일반 페이지인지 태그 검색페이지인지 먼저 확인
					if ( parseInt(wherePage) ){
						// 태그 검색 페이지라면, 1,2,3, 10000 이라면
						var makeMp3Arr = selectedSen.parent().prev().find('.forMp3s').data('mp3s').split(',');
						var tmpFoundMp3Idx = makeMp3Arr.indexOf(senInfo.data('senIdMp3'));  // mp3s배열에서 예전 파일을 찾아서 
	
						makeMp3Arr.splice( tmpFoundMp3Idx, 1, d.aSentence.mp3 );  // 파일명을 교체한다. 일반 '='을 사용하면 들어가지 않는다.
						selectedSen.parent().prev().find('.forMp3s').data('mp3s',makeMp3Arr.toString()); // 교체한 파일목록을 저장
	
						// 태그를 붙인다. 이유는 도저히 모르겠지만 parseInt가 먹히지 않아 string으로 처리한다
						if ((wherePage == '10000')){
							// love 페이지라면 일반 태그(카테고리)를 붙인다
							selectedSen.find('.tagInfo').text( tagInfo.text());
						} else{
							// 여기서 태그는 작성시간이다.
							selectedSen.find('.tagInfo').text(d.aSentence.updatedAt_local);
						}
						selectedSen.find('.tagInfo').data('tagIdx', tagInfo.data('tagIdx'));
	
					}else{
						// 일반 페이지라면, 0이라면
						console.log('일반 페이지?');
						selectedSen.parent().prev().find('.forMp3s')
							.data('mp3s', d.mp3s.toString()); // 전체 음성 파일도 바꾸고
						// 태그를 붙인다
						if ( parseInt(tagInfo.data('tagIdx')) ){
							selectedSen.find('.tagInfo').text( tagInfo.text());
							selectedSen.find('.tagInfo').data('tagIdx', tagInfo.data('tagIdx'));
						} else{
							selectedSen.find('.tagInfo').remove();
						}
					}
	
					selectedSen.css('background-color', '#b2dec5'); // 수정된 문장을 이쁘게 연출
					selectedSen.animate({
						backgroundColor: "#fff"
					}, 1200);
	
					$.magnificPopup.proto.close.call($('#engTxtareaModify')); // 마지막 팝업창 닫기!
				}
			});

		} catch(err) { console.log(err); }
	}


	// 시작 ---------------------------------------글삭제 팝업창 띄우기
	$('#optDelete').click( function(){ // -옵션 박스에서 delete를 눌렀을 때
		$.magnificPopup.open({
			items: {
				src:'#deletePopup', // a(href='#tagList')로 만들고 이 부분을 없애도 된다.
				type: 'inline',
				modal: false,
				closeBtnInside: true,
			},
			alignTop: window.innerWidth < 680 , // 화면해상도에 맞춰 popup align 결정
			fixedContentPos: true,
		})
	})
	// 끝 ----------------------------------------글삭제 팝업창 띄우기

	// 글 수정 후 Confirm을 눌렀을 때
	$('#modifyOK').click(function () {
		modifyOKExe($(this).next().next().text()); // this를 통해 데이터를 가져오므로 유지관리 신중하게 하자. 글자수 전달
		
	})

	$('#engTxtareaModify').keydown(function (e) { // 글 수정 후 Enter를 쳤을 때
		if (e.keyCode == 13) {
			console.log('문자길이: ' +$(this).parent().find('.checkLenInfo').text());
			modifyOKExe($(this).parent().parent().find('.checkLenInfo').text()); // 문자길이를 클라에서 계산 후 서버로 보냄
		}
	})
	// 끝-------------------------------글 수정 완료 후 엔터를 치거나 Sayv를 할때

});
// -------------------------------------------------------------------------------


// Delete창 닫기버튼(Cancel)
function noMsgPopup(){
	$.magnificPopup.proto.close.call($('#deletePopup')); // 삭제 팝업창 닫기
}
// 문장 Delete 실행
function yesMsgPopup(){
	var senInfo = $('#senInfo');
	var wherePage = $('.categorySearchWindow').data('searchingTagIdx');

	$.ajax({
		type: 'POST',
		url: '/senDel',
		data: {
			nickname : senInfo.data('nickname'),
			senID: senInfo.data('senId'),
			senByDateID: senInfo.data('senByDateId'),
			senIDMp3: senInfo.data('senIdMp3'),
		},
		success: function (data) {
			// console.log(JSON.parse(data.success)); // 이렇게 json처리
			console.log('delete success!');
			$.magnificPopup.proto.close.call($('#deletePopup')); // 삭제 팝업창 닫기

			$('.optBox').hide(); // 먼저 optBox를 안보이게 하고
			githubCellColorLighter(); // github Cell 색깔 옅게 하고

			// 남은 글이 하나 뿐이고 Love페이지가 아니라면
			if (data.count < 1 && parseInt(wherePage) != 10000 ) {
					selectedSen.css('background-color', '#cfe9da');
					selectedSen.parent().parent().fadeOut('fast'); // 그냥 날짜 전체를 지우면 된다.
					// more버튼을 눌렀을때 삭제된 bydate가 있다면 계산해서 목록을 뿌려줘야 한다
					$('#pageInfo').data('newBydate' , parseInt($('#pageInfo').data('newBydate')) -1) 
					console.log('del newBydate: '+ $('#pageInfo').data('newBydate'));
			} else {
				
				if ( parseInt(wherePage) ){
					// 일반 페이지라면, 1,2,3이라면
					// 먼저 카운트에서 1을 빼고
					selectedSen.parent().prev().find('span.countSentence.badge').text( parseInt(selectedSen.parent().prev().find('span.countSentence.badge').text())-1 );

					// 해당문장을 목록에서 제거한다.
					var makeMp3Arr = selectedSen.parent().prev().find('.forMp3s').data('mp3s').split(',');
					var tmpFoundMp3Idx = makeMp3Arr.indexOf(senInfo.data('senIdMp3'));  // mp3s배열에서 예전 파일을 찾아서 

					makeMp3Arr.splice( tmpFoundMp3Idx, 1 );  // 파일명을 교체한다. 일반 '='을 사용하면 들어가지 않는다.
					selectedSen.parent().prev().find('.forMp3s').data('mp3s',makeMp3Arr.toString()); // 교체한 파일목록을 저장

				}else{
					// 태그 검색 페이지라면, 0이라면
					selectedSen.parent().prev().find('span.countSentence.badge').text(data.count); // 카운트 1개를 줄이고
					selectedSen.parent().prev().find('.forMp3s').data('mp3s', data.mp3s.toString()); // 전체 음성 파일도 바꾸고
				}

				selectedSen.css('background-color', '#cfe9da').fadeOut('fast');
			}
		}
	});
}



// 옵션 팝업 상자 (레이어팝업)
function openOpt(_this){
	var option = $(_this);
	var optionSen = option.parent().next().find('.senTxt').text();
	var optionTag = option.parent().next().find('.tagInfo');
	var senInfo = $('#senInfo');
	var wherePage = $('.categorySearchWindow').data('searchingTagIdx');
	var categorySearchWindow= $('.categorySearchWindow');
	
	// 해당 파일에 대한 정보를 팝업을 위해 전역변수에 넣는다
	senInfo.data('senId',option.data('itemId')); // 무조건 소문자만 되는구나. 몰랐다 ㅠ
	senInfo.data('senByDateId',option.data('itemByDate'));
	senInfo.data('senIdMp3', option.attr('data-file'));
	senInfo.data('senTagIdx', optionTag.data('tagIdx') || noTagIdx ); // tagIdx

	if ( wherePage == 'undefined' || wherePage == '10000'|| wherePage == '9999' ){ // 일반 페이지나 love페이지, day페이지라면
		senInfo.data('senTagName', optionTag.text() || noTagName  );
	}else{ // 카테고리 페이지라면, 1,2,3이라면
		console.log('카테고리 페이지 난입');
		console.log(optionTag.data('tagIdx'));
		senInfo.data('senTagName', $('.categorySearchWindow').data('searchingTagName') );
		
	}
	senInfo.data('sentence', optionSen );
	// console.log('senID: '+ senInfo.data('senId'));
	// console.log('senByDateId: '+ option.data('itemByDate'));
	// console.log('option.attr: '+ option.attr('data-file'));
	// console.log('senIdMp3: '+ senInfo.data('senIdMp3'));
	// console.log('senTagIdx: '+ optionTag.data('tagIdx') || 0);
	// console.log('searchingTagName: '+ categorySearchWindow.data('searchingTagName'));
	var optBox = $('.optBox');
	selectedSen = option.parent().parent(); // 전역변수 이용!
	// 아래 한줄 만드는데 종일 걸렸다 ㅜ 17.02.17
	optBox.css({
		'top': option.offset().top + option.height() / 2,
		// 'left': option.offset().left - option.width() * 2
		'left': option.offset().left + 5
	}).show();
}

// 문장 정렬
function senSort(_this){
	var _this = $(_this);
	var senInfo = $('#senInfo');
	var sort = !Boolean(_this.data('sort')); // 정렬 전환
	_this.data('sort', sort);
	tooltipSetTimeOut(_this.children().first()); // tooltip 1초만 보이고 사라지게
	
	var mp3files = _this.parent().find('.forMp3s').data('mp3s'); // mp3s 파일목록

	var mp3sReverse = mp3files.split(',');
	_this.parent().find('.forMp3s').data('mp3s', mp3sReverse.reverse().toString()); // 바꾼 파일목록 저장
	$.ajax({
		type: 'POST',
		url: '/senSort',
		data: {
			// nickname		: senInfo.data('nickname'),
			senByDateID	: _this.data('itemByDate'),
			senSort 		: sort,
			mp3s				: mp3sReverse,
		},

		success: function (d) {
			console.log('sort: ' + _this.data('sort'));
			if ( sort ) { // 최신순으로 정렬
				_this.children().first().removeClass('glyphicon-sort-by-attributes-alt').addClass('glyphicon-sort-by-attributes'); // 아이콘 바꾸고
				_this.children().first().attr('title',lang.tooltipSorting);
			} else { // 과거순으로 정렬
				_this.children().first().removeClass('glyphicon-sort-by-attributes').addClass('glyphicon-sort-by-attributes-alt');				
				_this.children().first().attr('title',lang.tooltipSortingAlt);

			}
			// _this.children().children().css('position','fixed');
			_this.children().tooltip('fixTitle');
			_this.children().tooltip('show');
			
			// Dom' elements reverse!
			var inferiorDay = _this.parent().next();
			//returns an array of all of the elements
			inferiorDay.css('background-color','#b3ddc5');
			inferiorDay.append( inferiorDay.children().get().reverse() ); // 중요!
			inferiorDay.animate({
				backgroundColor: "#eee"
			}, 1200);
			
		}
	});
}


// 글 더보기 more 
function moreSay(_this){
	var senInfo = $('#senInfo');
	var pageInfo = $('#pageInfo');
	var page = pageInfo.data('page') + 1 // 현재 내가 있는 페이지
	var byDateStep = pageInfo.data('byDateStep'); // 한페이지에 보여주는 글수
	var totalBydateCount = pageInfo.data('totalBydateCount'); // 전체 글 개수
	var totalPage = pageInfo.data('totalPage');
	
	$.ajax({
		type: 'POST',
		url: '/moreSay',
		// url: `/${senInfo.data('nickname')}/moreSay?page=${page}&byDateStep=${byDateStep}&totalBydateCount=${totalBydateCount}&totalPage=${totalPage}`, // 이건 나중에 처리
		data: {
			pageNickname			: location.pathname.split('/')[1],
			nickname					: senInfo.data('nickname'),
			page							: page,
			byDateStep 				: byDateStep,
			totalBydateCount 	: totalBydateCount,
			totalPage 				: totalPage,
			newBydate					: pageInfo.data('newBydate'),
			searchingTagIdx		: $('.categorySearchWindow').data('searchingTagIdx'),
		},
		success: function (data) {
			// console.log(`totalBydateCount : ${totalBydateCount}, page: ${page}, byDateStep: ${byDateStep}, totalPage: ${totalPage}`);
			$('.contentWrap').append(data);
			pageInfo.data('page', page );
			// $('.bottomUI').blur();
			senBGByCount(); // 카운팅마다 문장BG 바꿔주기
			senBGByHover(); // 마우스 롤오버시 문장 배경색 바꾸기
			visibleHeart(); // heart on 보이도록
			heartColor(); // heart된 수에 따라 색 다르게 나오도록
			tooltipShow(); // tooltip 보여주자
			
			if (totalBydateCount <= ((page) * byDateStep )) {
				$('.moreBtn').css('display', 'none');
			}
		}
	});
}

// Heart를 눌렀을 때 처리
function hearting(_this) {
	// 클라 아이콘 표시 처리
	var heart = $(_this);
	var senInfo = $('#senInfo');
	var isHearting;
	var who = parseInt(heart.attr('data-who'));
	var count = parseInt(heart.attr('data-count'));

	if( heart.hasClass('glyphicon-heart-empty') ){
		heart.removeClass('glyphicon-heart-empty').addClass('glyphicon-heart');
		isHearting = 1;
		heart.attr('data-count', count+1);
		// heart.attr('title', `${count+1}명이 좋아합니다`)
		heart.attr('title', (count+1) + lang.tooltipMsgLove)
		heart.tooltip('fixTitle');
		heart.tooltip('show');
		setTimeout( function(){
			heart.tooltip('hide');
		}, 1000);

		console.log('현재 who: '+ heart.attr('data-who'));;
		// heart.attr('data-who', parseInt(heart.attr('data-who')));

		if (window.innerWidth > 1024){
			heart.css('visibility','visible');
		}

	} else{
		heart.removeClass('glyphicon-heart').addClass('glyphicon-heart-empty');
		isHearting = 0;
		heart.attr('data-count', count-1);
		// heart.attr('title', `${count-1}명이 좋아합니다`)
		heart.attr('title', (count-1)+ lang.tooltipMsgLove)
		heart.tooltip('fixTitle');
		heart.tooltip('show');
		setTimeout( function(){
			heart.tooltip('hide');
		}, 1000);
		console.log('user: '+ senInfo.data('user'));
		console.log('현재 who: '+ heart.attr('data-who'));;
		// heart.attr('data-who', parseInt(heart.attr('data-who')));
		if (window.innerWidth > 1024){
			heart.attr('style','');
		}
	}

	// who 변경
	if (senInfo.data('user') == 'owner'){
		if (who ==0) heart.attr('data-who',3); // 소유자만 o
		if (who ==1) heart.attr('data-who',2); // 소유자 o, 다른 누군가 o
		if (who ==2) heart.attr('data-who',1); // 소유자 x, 다른 누군가 o
		if (who ==3) heart.attr('data-who',0); // 아무도 x
	} else {
		if (who =4) { // 소유자 o, 방문자 o, 다른 누군가 x
			if (count >=2 ) heart.attr('data-who',5);
			else heart.attr('data-who',6);
		}
		if (who ==5) heart.attr('data-who',4); // 소유자만 x, 방문자 o , 다른 누군가 o
		if (who ==6) heart.attr('data-who',4); // 소유자는 x, 방문자는 o, 다른 누군가는 x
		if (who ==7) { // 소유자 o, 방문자 x, 다른 누군가 x
			if (count >= 1) heart.attr('data-who',8);
			else heart.attr('data-who',9);
		}
		if (who ==8) heart.attr('data-who',7); // 소유자 x, 방문자x, 다른 누군가 o
		if (who ==9) heart.attr('data-who',7); // 아무도 heart X
	}

	$.ajax({
		type: 'POST',
		url: '/love',
		data: {
			itemId: heart.data('itemId'),
			user : heart.prev().hasClass('optionIcon'), // 좀 웃기긴 한데 option버튼이 있는지 없는지로 본인것인지 체크한다 18.05.30
			nickname : senInfo.data('nickname'),
			myNickname: senInfo.data('myNickname'),
			isHearting : isHearting,
		},
		success: function (data) {
			console.log('성공 베이베');
			heartColor(); // heart수에 맞춰 heart color변경
		}
	});
}

// heart on 된 문장들이 항상 보이도록
function visibleHeart(){
	var heart = $('.heartIcon');
	if (window.innerWidth > 1024){
		$('.glyphicon-heart').css('visibility','visible');
	}
}