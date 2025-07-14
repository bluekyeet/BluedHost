const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("This will show the resources stats on the dashboard!")
    .addStringOption((option) =>
      option.setName("id").setDescription("Enter ID:").setRequired(false)
    ),

  async execute(interaction, client) {
    const id = interaction.options.getString("id") || interaction.member.user.id;
    const userid = parseInt(id);

    if (isNaN(userid)) {
      await interaction.reply({ content: "INVALID ID", ephemeral: true });
      return;
    }

    const options = {
      method: "GET",
      url: `${process.env.Dash_URL}/api/userinfo/`,
      params: { id: id },
      headers: { Authorization: `Bearer ${process.env.DASH_API}` },
    };

    try {
      const response = await axios.request(options);
      const data = response.data;

      if (data.status === "could not find user on panel") {
        await interaction.reply({ content: "INVALID ID", ephemeral: true });
        return;
      }

      const ram = data.package.ram + data.extra.ram;
      const disk = data.package.disk + data.extra.disk;
      const cpu = data.package.cpu + data.extra.cpu;
      const servers = data.package.servers + data.extra.servers;

      const embed = new EmbedBuilder()
        .setTitle(process.env.Name)
        .setColor(0x11cbcb)
        .setURL(`${process.env.Dash_URL}/dashboard`)
        .setDescription("User information of <@" + id + ">") 
        .setThumbnail(process.env.Icon)
        .addFields(
          { name: `Ram : `, value: "```" + `${ram} MB ` + "```", inline: true },
          { name: `Disk : `, value: "```" + `${disk} MB ` + "```" },
          { name: `CPU:`, value: "```" + `${cpu}% ` + "```" },
          { name: `Servers: `, value: "```" + `${servers} ` + "```" },
          { name: `User ID:`, value: "```" + id + "```" },
          { name: `Coins:`, value: "```" + data.coins + "```" }
        )
        .setTimestamp()
        .setFooter({ text: interaction.member.user.tag });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error fetching user info:", error);
      await interaction.reply({ content: "An error occurred while fetching user information.", ephemeral: true });
    }
  }
};