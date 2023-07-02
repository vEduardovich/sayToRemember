var noTagIdx = 0;
var noTagName = 'No Category';

// Bootstrap js importing. isAlwaysLogin 버튼 처리
+function(a){"use strict";function b(b){return this.each(function(){var d=a(this),e=d.data("bs.toggle"),f="object"==typeof b&&b;e||d.data("bs.toggle",e=new c(this,f)),"string"==typeof b&&e[b]&&e[b]()})}var c=function(b,c){this.$element=a(b),this.options=a.extend({},this.defaults(),c),this.render()};c.VERSION="2.2.0",c.DEFAULTS={on:"On",off:"Off",onstyle:"primary",offstyle:"default",size:"normal",style:"",width:null,height:null},c.prototype.defaults=function(){return{on:this.$element.attr("data-on")||c.DEFAULTS.on,off:this.$element.attr("data-off")||c.DEFAULTS.off,onstyle:this.$element.attr("data-onstyle")||c.DEFAULTS.onstyle,offstyle:this.$element.attr("data-offstyle")||c.DEFAULTS.offstyle,size:this.$element.attr("data-size")||c.DEFAULTS.size,style:this.$element.attr("data-style")||c.DEFAULTS.style,width:this.$element.attr("data-width")||c.DEFAULTS.width,height:this.$element.attr("data-height")||c.DEFAULTS.height}},c.prototype.render=function(){this._onstyle="btn-"+this.options.onstyle,this._offstyle="btn-"+this.options.offstyle;var b="large"===this.options.size?"btn-lg":"small"===this.options.size?"btn-sm":"mini"===this.options.size?"btn-xs":"",c=a('<label class="btn">').html(this.options.on).addClass(this._onstyle+" "+b),d=a('<label class="btn">').html(this.options.off).addClass(this._offstyle+" "+b+" active"),e=a('<span class="toggle-handle btn btn-default">').addClass(b),f=a('<div class="toggle-group">').append(c,d,e),g=a('<div class="toggle btn" data-toggle="toggle">').addClass(this.$element.prop("checked")?this._onstyle:this._offstyle+" off").addClass(b).addClass(this.options.style);this.$element.wrap(g),a.extend(this,{$toggle:this.$element.parent(),$toggleOn:c,$toggleOff:d,$toggleGroup:f}),this.$toggle.append(f);var h=this.options.width||Math.max(c.outerWidth(),d.outerWidth())+e.outerWidth()/2,i=this.options.height||Math.max(c.outerHeight(),d.outerHeight());c.addClass("toggle-on"),d.addClass("toggle-off"),this.$toggle.css({width:h,height:i}),this.options.height&&(c.css("line-height",c.height()+"px"),d.css("line-height",d.height()+"px")),this.update(!0),this.trigger(!0)},c.prototype.toggle=function(){this.$element.prop("checked")?this.off():this.on()},c.prototype.on=function(a){return this.$element.prop("disabled")?!1:(this.$toggle.removeClass(this._offstyle+" off").addClass(this._onstyle),this.$element.prop("checked",!0),void(a||this.trigger()))},c.prototype.off=function(a){return this.$element.prop("disabled")?!1:(this.$toggle.removeClass(this._onstyle).addClass(this._offstyle+" off"),this.$element.prop("checked",!1),void(a||this.trigger()))},c.prototype.enable=function(){this.$toggle.removeAttr("disabled"),this.$element.prop("disabled",!1)},c.prototype.disable=function(){this.$toggle.attr("disabled","disabled"),this.$element.prop("disabled",!0)},c.prototype.update=function(a){this.$element.prop("disabled")?this.disable():this.enable(),this.$element.prop("checked")?this.on(a):this.off(a)},c.prototype.trigger=function(b){this.$element.off("change.bs.toggle"),b||this.$element.change(),this.$element.on("change.bs.toggle",a.proxy(function(){this.update()},this))},c.prototype.destroy=function(){this.$element.off("change.bs.toggle"),this.$toggleGroup.remove(),this.$element.removeData("bs.toggle"),this.$element.unwrap()};var d=a.fn.bootstrapToggle;a.fn.bootstrapToggle=b,a.fn.bootstrapToggle.Constructor=c,a.fn.toggle.noConflict=function(){return a.fn.bootstrapToggle=d,this},a(function(){a("input[type=checkbox][data-toggle^=toggle]").bootstrapToggle()}),a(document).on("click.bs.toggle","div[data-toggle^=toggle]",function(b){var c=a(this).find("input[type=checkbox]");c.bootstrapToggle("toggle"),b.preventDefault()})}(jQuery);
// # sourceMappingURL=bootstrap-toggle.min.js.map


