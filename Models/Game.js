const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let GameSchema = new Schema({
    gameId: String,
    region: {
        id: String,
        name: String,
    },
    serverId: String,
    gameMode: String,
    players: Object,
    time: {
        duration: Number,
        closedAt: String,
        completedAt: String,
    },
    hostName: String,
    gameLink: String,

});

module.exports = mongoose.model('Game', GameSchema);