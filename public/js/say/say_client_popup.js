$(document).ready(function () {
	// 초기 설정값 시작 ---------------------------------------
	var noTagIdx = 0;
	var noTagName = 'No Category';
	
	var engTxt = $('#engTxtarea'); // 텍스트박스에 입력된 영어 문장
	var senInfo = $('#senInfo');
	var categorySearch = $('.categorySearch');
	var categorySearchWindow = $('.categorySearchWindow');
	var searchTag = $('#searchTag');

	tooltipShow(); // PC화면에서만 툴팁보이도록
	
	// - SNS 로그인시 지저분한 쓰레기 값이 주소에 들어가기때문에 삭제
	// Internet Explorer 6-11 에서는 endWith가 먹히지 않아 처리한다.
	var isIE = /*@cc_on!@*/false || !!document.documentMode;
	if( !isIE ) { 
		if (location.href.endsWith('#')){
			window.history.replaceState({}, null, location.href.slice(0, location.href.length-1))
			// location.href = location.href.slice(0, location.href.length-1);
		} else if (location.href.endsWith('#_=_')){
			window.history.replaceState({}, null, location.href.slice(0, location.href.length-4))
			// location.href = location.href.slice(0, location.href.length-4);
		}
	}  

	// 만약 카테고리 쿠키값이 없다면 기본값 넣기. 서버에서 처리했지만 클라에서도 처리해놓는다.
	if(!getCookie('tagIdx')){
		setCookie('tagIdx', noTagIdx ,365);
		setCookie('tagName', noTagName ,365);
	}
	// Cookie를 이용한 Category설정
	$('.engTxtareaTag').text(getCookie('tagName') || noTagName);
	var searchingTagIdx = categorySearchWindow.data('searchingTagIdx');	

	// 다른 사람의 페이지에 방문했을 때나 카테고리 검색 페이지에 방문했을 때 문장 입력창이 없어 height가 줄어들도록 해야한다.
	if ( senInfo.data('user') != 'owner' || parseInt(searchingTagIdx) ){
		// everyone페이지이고 일반페이지(0)라면
		if (senInfo.data('nickname')=='everyone' && searchingTagIdx == 'undefined'){
			// return; // everyone만 예외처리. 나중에 없애던가 하자. 18.06.12 
			// 위와 같이 return을 넣으면 하단 모든 모듈이 작동하지 않는다. 기억하자.
		} else{
			// categorySearch.css('top','317px');
			categorySearch.css('top','200px');
			if (window.innerWidth > 530 && window.innerWidth <= 679){
				categorySearch.css('top','177px');
			} else if(window.innerWidth < 530){
				categorySearch.css('top','142px');
			}

		}
	}

	// 모바일에서 카테고리(태그)를 클릭했을 때 팝업이 뜨는 위치 설정.
	// absolute라서 css로 left설정이 계속 꼬여 그냥 js로 만듦.
	if (window.innerWidth <= 1024){
		console.log('searchingTagIdx '+ searchingTagIdx);
		// if ( !(location.pathname == '/' || location.href.endsWith('/mypage')) ){ // 메인페이지, 마이페이지가 아닐때만 적용
		if ( searchingTagIdx== 'undefined' || searchingTagIdx== '1' || searchingTagIdx== '2' || searchingTagIdx== '3' || searchingTagIdx== '10000' || searchingTagIdx== '9999' ){ // 메인페이지, 카테고리 페이지, Love페이지에만 적용
				categorySearch.css({left: searchTag.position().left + searchTag.width()  - 158 });
		}
	} 



	// 선택된 태그 검색 카테고리에 tagChecked 클래스 붙이기
	$.map( $('.categorySearchItem'), function( searchTag, idx){
		if(searchingTagIdx== 'undefined') searchingTagIdx = 0;

		if ($(searchTag).data('tagIdx') == searchingTagIdx ){
			$(searchTag).addClass('tagChecked');
			// $(searchTag).removeAttr('href');
			$('.searchTagItem').text( $(searchTag).text() );
		} 
		// love 페이지라면 카테고리 이름에 love가 표시되게
		if (searchingTagIdx == 10000){
			$('.searchTagItem').text('Love');
		}
	})
	// 초기 설정값 끝 ---------------------------------------
})




