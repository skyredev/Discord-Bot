const tokens = require("../tokens.json");

function loadCommands(client) { // Loads all commands from the commands folder made to make it easier to add commands
    const ascii = require('ascii-table');
    const fs = require('fs');
    const table = new ascii().setHeading('Commands', 'Status');

    let commandsArray =[];
    let developersArray =[];

    const commandsFolders = fs.readdirSync('./Commands');
    for(const folder of commandsFolders){
        const commandFiles = fs
            .readdirSync(`./Commands/${folder}`)
            .filter(file => file.endsWith('.js'));
        for(const file of commandFiles){
            const commandFile = require(`../Commands/${folder}/${file}`);

            if(commandFile.disabled) continue;

            client.commands.set(commandFile.name, commandFile);

            if(commandFile.developer) {
                if ( commandFile.raw )
                    developersArray.push(commandFile.raw);
                else
                    developersArray.push(commandFile.data.toJSON());
            }

            else {
                if ( commandFile.raw )
                    commandsArray.push(commandFile.raw);
                else
                    commandsArray.push(commandFile.data.toJSON());
            }

            table.addRow(file, '✅');
            }
        }
    client.application.commands.set(commandsArray);

    const developerGuild = client.guilds.cache.get(tokens.developerGuild);

    developerGuild.commands.set(developersArray);

    console.log(table.toString(), "\n Loaded Commands!");

}
module.exports = {loadCommands};