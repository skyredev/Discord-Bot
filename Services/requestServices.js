async function sendRequest(client, channel, content) {
    try {
        const sendChannel = await client.channels.fetch(channel.id);

        return sendChannel.send(content);
    }
    catch (e) {
        console.log(e)
    }
}
async function getJSONResponse(body) {
    let fullBody = '';

    for await (const data of body) {
        fullBody += data.toString();
    }
    return JSON.parse(fullBody);
}

async function getTextResponse(body) {
    let fullBody = '';

    for await (const data of body) {
        fullBody += data.toString();
    }
    return fullBody;
}
module.exports = {sendRequest, getJSONResponse, getTextResponse};