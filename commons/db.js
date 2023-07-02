const mongoose  = require('mongoose');
const config    = require('./config');
const database  = mongoose.connection;
const databaseURL = config.db.url;

mongoose.Promise = global.Promise; // DeprecationWarning 제거
mongoose.set('useCreateIndex', true);//DeprecationWarning: collection.ensureIndex is deprecated. 아래 2개도 마찬가지.
mongoose.set('useFindAndModify', false);
mongoose.set('useNewUrlParser', true);
mongoose.connect( databaseURL, { useNewUrlParser: true } ); // DeprecationWarning 제거
database.on('error', console.error.bind(console, 'mongoose connection error!'));
database.once('open', ()=> {
    console.log('Success! mongoose connected : ' + databaseURL);
})