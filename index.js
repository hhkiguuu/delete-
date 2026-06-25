const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  if (message.content !== "!deleteroles") return;

  // check admin permission
  if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    return message.reply("You need Administrator permission.");
  }

  const botMember = message.guild.members.me;

  let deleted = 0;

  const roles = message.guild.roles.cache
    .sort((a, b) => b.position - a.position);

  for (const role of roles.values()) {
    try {
      // skip @everyone
      if (role.id === message.guild.id) continue;

      // skip roles higher or equal to bot
      if (role.position >= botMember.roles.highest.position) continue;

      await role.delete("Mass role delete command");
      deleted++;
    } catch (err) {
      console.log(`Failed to delete role ${role.name}`);
    }
  }

  message.channel.send(`Deleted **${deleted} roles**.`);
});

client.login(process.env.TOKEN);
