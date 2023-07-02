const i18n = require('i18n'); // 다국어 지원 모듈
const config 				= require('../commons/config');


i18n.configure( {
      locales: [ 'kr', 'en' ],
      directory : 'views/langPack',
      defaultLocale: 'kr',
      cookie: 'langPack',
      updateFiles: true,
      autoReload: true,
      register: global
});

// 아래와 같이 해야만 kr이 default로 먹힌다. req.region으로 지역의 언어도 알아낼 수 있다. 위의 defaultLocale은 안먹힌다. 공식 버그다 ㅡ,ㅡ
module.exports = function(req, res, next) {
  i18n.init(req, res, ()=>{
    if(!req.cookies.langPack) res.setLocale('kr');
    // console.log(req.region);
    next();
  });
};