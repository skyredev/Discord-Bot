const { SlashCommandBuilder, CommandInteraction, PermissionFlagsBits } = require('discord.js');
const axios = require('axios');
const {getJSONResponse} = require("../../Services/requestServices");
const {requestGameData} = require("../../Services/dataBaseServices");

module.exports = { // Basic ping command - disabled
    name: 'test',
    disabled: false,
    data: new SlashCommandBuilder()
        .setName('test')
        .setDescription('Pong!')
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages)
        ,
    /**
     *
     * @param { CommandInteraction } interaction
     */
    async execute(interaction) {
    }



}