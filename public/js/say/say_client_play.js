// mp3 play module
var objRepeating; // repeat 체크한 후 아이콘 추가 및 삭제를 위해
var chkObj; // 무엇이 클릭 되었는지 저장을 위해

// 영문 읽어주기
function speak(_this, cheFn) {
	_this		= $(_this);

	var dayId		= _this.data('itemByDate');
	var audio		= $('audio');		
	
	tooltipSetTimeOut(_this); // tooltip 1초만 보이고 사라지게

	switch (cheFn) { // 어떤 플레이인지 체크
		case 'playOne'			:
		case 'repeatOne' 		: 
			var filesStr	= _this.data('file');
			var senId			= _this.data('itemId');
			break;
		case 'playTotal' 		:
		case 'repeatTotal'	:
			var senIds 		= _this.data('ids');
			var filesStr 	= _this.data('mp3s');
			break;
	}
	
	if (!filesStr) return; // 재생할 파일이 없으면 return

	// 플레이 및 중지 모듈---------------------------
	if ( !chkObj ){ // 처음 플레이 하는 거라면
		// ★중요! 이렇게 jquery의 0번째를 비교해야만 올바른 객체비교가 된다.
		// js로 바꾸는 건 나중에 제대로 하자. 18.03.12
		chkObj = _this.get(0);
		playNext(0); // 플레이 시작
		addRepeat(); // repeat 클래스 체크 후 추가

	} else { // 이미 플레이 중인 파일이 있다면
		if ( Object.is( chkObj, _this.get(0) )){ // 같은 파일을 플레이하는 거라면
			chkObj = undefined;
			stop(); // 플레이 멈춤
			removeRepeat(); // repeat 클래스 체크 후 제거

		} else { // 다른 파일을 플레이 시키는 거라면
			removeRepeat();
			addRepeat();

			chkObj = _this.get(0);
			stop(); // 이전 모든 플레이를 멈추고
			playNext(0); // 플레이 시작

		}		
	}
	// ----------------------------플레이 및 중지 모듈


	// iconRolling 클래스 추가
	function addRepeat(){
		if ( cheFn == 'repeatTotal' || cheFn =='repeatOne' ){
			objRepeating = _this; 
			_this.addClass('iconRolling');
		}
	}
	// iconRolling 클래스 삭제
	function removeRepeat(){
		if ( objRepeating ){		
			objRepeating.removeClass('iconRolling');
			objRepeating = undefined;
		}
	}

	function playNext(i) {
		function playMp3(i){
			// console.log(files[i]);
			// 플레이가 끝나면 ended 이벤트가 발생하여 재귀호출한다.
			audio.attr('src', 'https://saytoremember.s3.amazonaws.com/sound/' + files[i]).get(0).play();
		}

		// String을 Array변경. 맨 윗문장부터 읽어주기위해 reverse()사용
		var files = filesStr.split(',').reverse();
		// var files = filesStr.split(',');
		playMp3(i); // 첫문장 읽고
		audio.on('ended', function () { // 만약 한 문장을 다 읽으면
			i++; // 다음 문장을 선택
			if (i < files.length  ) {
				playMp3(i);
			} else {  // 모든 문장을 다 읽었다면
				var senInfo = $('#senInfo');
				console.log('who? '+ senInfo.data('user'));
				$.ajax({	// 클릭 수 올려주기
					type: 'POST',
					url: '/clicked',
					data: { 
						// nickname	: senInfo.data('nickname'),
						dayId: dayId, 
						cheFn: cheFn,
						senId: senId || '',
						senIds: senIds || '',
						who: senInfo.data('user'),
						},
					success: function(){
						var senTxtObj = _this.parent().parent().find('.senTxt');
						var senTxtCount; // 자기 문장 클릭수
						var senTxtOtherCount; // 다른 사람이 클릭한 수

						if ( cheFn == 'repeatOne' || cheFn =='playOne' ){
							senTxtCount = parseInt(senTxtObj.data('clicked'));
							enTxtOtherCount = parseInt(senTxtObj.data('otherClicked'));
							// 자신이 자기 문장을 플레이한 경우
							if (senInfo.data('user') == 'owner' ) {
								senTxtCount++;
								senTxtObj.data('clicked', senTxtCount );
							}
							else {
								senTxtOtherCount++;
								senTxtObj.data('otherClicked', senTxtOtherCount );
							}
							
						} else { // 전체반복이나 단일반복일 경우 문장 전체를 돌며 +1 해줘야한다.
							senTxtObj.map( function (err, sen){
								// var senTxtCount = parseInt(sen.data('clicked'));
								// senTxtCount++;
								// sen.data('clicked', senTxtCount );
								
								sen = $(sen);
								senTxtCount = parseInt(sen.data('clicked'));
								senTxtOtherCount = parseInt(sen.data('otherClicked'));
								// 자신이 자기 문장을 플레이한 경우
								if (senInfo.data('user') == 'owner' ) {
									senTxtCount++;
									sen.data('clicked', senTxtCount );
								}
								else {
									senTxtOtherCount++;
									sen.data('otherClicked', senTxtOtherCount );
								}
							})
							// console.log(senTxt);
							// var senTxtCount = parseInt(senTxt.data('clicked'));

						}
						senBGByCount();// 클릭이 많이 된 문장의 배경색을 바꿔준다. 
						senBGByHover();// 마우스를 올렸을 때 색을 바꿔준다.
					}
				});
				stop();
				if (cheFn == 'repeatTotal' || cheFn == 'repeatOne'){
					playNext(0); // 이게 전체 재생 모듈
				} else if ( cheFn == 'playTotal' || cheFn == 'playOne' ){
					chkObj = undefined;
				}
			}

		})
	}

	function stop() {
		// audio.attr('src','sound/'+files[i]).get(0).pause(); // 이렇게 멈춰도 되고
		// _this.removeClass('glyphicon-volume-off').addClass('glyphicon-volume-down').css('color','#050');
		// IsPlaying = false; // 플레이 상태를 false로 바꿔놓고
		audio.off('ended'); // 이게 대박. ended 이벤트를 제거해야만 audio play부하가 생기지 않는다.
		audio.attr('src', '').get(0); // 이렇게 src를 초기화 시켜서 play를 멈춘다.
	}

}

