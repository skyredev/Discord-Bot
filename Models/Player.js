const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let PlayerSchema = new Schema({
    battleTag: String,
    battleId: Number,
    handles: Array,
    discordId: String,
    discordName: String,
    isDonator: Boolean,
    isPrivate: Boolean,
    multiplier: Number,
    crystals: Number,
    items: Array,
    region:{
        id: Number,
        name: String,
    },
    games: Array,
    stats: {
        games: Number,
        wins: Number,
        losses: Number,
        winRate: Number,
        timePlayed: Number,
        timePlayedPerGame: Number,
        MMR: Number,
        rank: String,
    },
    codesUsed: Array,
});

PlayerSchema.index({battleTag: 1, discordId: 1}, {unique: true});

module.exports = mongoose.model('Player', PlayerSchema);