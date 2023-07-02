const FacebookStrategy  = require('passport-facebook').Strategy;
const ip                = require('ip');
const useragent     	= require('useragent');

const utils             = require('../commons/utils.js');
const utils_db          = require('../commons/utils_db.js');

const DB_userAccount    = require('../models/userAccount'); // 회원 계정 DB
const config            = require('../commons/config'); // 설정

const mailOptions = config.mail.mailOptions;
const newMemember = config.mail.newMemember; // 새로 가입한 회원

// 회원가입 - local - 직접 가입할 경우 display_name을 입력하지 않는다. 나중에 개인정보 수정에서 추가한다.
module.exports = new FacebookStrategy( config.passport.facebook.setting ,

    (accessToken, refreshToken, profile, done) => { //★ passport 안에서는 session이나 req.XXX 가 뽑히지 않는구나.. 17.04.22
        // 확인해 보니 최근 req에 accessToken 이 들어오고 accessToken은 undefined다. 
        // 그래서 req.session을 사용하지 않고 user에 welcome을 넣어 처리한다. It's more nicely!

        let email       = profile.emails[0].value;
        DB_userAccount.findOne( { email : email }, ( err, userAccount ) => { // 이미 가입된 유저인지 확인한 후

            // facebook에서 req를 지원하지 않아 사용을 못한다 18.10.26 구글과 다르니 유의하자.
            const osInfo = 'facebook';

            const userTokenVal = utils.sha256(utils.uid(16));
            const userToken = { os_Info : osInfo , tokenVal : userTokenVal, ip : ip.address(), date : Date.now(), date_txt : utils.getWhen('txtDate') };

            if ( !userAccount ) { // 가입한 적이 없는 유저라면
                let tmpNick = email.split('@')[0];
                let i       = 0;
                tmpNick     = utils.makeNickname(tmpNick, i);

                // 중복되지 않는 닉넴을 가지고 최종 계정을 생성하는 모듈
                utils.decideNickname( tmpNick, i, (nickname)=>{
                    let profileImg  = 'https://graph.facebook.com/' + profile.id + '/picture?type=square'; // large / normal / small /square
                    // userStatDB 만들기
                    utils_db.makingUserStatDB(nickname);
                    new DB_userAccount({
                        email           : email,
                        providerID      : profile.id,
                        nickname        : nickname,
                        display_name    : profile.displayName,
                        profile_img     : profileImg,
                        tokens          : userToken, //  로그인 유지를 위한 token
                        gender          : profile.gender,
                        birthday        : profile.birthday, // format - MM/DD/YYYY
                        ip_address      : ip.address(), // 이유는 모르겠지만 ip.address()가 여기 페이스북 함수에만 들어오지 않는다. 이제 모듈을 사용함.
                        createdAt_local : new Date().toLocaleString(),
                        provider        : 'facebook',
                        counting_signin : 1,
                        stat            : { level : 0, levelScore: 0 },

                    }).save( (err, userAccount) => {
                        if ( err ) return console.log(err);
                        if ( !userAccount ) { console.log('userAccount: '+err); return ; }

                        newMemember.html  = '<h3>' + email + ' 계정을 가진 ' + nickname + ' 닉네임의 ' + userAccount.display_name + '라는 유저 가입!</h3>'+ '<br> <img src="' + profileImg +'">';
                        mailOptions.to = email;

                        userAccount.welcome = 1; // 회원가입

                        // DB_signInOut에서 처리할 데이터를 userAccount에 담아 넘긴다. 그리고 여기에 있던 DB_signInOut을 sign.js로 이동시킨다. 왜냐면 session이 먹히지 않아 isAlwaysSignIn 데이터를 확인할 수 없기 때문이다.
                        console.log('osInfo: '+osInfo);
                        userAccount.os_Info = osInfo;
                        userAccount.userTokenVal = userTokenVal;
                        return done(null, userAccount);                        
                    })
                })

            } else { // 이미 회원가입한 유저라면
                userAccount.counting_signin++;
                userAccount.tokens.push( userToken ); // DB에 새로운 token 입력
                userAccount.save();
                userAccount.welcome = 0; // 기존 회원
                
                // DB_signInOut에서 처리할 데이터를 userAccount에 담아 넘긴다. 그리고 여기에 있던 DB_signInOut을 sign.js로 이동시킨다. 왜냐면 session이 먹히지 않아 isAlwaysSignIn 데이터를 확인할 수 없기 때문이다.
                console.log('osInfo: '+osInfo);
                userAccount.os_Info = osInfo;
                userAccount.userTokenVal = userTokenVal;
                return done(null, userAccount);
            }
        })
    }
);