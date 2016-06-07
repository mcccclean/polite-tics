var log = require('pretty-good-log')('main');
var config = require('config');

var getExcuses = require('./lib/hansard');
var store = require('./lib/store');

var HOUR = 1000 * 60 * 60;
var moment = require('moment');

var Twitterbot = require('mcccclean-twitterbot');
var bot = new Twitterbot(config.get('twitterbot'));

function tweet() {
    var h = moment().hour();
    // keep to tweeting between 8am and 6pm
    if(h >= 8 && h <= 17) {
        store.getTopTweet().then(function(doc) {
            if(doc) {
                bot.tweet(doc.tweet);
                store.flag(doc.gid);
            } else {
                log("didn't tweet");
            }
        }).catch(function(err) {
            log('error', err);
        });
    }
}

function downloadNewExcuses() {
    getExcuses().then(function(allexcuses) {
        allexcuses.map(function(m) {
            store.addTweet(m);
        });
    }).catch(function(e) {
        log('error', e);
    });
}

downloadNewExcuses();
tweet();
setInterval(downloadNewExcuses, HOUR * 24);
setInterval(tweet, HOUR * 2);
