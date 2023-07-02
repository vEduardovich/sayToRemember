$(document).ready(function () {
	var forumInfo = $('#forumInfo');
	var isMobile = true;//모바일인지 체크

	console.log('window.innerHeight: '+window.innerHeight);
	// Find all iframes

	// $('#articleTxtArea').fitVids();

	if (window.innerWidth > 1024){
		console.log('1024보다 크잖아');
		isMobile = false;
		tinymce.init({
			selector: '#articleTxtArea',
			// language: 'ko_KR',
			// width:'auto !important',//width 오른쪽 경계 화면에 보이기
			width: '1000',
			height: '400',
			// statusbar: false,
			plugins: [
				'image','emoticons', 'autolink', 'autosave', 'textcolor','preview','media','link'
			],
			toolbar: ['styleselect forecolor | youtube | picture | emoticons | preview'],
			// enable title field in the Image dialog
			// image_title: true, 
			// enable automatic uploads of images represented by blob or data URIs
			// automatic_uploads: true,
			branding: false,
			force_br_newlines : true,
			menubar: false,
			media_live_embeds: true,
			// valid_elements : 'span[*],iframe[!src|width|height|frameborder:0|allowfullscreen]',
			relative_urls: true,
			remove_script_host: true,
			convert_urls: false,
			// content_style: 'img {max-width:100%;height:auto;margin:5px auto;}, iframe{max-width:100%;height:auto;margin:5px auto;}',
			content_style: 'img {max-width:100%;height:auto;margin:5px auto;}',
			file_picker_types: 'image',
	
				
			// paste_data_images: true,
			// file_picker_callback: function(cb, value, meta) {
			// 	var input = document.createElement('input');
			// 	input.setAttribute('type', 'file');
			// 	input.setAttribute('accept', 'image/*');
		
			// 	input.onchange = function() {
			// 		console.log('1');
			// 		var file = this.files[0];
			// 		var reader = new FileReader();
			// 		reader.onload = function () {
			// 			console.log('2');
			// 			console.log(file);
			// 			var id = 'blobid' + (new Date()).getTime();
			// 			var blobCache =  tinymce.activeEditor.editorUpload.blobCache;
			// 			var base64 = reader.result.split(',')[1];
			// 			console.log('id: '+ id);
			// 			var blobInfo = blobCache.create(id, file, base64);
			// 			blobCache.add(blobInfo);
		
			// 			// call the callback and populate the Title field with the file name
			// 			cb(blobInfo.blobUri(), { title: file.name });
			// 			// this.dispatchEvent(new Event('change'));
			// 			console.log('5');		
			// 			// 로딩 바
			// 			// tinymce.activeEditor.setProgressState(true);
			// 				// tinymce.activeEditor.insertContent("<br/><br/><br/><br/><br/>");
			// 				var a = tinymce.activeEditor.getBody();
	
			// 				setTimeout(() => {
			// 					console.log('2초후');
			// 				// var inst = tinyMCE.EditorManager.get('articleTxtArea');
			// 				// inst.focus();
			// 				}, 2000);
			// 		};
			// 		reader.readAsDataURL(file);
			// 		console.log('4');
			// 	};
				
			// 	input.click();
			// },
	
			// content_css: 'views/style.css', // css가 있을때만 적용하자. 주소 잘 적고. 18.02.24
			// mobile: {
			// 	theme: 'mobile',
			// 	plugins: [ 'autosave', 'lists', 'autolink' ]
			// },
	
			setup: function (editor) {
				editor.addButton('youtube', {
					text: "유튜브 추가",
					cmd: 'mceMedia',
					icon: false,
					onclick: function(e){
						$('#imgFile').click();
					}
				});
				editor.addButton('picture', {
					text: "이미지 추가",
					// cmd: 'mceImage',
					icon: false,
					onclick: function(e){
						$('#imgFile').click();
					}
				});
				editor.on('change', function () {
					tinymce.triggerSave();
					// editor.save();
	
					// // 이미지 삽입후 포커스를 커서로 바꾼다
					// editor.focus();
					// editor.selection.select(editor.getBody(), true);
					// editor.selection.collapse(false);
	
					// setTimeout(() => {
					// 	editor.insertContent("<br/>");
					// }, 1000);
	
				});
			}
	
		});
	} else {
		isMobile = true;
		console.log('1024보다 작아');
		tinymce.init({
			selector: '#articleTxtArea',
			// language: 'ko_KR',
			width:'auto !important',//width 오른쪽 경계 화면에 보이기
			height: '220',
			plugins: [
				'image','emoticons', 'autolink', 'autosave', 'textcolor','preview','media','link'
			],
			toolbar: ['styleselect forecolor | emoticons |'],
			statusbar: false,
			branding: false,
			force_br_newlines : true,
			menubar: false,
			relative_urls: true,
			remove_script_host: true,
			convert_urls: false,
			// content_style: 'img {max-width:100%;height:auto;margin:5px auto;}, iframe{max-width:100%!important;height:auto!important;margin:5px auto;}',
			// extended_valid_elements: "+iframe[src|width|height|name|align|class]",

			setup: function (editor) {
				// editor.addButton('youtube', {
				// 	text: "유튜브 추가",
				// 	cmd: 'mceMedia',
				// 	icon: false,
				// 	onclick: function(e){
				// 		$('#imgFile').click();
				// 	}
				// });

				editor.on('change', function () {
					editor.save();	
				});
			}
		});
	}

''
	
	// 글 수정 등록 클릭
	$('#submitArticleEdit').on('click', function(e){
		var articleId = $('#forumInfo').data('articleId');
		registArticle('/f/registerEdit', articleId);
	})

	// 글 등록 클릭
	$('#submitArticle').on('click', function(e){
		registArticle('/f/register');
	})

	function registArticle(url, articleId = '' ){
		$(window).unbind('beforeunload');//나가시겠습니까? 에러메시지 나오지 않도록

		// 중요. 아래와 같이 게시판의 textarea 데이터를 가져온다.
		var articleTxt = tinymce.get('articleTxtArea').getContent();
		// console.log($('#articleTxtArea').html(tinymce.get('articleTxtArea').getContent()));

		// 제목이 없을때는 제목없음. 내용이 없을때는 그냥 return하며 아무 반응이 없도록 한다
		var articleTitle = $('#articleTitle').val().trim() || '제목없음';
		// articleTxt = articleTxt || '내용없음';
		if(!articleTxt) return;


		if( $('.iframeMedia').length > 0 ){
			$('.iframeMedia').map( function (idx, _el){
				var src ='';
				var el = $(_el);
				var temp = el.attr('src');
				if(el.data('fileName') != undefined ){//이미지라면
					src = "<img src='"+temp+"' alt='added image' class='addedMedia effect'>";
				}else{//유튜브주소라면
					var temp = el.attr('src');
					src = "<iframe src='"+temp+"' allowfullscreen='allowfullscreen'  frameborder='0' class='addedMedia effect'></iframe>";
				}
				articleTxt += src;
			})
		}

		$.ajax({
			type: 'POST',
			url: url,
			cache: false,
			data: {
				isMobile			: isMobile,//화면이 1200보다 작으면 모바일로 체크		
				articleTitle 	: articleTitle,//글제목
				articleTxt		: articleTxt,//글본문
				articleId 		: articleId,//글 수정 일때, id 넘기기
				nickname			: forumInfo.data('nickname'),//해당 페이지 닉네임
				level 				: forumInfo.data('level'),//해당 유저 레벨
				forumName			: forumInfo.data('forumName'),//게시판 이름
				forumNum			: forumInfo.data('forumNum'),//게시판 번호
			},
			success: function (d) {
				window.location.assign('/f/'+ forumInfo.data('forumName')+ '?num=' + d.articleNum);
			},
		});
	}

	// 이미지 업로드
	$('#imageForm').on('submit', function (e) {
		// data로 전달할때에는 다른 body값 전달이 되지않아 queryString방식으로 전달한다 18.09.17
		var url = '/f/write/img?user='+forumInfo.data('nickname')+'&forumNmae='+forumInfo.data('forumName');
		var formData = new FormData($(this)[0]);
		console.log('#imageForm 실행!');
		
		$.ajax({
			type: 'POST',
			url: url,
			data: formData,
			cache: false,
			contentType: false,
			processData: false,
			success: function (serverFileName) {

				console.log('serverFileName: https://saytoremember.s3.amazonaws.com/'+ serverFileName);

				var loader = "<div class='mediaPack'><div class='loader'></div></div>";//loading css
				var html = "<div class='mediaPack'><img src='https://saytoremember.s3.amazonaws.com/"+serverFileName+"' data-file-name='"+serverFileName+"' style ='display:block();overflow:hidden;' alt='add image' class='iframeMedia' /><a class='fa fa-close mediaRemove'  onclick='mediaRemove(this)'></div>";

				$('.addMedia').append(loader);
				// $('.addMedia').append("<div class='loader'></div>");
				setTimeout(() => {
					// $('.mediaPack').last().remove();
					$('.mediaPack').last().remove();
					$('.addMedia').append(html);
				}, 1000);

				console.log('이미지 업로드 성공');
				// .insertContent를 사용하면 이미지 삽입 후 커서가 편집창 안에 살아있다. setContent는 focus가 사라진다.
				// tinyMCE.get('articleTxtArea').insertContent("<a class ='articleTxtArea cboxElement' href='/img/diary/"+serverFileName+ "'> <img src='/img/diary/" + serverFileName + "' style='max-width:100%; max-height:100%;' /></a>");

			},
		});
		e.preventDefault();
	});

	
	// 개발일지 작성중일 때
	$(window).on('beforeunload', function () {
		if ($('#articleTxtArea').val().length > 30) {
			return "정말 취소하시겠습니까?";
		}
	});
	
	// submit 할때 beforeunload와 unload 이벤트 제거
	$('#diaryRegisterForm').submit(function () {
		$(window).off('beforeunload');
		$(window).off('unload');
	})
	// 개발일지 > 등록 버튼 눌렀을 때 null값 방지
	$('#diaryTextareaBtn').on('click', function (e) {
		if (!$('#articleTxtArea').val().trim()) {
			e.preventDefault();
		}
	})
	
	// 페이지 주소 복사 - 1초간 팝업 후 사라지도록
	$('.linkAdress').popover().click( function(){
		setTimeout( function(){
			$('.linkAdress').popover('hide');
		},1000);
	}); 

	// 유튜브 주소 입력 후
	$('#btnOK').click(function () {
		youtubeAddressCheck();
	})
	$('#youtubeAddress').keydown(function (e) { // 글 수정 후 Enter를 쳤을 때
		if (e.keyCode == 13) {
			youtubeAddressCheck();
		}
	})
})

