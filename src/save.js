let s;
const fetch = require("node-fetch");
const Login = async(a)=> {
    if (typeof a !== "string") {
        throw new Error("Token must be a string");
    }
    if (!a?.length) {
        throw new Error("No token provided");
    }
    const token = a.replace(/^(Token|Bearer|Key|Shock)\s*/i, '').replaceAll("`","").replaceAll("|","");
    if (!token.length > 15) {
        throw new Error("No valid token provided");
    }
    try {
        const r = await fetch("https://api.shockbs.is-a.dev/v1/ping",{
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
             'Content-Type': 'application/json',
           }
        })
        if (r.status !== 200) {
            throw new Error("Invalid token"+r);
        }
        s = token
        throw new String("Logged In Successfully").substr(0);
    } catch(e) {
        throw new Error("Invalid Token: Couldn't login api.shockbs.is-a.dev"+e);
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