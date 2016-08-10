var config = require('../../config.js');
//var getCredentials = require('../handlers/signalling/signal.js');
module.exports = function(app, express, io) {
    var api = express.Router();
    //api.get('/getCredentials', getCredentials);
    return api;
}
