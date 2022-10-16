const fs = require('fs');
const path = require('path');
let configState = require("../config.json");

function saveConfig(config) {

    fs.writeFileSync(path.join(__dirname, '../config.json'), JSON.stringify(config, null, 2))
    configState = config
}

function getConfig() {
    return configState
}


module.exports = {
    saveConfig,
    getConfig
}