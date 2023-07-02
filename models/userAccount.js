const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;
const config    = require('../commons/config'); // 설정

// 유저 계정 스키마
const userAccountSchema = new Schema({
    email           : { type: String, require: true, index: { unique: true } },
    providerID      : { type: String }, // 각 provider가 제공하는 id
    tokens          : [ { os_info : String, tokenVal : String , ip : String, date : { type : Date, default: Date.now }, date_txt: String } ], // 로그인 유지를 위한 token
    pwd_sha256      : { type: String },
    salt            : { type: String },
    pwd             : { type: String, require: true },

    nickname        : { type: String, require: true, index: { unique: true } }, // 주소에 쓰이는 이름
    display_name    : { type: String }, // 유저들의 일반적인 이름 (구글이나 페이스북의 프로필 이름)
    profile_img     : { type: String }, // 프로필 이미지 주소
    gender          : { type: String },
    birthday        : { type: Number },
    ip_address      : { type: String }, // 계정 생성시 접속 ip
    createdAt       : { type: Date, default: Date.now(), index: { unique: false } }, // 계정을 생성한 날짜
    createdAt_local : { type: String },
    provider        : { type: String }, // 어느 경로로 가입했는가 local, facebook, google

    // 아래는 계속 변하는 정보
    heart           : { my : [{ sen_id: { type : mongoose.Schema.ObjectId, ref : 'aSentence'},                                               user_nickname : { type: String },
                        createdAt: { type: Date }, createdAt_local : { type: String }  }] ,
                        other : [{ sen_id: { type : mongoose.Schema.ObjectId, ref : 'aSentence'}, user_nickname : { type: String },
                        createdAt: { type: Date }, createdAt_local : { type: String }  }] },  
    counting_signin : { type: Number, default: 0 }, // 유저가 로그인을 총 몇번 했나
    bigGoodBad_list    : [ { type: String }],//배열안에 같은 날의 날짜가 있다면 대뽕/대똥을 사용할 수 없다. strDate사용
    tags            : { type: Array, default: config.defaultTag.tagName },  // 기본 카테고리는 0, ''

    stat            : { level : { type: Number }, levelScore : { type: Number },  }, // Level
});

const userAccount= mongoose.model('userAccount', userAccountSchema);
module.exports = userAccount;