var express = require('express');
var Search = require('bing.search');
var mongo = require('mongodb').MongoClient;
var JSONStream = require('JSONStream')
var mongoURL = 'mongodb://localhost:27017/image-search';
var fs = require('fs');

var search = new Search('APP');

var app = express();

app.get('/image-search/', function(req, res) {
  res.writeHead(200, { 'content-type': 'text/html' })
  var fileStream = fs.createReadStream('./public/index.html');
  fileStream.pipe(res);
});

app.get('/image-search/latest', function(req, res) {
  mongo.connect(mongoURL, function(err, db) { 
      if(!err) {
          var terms = db.collection("terms");
          terms.find({},{_id:0}, function(err, data) {
             if(!err && data) {
                 data.stream().pipe(JSONStream.stringify()).pipe(res);
             } 
          });
      }
  });
});

app.get('/image-search/*', function(req, res) {
    var value = req.params[0];
    var offset = req.query.offset;
    var rows = 10;
    var page = 0;
    mongo.connect(mongoURL, function(err, db) { 
        if(!err) {
            var terms = db.collection("terms");
            terms.insert({term:value, when:new Date()});
        }
    });
    if (offset) {
        rows = 10*parseInt(offset);
        page = rows - 10;
    }
    search.images(value,
      {top: 10, skip: page, adult:0},
      function(err, results) {
          if(!err) {
              var data = [];
              for(var i=0;i<results.length;i++) {
                  data[i] = {};
                  data[i]["url"] = results[i].url;
                  data[i]["snippet"] = results[i].title;
                  data[i]["thumbnail"] = results[i].thumbnail.url;
                  data[i]["context"] = results[i].sourceUrl;
              }
          }
            res.send(JSON.stringify(data));
      }
    );
});

app.listen(8080, function() {
  console.log('Image Search Server listening on port 8080!');
});
