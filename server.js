var express = require('express');
var url = require('url');
var validUrl = require('valid-url');
var path = require('path');
var bodyParser = require('body-parser');
var app = express();
var mongoose = require('mongoose');
var Url = require('./db');
require('dotenv').config();

mongoose.Promise = global.Promise;
var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };
mongoose.connect(process.env.PROD_MONGODB,options);

var conn = mongoose.connection;

conn.on('error',console.error.bind(console,'connection error'));
conn.once('open',function(){
  console.log('Connected to DB');
})

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'views')));

var port = process.env.PORT||8080;

app.get('/',function(req,res){
    res.render('index');
});

app.get('/shorten/*',function(req,res){
    var passedUrl = req.params[0];
    var encodedUrl = '';
    if(validUrl.isHttpUri(passedUrl)||validUrl.isHttpsUri(passedUrl)){
    Url.findOne({longUrl:passedUrl},function(err,doc){
      if(err) console.error(err);
      if(doc){
        encodedUrl = process.env.host +'/short/' + encode(doc._id);
        res.send({'originalurl':passedUrl,'altUrl':encodedUrl});
      }else{
        var newUrl = Url({longUrl:passedUrl});
        newUrl.save(function(err){
          if(err) console.error(err);
          encodedUrl = process.env.host +'/short/'+ encode(newUrl._id);
          res.send({'originalurl':passedUrl,'altUrl':encodedUrl});
        })
      }
    })
  }
  else{res.send('Please use a valid http or https address');}
});

app.get('/short/*',function(req,res){
    var encodedId = req.params[0];
    var id = decode(encodedId);
    
    Url.findOne({_id:id},function(err,doc){
      if(err) console.error(err);
      if(doc){
        res.redirect(doc.longUrl);
      }
      else{
        res.redirect('/');
      }
    })
});

var keyContainer = "123456789nejctrsakNEJCTRSAK";
var keyQuantity = keyContainer.length;

function encode(num){
  var encoded = '';
  while(num){
      var remainder = num % keyQuantity;
      num = Math.floor(num / keyQuantity);
      encoded = keyContainer[remainder].toString()+encoded;
  }
  return encoded;
};
function decode(str){
  var decoded = 0;
  while(str){
    var index = keyContainer.indexOf(str[0]);
    var power = str.length -1;
    decoded +=index*(Math.pow(keyQuantity,power));
    str = str.substring(1);
  }
  return decoded;
};

app.listen(port);