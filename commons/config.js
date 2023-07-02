module.exports = {
    mode : 'development',
    // mode : 'production',
    port : 8888, // server port
    session: {
        secure: true,
        httpOnly: true,
        secret: 'saytoremember',
        resave: false,
        saveUninitialized: false,
    },
    db: {
        host: '127.0.0.1',
        port: '28028',
        // 노드 18이상이고 몽고6 이상에서는 localhost가 안먹힌다. 127.0.0.1로 바꾼다
        url: 'mongodb://127.0.0.1:28028/SayToRemember',
        out: 'models/db_backup/',
    },
    stats: {
        summary :{
            byDateWeight: 30, loginWeight: 1, honorWeight: 5, iLoveWeight : 2, iPlayedCount: 1, letterCount: 1,
        },
        
        level_criteria : 100, // 레벨업 기준
    },
    mail: {
        mailOptions: {
            from: '"ID" <이메일 주소>',
            to: '', // dumy계정. 새로 가입한 유저 메일주소를 나중에 overriding한다.
            subject: 'Say to Remember의 멤버가 되신걸 환영합니다! ', // Subject line
            // text: 'Hello world 🐴"', // plaintext body
            html: `<h1>환영! 환영! 님 울트라 환영!</h1>
    <h2> 캡숑 캡숑, 언제든</h2> <a href='https://str.himion.com'>Say to remember</a><h2>에서 다시 만날 수 있어요</h2>
    ` // html body
        },
        newMemember : {
            from: '"ID" <이메일 주소>',
            to: '이메일주소', // list of receivers
            subject: '새로운 멤버가 STR에 가입했습니다! ', // Subject line
            html : '',
        },
    },
    showPage: {//say
        page : 1, //유저에게 처음 보여줄 페이지
        byDateStep : 10, // 하루에 보여주는 날짜수
        tagPage : 20, // tag 검색했을 때 보여줄 문장수
    },
    articlePage : {
        page        : 1, //유저에게 처음 보여줄 페이지
        articleStep : 10,//한번에 보여주는 글수
        replyStep   : 3, // 한번에 보여주즌 댓글 수
    },
    searchingTagIdx : {//searchingTagIdx 정리. 클라에서 그에 맞는 연출을 위해(주소복사등)
        say  : undefined, 
        love : 10000,
        tag1 : 1,
        tag2 : 2,
        tag3 : 3,
        articleList : 9000,
        article : 9100,//여기서부터 실제 코드에 적용. 18.10.11
    },
    defaultTag: {
        tagIdx : 0,
        tagName : 'No Category',
    },
    cookie: {
        key: 'saytoremember',
        token: {
            opt12h: {
                maxAge: (1000 * 60 * 60 * 12),
                signed: true,
                httpOnly: true,
            },            
            opt3m: {
                maxAge: (1000 * 60 * 60 * 24 * 90),
                signed: true,
                httpOnly: true,
            },
            opt1y: {
                maxAge: (1000 * 60 * 60 * 24 * 365 * 1 ),
                signed: true,
                httpOnly: true, // true를 하면 browser에서 document.cookie를 쳤을 때 나오지 않는다.
            },
            opt10y: {
                maxAge: (1000 * 60 * 60 * 24 * 365 * 10),
                signed: true,
                httpOnly: true,
            },
        }
    },
    passport: {
        facebook: {
            setting: {
                clientID: 'clientID',
                clientSecret: 'clientSecret',
                callbackURL: 'callbackURL',
                profileFields: ['id', 'emails', 'name', 'displayName',],
            },
            scope: {
                scope: ['public_profile', 'email']
            },
        },
        google: {
            setting: {
                clientID: 'clientID',
                clientSecret: 'clientSecret',
                callbackURL : "callbackURL", // 이건 나중에 실서비스할때 적용하기
                passReqToCallback: true,
            },
            scope: { // id, name, displayName, birthday, relationship, isPerson, isPlusUser, placesLived, language, emails, gender, picture
                scope: ['https://www.googleapis.com/auth/plus.login',
                    'https://www.googleapis.com/auth/plus.profile.emails.read',
                    'https://www.googleapis.com/auth/plus.me',
                    'https://www.googleapis.com/auth/plus.profiles.read'
                ]
            },
            apiKey: 'apiKey', // 구글 API key가 따로 있다. 이것때문에 꽤 고생했다 170416
        }
    },
    apis: {
        // 파파고 번역은 아직 몹시 후지고 이미 엄청 비싸다 18.03.13
        // 기계번역의 품질이 갑자기 떨어져서 파파고 번역으로 변경했다. 18.05.14
        naver: {
            client_id: 'client_id',
            client_secret: 'client_secret',
            api_trans_url: 'https://openapi.naver.com/v1/papago/n2mt', //파파고번역

            client_id_papago: 'client_id_papago', // 파파고용 새계정
            client_secret_papago: 'client_secret_papago', // 파파고용 새계정
            api_tts_url: 'https://naveropenapi.apigw.ntruss.com/voice/v1/tts',


            api_detect_url : 'https://openapi.naver.com/v1/papago/detectLangs', // 언어감지
            speaker_ko : 'mijin', // 한국어
            speaker_en : 'clara', // 영어
            speaker_ja : 'yuri', // 일본어
            speaker_zh_cn : 'meimei', // 중국어 간체
            speaker_zh_tw : 'meimei', // 중국어 번체
            speaker_es : 'jose', // 스페인어

            en: 'en',
            ko: 'ko',
            tts_speaker : 'clara',
            tts_speed: '0',

        },
        aws: {
            bucketName : 'str',
            AWS_authorize: 'public-read',
            AWS_contentType: 'audio/mpeg',
            AWS_contentType_img: 'image/jpeg',
            region : 'ap-northeast-2',
        },
    }
}