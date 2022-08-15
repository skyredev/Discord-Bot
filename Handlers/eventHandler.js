function loadEvents(client){
    const ascii = require('ascii-table');
    const fs = require('fs');
    const table = new ascii().setHeading('Events', 'Status');

    const folders = fs.readdirSync('./Events');
    for(const folder of folders){
        const files = fs
            .readdirSync(`./Events/${folder}`)
            .filter(file => file.endsWith('.js'));
        for(const file of files){
            const event = require(`../Events/${folder}/${file}`);

            const executor = async  (...args)=>{
                try {
                    return event.execute(...args, client)
                } catch (error) {
                    console.error(error)
                }
            }

            if(event.disabled) continue;

            if(event.rest){
                if(event.once)
                    client.rest.once(event.name, executor);

                else
                    client.rest.on(event.name, executor);
            }else{
                if(event.once)
                    client.once(event.name, executor);
                else
                    client.on(event.name, executor);
            }
            table.addRow(file, '✅');
        }
    }
    console.log(table.toString(), "\n Loaded Events!");
}
module.exports = {loadEvents};
