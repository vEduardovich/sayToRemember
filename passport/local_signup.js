const LocalStrategy     = require('passport-local').Strategy;
const ip                = require('ip');
const bkfd2Password     = require("pbkdf2-password"); // 비밀번호 암호화 모듈
const hasher            = bkfd2Password();
const useragent     	= require('useragent');

const utils             = require('../commons/utils.js');
const utils_db          = require('../commons/utils_db.js');
const DB_userAccount    = require('../models/userAccount'); // 회원 계정 DB

const config            = require('../commons/config'); // 설정

const mailOptions = config.mail.mailOptions;
const newMemember = config.mail.newMemember; // 새로 가입한 회원

module.exports = new LocalStrategy(
    { usernameField : 'inputEmail', passwordField : 'inputPwd', passReqToCallback : true },
    (req, inputEmail, inputPwd, done ) => {

        if ( inputEmail.indexOf('@') == -1 || inputEmail.indexOf('.') == -1) return done(null, false, { message: 'Not valid email format.' });
        if ( inputPwd.length < 8 ) return done(null, false, { message: '8 than less characters' });

        DB_userAccount.findOne( { email : inputEmail }, (err, userAccount)=>{ // 일치하는 email을 찾은 후
            if ( err ) return done(err);
            if ( userAccount ) return done(null, false, { message: 'Incorrect username.' });
            console.log('여긴들어온거?3');

            const email   = inputEmail;
            const pwd     = utils.sha256(inputPwd); // 비밀번호를 먼저 sha256으로 암호화 한 후 뒤에 hasher로 2중 암호화 한다.
            
            // 1. 먼저 해당 닉네임이 5자 미만일 경우 랜덤값을 붙여 4자 이상을 만든 후 해당 닉넴이 기존 닉넴 중복되는지 확인
            // 2. 중복 된다면 뒤에 한자리 더 랜덤값을 붙인 후 다시 중복 체크(반복)
            // 3. 더 이상 중복 되지 않는다면 해당 닉넴 고정
            // 4. 만약 글자가 4자 이상이고 중복되는 값이 없다면 닉넴 그대로 계정 만들어주기.
            // *****해결
            // 1. 중복될때까지 nickname을 만드는 것은 재귀함수로 했다.
            // 2. mongoose는 bluebird를 사용하지 않고 기본 built-in 되어 있는 promise를 사용했다. 이것 꽤 좋다.

            let tmpNick = email.split('@')[0];
            let i       = 0;
            tmpNick     = utils.makeNickname(tmpNick, i);

            // 중복되지 않는 닉넴을 가지고 최종 계정을 생성하는 모듈
            utils.decideNickname( tmpNick, i, (nickname)=>{
                // console.log('최종 nickname: '+ nickname);
                hasher( { password : pwd }, (err, pass, salt, hash)=> {
                    // userStatDB 만들기
                    utils_db.makingUserStatDB(nickname);
                    const agent = useragent.parse(req.headers['user-agent']);
                    const osInfo = agent.os.toString() + agent.device.toString() + agent.family.toString();
                    
                    const userTokenVal = utils.sha256(utils.uid(16));
                    const userToken = { os_Info : osInfo , tokenVal : userTokenVal, ip : ip.address(), date : Date.now(), date_txt : utils.getWhen('txtDate') };

                    new DB_userAccount({
                        email           : email,
                        pwd_sha256      : pass, // 이미 sha256으로 암호화한 password.
                        salt            : salt, // 이 password를 pbkdf2-password로 salt 친 후
                        pwd             : hash, // 한번 더 암호화해서 나온 password가 바로 hash이다.
                        nickname        : nickname,
                        tokens          : userToken, //  로그인 유지를 위한 token
                        gender          : req.body.gender || 'sexless',
                        birthday        : req.body.inputBirthYear,
                        ip_address      : ip.address(),
                        createdAt_local : new Date().toLocaleString(),
                        provider        : 'local',
                        counting_signin : 1,
                        stat            : { level : 0, levelScore: 0 },
                        
                    }).save( (err, userAccount) => {
                        if ( !userAccount ) { console.log('userAccount: '+err); return ; }
                        newMemember.html  = '<h3>' + email + ' 계정을 가진 ' + nickname + ' 닉네임의 ' + userAccount.display_name + '라는 유저 가입!</h3>';
    
                        mailOptions.to = email;
                        req.login(userAccount, (err)=>{ // 회원가입 후 동시에 로그인을 시켜준다.
                            if (err) return console.log(err);
                            userAccount.os_Info = osInfo;
                            userAccount.userTokenVal = userTokenVal;
                            userAccount.isAlwaysSignIn = req.body.isAlwaysSignIn;//session이 아니라 body
                            return done(null, userAccount);

                        })
                    })
                })
            })
        });
    }
);
