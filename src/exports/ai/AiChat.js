const fetch = require("node-fetch");
const { connected, getToken, request } = require("../../utilman.js");
const stringSimilarity = require("string-similarity");
const { ButtonStyle, EmbedBuilder, ButtonBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");

module.exports = class gpt4Chat {
  constructor(options = {}) {
    connected(true);

    if (!options.model) {
      throw new ReferenceError("options.model was missing");
    }
    if (typeof options.model !== "string") {
      throw new TypeError("options.model must be a string");
    }
    const compareResults = stringSimilarity
      .findBestMatch(options.model.toLowerCase(), ["gpt-4", "gpt-3.5", "gpt-3"])
      .ratings.filter(result => result.rating >= 0.3)
      .sort((a, b) => b.rating - a.rating);

    if (compareResults.length > 0) {
      options.model = compareResults[0].target;
    } else {
      throw new ReferenceError("options.model must be one of the available models");
    }

    options.replyMention = options.replyMention || false;
    if (typeof options.replyMention !== "boolean") {
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

    options.components = options.components || [];
    if (!Array.isArray(options.components)) {
      throw new TypeError("options.components should be an array");
    }

    if (options.dashboard) {
      if (options.dashboard.enabled) {
        if (typeof options.dashboard.enabled !== "boolean") {
          throw new TypeError("options.dashboard.enabled must be a boolean.");
        }
        let dash = options.dashboard;
        dash.buttonStyle = dash.buttonStyle || ButtonStyle.Primary;
        if (typeof dash.buttonStyle !== "number") {
          throw new TypeError(`${dash.buttonStyle} is not a number`);
        }
        dash.buttonText = dash.buttonText || "Dashboard";
        if (typeof dash.buttonText !== "string") {
          throw new TypeError("options.dashboard.buttonText must be a string");
        }
        if (!dash.buttonText.length) {
          throw new Error("options.dashboard.buttonText cannot be empty");
        }
        dash.clearConversationOnSwitchModel = dash.clearConversationOnSwitchModel ?? true;
        if (typeof dash.clearConversationOnSwitchModel !== "boolean") {
          throw new TypeError(`${dash.clearConversationOnSwitchModel} is not a boolean`);
        }
        this.data = new Map();
        const buttons = new ActionRowBuilder().addComponents(
          new ButtonBuilder({
            label: dash.buttonText,
            style: dash.buttonStyle,
            custom_id: "api.shockbs.is-a.dev chat"
          })
        );
        this.options.components.unshift(buttons);
        this.options.dashboard = dash;
      } else {
        throw new Error("options.dashboard.enabled is required.");
      }
    } else {
      throw new Error("options.dashboard is required.");
    }

    options.custom = options.custom || null;
    if (options.custom && typeof options.custom !== "string") {
      throw new TypeError("options.custom must be a string");
    }
    if (options.custom && options.custom.length > 1500) {
      throw new ReferenceError("The length of options.custom should not be greater than 1500.");
    }

    options.embed = options.embed || {};
    options.embed.color = options.embed.color || "#34FFC2";
    if (typeof options.embed.color !== "string") {
      throw new TypeError("options.embed.color must be a string");
    }

    options.blacklistedUsers = options.blacklistedUsers || [];
    if (!Array.isArray(options.blacklistedUsers)) {
      throw new TypeError("options.blacklistedUsers must be an array");
    }
    if (options.blacklistedUsers.length && options.blacklistedUsers.includes("880084860327313459")) {
      throw new Error("880084860327313459 is the ID of ShockBS, the owner of ShockBS API, and hence should not be blacklisted.");
    }
    options.blacklistedUsers.forEach(key => {
      if (typeof key !== "string") {
        throw new TypeError(`${key} is not a string`);
      }
      if (key.includes(" ") || key.includes('\n')) {
        throw new Error(`"${key}" contains blank spaces or new lines`);
      }
      if (isNaN(Number(key))) {
        throw new Error(`ID should only contain numbers. Referring to "${key}"`);
      }
    });

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
      throw new ReferenceError("ID is not provided");
    }
    if (typeof id !== "string") {
      throw new TypeError("ID must be a string");
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
      throw new ReferenceError("ID is not provided");
    }
    if (typeof id !== "string") {
      throw new TypeError("ID must be a string");
    }
    if (!this.cache.has(id)) {
      throw new Error(`${id} Not Found`);
    }
    return this.cache.get(id);
  }

  async getCount(id) {
    if (!id) {
      throw new ReferenceError("ID is not provided");
    }
    if (typeof id !== "string") {
      throw new TypeError("ID must be a string");
    }
    if (!this.cache.has(id)) {
      throw new Error(`${id} Not Found`);
    }
    return this.cache.get(id).length / 2;
  }

  async handleMessage(message) {
    if (!message) {
      throw new Error("Message not provided");
    }
    if (!message.content?.length) {
      throw new Error("Message must have content");
    }
    if (this.options.blacklistedUsers.length && this.options.blacklistedUsers.includes(message.author.id)) {
      return message.reply({ content: `Sorry, you are blacklisted from using this feature.`, allowedMentions: { repliedUser: true } });
    }
    let data = this.cache.get(message.author.id) || [];
    let data2 = this.data.get(message.author.id) || { model: this.model, count: 0 };

    if (!this.cache.has(message.author.id)) {
      this.cache.set(message.author.id, []);
    }
    if (!this.data.has(message.author.id)) {
      this.data.set(message.author.id, data2);
    }

    data.push({ role: "user", content: message.cleanContent });
    const { message: msg } = await request({
      method: "post",
      route: "ai/chat",
      body: JSON.stringify({ data, model: data2.model, custom: this.options.custom }),
      reply: message.reply
    });
    data.push({ role: "shock", content: msg });

    if (data2.count > this.options.maxInteractions) {
      this.cache.delete(message.author.id);
      this.data.delete(message.author.id);
    } else {
      this.cache.set(message.author.id, data);
      this.data.set(message.author.id, data2);
    }

    if (msg.length < 4097) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(this.options.embed.color).setDescription(msg)],
        components: this.options.components,
        allowedMentions: { repliedUser: this.options.replyMention, parse: [], users: [], roles: [] }
      });
    } else {
      const chunks = [];
      let i = 0;
      while (i < msg.length) {
        chunks.push(msg.substring(i, i + 4096));
        i += 4096;
      }
      for (const chunk of chunks) {
        message.reply({
          embeds: [new EmbedBuilder().setColor(this.options.embed.color).setDescription(chunk)],
          components: this.options.components,
          allowedMentions: { repliedUser: this.options.replyMention, parse: [], users: [], roles: [] }
        });
      }
    }
  }

  async handleInteraction(interaction) {
    if (!interaction.customId.startsWith("api.shockbs.is-a.dev chat")) return;
    let data = this.data.get(interaction.user.id) || { model: this.model, count: 0 };

    if (!this.data.has(interaction.user.id)) {
      this.data.set(interaction.user.id, data);
    }

    if (interaction.replied || interaction.deferred) {
      interaction.reply = interaction.editReply;
      interaction.update = interaction.editReply;
    }

    if (interaction.customId.endsWith("chat")) {
      let ephemeral = true;
      if (interaction.customId.endsWith("chatchat")) {
        interaction.reply = interaction.update;
        ephemeral = false;
      }
      return reply(interaction.reply, data, this.options, ephemeral);
    } else {
      switch (interaction.customId.replace("api.shockbs.is-a.dev chat ", "")) {
        case "clear":
          this.data.delete(interaction.user.id);
          this.cache.delete(interaction.user.id);
          return interaction.update({ content: "Cleared data successfully", embeds: [], components: [], allowedMentions: { repliedUser: true } });
        case "models":
          data.model = interaction.values[0];
          if (this.options.dashboard.clearConversationOnSwitchModel) {
            this.cache.delete(interaction.user.id);
            data.count = 0;
          }
          this.data.set(interaction.user.id, data);
          return reply(interaction.update, data, this.options);
      }
    }
  }
};

