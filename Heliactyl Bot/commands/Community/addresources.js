const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const axios = require("axios");
require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addresources")
        .setDescription("This will set a resource for a specific user (Required Admin)")
        .addStringOption((option) =>
            option.setName("id").setDescription("Enter ID:").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("ram").setDescription("Enter RAM:").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("disk").setDescription("Enter DISK:").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("cpu").setDescription("Enter CPU:").setRequired(true)
        )
        .addStringOption((option) =>
            option.setName("servers").setDescription("Enter Servers:").setRequired(true)
        ),

    async execute(interaction, client) {
        // Fetch options from the interaction
        const ID = interaction.options.getString("id");
        const Iram = parseInt(interaction.options.getString("ram"));
        const Idisk = parseInt(interaction.options.getString("disk"));
        const Icpu = parseInt(interaction.options.getString("cpu"));
        const Iservers = parseInt(interaction.options.getString("servers"));

        // Check if the user has the admin role
        const isAdmin = interaction.member.roles.cache.has(process.env.Admin_ROLE_ID);
        if (isAdmin) {
            // Prepare data for the API request
            const data = { id: ID, ram: Iram, disk: Idisk, cpu: Icpu, servers: Iservers };
            try {
                // Send the API request
                const response = await axios.post(process.env.Dash_URL + '/api/addresources', data, {
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
                            `Successfully added the resources for user: \`\`\`${ID}\`\`\``
                        )
                        .setThumbnail(process.env.Icon)
                        .setTimestamp()
                        .setFooter({
                            text: interaction.member.user.tag,
                        });
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    await interaction.reply({
                        content: "INVALID RESPONSE!",
                        ephemeral: true,
                    });
                }
            } catch (error) {
                console.error("Error adding resources:", error);
                await interaction.reply({
                    content: "An error occurred while adding resources.",
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