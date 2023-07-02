const LocalStrategy     = require('passport-local').Strategy;
const ip                = require('ip');
const bkfd2Password     = require("pbkdf2-password"); // 비밀번호 암호화 모듈
const hasher            = bkfd2Password();
const useragent     	= require('useragent');

const utils             = require('../commons/utils');
const DB_userAccount    = require('../models/userAccount'); // 회원 계정 DB

module.exports = new LocalStrategy(
    { usernameField : 'inputEmail', passwordField : 'inputPwd', passReqToCallback : true },
    (req, inputEmail, inputPwd, done ) => {
        let pwd_sha256ed = utils.sha256(inputPwd);
        DB_userAccount.findOne( { email : inputEmail }, (err, userAccount)=>{ // 일치하는 email을 찾은 후
            if ( err ) return done(err);
            // 아래와 같이 pwd_sha256와 salt를 함께 주어야만 처음 계정 생성시 만든 hash와 동일한 값이 나온다.
            if ( !userAccount ) { return done(null, false, { message: 'Incorrect username.' }); }
            const agent = useragent.parse(req.headers['user-agent']);
            const osInfo = agent.os.toString() + agent.device.toString() + agent.family.toString();

            const userTokenVal = utils.sha256(utils.uid(16));
            const userToken = { os_info : osInfo , tokenVal : userTokenVal, ip : ip.address(), date : Date.now(), date_txt : utils.getWhen('txtDate') };

            hasher( { password : pwd_sha256ed, salt : userAccount.salt }, (err, pass, salt, hash)=> {
                if( userAccount.pwd === hash ) { // email 과 pwd 모두 일치했다면
                    console.log('로컬 로그인 성공!');
                    console.log(userAccount._id);

                    userAccount.counting_signin++;
                    userAccount.tokens.push( userToken ); // DB에 새로운 token 입력
                    userAccount.save();

                    userAccount.os_info = osInfo;
                    userAccount.userTokenVal = userTokenVal;
                    return done(null, userAccount);
                } else {
                    console.log('로그인 실패!');
                    return done(null, false, {message: 'Incorrect password'});
                }
            })
        })
    }
);