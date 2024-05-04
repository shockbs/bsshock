const fetch = require("node-fetch");
const { loggedIn, getToken } = require("../../save.js");
const cache = new Map();

module.exports = async(message) {
    if (loggedIn() === false) {
        throw new Error("API not logged in yet");
    }
    if (!message) {
        throw new Error("message is not provided");
    }
    if (!await cache.has(message.author.id)) {
        await cache.set(message.author.id,[]);
    }
    let data = await cache.get(message.author.id);
    data.push({role:"user", content: message.cleanContent });
    const fetched = await fetch("https://api.shockbs.is-a.dev/v1/ai/gpt4/chat", {
        method: "post",
        headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    if (!fetched.ok) {
        throw new Error(fetched);
    }
    const { message: msg } = await fetched.json();
    data.push({role: "shock", content:msg })
    if (data.length > 60) {
        await cache.set(message.author.id,[])
    } else {
        await cache.set(message.author.id,data)
    }
    return message.reply({content: msg, allowedMentions:{roles:[],users:[],repliedUser:false}})
}