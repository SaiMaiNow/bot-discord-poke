import dotenv from 'dotenv';
import { REST, Routes, Client, Events, GatewayIntentBits } from 'discord.js';

dotenv.config();

const commands = [
    {
        name: 'setup',
        description: 'Setup the bot',
        options: [
            {
                name: 'channel',
                description: 'The channel ID to setup',
                type: 4,
                required: true,
            },
        ],
    },
    {
        name: 'poke',
        description: 'Poke a user',
        options: [
            {
                name: 'user',
                description: 'The user to poke',
                type: 6,
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
} catch (error) {
    console.error(error);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on(Events.ClientReady, readyClient => {
    console.log(`Logged in as ${readyClient.user.tag}!`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'poke') {
        const user = interaction.options.getUser('user');
        if (!user) {
            await interaction.reply('Please provide a valid user to poke.');
            return;
        }

        await interaction.reply(`Poke ${user.username}!`);
    }
});

client.login(process.env.TOKEN);