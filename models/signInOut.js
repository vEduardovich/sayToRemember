const mongoose  = require('mongoose');
const Schema    = mongoose.Schema;

// 로그인 관리
const signInOutSchema = new Schema({
    user_id             : { type: mongoose.Schema.ObjectId, index: { unique: false }, ref : 'userAccount' }, // userAccount의 _id
    user_email          : { type: String },
    user_nickname       : { type: String },
    user_display_name   : { type: String },
    os_info             : { type: String },// 해당 id가 가진 os+ device + browser 가 조합된 정보
    tokenVal            : { type: String }, // 같은 기기라도 브라우저마다 따로 접근할 수 있기 때문에 token을 발행하여 구별한다
    isAlwaysSignIn      : { type: Boolean }, // 항상로그인이 아닐 경우 로그아웃 정보가 없더라도 컴퓨터 종료시 자동 로그아웃 되었다고 생각할 수 있다
    gender              : { type: String },
    birthday            : { type: String },
    provider            : { type: String },
    ip_address          : { type: String }, // 로그인했을 때 IP
    signin_time         : { type: Date }, // 로그인한 시간
    signin_time_txt     : { type: String },
    signout_time        : { type: Date }, // 로그아웃한 시간
    signout_time_txt    : { type: String }, // 로그아웃한 시간
})

const signInOut = mongoose.model('signInOut', signInOutSchema);
module.exports = signInOut;