// tag검색(카테고리검색) 클릭했을 때.
function searchTag(){
	$('.categorySearch').toggle();
}

// modify를 클릭했을 때 해당글을 읽어와서 popup 창에 띄워주는 모듈
function optModify(){
	var senInfo = $('#senInfo');
	$.magnificPopup.open({
		items: {
			src: '#modifyDialog',
			type: 'inline',
			focus: '#engTxtareaModify',
		},
		alignTop: window.innerWidth < 680 , // 화면해상도에 맞춰 popup align 결정
		fixedContentPos: true,
		modal: true,
		callbacks: {
			open: function () {
				console.log('창열림');
				// modal enable시 x버튼이 사라지기 때문에 어쩔수 없이 직접 append시킴
				// var html = `<button title="Close (Esc)" type="button" class="mfp-close">×</button>`;
				var html = '<button title="Close (Esc)" type="button" class="mfp-close">×</button>';
				$('.modifyDialog').append(html);
				$('#engTxtareaModify').val( senInfo.data('sentence') );
				var tagInfo = $('#optSelectTag>.tagInfo');
				tagInfo.data('tagIdx', senInfo.data('senTagIdx'));
				tagInfo.text(senInfo.data('senTagName'));
				// 글자 길이 가져오기
				$('.modifyBtnWrap > .checkLenInfo').val(checkTextArea($('#engTxtareaModify')));
			
				$.magnificPopup.instance.close = function () {

					$.magnificPopup.proto.close.call('#modifyDialog');
					// if (!confirm('Are you sure?')) {
					// 	return;
					// }
					// $.magnificPopup.proto.close.call(this);
				};
			},

		}
	})
}

function optSelectTag(){
	var senInfo = $('#senInfo');
	senInfo.data('tagWhere','option');

	console.log('수정창 tag버튼 클릭1');
	$.magnificPopup.close(); // magnificPopup은 꼭 창을 닫은 후

	// 아래처럼 시간차를 두고 open해야만 창이 열린다. 그렇게 안하면 안열린다.
	// 이걸 알아내는데 만 48시간 걸렸다. 눈물과 분노가 함께 차오른다. 18.04.25 이제 됐다. 드디어.
	setTimeout( function() {
		$.magnificPopup.open({
			items: {
				src:'#tagList',
				type: 'inline',
			},
			closeBtnInside: false,
			modal: true,
			callbacks: {
				open: function () {
					// $.magnificPopup.instance.st.el.attr('id') 는 클릭한 객체의 id를 알아내는 방법
					// $.magnificPopup.proto.close.call('#modifyDialog');
					// $.magnificPopup.close() // 어쨌든 창을 닫아야만 한단다. 알아보자.

					// var html = `<button title="Close (Esc)" type="button" class="optListCloseBtn" id="optListCloseBtn">×</button>`;
					// var html = `<a href='javascript:;' onclick='optListCloseBtn()' class="optListCloseBtn" id="optListCloseBtn">×`;
					var html = "<a href='javascript:;' onclick='optListCloseBtn()' class='optListCloseBtn' id='optListCloseBtn'>×";
					$('.tagList').append(html);

					$.magnificPopup.instance.close = function () {
						$.magnificPopup.proto.close.call(this);
						$('#engTxtarea').focus();
					};	
				}
			}
		}); 
	}, 10);
}


// 메인 tag 클릭했을 때.
function selectTag(){
	var senInfo = $('#senInfo');
	senInfo.data('tagWhere','main');
	$.magnificPopup.open({
		items: {
			src:'#tagList', // a(href='#tagList')로 만들고 이 부분을 없애도 된다.
			type: 'inline',
			modal: false,
			closeBtnInside: true,
		},
		alignTop: window.innerWidth < 680 , // 화면해상도에 맞춰 popup align 결정
		fixedContentPos: true,
		callbacks: {
			open: function () {
				$.map( $('.tagItem'), function (itemIdx, idx){
					if ( $(itemIdx).data('tagIdx') == getCookie('tagIdx') ){
						$(itemIdx).addClass('insertTagChecked');
						$(itemIdx).removeAttr('href');
						// $('.searchTagItem').text( $(searchTag).text() );
					}else{
						$(itemIdx).removeClass('insertTagChecked');
						$(itemIdx).attr('href',$(itemIdx).data('javascript:;'));
					}
				} )
				$.magnificPopup.instance.close = function () {
					$.magnificPopup.proto.close.call(this);
					$('#engTxtarea').focus();
				};	
			}
		}
	})
}

