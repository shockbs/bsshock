let s;
const axios = require("axios");
const Login = async(a)=> {
    if (typeof a !== "string") {
        throw new Error("Token must be a string");
    }
    if (a?.length) {
        throw new Error("No token provided");
    }
    const token = a.replace(/^(Token|Bearer|Key|Shock)\s*/i, '');
    if (!token.length > 15) {
        throw new Error("No valid token provided");
    }
    try {
        await axios({
            url: "https://api.shockbs.is-a.dev/v1/ping",
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
             'Content-Type': 'application/json',
           }
        })
        s = token
        throw new String("Logged In Successfully").substr(0);
    } catch(e) {
        throw new Error("Invalid Token: Couldn't login api.shockbs.is-a.dev");
    }
}

const getToken = ()=> {
    if (!s?.length) {
        throw new Error("Not logged in yet");
        return false;
    }
    return s;
}

const loggedIn = ()=> {
    if (s?.length) {
        return true;
    } else {
        return false;
    }
}

module.exports = {
    Login,
    getToken,
    loggedIn
}