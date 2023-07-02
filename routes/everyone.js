const express       = require('express');
const ip            = require('ip');
const route         = express.Router();
const mongoose      = require('mongoose');
const fs            = require('fs');
const request       = require('request');
const utils         = require('../commons/utils.js');
const config        = require('../commons/config'); // 설정

const DB_aSenByDate  = require('../models/aSenByDate');
const DB_aSentence   = require('../models/aSentence');
const DB_userAccount = require('../models/userAccount'); // 회원 계정 DB

const AWS            = require('aws-sdk');


// 시작화면 - Main
route.get('/', utils.funcIsSignedIn, (req, res) => {
	// 대체 왜 req.isSingedIn 직접 대입이 undefined로 나오는지 이해가 가지 않는다. 누군가에 물어보고 싶다 ㅜㅜ 엄청 고생함. 17.04.18
	res.render('index', {
		tags						: (req.user == undefined) ? '' : req.user.tags, // 내 자신의 tags
		isSignedIn      : req.session.isSignedIn,
		nickname        : req.session.isSignedIn? req.user.nickname : '',
	});
})



module.exports = route;