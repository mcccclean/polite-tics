var config = require('config');
var log = require('pretty-good-log')('hansard');
var request = require('request');
var moment = require('moment');
var striptags = require('striptags');
var Tokenizer = require('sentence-tokenizer');
var Entities = require('html-entities').AllHtmlEntities;
entities = new Entities();

var API = 'http://www.openaustralia.org/api/';

var PARTIES = {
    "Australian Labor Party": "ALP",
    "Liberal Party": "LIB",
    "National Party": "NAT",
    "Australian Greens": "GRN",
    "President": "Pres."
};

function splitsentences(text) {
    var tokens = new Tokenizer('sentences');
    tokens.setEntry(text);
    return tokens.getSentences();
}

function getHansard(term) {
    var url = API + 'getHansard';
    var params = {
        search: term,
        output: 'js',
        key: config.openaus_api
    };
    return new Promise(function(resolve, reject) {
        log('Getting term:', term);
        request.get({
            url: url,
            qs: params
        }, function(err, response, body) {
            var data = JSON.parse(body);
            resolve(data.rows);
        });
    });
}

function getQuotes(term, data) {
    var speaker = data.speaker.first_name[0] + ' ' + data.speaker.last_name;
    var party = data.speaker.party;
    var date = moment(data.hdate, 'YYYY-MM-DD');
    var gid = data.gid;

    if(PARTIES[party]) {
        party = PARTIES[party];
    }

    var text = entities.decode(striptags(data.body));
    var sentences = splitsentences(text);

    return sentences.filter(function(s) {
        if(s.toLowerCase().indexOf(term) >= 0) {
            return true;
        } else {
            return false;
        }
    }).map(function(s, i) {
        var tweet = speaker + ' (' + party + ', ' + date.format('MMM D') + '): "' + s + '"';
        return {
            date: date.unix(),
            tweet: tweet,
            gid: gid + '_' + i
        }
    }).filter(function(s) {
        return s.tweet.length <= 140;
    });
}

function getExcuses(term) {
    return getHansard(term).then(function(data) {
        var excuses = [];
        for(var i = 0; i < data.length; ++i) {
            excuses = excuses.concat(getQuotes(term, data[i]));
        }
        return excuses;
    }).catch(function(e) {
        log('error', e);
    });
}

module.exports = function() {
    var allexcuses = [];
    var appendExcuses = function(term) {
        return getExcuses(term).then(function(excuses) {
            allexcuses = allexcuses.concat(excuses);
        });
    };

    var terms = [
        'sorry',
        'excuse me',
        'pardon me',
        "you're welcome",
        'thank you',
        'please'
    ];

    var pchain = Promise.resolve();
    terms.each(function(t) {
        pchain = pchain.then(function() {
            return appendExcuses(t);
        });
    });

    return pchain.then(function() {
        allexcuses.sort(function(a, b) {
            return a.date - b.date;
        });

        return allexcuses;
    });
}