// 시작 ------------------------------------------------전체 파일 다운 받기
// 먼저 String을 배열로 바꾸고
function makeArray(filesStr) {
	var files = filesStr.split(','); // string을 배열로 바꾸어 전달
	var fileName = new Array();
	for (var i = 0; i < files.length; i++) {
		fileTmp = files[i].split('/');
		fileName[i] = fileTmp[1]; // userID제거하고 파일명만 뽑아서
	}
	return fileName;
}

function downloadAllFiles(filesStr) {
	var files = filesStr.split(','); // string을 배열로 바꾸어 전달
	var fileName = new Array();
	for (var i = 0; i < files.length; i++) {
		fileTmp = files[i].split('/');
		fileName[i] = fileTmp[1]; // userID제거하고 파일명만 뽑아서
	}

	function download_next(i) {
		if (i >= files.length) {
			return;
		}
		var a = document.createElement('a');
		a.href = 'https://saytoremember.s3.amazonaws.com/sound/' + files[i];
		a.target = '_parent';
		// Use a.download if available, it prevents plugins from opening.
		if ('download' in a) {
			a.download = fileName[i]; // 파일 다운로드
		}
		// Add a to the doc for click to work.
		(document.body || document.documentElement).appendChild(a);
		if (a.click) {
			a.click(); // The click method is supported by most browsers.
		} else {
			$(a).click(); // Backup using jquery
		}
		// Delete the temporary link.
		a.parentNode.removeChild(a);
		// Download the next file with a small timeout. The timeout is necessary
		// for IE, which will otherwise only download the first file.
		setTimeout(function () {
			download_next(i + 1);
		}, 1000);
	}
	// Initiate the first download.
	download_next(0);
}
// 끝 ------------------------------------------------전체 파일 다운 받기