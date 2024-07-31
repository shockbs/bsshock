let s;
const axios = require('axios');

const connect = async (a) => {
  if (typeof a !== "string") {
    throw new Error("Token must be a string");
  }
  if (!a?.length) {
    throw new Error("No token provided");
  }
  const token = a.replace(/^(Token|Bearer|Key|Shock)\s*/i, '').replaceAll("`", "").replaceAll("|", "");
  if (token.length <= 15) {
    throw new Error("No valid token provided");
  }
  try {
    const res = await axios.get('https://api.shockbs.is-a.dev/v1/ping', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
    });

    if (res.status === 200) {
      s = token;
      return "Connected Successfully";
    } else {
      throw new Error(`Unable to Connect. Response: ${JSON.stringify(res.data)}`);
    }
  } catch (e) {
    throw new Error(`Error in connect: ${e.message || JSON.stringify(e)}`);
  }
};

const getToken = () => {
  if (!s?.length) {
    throw new Error("Not logged in yet");
  }
  return s;
};

const connected = (returnError) => {
  if (s?.length) {
    return true;
  } else {
    if (returnError) {
      throw new Error('[API_NOT_CONNECTED] API not attempted to connect or connect() is not awaited. Read: https://docs.shockbs.is-a.dev/guides/connect#why-are-classes-and-functions-still-throwing-erros-even-it-is-already-connected');
    } else {
      return false;
    }
  }
};

const request = async (options) => {
  if (!s?.length) {
    throw new Error('[API_NOT_CONNECTED] API not attempted to connect or connect() is not awaited. Read: https://docs.shockbs.is-a.dev/guides/connect#why-are-classes-and-functions-still-throwing-erros-even-it-is-already-connected');
  }
  const { method, route, body, reply } = options;

  try {
    const res = await axios({
      url: `https://api.shockbs.is-a.dev/v1/${route}`,
      method: method.toUpperCase(),
      headers: {
        Authorization: `Bearer ${s}`,
      },
      data: method.toUpperCase() === 'POST' ? body : undefined,
    });

    if (res.status === 200) {
      return res.data;
    } else {
      if (reply) {
        reply({
          content: `Request to api.shockbs.is-a.dev/v1/${route} failed, response:\n\`\`\`\n${res.data.message}\n\`\`\`\nStatus Code: ${res.status}`,
          allowedMentions: { repliedUser: false, parse: [], users: [], roles: [] },
        });
      }
      throw new Error(`Request failed. Response: ${JSON.stringify(res.data)}, Status Code: ${res.status}`);
    }
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
};

module.exports = {
  getToken,
  request,
  connect,
  connected
};
