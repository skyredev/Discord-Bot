const {checkPatreon} = require("./Services/patreonService");
const {updateShopImage} = require("./Services/shopImageService");
const tokens = require("./tokens.json");
const { Client, GatewayIntentBits, Partials, Collection} = require('discord.js');
const { Guilds, GuildMembers, GuildMessages, DirectMessages , MessageContent, GuildMessageReactions } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember, Channel, Reaction } = Partials;
const server = require('./server.js')


const {loadEvents} = require('./Handlers/eventHandler');
const {loadCommands} = require('./Handlers/commandHandler');


const client = new Client({
    intents: [Guilds, GuildMembers, GuildMessages, DirectMessages, MessageContent, GuildMessageReactions],
    partials: [User, Message, GuildMember, ThreadMember, Channel, Reaction],
});
client.commands=new Collection();




client
    .login(tokens.token)
    .then(() => {
        loadEvents(client);
        loadCommands(client);

        server(client); //Runs express server

    })
    .catch(console.error);




setInterval( checkPatreon, 5000*60, client);
setInterval( updateShopImage, 1000*60*60*24, client);


