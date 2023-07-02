const mongoose      = require('mongoose');
const Schema        = mongoose.Schema;

// 유저 통계 DB
const userStatSchema = new Schema({
    nickname        : { type: String, },
    createdAt       : { type: Date, default: Date.now() },
    createdAt_local : { type: String },
    thisYear        : { type: Number },

    level   : { stat : {type: Number}, rank: {type: Number}, ratio : {type:Number} }, // Level
    levelScore: { stat : {type: Number}, rank: {type: Number}, ratio : {type:Number} }, // Level Score

    total   : { stat : {type: Number}, rank: {type: Number}, ratio : {type:Number} }, // Summary > Total
    grit    : { stat : {type: Number}, rank: {type: Number}, ratio : {type:Number} }, // Summary > Grit
    honor   : { stat : {type: Number}, rank: {type: Number}, ratio : {type:Number} }, // Summary > Honor
    intellect:{ stat : {type: Number}, rank: {type: Number}, ratio : {type:Number} }, // Summary > Intellect

    
    info_days           : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Days
    info_sentences      : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Sentencs
    info_letters        : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Letters
    info_played         : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Played
    info_otherPlayed    : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Other played
    info_love           : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Love
    info_beloved        : { count: {type: Number}, avg: {type: Number}, rank: {type: Number}, ratio : {type:Number} },// Detail Information > Beloved
    
    
    category    : { type: Array },// Category
    mostPlayed  : { type: Array },// Most played sentences
    mostBeloved : { type: Array },// Most beloved sentences
    mostStems   : { type: Array },// Most used stems of words
});

const userStat = mongoose.model('userStat', userStatSchema);
module.exports = userStat;
