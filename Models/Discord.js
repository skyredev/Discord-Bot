const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let DiscordSchema = new Schema({
    name: String,
    id: String,
    isDonator: Boolean,
    isPrivate: Boolean,
    verified: Boolean,
    battleTag: String,
});

DiscordSchema.index({id: 1, battleTag: 1}, {unique: true});

module.exports = mongoose.model('Discord', DiscordSchema);