const mongoose      = require('mongoose');
const Schema        = mongoose.Schema;
const autoIncrement = require('mongoose-sequence')(mongoose);

// 게시판 DB
const forumSchema = new Schema({
	forum_name      : { type: String, },//게시판 이름
	forum_num				: { type: Number, index: 'hashed' },//게시판 번호
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
	article_num		  : { type: Number },//글번호
	isDeleted				: { type: Boolean, default: false },//글이 삭제된 것인지 확인. 권한때문에.
	title           : { type: String, default: '' },//글제목
	title_deleted   : { type: String, default: '' },//삭제한 글제목
	article         : { type: String },//본문
	article_deleted : { type: String },//삭제한 본문
	count           : { type: Number, default: 0 },//조회수
	reply_count			: { type: Number, default: 0}, //댓글 수. CRUD할때마다 매번 갱신하는게 더 낫다고 판단.
	score           : { good : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}],
											bigGood : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}],
											bad : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}],
											bigBad : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}]},
	public          : { type: Number, default: 1 },//0은 비공개, 1은 모두 공개, 2는 차별 공개

	police          : { count: {type: Number, default: 0 }, //신고
											users : [ {type: mongoose.Schema.ObjectId, ref : 'userAccount'}] },
	is_notice       : { type: Boolean, default: false },//공지

});

forumSchema.plugin( autoIncrement , { inc_field : 'article_num' } );
const forum = mongoose.model('forum', forumSchema);
module.exports = forum;