// 유저가 카테고리를 선택했을 때
function chooseTag(_this){
  _this = $(_this);

	$.magnificPopup.close();
	var tagWhere = $('#senInfo').data('tagWhere');

	if( tagWhere == 'main' ){ // 메인 태그를 클릭했을 때
		setCookie('tagIdx', _this.data('tagIdx'), 365); //선택한 카테고리의 클래스도 굽고
		setCookie('tagName', _this.text(), 365); //선택한 카테고리를 쿠키로 굽고
		console.log(getCookie('tagIdx'));
		$('.engTxtareaTag').text(_this.text() ); //해당 카테고리를 화면에 표시한다
		$('#engTxtarea').focus();

	} else { // 옵션안에 태그를 클릭했을 때
		var tagInfo = $('#optSelectTag>.tagInfo');
		tagInfo.data('tagIdx', _this.data('tagIdx'));
		tagInfo.text( _this.text() );
		
		setTimeout( function() {
			$.magnificPopup.open({
				items: {
					src: '#modifyDialog',
					type: 'inline',
					focus: '#engTxtareaModify',
				},
				alignTop: window.innerWidth < 680,
				modal: true,
				fixedContentPos: true,
				callbacks: {
					open: function () {
						// modal enable시 x버튼이 사라지기 때문에 어쩔수 없이 직접 append시킴
						// var html = `<button title="Close (Esc)" type="button" class="mfp-close">×</button>`;
						var html = '<button title="Close (Esc)" type="button" class="mfp-close">×</button>';
						$('.modifyDialog').append(html);

						$.magnificPopup.instance.close = function () {
							$.magnificPopup.proto.close.call(this);
							$('#engTxtareaModify').focus();
						};	
					}
				}
			})
		}, 10);
	}
}

// $(document).on('click', '.optBox', function () { 
// 	$('.optBox').hide();
// })

// 태그 이름 수정 후 엔터키를 쳐도 저장이 되도록
function tagSaveEnter(e,_this){
	if(e.keyCode == 13){
		tagSave($(_this).next());
	}
}

