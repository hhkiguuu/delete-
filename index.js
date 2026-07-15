const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kickall")
    .setDescription("Kick all members.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const ownerId = interaction.guild.ownerId;

    await interaction.reply({
      content: "Starting to kick members...",
      ephemeral: true,
    });

    const members = await interaction.guild.members.fetch();

    let kicked = 0;
    let failed = 0;

    for (const [, member] of members) {
      if (
        member.id === interaction.client.user.id ||
        member.id === ownerId ||
        member.user.bot ||
        !member.kickable
      ) {
        continue;
      }

      try {
        await member.kick("Server revamp");
        kicked++;
      } catch {
        failed++;
      }

      // Prevent hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await interaction.followUp({
      content: `Finished.\n✅ Kicked: ${kicked}\n❌ Failed: ${failed}`,
      ephemeral: true,
    });
  },
};
