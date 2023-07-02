const passport          = require('passport');
const DB_userAccount    = require('../models/userAccount'); // 회원 계정 DB

passport.serializeUser( (userAccount, done)=>{
    done(null, userAccount.id ); // userID 세션을 저장한다. _id로 넣지 않고 그냥 id로 넣어도 정상적인 id 값을 참조하더라.
})
passport.deserializeUser( (id, done)=> { // 웹 페이지에 접속할때마다 deserializeUser만 실행된다. session에는 user가 들어간다. user는 userAccount다.
    DB_userAccount.findById(id, (err, userAccount)=> {
        done(err, userAccount);
    })
})

passport.use( 'google', require('./google') ); // 구글 회원가입 및 로그인
passport.use( 'facebook', require('./facebook') ); // 페이스북 회원가입 및 로그인
passport.use( 'local_signup', require('./local_signup') ); // 회원가입 -local
passport.use( 'local_signin', require('./local_signin') ); // 로그인 - local

module.exports = passport;
