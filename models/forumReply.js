const mongoose      = require('mongoose');
const Schema        = mongoose.Schema;
const autoIncrement = require('mongoose-sequence')(mongoose);

// 게시판 DB
const forumReplySchema = new Schema({
	forum_name      : { type: String, },//게시판 이름
	forum_num		    : { type: Number, index: 'hashed' },//게시판 번호
	user_id         : { type: mongoose.Schema.ObjectId, required: true, ref : 'userAccount' },
	nickname        : { type: String, index: 'hashed' },
	level						: { type: Number },
	ip_address      : { type: String },
	isMobile				: { type: Boolean, default: true },//모바일인지 체크, 화면이 1200보다 작으면 모바일
	createdAt       : { type: Date, default: Date.now() },
	createdAt_txt   : { type: String },// momentJS를 사용할거다. 일반 say페이지와 달리,
	updatedAt       : { type: Date, default: Date.now() },
	updatedAt_txt   : { type: String },
	strDate         : { type: Number },
	reply_num		    : { type: Number },//댓글번호
	main_reply_num	: { type: Number },//댓글의 댓글일 경우 원댓글의 reply_num 정보를 넣는다.
	article_id      : { type: mongoose.Schema.ObjectId, required: true, ref : 'forum' },//글id
	isDeleted				: { type: Boolean, default: false },//글이 삭제된 것인지 확인. 권한때문에.
	replyTxt        : { type: String },//본문
	replyTxt_deleted: { type: String },//삭제한 덧글 본문
	// isMainReply 		: { type: Boolean },//메인 댓글인지 답글인지 확인. true라면 메인댓글
	score           : { good : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}],
											bigGood : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}],
											bad : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}],
											bigBad : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}]},
	public          : { type: Number, default: 1 },//0은 비공개, 1은 모두 공개, 2는 차별 공개

	police          : { count: {type: Number, default: 0 }, //신고
						          users : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}] },

});

forumReplySchema.plugin( autoIncrement , { inc_field : 'reply_num' } );
const forumReply = mongoose.model('forumReply', forumReplySchema);
module.exports = forumReply;
