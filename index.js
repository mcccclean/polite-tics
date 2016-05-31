
var getExcuses = require('./lib/hansard.js');

function main() {
    getExcuses().then(function(allexcuses) {
        console.log(allexcuses.map(function(m) {
            return m.tweet;
        }));
    }).catch(function(e) {
        console.log('error', e);
    });
}

main();
