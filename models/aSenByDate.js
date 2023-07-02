const mongoose      = require('mongoose');
const Schema        = mongoose.Schema;
const autoIncrement = require('mongoose-sequence')(mongoose);

// 같은 날짜의 영문 그룹 스키마
const aSenByDateSchema = new Schema({
    byDate_num      : { type: Number, index: 'hashed' }, // 해당 날짜 번호
    user_id         : { type: mongoose.Schema.ObjectId, required: true, ref : 'userAccount' }, // userAcoount 컬렉션과 연결. 책 p600의 popultate('userAccout')
    email           : { type: String},
    nickname        : { type: String, index: 'hashed' },
    createdAt       : { type: Date, default: Date.now() },
    createdAt_local : { type: String },
    strDate         : { type: Number },
    strDateTxt      : { type: String },  
    count           : { type: Number, default: 0 },
    aSen_ids        : { type: Array }, // aSentence 문장들
    mp3s            : { type: Array },
    total_clicked   : { type: Number, default : 0 }, // 문장 재생 총 클릭 수
    total_other_clicked : { type: Number, default : 0 }, // 다른 사람이 문장 재생한 총 클릭 수
    senSort         : { type: Boolean, default : true },
});

aSenByDateSchema.plugin( autoIncrement , { inc_field : 'byDate_num' } );
const aSenByDate = mongoose.model('aSenByDate', aSenByDateSchema);
module.exports = aSenByDate;