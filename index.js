import dotenv from 'dotenv';
import { REST, Routes, Client, Events, GatewayIntentBits, ChannelType } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const commands = [
    {
        name: 'setup',
        description: 'Setup the bot',
        options: [
            {
                name: 'channel',
                description: 'The channel ID to setup',
                type: 7,
                required: true,
                channel_types: [2]
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

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
    console.log('Successfully deleted all guild commands.');

    await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
    console.log('Successfully registered guild commands.');

} catch (error) {
    console.error(error);
}

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ] 
});

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

        const member = await interaction.guild.members.fetch(user.id);
        if (!member.voice.channel) {
            await interaction.reply('ผู้ใช้ที่คุณต้องการ poke ไม่ได้อยู่ในห้องเสียง');
            return;
        }

        const setup = await fs.readFile(path.join(__dirname, 'setup.json'), 'utf8');
        const setupData = JSON.parse(setup);

        const targetChannel = client.channels.cache.get(setupData.channelId);
        if (!targetChannel) {
            await interaction.reply('Please setup the channel first.');
            return;
        }

        const originalChannel = member.voice.channel;

        try {
            await interaction.deferReply();
            await interaction.editReply(`${interaction.user.username} Poke ${user.username} 😈`);

            for (let i = 0; i < 10; i++) {
                await member.voice.setChannel(targetChannel);
                await new Promise(resolve => setTimeout(resolve, 100));
                await member.voice.setChannel(originalChannel);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            await interaction.editReply(`${user.username} มาได้เเล้วมั้งน่อง😑`);
        } catch (error) {
            await interaction.editReply('ไม่สามารถย้ายผู้ใช้ได้ กรุณาตรวจสอบสิทธิ์ของบอท');
        }
    } else if (interaction.commandName === 'setup') {
        const channel = interaction.options.getChannel('channel');
        if (!channel) {
            await interaction.reply('Please provide a valid channel to setup.');
            return;
        }

        if (channel.type !== ChannelType.GuildVoice) {
            await interaction.reply('Please provide a valid voice channel to setup.');
            return;
        }

        fs.writeFile(path.join(__dirname, 'setup.json'), JSON.stringify({ channelId: channel.id }, null, 2));

        await interaction.reply(`Setup Bot successfully ${channel.name}! 👍`);
    }
});

client.login(process.env.TOKEN);