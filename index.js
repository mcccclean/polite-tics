var log = require('pretty-good-log')('main');
var config = require('config');
var schedule = require('node-schedule');

var getExcuses = require('./lib/hansard');
var store = require('./lib/store');

var Twitterbot = require('mcccclean-twitterbot');
var bot = new Twitterbot(config.get('twitterbot'));

function tweet() {
    return store.getTopTweet().then(function(doc) {
        if(doc) {
            bot.tweet(doc.tweet);
            store.flag(doc._id);
            log("Tweeting:", doc.tweet);
        } else {
            log("didn't tweet");
        }
    }).catch(function(err) {
        log('error', err);
    });
}

function downloadNewExcuses() {
    return getExcuses().then(function(allexcuses) {
        allexcuses.map(function(m) {
            store.addTweet(m);
        });
    }).catch(function(e) {
        log('error', e);
    });
}

// download new excuses every 24 hours
schedule.scheduleJob('0 0 0 * * *', downloadNewExcuses);

// tweet every 2 hours between 8am and 6pm
schedule.scheduleJob('0 0 8-18/2 * * *', tweet);

