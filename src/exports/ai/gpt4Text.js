const fetch = require("node-fetch");
const { loggedIn, getToken } = require("../../save.js");

module.exports = async(message)=> {
    if (loggedIn() === false) {
        throw new Error("API not logged in yet");
    }
    if (!message?.length) {
        throw new Error("message is not provided");
    }
    const fetched = await fetch("https://api.shockbs.is-a.dev/v1/ai/gpt4/text", {
        method: "post",
        headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({data: message})
    })
    if (!fetched.ok) {
        throw new Error(fetched);
    }
    const { message:msg } = await fetched.json();
    return msg;
}