require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
  ],
});

const USER_ID = "1528524235566354542"; // Replace with the user's Discord ID

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const user = await client.users.fetch(USER_ID);

    await user.send("please im sorry come back");

    console.log("DM sent successfully!");
  } catch (err) {
    console.error("Failed to send DM:", err);
  }

  process.exit(0);
});

client.login(process.env.TOKEN);