// 카테고리를 새로 만든 후 저장을 클릭했을 때
function tagSave(_this){
	_this = $(_this);
	var tagName = _this.prev().val().trim(); // 공백제거

	if (tagName){
		var tagLi = _this.parent();
		var tagIdx = parseInt(_this.data('tagIdx'));
		console.log(_this.prev().val());
	
		$.ajax({
			type: 'POST',
			url : '/tagSave',
			data: {
				nickname: $('#senInfo').data('nickname'),
				tagIdx: tagIdx,
				tagName: tagName, // 카테고리 이름
			},
			success: function (data) {
				_this.prev().remove();
				_this.remove();
				var html = 
				// `
				// <a href="javascript:;" onclick="chooseTag(this)" data-tag-idx='${tagIdx}' class="tagItem">${tagName}</a>
				// <a href="javascript:;" onclick="tagRemove(this)" data-tag-idx="${tagIdx}">
				// 	<i class="glyphicon glyphicon-remove tagRemove"></i>
				// </a>
				// <a href='javascript:;' onclick='tagModify(this)' data-tag-idx="${tagIdx}">
				// 	<i class="glyphicon glyphicon-pencil tagModify"></i>
				// </a>
				// `
				// 아래 태그는 ""로 묶기 때문에 ${}가 먹히지 않아 에러가 난다. explore를 포기할까하다가 그냥 노가다뛴다 18.08.02
				"<a href='javascript:;' onclick='chooseTag(this)' data-tag-idx='"+tagIdx+"' class='tagItem'>"+ tagName+"</a><a href='javascript:;' onclick='tagRemove(this)' data-tag-idx='"+tagIdx+"'><i class='glyphicon glyphicon-remove tagRemove'></i></a>				<a href='javascript:;' onclick='tagModify(this)' data-tag-idx='"+tagIdx+"'>					<i class='glyphicon glyphicon-pencil tagModify'></i>				</a>"
				tagLi.append(html);

				// 삭제한 카테고리가 현재 기본 카테고리와 같으면 tagIdx를 0으로 바꾼다
				if ( tagIdx == parseInt(getCookie('tagIdx')) ){
					setCookie('tagName', tagName, 365);
					$('.engTxtareaTag').text( tagName );
				}

				// 만약 카테고리 수정일 경우 각 문장이 가지고 있는 카테고리 정보들을 모두 갱신한다
				$.map( $('i.tagInfo'), function( tagInfo, idx){
					if ( parseInt($(tagInfo).data('tagIdx')) == tagIdx ){
						$(tagInfo).text(tagName);
					}
				})

				// 카테고리 검색창 정보도 갱신한다
				$.map( $('.categorySearchWindow>ul>li>a'), function( tagInfo, idx){
					if ( parseInt($(tagInfo).data('tagIdx')) == tagIdx ){
						$(tagInfo).addClass('categorySearchItem');
						$(tagInfo).text(tagName);
					}
				})

				// 카테고리 검색창 정보 중 레이아웃 팝업창 정보도 갱신한다
				// 레이아웃의 카테고리를 일단 없앴다 18.05.23
				// $.map( $('.optCategory>li>a'), function( tagInfo, idx){
				// 	console.log($(tagInfo).data('tagIdx'));
				// 	if ( parseInt($(tagInfo).data('tagIdx')) == tagIdx ){
				// 		$(tagInfo).addClass('categoryList categorySub');
				// 		$(tagInfo).text(tagName);
				// 	}
				// })


			}
		});
	}
}

// 카테고리를 삭제했을 때
function tagRemove(_this){
	_this = $(_this);
	var tagLi = _this.parent();
	var tagIdx = parseInt(_this.data('tagIdx'));
	console.log('삭제할 idx : '+ tagIdx);
	$.ajax({
		type: 'POST',
		url : '/tagRemove',
		data: {
			nickname: $('#senInfo').data('nickname'),
			tagIdx: tagIdx,
		},
		success: function(data){
			_this.prev().remove();
			_this.next().remove();
			_this.remove();
			var html = 
			// `
			// <input type="text" placeholder="Make a new category" onkeypress='tagSaveEnter(event, this)' class="makeTag"><a href="javascript:;" onclick="tagSave(this)" data-tag-idx="${tagIdx}"><i class="glyphicon glyphicon-ok tagSave"></i></a>
			// `
			'<input type="text" placeholder="Make a new category" onkeypress="tagSaveEnter(event, this)" class="makeTag"><a href="javascript:;" onclick="tagSave(this)" data-tag-idx="'+tagIdx+'"><i class="glyphicon glyphicon-ok tagSave"></i></a>'
			
			tagLi.append(html);

			// 삭제한 카테고리가 현재 기본 카테고리와 같으면 tagIdx를 0으로 바꾼다
			if ( tagIdx == parseInt(getCookie('tagIdx')) ){
				setCookie('tagIdx', noTagIdx, 365);
				setCookie('tagName', noTagName, 365);
				$('.engTxtareaTag').text( noTagName );
			}

			$.map( $('i.tagInfo'), function( tagInfo, idx){
				console.log($(tagInfo).data('tagIdx'));
				if ( parseInt($(tagInfo).data('tagIdx')) == tagIdx ){
					console.log('삭제하자!');
					$(tagInfo).data( 'tagIdx', noTagIdx );
					$(tagInfo).text(noTagName);
					$(tagInfo).remove();
				}
			})

			// PC용 카테고리 삭제
			$.map( $('a.categorySearchItem'), function( tagInfo, idx){
				console.log($(tagInfo).data('tagIdx'));
				if ( parseInt($(tagInfo).data('tagIdx')) == tagIdx ){
					console.log('삭제하자!');
					$(tagInfo).removeClass('categorySearchItem tagChecked');
					$(tagInfo).text('');
				}
			})

			// 팝업창 카테고리 삭제
			$.map( $('.categoryList.categorySub'), function( tagInfo, idx){
				console.log($(tagInfo).data('tagIdx'));
				if ( parseInt($(tagInfo).data('tagIdx')) == tagIdx ){
					console.log('삭제하자!');
					$(tagInfo).removeClass('categoryList categorySub');
					$(tagInfo).text('');
				}
			})
			
		}
	})
}

