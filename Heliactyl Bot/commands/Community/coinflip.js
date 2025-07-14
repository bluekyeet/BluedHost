const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Bet your coins on a coinflip.") 
    .addStringOption((option) =>
      option.setName("coins").setDescription("Enter number: ").setRequired(true)
    )
    .addStringOption(option =>
      option.setName('coin')
        .setDescription('Choose heads or tails.')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: "1" },
          { name: 'Tails', value: "2" },
        )),

  async execute(interaction, client) {
    const coinstogamble = parseInt(interaction.options.getString("coins"));
    const userChoice = interaction.options.getString("coin");
    const id = interaction.member.user.id;

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

      if (data.coins < coinstogamble) {
        await interaction.reply({ content: "You do not have enough coins to gamble.", ephemeral: true });
        return;
      }

      if (coinstogamble < 0) {
        await interaction.reply({ content: "Fuck off", ephemeral: true });
        return;
      }


      // Generate a rigged result for the coin flip (35% chance to win)
      const randomValue = Math.random();
      const coinflipResult = randomValue < 0.35 ? userChoice : (userChoice === "1" ? "2" : "1");

      let resultMessage;
      if (coinflipResult === userChoice) {
        // User wins
        const newBalance = data.coins + Number((coinstogamble * 2));
        resultMessage = `Congratulations! You won ${coinstogamble * 2} coins.`;
        // Update user's coin balance
        await axios.post(`${process.env.Dash_URL}/api/setcoins`, {
          id: id,
          coins: newBalance
        }, {
          headers: { Authorization: `Bearer ${process.env.DASH_API}` }
        });
      } else {
        // User loses
        const newBalance = data.coins - Number(coinstogamble);
        resultMessage = `Sorry! You've lost ${coinstogamble} coins.`;
        // Update user's coin balance
        await axios.post(`${process.env.Dash_URL}/api/setcoins`, {
          id: id,
          coins: newBalance
        }, {
          headers: { Authorization: `Bearer ${process.env.DASH_API}` }
        });
      }

      await interaction.reply({ content: resultMessage});

    } catch (error) {
      console.error("Error fetching user info:", error);
      await interaction.reply({ content: "An error occurred while fetching user information.", ephemeral: true });
    }
  }
};