// 유튜브 textarea 아래에 iframe으로 추가
function youtubeAddressCheck() {
	var youtubeAddress = $('#youtubeAddress').val().trim();
	if(youtubeAddress == '') return;//아무것도 입력X 하면 창을 닫지 않는다

	// var a1 = 'https://youtu.be/qKk9VhwMYnk?t=22s';
	// var a11 = 'https://youtu.be/qKk9VhwMYnk';
	// var a2 = 'https://www.youtube.com/watch?v=qKk9VhwMYnk&feature=youtu.be&t=2m22s';
	// var a3 = 'https://www.youtube.com/watch?v=qKk9VhwMYnk';

	var temp = youtubeAddress.replace(/(.*?)\//g, '');//watch?v=qKk9VhwMYnk&feature=youtu.be&t=2m22s
	var youtubeId;
	var youtubeStartAt = 0;
	var checkAddress = youtubeAddress.indexOf('youtube.com');
	var checkMediaTime = youtubeAddress.indexOf('t=');

	if (checkAddress != -1 ){//youtube.com주소라면
		if(checkMediaTime != -1){// time 정보가 O
			youtubeId = temp.match( /(=(.*?))\&/g)[0].replace('=','').replace('&','');
			youtubeStartAt = extractStartAt(temp);
		}else{//time정보가 X
			youtubeId = temp.match( /=((.*?))$/g).toString().replace('=','').replace('&','');
		}
	}else{// youtu.be 주소라면
		if(checkMediaTime != -1){// time 정보가 O
			youtubeId = temp.match(/(.*?)\?/g).toString().replace('?','');
			youtubeStartAt = extractStartAt(temp);
		}else{//time정보가 X(가장 일반적인 유튭 share주소)
			youtubeId = temp;//https://youtu.be/qKk9VhwMYnk
		}
	}

	// start time 구하기(embed시키기 위해)
	function extractStartAt(temp){
		var start = 0;
		var tempTime = temp.match(/t=(.*?)$/g).toString().replace('t=','');
		var checkMinSec = tempTime.match(/(.*?)m(.*?)s/g);
		if(checkMinSec != null){
			var min = parseInt(tempTime.match(/(.*?)m/g).toString().replace('m',''));// 분정보를 빼내고
			var sec = parseInt(tempTime.match(/m(.*?)s/g).toString().replace('m','').replace('s',''));//초정보를 빼내고
			start = min * 60 + sec;//초로 계산해서 넘겨준다
		}else{
			var checkMin = temp.match(/(.*?)m/g);
			if (checkMin != null ) start = parseInt(tempTime.toString().replace('m','')) * 60;
			else start = parseInt(tempTime.toString().replace('s',''));
		}
		return start;
	}

	console.log(youtubeId);
	console.log('youtubeStartAt: '+ youtubeStartAt);
	$.magnificPopup.proto.close.call($('#youtubePopup'));// 팝업창 닫기!
	$('#youtubeAddress').val('');//유튜브 주소를 긁어냈으니 이제 이전 주소를 지운다.
	console.log('유튜브 주소: '+ "https://www.youtube.com/embed/"+youtubeId+"?start="+youtubeStartAt+"");
	var html = "<div class='mediaPack'><iframe src='https://www.youtube.com/embed/"+youtubeId+"?start="+youtubeStartAt+"' data-youtube-id='"+youtubeId+"' data-youtube-start-at='"+youtubeStartAt+"' allowfullscreen='allowfullscreen' frameborder='0' style ='' class='iframeMedia'></iframe><a class='fa fa-close mediaRemove' onclick='mediaRemove(this)'></div>";
	
	$('.addMedia').append(html);
}



// 미디어 삭제
function mediaRemove(_this){
	var el = $(_this);
	el.parent().remove();
	console.log('img fileName: '+ el.prev().data('fileName'));
	if(el.prev().data('fileName') != undefined ){//유튜브일 경우 처리x, 이미지만 처리 O
		console.log('이미지 삭제 클라 들어온지 확인');
		$.ajax({
			type: 'POST',
			url: '/f/write/imgDelete',
			data: { imgFileName : el.prev().data('fileName') },
			success: function (serverFileName) {
				console.log('이미지 파일 삭제완료');
			},
		});
	}
}

// 댓글 보이기 숨기기 토글
function cmtCountBtn(cmtBtn){
	$(cmtBtn).parent().next().slideToggle('fast'); // 댓글 목록
	$(cmtBtn).parent().next().next().slideToggle('fast'); // 등록 버튼
}

// 댓글 등록하기
function cmtTxtExec(cmtRegBtn) {
	var categoryName = '';
	if (location.pathname.indexOf('guide') != -1) { // url주소로 확인. guide를 찾았다면
		categoryName = 'guide';
	}else {
		categoryName = 'diary';
	}
	
	var cmtTxtarea = $(cmtRegBtn).prev().val(); // 댓글 내용
	var article_ID = $(cmtRegBtn).parent().parent().children().first().val(); // 해당 글 _id #article_id
	var cmtCount = $(cmtRegBtn).parent().prev().prev().find('.cmtCountTxt'); // .cmtCountTxt
	var cmtCountTxt = parseInt(cmtCount.text());
	$.ajax({
		type: 'POST',
		url: '/comment/register',
		data: {
			cmtTxtarea: cmtTxtarea,
			article_ID: article_ID,
			board_name: categoryName,
		},
		success: function (data) {
			cmtCount.text(++cmtCountTxt);
			$(cmtRegBtn).prev().val('');
			$(cmtRegBtn).parent().prev().append(data); // .diaryComment
			cmtRegBtn.blur(); // 포커스 날리기
			
			// $('#cmtArea').append("<div class='cmtDate'>"+ $('.createdAt_txt').last().val()+"</div><div class='cmtArticle'>"+ $('.cmtArticle').last().val()+"</div>");
		}
	})
}

function youtubePopup(){
	$.magnificPopup.open({
		items: {
			src: '#youtubePopup',
			type: 'inline',
			focus: '#youtubeAddress',
		},
		alignTop: window.innerWidth < 680 , // 화면해상도에 맞춰 popup align 결정
		fixedContentPos: true,
		// modal: true,
		callbacks: {
			open: function () {
				// modal enable시 x버튼이 사라지기 때문에 어쩔수 없이 직접 append시킴
				var html = `<button title="Close (Esc)" type="button" class="mfp-close">×</button>`;
				$('#youtubePopup').append(html);
				// $('#engTxtareaModify').val( senInfo.data('sentence') );
				// var tagInfo = $('#optSelectTag>.tagInfo');
				// tagInfo.data('tagIdx', senInfo.data('senTagIdx'));
				// tagInfo.text(senInfo.data('senTagName'));
				// // 글자 길이 가져오기
				// $('.modifyBtnWrap > .checkLenInfo').val(checkTextArea($('#engTxtareaModify')));
			
				$.magnificPopup.instance.close = function () {
					$.magnificPopup.proto.close.call('#youtubePopup');
				};
			},

		}
	})
}
