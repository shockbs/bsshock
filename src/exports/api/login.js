const { Login, loggedIn } = require("../../save.js")

module.exports = (a)=> {
    if (loggedIn()) {
        console.log(`[${new Date().toString()}] Triggered Another Login to api.shockbs.is-a.dev`)
        return Login(a)
    } else {
        return Login(a)
    }
}