// 카테고리를 수정했을 때
function tagModify(_this){
	_this = $(_this);
	var tagLi = _this.parent();
	var tagIdx = parseInt(_this.data('tagIdx'));
	var tagName = _this.prev().prev().text();

	_this.prev().prev().remove();
	_this.prev().remove();
	_this.remove();

	var html = 
	// `
	// <input type="text" placeholder="Make a new category" onkeypress='tagSaveEnter(event, this)' class="makeTag" value="${tagName}" style="color:$"><a href="javascript:;" onclick="tagSave(this)" data-tag-idx="${tagIdx}"><i class="glyphicon glyphicon-ok tagSave"></i></a>
	// `
		'<input type="text" placeholder="Make a new category" onkeypress="tagSaveEnter(event, this)" class="makeTag" value="'+tagName+'" ><a href="javascript:;" onclick="tagSave(this)" data-tag-idx="'+tagIdx+'"><i class="glyphicon glyphicon-ok tagSave"></i></a>'
		
	tagLi.append(html);

}

// 글 수정 화면안에 카테고리를 클릭하여 카테고리 선택 화면에서 그냥 x버튼을 눌렀을 때 창이 닫힌 후 다시 글수정화면 열기
function optListCloseBtn(){
	$.magnificPopup.close();
		
	setTimeout( function () {
		$.magnificPopup.open({
			items: {
				src: '#modifyDialog',
				type: 'inline',
				focus: '#engTxtareaModify',
			},
			alignTop: window.innerWidth < 680,
			modal: true,
			fixedContentPos: true,
			callbacks: {
				open: function () {
					// var html = `<button title="Close (Esc)" type="button" class="mfp-close">×</button>`;
					var html = '<button title="Close (Esc)" type="button" class="mfp-close">×</button>';
					$('.modifyDialog').append(html);

					$.magnificPopup.instance.close = function () {
						$.magnificPopup.proto.close.call(this);
						$('#engTxtareaModify').focus();
					};	
				}
			}
		})
	}, 10);

}

// 다른 곳을 눌렀을 때 창닫기
$(document).mouseup(function (e) {
	var container = $(".optBox");
	if (!container.is(e.target) && container.has(e.target).length === 0){
		container.css("display","none");
	}

	var container = $(".categorySearch");
	// 클릭한 el의 부모중에 searchTag클래스가 없을 때만 아래가 실행되도록. 별것도 아닌것에 4시간 엄청고생ㅡ,ㅡ
	if (window.innerWidth <= 1024){ // pc환경에서는 항상 보여야 하므로
		if ( !$((e.target)).parent().parent().hasClass('searchTag') && !container.is(e.target) && container.has(e.target).length === 0){
			container.css("display","none");
		}
	}
});

	// pc화면에서만 툴팁 제공
	function tooltipShow(){
		if (window.innerWidth > 1024){
			// 툴팁 설정. tooltipUp이란 클래스가 있는 모든 obj에 툴팁을 붙인다. tooltip은 bootstrap을 사용한다
			// $('.tooltipUp').tooltip({ container : 'body'}); // table에서 tooltip이 안깨지게
			$('.tooltipUp').tooltip();
		}else{
			if (location.href.endsWith('profile')){ // profile 페이지는 툴팁이 보이도록 예외처리
				$('.tooltipUp').tooltip();
			}
			$('.tooltipUp').tooltip('hide');
		}
	}

	// tooltip이 계속 화면에 보이지 않게 1초만 보이고 사라지도록
	function tooltipSetTimeOut(_this){
		_this.tooltip('show');
		setTimeout(function() {
			_this.tooltip('hide');
		}, 1000);
	}