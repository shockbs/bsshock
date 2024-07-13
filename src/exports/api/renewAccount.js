const { loggedIn, getToken } = require("../../save.js");
const fetch = require("node-fetch");

module.exports = async()=> {
    if (!loggedIn()) {
        throw new Error("API not logged in. read https://docs.shockbs.is-a.dev/guides/login#why-are-classes-and-functions-still-throwing-erros-even-ive-already-logged-in");
    }
    let res;
    try {
    res = await fetch("https://api.shockbs.is-a.dev/v1/account/renew", {
        method: "get",
        headers: {
            Authorization: `Bearer ${getToken()}`,
            Accept: "application/json",
            "Content-Type": "application/json",
        }
    })
    } catch(e) {
        throw new Error(e);
    }
    const a = res.json();
    return a;
}