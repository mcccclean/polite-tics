
var moment = require('moment');
var log = require('pretty-good-log')('store');
var datastore = require('nedb-promise')({
    filename: 'politetics.db',
    autoload: true
});

var store = {};

store.addTweet = function(tweet) {
    datastore.find({ gid: tweet.gid }).then(function(docs) {
        if(docs && docs.length > 0) {
            // this tweet has already been seen
        } else {
            datastore.insert(tweet);
        }
    });
};

store.flag = function(gid) {
    return datastore.update({
        gid: gid
    }, {
        $set: {
            tweeted: moment()
        }
    });
};

store.getTopTweet = function() {
    return datastore.cfindOne({
        tweeted: {
            $exists: false
        }
    }).sort({ gid: 1 }).exec();
};

module.exports = store;
