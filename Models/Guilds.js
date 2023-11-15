const mongoose = require('mongoose')
let Schema = mongoose.Schema;

let GuildSchema = new Schema({
    id: String,
    name: String,
    system: {
        gamesLog: {
            id: String,
            name: String,
        }
    },
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
            },
            aliasRoles: Array,
        },
        shop: {
            logChannel:{
                id: String,
                name: String,
            },
            channel: {
                id: String,
                name: String,
            },
            items: Array,
        },
        wiki: Array,
        codes: {
            logChannel: {
                id: String,
                name: String,
            },
            codePaths: Array,
        },
        authLinks: Array,
        testing: {
            logChannel:{
                id: String,
                name: String,
            },
            channel: {
                id: String,
                name: String,
            },
            testersChannel: {
                id: String,
                name: String,
            },
            testingRole: {
                id: String,
                name: String,
            },
            waves: Array,
            cleaning: Array,
        }
});

GuildSchema.index({id: 1}, {unique: true});


module.exports = mongoose.model('Guilds', GuildSchema);