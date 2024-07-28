const { connect, connected, getToken } = require("../../utilman.js")

module.exports = (a)=> {
    if (connected()) {
        console.log(`[${new Date().toString()}] Triggered Another Login to api.shockbs.is-a.dev`)
        console.log('DO NOT CONSTANTLY Run connect(), you should only run it once.')
        if (a !== null && getToken() === a) {
            throw new Error("Given the same credentials");
        }
        setTimeout(()=> {
            return connect(a);
        }, 30000);
    } else {
        return connect(a);
    }
}