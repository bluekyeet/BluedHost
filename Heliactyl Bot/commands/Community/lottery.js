const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lottery")
    .setDescription("Guess a number from 1-50 to gamble 50 coins in a lottery.") 
    .addStringOption((option) =>
      option.setName("number").setDescription("Enter number: ").setRequired(true)
    ),

  async execute(interaction, client) {
    guessnumber = interaction.options.getString("number");
    const id = interaction.member.user.id;

    if (guessnumber <= 0 || guessnumber >= 51) {
      await interaction.reply({ content: "Invalid Number. Guess a number 1-100.", ephemeral: true });
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

      if (data.coins < 50) {
        await interaction.reply({ content: "You do not have enough coins to gamble.", ephemeral: true });
        return;
      }

      const postlottery = { id: id, number: guessnumber };
      const postoptions = {
        method: "POST",
        url: `http://node-1.bluekyeet.me:25004/enter`,
        data: postlottery,
      };
      const setcoins = { id: id, coins: data.coins - 50 };

      try {
        const postResponse = await axios.request(postoptions);
        const postData = postResponse.data;
        if (postData.error) {
          await interaction.reply({ content: postData.error, ephemeral: true });
        } else {
          await axios.post(`${process.env.Dash_URL}/api/setcoins`, setcoins);
          await interaction.reply({ content: postData.message });
        }
      } catch (error) {
        console.error("Error entering lottery:", error);
        await interaction.reply({ content: "An error occurred while entering the lottery.", ephemeral: true });
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      await interaction.reply({ content: "An error occurred while fetching user information.", ephemeral: true });
    }
  }
};