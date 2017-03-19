var mongodb = require('mongodb');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var counterSchema = Schema({
   _id:{type:String, required:true},
   seq:{type:Number,default:0}
});
var counter = mongoose.model('counter',counterSchema);

var urlSchema = new Schema({
    _id:{type:Number,index:true},
    longUrl:String,
    date:Date
});

urlSchema.pre('save',function(next){
    var doc = this;
    counter.findByIdAndUpdate({_id:"url_count"},{$inc:{seq:1}},function(err,counter){
       if(err)
            return next(err);
        doc.date = new Date();
        doc._id = counter.seq;
        next();
    });
});

var Url = mongoose.model('Url',urlSchema);

module.exports = Url;