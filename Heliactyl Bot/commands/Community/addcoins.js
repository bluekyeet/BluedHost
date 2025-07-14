const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addcoins")
        .setDescription("This will add coins to a specific user (Required Admin)")
        .addStringOption((option) =>
            option.setName("id").setDescription("Enter User ID:").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("coins").setDescription("Enter Coins:").setRequired(true)
        ),

    async execute(interaction, client) {
        // Fetch options from the interaction
        const Iuser = interaction.options.getString("id");
        const Icoins = parseInt(interaction.options.getString("coins"));
        
        // Check if the user has the admin role
        const isAdmin = interaction.member.roles.cache.has(process.env.Admin_ROLE_ID);
        if (isAdmin) {
            // Prepare data for the API request
            const data = { id: Iuser, coins: Icoins };
            try {
                // Send the API request
                const response = await axios.post(process.env.Dash_URL + '/api/addcoins', data, {
                    headers: {
                        'Authorization': `Bearer ${process.env.DASH_API}`
                    }
                });

                // Check the response
                if (response.data.status === 'success') {
                    const embed = new EmbedBuilder()
                        .setTitle(process.env.Name)
                        .setColor(0x11cbcb)
                        .setURL(`${process.env.Dash_URL}/dashboard`)
                        .setDescription(
                            `Successfully added ${Icoins} coins to [${Iuser}] :white_check_mark:`
                        )
                        .setThumbnail(process.env.Icon)
                        .setTimestamp()
                        .setFooter({
                            text: interaction.member.user.tag,
                        });
                    await interaction.reply({ embeds: [embed] });
                } else {
                    await interaction.reply({
                        content: "INVALID CODE!",
                        ephemeral: true,
                    });
                }
            } catch (error) {
                console.error("Error adding coins:", error);
                await interaction.reply({
                    content: "An error occurred while adding coins.",
                    ephemeral: true,
                });
            }
        } else {
            await interaction.reply({
                content: "Insufficient Permissions!",
                ephemeral: true,
            });
        }
    }
};