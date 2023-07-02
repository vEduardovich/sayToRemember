const GoogleStrategy    = require('passport-google-oauth2').Strategy; // 꼭 이걸 써야 한다. passport-google-oauth는 failed token이 뜬다 ㅜ 170416
const ip                = require('ip');
const utils             = require('../commons/utils.js');
const utils_db          = require('../commons/utils_db.js');
const useragent     	= require('useragent');

const DB_userAccount    = require('../models/userAccount'); // 회원 계정 DB
const config            = require('../commons/config'); // 설정
const mailOptions = config.mail.mailOptions;
const newMemember = config.mail.newMemember; // 새로 가입한 회원

module.exports = new GoogleStrategy( config.passport.google.setting ,

    async (req, token, tokenSecret, profile, done) => {
        const apiKey          = config.passport.google.apiKey;
        const profileImgKey   = 'https://www.googleapis.com/plus/v1/people/' + profile.id + '?fields=image&key=' + apiKey; // 프로필 이미지

        // 구글에서는 request를 날려 json을 받아 프로필 이미지 주소를 받아온다.
        let email       = profile.emails[0].value;
        DB_userAccount.findOne( { email : email }, ( err, userAccount ) => { // 이미 가입된 유저인지 확인한 후
            const agent = useragent.parse(req.headers['user-agent']);
            const osInfo = agent.os.toString() + agent.device.toString() + agent.family.toString();

            const userTokenVal = utils.sha256(utils.uid(16));
            const userToken = { os_Info : osInfo , tokenVal : userTokenVal, ip : ip.address(), date : Date.now(), date_txt : utils.getWhen('txtDate') };

            if ( !userAccount ) { // 가입한 적이 없는 유저라면
                console.log('구글에서 받았다');
                let tmpNick = email.split('@')[0];
                let i       = 0;
                tmpNick     = utils.makeNickname(tmpNick, i);

                const nickname = tmpNick;//중복체크가 계속 에러가 나서 일단 이렇게 만든다. 블록체인 완성후 수정하자.

                console.log('profile: ' + profile);
                console.log('nickname: '+ nickname);
                // userStatDB 만들기
                utils_db.makingUserStatDB(nickname);
                
                new DB_userAccount({
                    email           : email,
                    providerID      : profile.id,
                    nickname        : nickname,
                    display_name    : profile.displayName,
                    profile_img     : profile._json.image.url,
                    tokens          : userToken, //  로그인 유지를 위한 token
                    gender          : profile.gender,
                    birthday        : profile.birthday, // format - MM/DD/YYYY
                    ip_address      : ip.address(),
                    createdAt_local : new Date().toLocaleString(),
                    provider        : 'google',
                    counting_signin : 1,
                    stat            : { level : 0, levelScore: 0 },
                    
                }).save( (err, userAccount) => {
                    if ( err ) return console.log(err);
                    if ( !userAccount ) { console.log('userAccount: '+err); return ; }
                    newMemember.html  = '<h3>' + email + ' 계정을 가진 ' + nickname + ' 닉네임의 ' + userAccount.display_name + '라는 유저 가입!</h3>'+ '<br> <img src="' + userAccount.profileImg +'">';

                    mailOptions.to = email;
                    userAccount.welcome = 1; // 회원가입

                    userAccount.os_Info = osInfo;
                    userAccount.userTokenVal = userTokenVal;
                    return done(null, userAccount);
                })
                
            } else { // 이미 회원가입한 유저라면
                userAccount.counting_signin++;
                userAccount.tokens.push( userToken ); // DB에 새로운 token 입력
                userAccount.save();
                userAccount.welcome = 0; // 기존 회원
                
                userAccount.os_Info = osInfo;
                userAccount.userTokenVal = userTokenVal;
                return done(null, userAccount);
            }
        })
    }
);