// Gender 클릭했을 때
$(document).ready(function () {
  // Always Sign in : true or false 확인
  $("div[data-toggle='toggle']").click(function () {
    if ($(this).hasClass('off')) {
      $('#isAlwaysSignIn').prop('value', 'true');
    } else {
      $('#isAlwaysSignIn').prop('value', 'false');
    }
  })
  
  $("a[data-toggle='gender']").click(function () {
    if ($(this).hasClass('male')) {
      $('#genderInfo').prop('value', 'male');
    } else {
      $('#genderInfo').prop('value', 'female');
    }
    $('.gender').removeClass('active');
    $(this).addClass('active');
  })   
  
  // 설정된 언어가져오기
  var lang = langPack();
  tooltipShow();// pc화면에서만 툴팁 제공.
  
  $('#signinGoogle').click(function () {
    console.log("$('#isAlwaysSignIn').val() :" + $('#isAlwaysSignIn').val());
    location.href = '/sign/in/google?isAlwaysSignIn=' + $('#isAlwaysSignIn').val();
    // ajax는 데이터를 보낼때만 사용하자. 무언가에 걸려서 안된다. 단순 redirect는 locaion.href를 사용하자. Window.open()도 가능.
    // 안되는 이유를 알았다. oauth에서 구글 사용자 계정 선택화면이 떠야하는데 ajax를 사용하니가 fail to load가 떠서 안되는 거다.
  })

  // 페이스북으로 로그인
  $('#signinFacebook').click(function () {
    console.log("$('#isAlwaysSignIn').val() :" + $('#isAlwaysSignIn').val());
    location.href = '/sign/in/facebook?isAlwaysSignIn=' + $('#isAlwaysSignIn').val();
  })
  

  // pc화면에서만 툴팁 제공.
  function tooltipShow(){
    var isAlwaysSignIn = $('#isAlwaysSignIn');
    // 모바일 일때는 항상로그인이 기본이고 PC에서는 항상로그인 OFF를 기본값으로 한다.
    if (window.innerWidth > 1024){
      // 툴팁 설정. tooltipUp이란 클래스가 있는 모든 obj에 툴팁을 붙인다. tooltip은 bootstrap을 사용한다
      $('.tooltipUp').tooltip();
      isAlwaysSignIn.bootstrapToggle('off')
      isAlwaysSignIn.attr('value','false');
    }else{
      console.log('화면보다 작아!');
      $('.tooltipUp').tooltip('hide'); // 툴팁 hide시키고
      isAlwaysSignIn.bootstrapToggle('on');
      isAlwaysSignIn.attr('value','true');
    }
    $('#inputEmailSignUp').focus(); // id 입력창 포커스
  }



  // 일치하는 ID찾고 없으면 메시지 띄우기
  function ajaxCheckID(){
    var inputEmail = $('#inputEmail');
    console.log('inputEmail: '+ $('#inputEmail').val());
    
    $.ajax({
      type: 'POST',
      url: '/sign/in',
      data: { 
        inputEmail: inputEmail.val(), 
        isAlwaysSignIn : $('#isAlwaysSignIn').val(),
      },
      success: function(d){
        if (d.status == 406){
          console.log('성공확인2: '+ d.status);
          inputEmail.next().text(lang.jsNotFoundAccount);
          // 아래와 같이 팝업창으로 처리할 수도 있다
            // $.magnificPopup.open({
            //   items: {
            //     src: '#msgFindID',
            //     type: 'inline',
            //   },
            //   alignTop: window.innerWidth < 680 , // 화면해상도에 맞춰 popup align 결정
            //   fixedContentPos: true,

              // callbacks: {
                // open: function () {
                  // console.log('창열림');
                  
                  // $.magnificPopup.instance.close = function () {
        
                    // $.magnificPopup.proto.close.call('#msgFindID');
                    // if (!confirm('Are you sure?')) {
                    // 	return;
                    // }
                    // $.magnificPopup.proto.close.call(this);
                  // };
                // },
              // }
            // })

        } else{
          location.href='/sign/in/pwd';
        }
      }
    }); 
  }
  $('#inputEmail').on('keydown', function(e){
    if(e.keyCode == 13){
      ajaxCheckID();
    }
  })
  $('#signinNext').click(function(){
    ajaxCheckID();
  })


  // password가 일치하는지 확인 후 메시지 띄우기
  function ajaxCheckPassword(){
    var inputPwd = $('#inputPwd');

    $.ajax({
      type: 'POST',
      url: '/sign/in/pwd',
      data: { 
        inputEmail: inputPwd.prev().val(),
        inputPwd  : inputPwd.val(),
      },
      success: function(d){
        console.log(d);
        if(d.nickname){
          location.href= '/'+ d.nickname;
        }else{
          console.log('비밀번호 불일치');
          inputPwd.next().text(lang.jsMsgWrongPwd);
        }
      }
    }); 
  }
  $('#inputPwd').on('keydown', function(e){
    if(e.keyCode == 13){
      ajaxCheckPassword();
    }
  })
  $('#signinSubmit').click(function(){
    ajaxCheckPassword();
  })


  // 회원가입. 기존 ID가 있는지 확인한다. 중복이 아니라면 통과.
  function ajaxSignUp(){
    var inputEmail = $('#inputEmailSignUp');
    var inputPwd = $('#inputPwdSignUp');
    // 초기화
    inputEmail.css('border','1px solid #ccc');
    inputPwd.css('border','1px solid #ccc');
    inputEmail.next().text('');
    inputPwd.next().css('color','#555');
    inputPwd.next().text('');

    
    // 이메일 체크
    if (inputEmail.val().indexOf('@') == -1 || inputEmail.val().indexOf('.') == -1){
      inputEmail.css('border-color','#d65e5e')
      inputEmail.next().css('border-color','#d65e5e');
      // inputEmail.next().text(`Not valid email format.`);
      inputEmail.next().text(lang.jsMsgNotValidFormat);
    } else // 비밀번호 길이 체크
    if (inputPwd.val().length < 8){
      inputPwd.next().css('color','#d65e5e');
      inputPwd.css('border-color','#d65e5e');
      // inputPwd.next().text(`character: ${inputPwd.val().length}, Use 8 or more characters.`);
      inputPwd.next().text(lang.jsMsgChar + inputPwd.val().length + lang.jsMsgMoreChar);
    } else {
      $.ajax({
        type: 'POST',
        url: '/sign/up',
        data: { 
          inputEmail: inputEmail.val(),
          inputPwd  : inputPwd.val(),
          gender    : $('#genderInfo').val(),
          inputBirthYear  : $('#inputBirthYear').val(),
          isAlwaysSignIn  : $('#isAlwaysSignIn').val(),
        },
        success: function(d){
          if(d.nickname){
            function makingFirstSentence() {
              $.ajax({
                type: 'POST',
                url: '/tts',
                data: {
                  nickname: d.nickname,
                  engTxt: "Welcome to SayToRemember!",
                  lenInfo: 25, // 글자수
                  tagIdx: noTagIdx,
                  tagName : noTagName,
                },
                success: function (data) {
                  location.href= '/'+ d.nickname;
                  setCookie('tagIdx',noTagIdx,365);
                  setCookie('tagName',noTagName ,365);
                }
              });
            };

            makingFirstSentence();

          }else{
            console.log('ID 중복');
            inputEmail.css('border-color','#d65e5e');
            inputEmail.next().text(lang.jsMsgEmailTaken);
          }
        }
      }); 
    }

  }
  $('#signUpSubmit').click(function(){
    ajaxSignUp();
  })

  // 비밀번호 8자리 이상 체크
  $('#inputPwdSignUp').on('keyup', function(e){
    var inputPwd= $('#inputPwdSignUp');
    if( inputPwd.val().length < 8 ){
      inputPwd.css('border-color','#d65e5e');
      inputPwd.next().css('color','#d65e5e');
      // inputPwd.next().text(`character: ${inputPwd.val().length}, Use 8 or more characters.`);
      inputPwd.next().text(lang.jsMsgChar + inputPwd.val().length+ lang.jsMsgMoreChar);
    } else {
      inputPwd.css({
        'border-color': 'rgba(106, 199, 88, 0.8)'
      });
      inputPwd.next().css('color','green');
      inputPwd.next().text(lang.jsMsgOK);
    }
  })
})


