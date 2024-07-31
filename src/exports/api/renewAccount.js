const { connected, request } = require("../../utilman.js");
const fetch = require("node-fetch");

module.exports = async()=> {
    if (!connected()) {
        throw new Error("API not logged in. read https://docs.shockbs.is-a.dev/guides/login#why-are-classes-and-functions-still-throwing-erros-even-ive-already-logged-in");
    }
    return request({
        method: "get",
        route: "account/renew"
    })
}