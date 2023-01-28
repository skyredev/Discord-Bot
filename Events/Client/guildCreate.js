const {Client} = require('discord.js');
const {createGuild} = require('../../Services/dataBaseServices')

module.exports = {
    name: 'guildCreate',
    once: false,
    /**
     * @param { Client } client
     * @param { Guild } guild
     */
    async execute(guild) {
        await createGuild(guild);
    }
}