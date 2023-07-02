const http 					= require('http');
const express 			= require('express');
const bodyParser 		= require('body-parser');
const cookieParser 	= require('cookie-parser');
const forceDomain 	= require('forcedomain'); // www로 들어온 주소를 non-www로 redirect
const session 			= require('express-session');
const app 					= express();
const server 				= http.createServer(app);

											require('./commons/db');
const config 				= require('./commons/config');
const timeInterval 	= require('./commons/timeInterval');
const i18n					= require('./commons/i18n');

// Middle-wares
process.env.NODE_ENV = config.mode;
timeInterval.dbSetting(); // 1시간 간격으로 DB백업
app.locals.pretty = true;
app.use(express.static('public'));
app.use(bodyParser.urlencoded({	extended: true }));
app.use(cookieParser(config.cookie.key));
app.use(session(config.session));
app.use(i18n);

// passport
const passport = require('./passport/passport');
app.use(passport.initialize());
app.use(passport.session());

// view engine
app.set('view engine', 'jade');
app.set('views', './views');

// routes
app.use(forceDomain({	hostname: 'str.himion.com' }));

app.use('/sign', require('./routes/sign')); // sign up/in/out/pwd 회원관련 처리
app.use('/f', require('./routes/forum/forum')); // forums 게시판
app.use('/', require('./routes/say/say')); // Main Page
app.all('*', (req, res) => {
	res.render('error/default');
});
// server start!
app.set('port', process.env.PORT || config.port);
server.listen(app.get('port'), (err) => {
	console.log('Connected Server 127.0.0.1:'+app.get('port'));
})