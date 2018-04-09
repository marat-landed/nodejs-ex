//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

//console.log("port:",port,"ip:",ip,"mongoURL:",mongoURL,"mongoURLLabel:",mongoURLLabel);
//console.log("process.env:",process.env);

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;

  }
} else if (mongoURL == null && process.env.DATABASE_SERVICE_NAME == null) {
  mongoURL = 'mongodb://localhost/db_nodejs_ex';
}

var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;
  
  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts'); // доступ к базе
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/remove', function (req, res) {
  // try to initialize the db on every request if it's not already initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts'); // доступ к базе
    col.remove({},function(err,numberRemoved){
      res.send("inside remove call back" + numberRemoved);	
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

var str = "";
app.get('/stat', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts'); // доступ к базе
    // Create a document with request IP and current time of request
    //col.insert({ip: req.ip, date: Date.now()});
	var myobj = {ip: req.ip, date: Date.now()};
	  
	col.insertOne(myobj, function(err, res2) {
	  if (err) throw err;
	  //console.log("1 document inserted");
	  // Get all the records in the test collection
	  col.find({}).toArray(function(err, result) {
		if (err) throw err;
		str="<table border='1' cellpadding='7' style='border-collapse: collapse;'>";
		str+="<tr>";
		str+="<th>ID</th>";  
		str+="<th>IP</th>";
		str+="<th>DATE</th>";
		str+="</tr>";  
		result.forEach(function(it, i, result) { 
		  str+="<tr>";	
		  for (var key in it) {
		    if (it.hasOwnProperty(key)) {
			  if(key=='date') {  
			    var formatdate = timestamp_to_formatdate (it[key]); 
				str+="<td>"+formatdate+"</td>";  
			  } else {
				str+="<td>"+it[key]+"</td>";  
			  }	
		    }
		  }
		  str+="</tr>";		
		})
		str+="</table>";
		res.send(str);
	  }); // find	
	}); // insert 
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error("err.stack:",err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;

function timestamp_to_formatdate (unix_timestamp) {
  var dateTime = new Date(unix_timestamp);
  var formatted = dateTime.toISOString();;	
  return formatted;
  var year = date.getFullYear();
  var month = date.getMonth();
  var date = date.getDate();	
  // Hours part from the timestamp
  var hours;// = date.getHours();
  // Minutes part from the timestamp
  var minutes = "0" + date.getMinutes();
  // Seconds part from the timestamp
  var seconds = "0" + date.getSeconds();
  // Will display time in 10:30:23 format
  var formattedTime = date + "-" + month + "-" + year + " " + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);	
  return formattedTime;	
}	
