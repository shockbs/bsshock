const { connect, connected, getToken } = require("../../utilman.js");

let lastConnectTime = 0;

module.exports = (a) => {
    const currentTime = Date.now();
    const cooldownPeriod = 2 * 60 * 60 * 1000;

    if (connected()) {
        console.log(`[${new Date().toString()}] Triggered Another Login to api.shockbs.is-a.dev`);
        console.log('DO NOT CONSTANTLY Run connect(), you should only run it once.');

        if (a !== null && getToken() === a) {
            throw new Error("Given the same credentials. The token is already connected");
        }
        
        if (currentTime - lastConnectTime < cooldownPeriod) {
            console.log('DO NOT CONSTANTLY Run connect(), you should only run it once.');
            return;
        }

        lastConnectTime = currentTime;
        setTimeout(() => {
            return connect(a);
        }, 30000);
    } else {
        lastConnectTime = currentTime;
        return connect(a);
    }
};
