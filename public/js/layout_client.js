// 화면이 스크롤 되고 있다면 상단 바 아래 그림자를 만든다
$(window).scroll(function () {
    var height = $(document).scrollTop(); // 현재의 스크롤 위치를 가져와서
    if (height > 25){
        $('.navWrap').css('boxShadow','0px 1px 3px rgba(0,0,0, 0.8),0 1px 3px rgba(0,0,0, 0.075)');
    } else {
        $('.navWrap').css('boxShadow','initial');
    }
});

$(document).ready(function () {
    // 모바일에서 카테고리 팝업
    $('#naviOpt').click(function (e) {
        // $(this).toggleClass('naviOptHover');
        e.preventDefault();
        if ($('#isSignedIn').val() == 'false') {
            console.log('isSignedIn is false');
            // $('.optCategory').css('height', '80px');
        }
        $('.optCategory').toggle();
        if ($(this).hasClass('naviOptOff')){
            $(this).removeClass('naviOptOff').focus();
        }else{
            $(this).addClass('naviOptOff').blur();
        }
    })

    // footer를 하단에 고정하기
    // var contentsY = $('.contents').offset().top;
    // var contentsHeight = document.querySelector('.contents').offsetHeight;
    // var footerHeight = document.querySelector('.footerClass').offsetHeight;
    // var footerClass = $('.footerClass');

    // var confirmFooterY = window.innerHeight - (contentsY + contentsHeight + footerHeight);
    // console.log('confirmFooterY: '+confirmFooterY);
    // if (confirmFooterY > 0){
    //     console.log('1');
    //     footerClass.css('position','fixed');
    // }else {
    //     console.log('2');
    //     footerClass.css('position','relative');
    // }

    // 언어체크
    var lang = langCheck();
    if (lang == 'kr') {
        $('.langEng').removeClass('langOn');
        $('.langKor').addClass('langOn');
    }
    else {
        $('.langKor').removeClass('langOn');
        $('.langEng').addClass('langOn');
    }
})

