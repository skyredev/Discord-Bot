const {checkPatreon} = require("./Services/patreonService");
const {getConfig} = require("./Services/configService");
const {checkWebSite} = require("./Services/newsService");
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages, DirectMessages , MessageContent, GuildMessageReactions } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel, Reaction } = Partials;

const { request } = require('undici');
const {loadEvents} = require('./Handlers/eventHandler');
const {loadCommands} = require('./Handlers/commandHandler');


const client = new Client({
    intents: [Guilds, GuildMembers, GuildMessages, DirectMessages, MessageContent, GuildMessageReactions],
    partials: [User, Message, GuildMember, ThreadMember, Channel, Reaction],
});
client.commands=new Collection();

const config = getConfig()

client
    .login(config.token)
    .then(() => {
        loadEvents(client);
        loadCommands(client);

    })
    .catch(console.error);


setInterval( checkPatreon, 5000*60, client);