function reply(reply, data, options, ephemeral) {
  return reply({
    embeds: [
      new EmbedBuilder()
        .setColor(options.embed.color)
        .setTitle("AI Dashboard")
        .setURL("https://docs.shockbs.is-a.dev/pckg/models/AiChat")
    ],
    allowedMentions: { repliedUser: false },
    ephemeral: ephemeral ? true : undefined,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder({ style: ButtonStyle.Danger, custom_id: "api.shockbs.is-a.dev chat clear", label: `(${data.count}/${options.maxInteractions})`, disabled: data.count <= 0 }),
        new ButtonBuilder({ style: ButtonStyle.Secondary, emoji: "🔄", custom_id: "api.shockbs.is-a.dev chatchat" })
      ),
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("api.shockbs.is-a.dev chat models")
          .setPlaceholder("Switch Models")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setValue("gpt-4")
              .setLabel("GPT-4")
              .setDefault(data.model === "gpt-4"),
            new StringSelectMenuOptionBuilder()
              .setValue("gpt-3.5")
              .setLabel("GPT-3.5")
              .setDefault(data.model === "gpt-3.5"),
            new StringSelectMenuOptionBuilder()
              .setValue("gpt-3")
              .setLabel("GPT-3")
              .setDefault(data.model === "gpt-3")
          )
      )
    ]
  });
}
