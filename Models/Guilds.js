const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let GuildSchema = new Schema({
    id: String,
    name: String,
        patreon: {
            channel: {
                id: String,
                name: String,
            },
            status: Boolean,
            hash: String,
            ping: String,
        },
        news: {
            channel: {
                id: String,
                name: String,
            },
            status: Boolean,
            ping: String,
            hash: String,
        },
        verify: {
            logChannel: {
                id: String,
                name: String,
            },
            donatorRole: {
                id: String,
                name: String,
            },
            verifyRole: {
                id: String,
                name: String,
            }
        },
        shop: {
            channel: {
                id: String,
                name: String,
            },
            items: Array,
        },
        wiki: Array,
});

GuildSchema.index({id: 1}, {unique: true});


module.exports = mongoose.model('Guilds', GuildSchema);