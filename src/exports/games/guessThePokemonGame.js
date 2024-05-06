const fetch = require("node-fetch");const stringSimilarity = require("string-similarity");const { loggedIn, getToken } = require("../../save.js");const { ButtonStyle, EmbedBuilder, ButtonBuilder, AttachmentBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
module.exports = class guessThePokemonGame {
    constructor(options={}) {
        if (loggedIn() === false) {
          throw new Error("API not logged in");
        }
        if (!options.base) {
          throw new Error("options.base is missing");
        }
        if (!options.baseType) {
            throw new Error("options.baseType is not defined")
        }
        if (typeof options.baseType !== "string") {
            throw new TypeError("options.baseType should be a string")
        }
        const baseType = options.baseType.toLowerCase();
        if (!["interaction","message"].includes(baseType)) {
            throw new TypeError("options.baseType must be either Interaction or Message");
        }
        if (baseType.includes("interaction")) {
            options.baseType = "Interaction";
        } else {
            options.baseType = "Message";
        }
        if (!options.embed) options.embed = {};
        if (!options.embed.title) {
            options.embed.title = "Guess The Pokemon Game";
        } else if (typeof options.embed.title !== "string") {
            throw new TypeError("options.embed.title should be a string");
        } else if (options.embed.title.length > 256) {
            throw new Error("Embeds titles should not be more than 256 characters");
        }
        if (!options.embed.color) {
            options.embed.color = "#2BFFE6";
        } else if (typeof options.embed.color !== "string") {
            throw new TypeError("options.embed.color should be a string");
        }
        if (!options.embed.winMessage) {
            options.embed.winMessage = "You're right! The Pokemon is ${pokemonName}!"
        } else if (typeof options.embed.winMessage !== "string") {
            throw new TypeError("options.embed.winMessage should be a string");
        } else if (options.embed.winMessage.length > 256) {
            throw new Error("winMessage shouldn't be more than 256 characters");
        }
        if (!options.embed.loseMessage) {
            options.embed.loseMessage = "You're wrong! Please Try Again."
        } else if (typeof options.embed.loseMessage !== "string") {
            throw new TypeError("options.embed.loseMessage should be a string");
        } else if (options.embed.loseMessage.length > 256) {
            throw new Error("loseMessage shouldn't be more than 256 characters");
        }
        if (!options.embed.timeoutMessage) {
            options.embed.timeoutMessage = "You didn't respond in time. The Pokemon is ${pokemonName}!"
        } else if (typeof options.embed.timeoutMessage !== "string") {
            throw new TypeError("options.embed.timeoutMessage should be a string");
        } else if (options.embed.timeoutMessage.length > 256) {
            throw new Error("timeoutMessage shouldn't be more than 256 characters");
        }
        if (!options.button) options.button = {}
        if (!options.button.text) {
            options.button.text = "Input Answer";
        } else if (typeof options.button.text !== "string") {
            throw new TypeError("options.button.text should be a string");
        }
        if (!options.button.style) {
            options.button.style = ButtonStyle.Primary;
        } else if (typeof options.button.style !== "number") {
            throw new Error("options.button.style should be a number");
        }
        if (!options.button.emoji) {
            options.button.emoji = null;
        } else if (typeof options.button.emoji !== "string") {
            throw new TypeError("options.button.emoji should be a string");
        }
        if (!options.time) {
            options.time = 30000;
        } else {
            const timeIsString = typeof options.time === "string";
            if (!(timeIsString || typeof options.time === "number")) {
                throw new TypeError("options.time should be either string or number");
            }
            if (timeIsString) {
                const regex = /^(\d+)\s*(s|second|sec|seconds|secs|min|m|minutes|mins|ms|millisecond|milliseconds)$/i;
                const match = options.time.replace("half",0.5).match(regex);
                if (!match) {
                    throw new TypeError("Invalid Duration Format passed to options.time");
                }
                switch (match[2].toLowerCase()) {
                    case "s":
                    case "second":
                    case "sec":
                    case "seconds":
                    case "secs": {
                        options.time = parseInt(match[1]) * 1000;
                        break;
                    }
                    case "min":
                    case "m":
                    case "minutes":
                    case "mins": {
                        options.time = (parseInt(match[1]) *60) * 1000;
                        break;
                    }
                    case "ms":
                    case "millisecond":
                    case "milliseconds": {
                        options.time = parseInt(match[1]);
                        break;
                    }
                }
            }
            if (options.time < 10000 || options.time > 600000) {
                const mins = Math.floor(options.time/60000);
                const secs = Math.floor((options.time - (mins * 60000)) / 1000);
                throw new TypeError(`options.time should be between 10 seconds to 10 minutes, and you passed ${mins > 0 ? `${mins} minute${mins > 1 ? "s":""}${secs < 1 ? "":` and ${secs} second${secs < 2 ? "":"s"}`}`:`${secs} second${secs < 2 ? "":"s"}`}`);
            }
        }
        this.options = options;
        this.base = options.base;
        this.message = null;
        this.data = {};
        this.i = null;
        this.file = null;
        this.ended = false;
        this.inter = false;
        this.attempts = 0;
        this.start = null;
        this.stopCollector = ()=> {
            this.base.channel.send(`<@${this.base.user.id}> I am having high delay, the game will be destroyed now without handling. You guessed correct for the answer`);
            throw new Error("Server was having high delay, game destroyed");
        }
    }
    
    async fetchAPI() {
        let res;
        try {
            res = await fetch("https://api.shockbs.is-a.dev/v1/random/pokemon", {
            method: "get",
            headers: {
              Authorization: `Bearer ${getToken()}`,
              Accept: "application/json",
             "Content-Type": "application/json",
           }
           });
        } catch(e) {
            throw new Error("Failed to Fetch data from API: "+e.message);
        }
        try {
            this.data = await res.json();
        } catch(e) {
            throw new Error("Failed to convert fetched data to JSON: "+e.message);
        }
    }
    
    async setFile() {
        try {
            this.file = new AttachmentBuilder(Buffer.from(this.data.image.data), {name: "api.shockbs.is-a.dev_guess_the_pokemon_output.png"});
        } catch(e) {
            throw new Error("Something went wrong file setting the image file: "+e.message);
        }
    }
    
    async interaction() {
        this.start = Date.now();
        const collector = this.message.createMessageComponentCollector({filter: ((i) => {
            if (i.user.id !== this.base.user.id) {
              i.reply({ content: `This is <@${this.base.user.id}>'s game!\n**Powered By:** [\`SHOCK API\`](<https://api.shockbs.is-a.dev>) **with** [\`ShockBS\`](<https://npmjs.com/package/shockbs>)`, ephemeral: true });
              return false;
            } else {
              return true;
            }
          }),time: this.options.time});
        this.stopCollector = collector.stop;
        collector.on("collect",(i)=> {
             return this.handleCollect(i);
        })
        collector.on("end",()=> {
            const diff = Date.now() - this.start;
                const mins = Math.floor(diff/60000);
                const secs = Math.floor((diff - (mins * 60000)) / 1000);
                let difference;
                if (mins > 0) {
                    difference = `\`\`\`python\nTime Taken: ${mins} minute${mins < 2 ? "":"s"}${secs === 0 ? "":` and ${secs} second${secs === 1 ? "":"s"}`}\n\`\`\``;
                } else {
                    difference = `\`\`\`python\nTime Taken: ${secs} second${secs < 2 ? "":"s"}\n\`\`\``;
                }
            if (this.inter === false) {
                this.message.edit({
                    content: "",
                    embeds: [
                new EmbedBuilder()
                .setColor(this.options.embed.color)
                .setTitle(this.options.embed.timeoutMessage.replaceAll("${pokemonName}",this.data.name))
                .setDescription(`\`\`\`javascript\nAttempts: ${this.attempts === 0 ? "Inactive, No Attempts":this.attempts}\n\`\`\`\n${difference}`)
                .setURL("https://npmjs.com/package/shockbs")
                .setImage("attachment://api.shockbs.is-a.dev_guess_the_pokemon_output.png")
                .setFooter({text:`Requested By @${this.base.user.username}`,iconURL: this.base.user.displayAvatarURL()})
                    ],
                    files: [
                       this.file
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder({ style: this.options.button.style, emoji: this.options.button.emoji || null, label: this.options.button.text, custom_id: "api.shockbs.is-a.dev/_npm_guessThePokemonGame", disabled: true})
                       )
                    ],
                    allowedMentions: {
                        repliedUser: false,
                        users: []
                    }
                })
            } else {
                this.message.edit({
                    content: "",
                    embeds: [
                new EmbedBuilder()
                .setColor(this.options.embed.color)
                .setTitle(this.options.embed.winMessage.replaceAll("${pokemonName}",this.data.name))
                .setDescription(`\`\`\`javascript\nAttempts: ${this.attempts}\n\`\`\`\n${difference}`)
                .setURL("https://npmjs.com/package/shockbs")
                .setImage("attachment://api.shockbs.is-a.dev_guess_the_pokemon_output.png")
                .setFooter({text:`Requested By @${this.base.user.username}`,iconURL: this.base.user.displayAvatarURL()})
                    ],
                    files: [
                       this.file
                    ],
                    components: [
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder({ style: this.options.button.style, emoji: this.options.button.emoji || null, label: this.options.button.text, custom_id: "api.shockbs.is-a.dev/_npm_guessThePokemonGame", disabled: true})
                       )
                    ],
                    allowedMentions: {
                        repliedUser: false,
                        users: []
                    }
                })
            }
        })
        
    }
    
    async handleCollect(i) {
        const filter = (ii)=> {
            if (ii.user.id !== this.base.user.id) {
               ii.reply({content:`This is <@${this.base.user.id}>'s game!\n**Powered By:** [\`SHOCK API\`](<https://api.shockbs.is-a.dev>) **with** [\`ShockBS\`](<https://npmjs.com/package/shockbs>)`, ephemeral:true});
               return false;
            } else {
                const compare = stringSimilarity.compareTwoStrings(ii.fields.getTextInputValue("api.shockbs.is-a.dev_npm_guessThePokemonGame").toLowerCase(), this.data.name.toLowerCase());
                if (this.ended === true) {
                    return ii.reply({
                        ephemeral:true,
                        content: `😱Oh no!😱\n🤔Do you know why you got this response?🤔\n😥I was hosted on a terrible **__SLOW__ and __WEAK__** server!😭\n 😤This made the game initialization take a LOOOONNNNNGGG time(which should only take 100 milliseconds with a normal server😐), and this this message is here because something is fucking delayed \\:(`,
                        allowedMentions: {
                            repliedUser: true,
                            users: [this.base.user.id]
                        }
                    });
                }
                this.attempts ++
                if (compare >= 0.7) {
                    this.inter = ii;
                    return this.stopCollector();
                } else {
                    this.inter = false;
                    return ii.update({content:`[\`${this.options.embed.loseMessage.replaceAll("`",'\\`').replaceAll("]","\\]")}\`](<https://npmjs.com/package/shockbs>)\n### similarity: \`${compare}\`\n\`\`\`js\nAttempts: ${this.attempts}\n\`\`\``});
                }
                return true;
            }
        }
        await i.showModal(
            new ModalBuilder().setCustomId("npmjs.com/package/shockbs").setTitle("Who's the Pokemon?").addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("api.shockbs.is-a.dev_npm_guessThePokemonGame").setLabel("Input Answer").setStyle(TextInputStyle.Short).setRequired(true).setPlaceholder("Enter Answer Here").setMaxLength(24).setMinLength(4)))
        );
        if (this.inter !== false) return;
        try {
            this.i = await i.awaitModalSubmit({filter, time: this.options.time});
        } catch(eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee) {
            return;
        }
        return;
    }
    
    async initialize() {
        await this.setFile();
        try {
        await this.message.edit({
            content: "",
            embeds: [
                new EmbedBuilder()
                .setColor(this.options.embed.color)
                .setTitle(this.options.embed.title)
                .setURL("https://npmjs.com/package/shockbs")
                .setImage("attachment://api.shockbs.is-a.dev_guess_the_pokemon_output.png")
                .setFooter({text:`Requested By @${this.base.user.username}`,iconURL: this.base.user.displayAvatarURL()})
                .setDescription(`Please Answer <t:${Math.round((new Date().getTime() + this.options.time)/1000)}:R>`)
            ],
            components: [
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder({ style: this.options.button.style, emoji: this.options.button.emoji || null, label: this.options.button.text, custom_id: "api.shockbs.is-a.dev_npm_guessThePokemonGame"})
                )
            ],
            files: [
                this.file
            ],
            allowedMentions: {
                repliedUser: true,
                users: [this.base.user.id]
            }
        })
        } catch(e) {
            if (e.message.includes("color")) {
                throw new Error("Failed to convert color to string, option.embed.color is not a valid color")
            }
            throw new Error("Failed to edit message for initialization: "+e.message);
        }
    }
    
    async startGame() {
        if (this.options.baseType === "Interaction") {
            try {
                if (this.base.deferred) {
                    await this.base.editReply({content: "Loading...",allowedMentions:{repliedUser:false,users:[]}});
                    this.message = await this.base.fetchReply();
                } else if (this.base.replied) {
                    this.message = await this.base.fetchReply();
                    this.message.edit({
                        content: "Loading...",
                        embeds: [],
                        components: [],
                        files: [],
                        allowedMentions:{repliedUser:false,users:[]}
                    })
                } else {
                    this.message = await this.base.reply({content:"Loading...",allowedMentions:{repliedUser:false,users:[]}});
                }
            } catch(eeeee) {
                if (eeeee.message.includes("429") || eeeee.message.includes("Permission")) throw new Error(eeeee);
                throw new TypeError("You are not passing an Interaction as base, but provided options.baseType as \"Interaction\"");
            }
        } else {
            try {
                this.message = await this.base.reply({content:"Loading...",allowedMentions:{repliedUser:false,users:[]}});
            } catch(eeeeeeee) {
                if (eeeeeeee.message.includes("429") || eeeeeeee.message.includes("Permission")) throw new Error(eeeeeeee);
                throw new TypeError(`You are not passing an Message as base, but provided options.baseType as "Interaction"`);
            }
            this.base.user = this.base.author;
        }
        await this.fetchAPI();
        await this.initialize();
        await this.interaction();
    }
}