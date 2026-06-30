const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN || 'MTUxOTc1Mjk0ODQwODY1MjAwOA.GMu7pQ.smNqxbVQf3iA52B9WvkciIyxUmtcPWLNTX1qoU';
const CLIENT_ID = process.env.CLIENT_ID || '1519752948408652008';

// 🔧 Hardcode your fake/troll user ID here, or set it live with /rig
let RIGGED_WINNER_ID = '1519064660501074133';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
});

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 };

function parseDuration(text) {
  const match = /^(\d+)\s*([smhd])$/i.exec(text.trim());
  if (!match) return null;
  const [, amount, unit] = match;
  return parseInt(amount, 10) * UNIT_SECONDS[unit.toLowerCase()];
}

const activeGiveaway = {
  messageId: null,
  channelId: null,
  title: null,
  timeout: null,
};

const commands = [
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a timed giveaway')
    .addStringOption((opt) =>
      opt
        .setName('duration')
        .setDescription('e.g. 30s, 10m, 2h, 1d')
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('title').setDescription('Giveaway title/prize').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('endgiveaway')
    .setDescription('End the active giveaway early and draw a winner now'),
  new SlashCommandBuilder()
    .setName('rig')
    .setDescription('Set the rigged winner')
    .addUserOption((opt) =>
      opt.setName('user').setDescription('User who will "win"').setRequired(true)
    ),
].map((cmd) => cmd.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('Slash commands registered.');
  } catch (err) {
    console.error('Failed to register slash commands:', err);
  }
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'giveaway') {
    const durationArg = interaction.options.getString('duration');
    const title = interaction.options.getString('title');
    const seconds = parseDuration(durationArg);

    if (!seconds) {
      await interaction.reply({
        content: '⚠️ Bad duration. Use formats like `30s`, `10m`, `2h`, `1d`.',
        ephemeral: true,
      });
      return;
    }

    const endUnix = Math.floor(Date.now() / 1000) + seconds;

    const embed = new EmbedBuilder()
      .setTitle(`🎉 ${title} 🎉`)
      .setDescription(
        `React with 🎉 to enter!\nEnds: <t:${endUnix}:R> (<t:${endUnix}:F>)`
      )
      .setColor(0xffd700);

    await interaction.reply({ embeds: [embed] });
    const msg = await interaction.fetchReply();
    await msg.react('🎉');

    activeGiveaway.messageId = msg.id;
    activeGiveaway.channelId = msg.channel.id;
    activeGiveaway.title = title;

    if (activeGiveaway.timeout) clearTimeout(activeGiveaway.timeout);
    activeGiveaway.timeout = setTimeout(() => runDraw(msg.channel), seconds * 1000);
  }

  if (interaction.commandName === 'endgiveaway') {
    if (!activeGiveaway.messageId) {
      await interaction.reply({ content: 'No active giveaway!', ephemeral: true });
      return;
    }
    if (activeGiveaway.timeout) clearTimeout(activeGiveaway.timeout);
    await interaction.reply({ content: 'Ending giveaway...', ephemeral: true });
    await runDraw(interaction.channel);
  }

  if (interaction.commandName === 'rig') {
    const user = interaction.options.getUser('user');
    RIGGED_WINNER_ID = user.id;
    await interaction.reply({
      content: `✅ (quietly) winner set to <@${user.id}>`,
      ephemeral: true,
    });
  }
});

async function runDraw(channel) {
  if (!activeGiveaway.messageId) return;

  let entrants = [];
  try {
    const msg = await channel.messages.fetch(activeGiveaway.messageId);
    const reaction = msg.reactions.cache.get('🎉');
    if (reaction) {
      const users = await reaction.users.fetch();
      entrants = users.filter((u) => !u.bot).map((u) => u.username);
    }
  } catch (err) {
    console.error('Failed to fetch giveaway message:', err);
  }

  const namesPool = entrants.length ? entrants : ['Mystery Entrant'];
  const suspense = await channel.send('🎲 Picking a winner...');

  for (let i = 0; i < 8; i++) {
    const fakePick = namesPool[Math.floor(Math.random() * namesPool.length)];
    await suspense.edit(`🎲 Picking a winner... **${fakePick}**?`);
    await new Promise((res) => setTimeout(res, 600));
  }

  await suspense.edit(
    `🎉 **Winner of ${activeGiveaway.title}**: <@${RIGGED_WINNER_ID}>\n\nFUCK THIS NIGGER WINS`
  );

  activeGiveaway.messageId = null;
  activeGiveaway.channelId = null;
  activeGiveaway.title = null;
  activeGiveaway.timeout = null;
}

client.login(TOKEN);
