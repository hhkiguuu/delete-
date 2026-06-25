const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`${client.user.tag} is online`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!deleteroles") return;

  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator))
    return message.reply("Administrator only.");

  let deleted = 0;

  for (const role of message.guild.roles.cache.values()) {
    if (
      role.id === message.guild.id ||
      role.position >= message.guild.members.me.roles.highest.position
    ) continue;

    try {
      await role.delete("Mass role deletion");
      deleted++;
    } catch {}
  }

  message.reply(`Deleted ${deleted} roles.`);
});

client.login(process.env.TOKEN);
