const {Client} = require('discord.js');
const {saveConfig, getConfig} = require("../../Services/configService");

module.exports = {
    name: 'guildCreate',
    once: false,
    /**
     * @param { Client } client
     * @param { Guild } guild
     */
    async execute(guild) {
        const config = getConfig();
        config.guilds[guild.id] = {}
        saveConfig(config);

    }
}