const mongoose      = require('mongoose');
const Schema        = mongoose.Schema;
const autoIncrement = require('mongoose-sequence')(mongoose);

// 영문 글 스키마
const aSentenceSchema = new Schema({
    sen_num         : { type: Number, index: 'hashed' }, // 해당 글 번호
    user_id         : { type: mongoose.Schema.ObjectId, required: true, ref : 'userAccount' },
    email           : { type: String },
    nickname        : { type: String, index: 'hashed' },
    byDate_id       : { type: mongoose.Schema.ObjectId, ref : 'aSenByDate'},
    ip_address      : { type: String },
    createdAt       : { type: Date, default: Date.now() },
    createdAt_local : { type: String },
    updatedAt       : { type: Date, default: Date.now() },
    updatedAt_local : { type: String },
    strDate         : { type: Number },
    tagIdx          : { type: Number }, // 글이 가지고 있는 tag Index ('', 0, 1, 2)
    mp3             : { type: String }, // mp3 파일명 userID + '/'+ fileName +'.mp3'
    fileName        : { type: String }, // mp3 순수 파일명 fileName + '.mp3'
    heart           : [ { user_id : { type: mongoose.Schema.ObjectId, ref : 'userAccount' }, 
                        user_nickname : { type: String },
                        createdAt : { type: Date },
                        createdAt_local : { type: String } } ], // 단 인덱스 0에는 글 작성자의 id만 들어간다. 만약 null이라면 문장의 소유자는 해당 문장을 heart하지 않은 것이다
    beloved_count   : { type: Number }, // 귀찮아서 beloved count도 db에 넣어놓는다
    is_secret       : { type: Boolean, default: false },
    engTxt          : { type: String, index: 'hashed' }, // 본문 검색을 빠르게 하기 위해 인덱스 설정
    engTxt_word     : { type: Array },
    korTxt          : { type: String },
    lenInfo         : { type: Number, default : 0 }, // 글자수
    clicked         : { type: Number, default : 0 }, // 클릭수
    other_clicked   : { type: Number, default : 0 }, // 다른 사람이 클릭한 수

    rank_played     : { type: Number },// Most played Sentence Rank
    ratio_played    : { type: Number },// Most played Sentence Ratio
    rank_beloved    : { type: Number },// Most beloved Sentence Rank
    ratio_beloved   : { type: Number },// Most beloved Sentence Ratio
    rank_stems      : { type: Number },// Most used stems Rank
    ratio_stems     : { type: Number },// Most used stems Ratio
});

aSentenceSchema.plugin( autoIncrement , { inc_field : 'sen_num' } );
const aSentence = mongoose.model('aSentence', aSentenceSchema);
module.exports = aSentence;
