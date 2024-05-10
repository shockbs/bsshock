const fetch = require("node-fetch");
const { loggedIn, getToken } = require("../../save.js");
const stringSimilarity = require("string-similarity");
const { ButtonStyle, EmbedBuilder, ButtonBuilder, AttachmentBuilder, ActionRowBuilder, Client } = require("discord.js");

module.exports = class gpt4Chat {
  constructor(options = {}) {
    if (loggedIn() === false) {
      throw new Error("API not logged in");
    }
    if (!options.model) {
      throw new ReferenceError("options.model was missing");
    }
    if (typeof options.model !== "string") {
      throw new TypeError("options.model must be a string");
    }
    const compareResults = ((stringSimilarity.findBestMatch(options.model.toLowerCase(), ["gpt4", "gpt3.5", "gpt3"])).ratings.filter(result => result.rating >= 0.3)).sort((shock, Shock) => Shock.rating - shock.rating);
    if (compareResults.length > 0) {
      options.model = compareResults[0].target;
    } else {
      throw new ReferenceError("options.model must be one of the available models");
    }
    if (!options.replyMention) {
      replyMention = false;
    } else if (typeof options.replyMention !== "boolean") {
      throw new TypeError("options.replyMention must be a boolean");
    }
    if (!options.maxInteractions) {
      throw new ReferenceError("options.maxInteractions was missing");
    }
    if (typeof options.maxInteractions !== "number") {
      throw new TypeError("options.maxInteractions must be a number");
    }
    if (options.maxInteractions < 2) {
      throw new Error("options.maxInteractions must be greater than 2, if you need text generation, use gptText function instead");
    }
    if (options.maxInteractions > 30) {
      throw new Error("options.maxInteractions should not be greater than 30");
    }
    if (!options.components) {
      options.components = null;
    } else if (typeof options.components !== "array") {
      throw new TypeError("options.components should be an array");
    }
    if (!options.custom) {
        throw new ReferenceError("options.custom was missing");
    }
    if (typeof options.custom !== "boolean") {
        throw new TypeError("options.custom must be a boolean");
    }
    if (!options.embed) {
        options.embed = {};
    }
    if (!options.embed.color) {
        options.embed.color = "#34FFC2";
    } else if (typeof options.embed.color !== "string") {
        throw new TypeError("options.embed.color must be a string");
    }
    this.model = options.model;
    this.options = options;
    this.cache = new Map();
    this.token = getToken();
  }
  async clear() {
    return this.cache.clear();
  }
  async clearConversation(id) {
    if (!id) {
      throw new ReferenceError("id is not provided");
    }
    if (typeof id !== "string") {
      throw new TypeError("id must be a string");
    }
    if (!this.cache.has(id)) {
      throw new Error(`${id} Not Found`);
    }
    try {
      await this.cache.delete(id);
      return true;
    } catch (e) {
      return false;
    }
  }
  async getData(id) {
    if (!id) {
      throw new ReferenceError("id is not provided");
    }
    if (typeof id !== "string") {
      throw new TypeError("id must be a string");
    }
    if (!this.cache.has(id)) {
      throw new Error(`${id} Not Found`);
    }
    return this.cache.get(id);
  }
  async getCount(id) {
    if (!id) {
      throw new ReferenceError("id is not provided");
    }
    if (typeof id !== "string") {
      throw new TypeError("id must be a string");
    }
    if (!this.cache.has(id)) {
      throw new Error(`${id} Not Found`);
    }
    return (this.cache.get(id)).length / 2;
  }
  async message(message) {
    if (!message) {
      throw new Error("Message not provided");
    }
    if (!message.content?.length) {
      throw new Error("Message must have content");
    }
    let data;
    if (!this.cache.has(message.author.id)) {
      await this.cache.set(message.author.id, []);
      data = [];
    } else {
      data = await this.cache.get(message.author.id);
    }
    data.push({ role: "user", content: message.cleanContent });
    const fetched = await fetch(`https://api.shockbs.is-a.dev/v1/ai/${this.model}/chat/${this.options.custom ? "custom":"normal"}`, {
        method: "post",
        headers: {
            Authorization: `Bearer ${this.token}`,
            Accept: "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({data})
    });
    if (fetched.status === 403) {
        message.reply({content:"Error: API request to api.shockbs.is-a.dev/v1/ was rejected or banned",allowedMentions:{repliedUser:false, parse:[],users:[],roles:[]}});
        if (this.options.custom) {
            throw new Error("Custom GPT Personality is not configured from the panel");
        } else {
            throw new Error("The account associated with the API token was banned or deactivated")
        }
    }
    if (!fetched.ok) {
        throw new Error(fetched);
    }
    const { message:msg } = await fetched.json();
    data.push({role:"shock", content:msg});
    if (data.length > this.options.maxInteractions) {
        await this.cache.set(message.author.id,[]);
    } else {
        await this.cache.set(message.author.id,data);
    }
    if (msg.length < 4097) {
        return interaction.reply({
            embeds: [new EmbedBuilder().setColor(this.options.embed.color).setDescription(msg)],
            components: this.components,
            allowedMentions: {repliedUser:this.options.replyMention,parse:[],users:[],roles:[]}
        });
    } else {
        const chunks = [];
        let i;
        while (i < msg.length) {
            chunks.push(msg.substring(i, i + 4096));
            i += 4096;
        }
        chunks.forEach(chunk=> {
            interaction.reply({embeds: [new EmbedBuilder().setColor(this.options.embed.color).setDescription(chunk)],
                components: this.components,
                allowedMentions: {repliedUser:this.options.replyMention,parse:[],users:[],roles:[]}
            })
        });
    }
  }
}