//  OpenShift sample Node application
// Cron 11-04-2018
var mongodb = require('mongodb');
var mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL;

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD'],
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
} else if (mongoURL == null && process.env.DATABASE_SERVICE_NAME == null) {
  mongoURL = 'mongodb://127.0.0.1:27017/db_nodejs_ex';
}

var initDb = function(callback) {
  mongodb.connect(mongoURL, function(err, db) {
    if (err) {
      callback(err);
      return;
    }
    //console.log('Connected to MongoDB at: %s', mongoURL);
	var col = db.collection('counts'); // доступ к базе
    col.insertOne({ip: '0.0.0.0', date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
	  console.log('count:',count);
    });
	db.close();
  });
};

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});