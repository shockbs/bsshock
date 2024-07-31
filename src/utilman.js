let s;
const { request: undici } = require('undici');

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
    const res = await undici(`https://api.shockbs.is-a.dev/v1/ping`, {
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      }
    });
    if (res.statusCode === 200) {
      s = token;
      return "Connected Successfully";
    } else {
      throw new Error(`Unable to Connect. Response: ${res.body.text()}`);
    }
  } catch (e) {
    throw new Error(`Error in connect: ${e.message}`);
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
      throw new Error('[API_NOT_CONNECTED] API not attempted to connect or connect() is not awaited. Read: https://docs.shockbs.is-a.dev/guides/login#why-are-classes-and-functions-still-throwing-erros-even-ive-already-logged-in');
    } else {
      return false;
    }
  }
};

const request = async (options) => {
  if (!s.length) {
    throw new Error('[API_NOT_CONNECTED] API not attempted to connect or connect() is not awaited. Read: https://docs.shockbs.is-a.dev/guides/login#why-are-classes-and-functions-still-throwing-erros-even-ive-already-logged-in');
  }
  const { method, route, body, reply } = options;

  try {
    const res = await undici(`https://api.shockbs.is-a.dev/v1/${route}`, {
      method,
      headers: {
        Authorization: `Bearer ${s}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: method === 'post' ? JSON.stringify(body) : undefined,
    });

    const data = await res.body.json();

    if (res.statusCode === 200) {
      return data;
    } else {
      if (reply) {
        reply({
          content: `Request to api.shockbs.is-a.dev/v1/${route} failed, response:\n\`\`\`\n${data.message}\n\`\`\`\nStatus Code: ${res.statusCode}`,
          allowedMentions: { repliedUser: false, parse: [], users: [], roles: [] },
        });
      }
      throw new Error(`Request failed. Response: ${JSON.stringify(data)}, Status Code: ${res.statusCode}`);
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
