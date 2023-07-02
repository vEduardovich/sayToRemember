// var senBG; // 문장 배경색 저장을 위해

$(document).ready( ()=>{
  var selectedSenNum = $('#senInfo').data('selectedSenNum');// 해당 문장을 클릭하여 열린 페이지
  $('.senTxt').map( (i, sen)=>{
    // 해당 문장을 페이지에서 발견했을 경우
    if ( selectedSenNum == $(sen).data('senNum') ){
      sen = $(sen);
      // senBG = sen.parent().parent().css('background-color');
      sen.parent().parent().css('background-color', '#b2dec5');
      var height = sen.offset().top - (window.innerHeight/2) + sen.height();// 해당 문장이 있는 위치로 스크롤 이동

      setTimeout(() => {
        $('html, body').animate( { scrollTop : height }, 400 );
        // window.scrollTo(0, sen.offset().top);
        // sen.parent().parent().animate({
        //   'background-color': senBG
        // }, 5000);
      
      }, 600);
      
      return;
    }
  })

})