require("dotenv").config();
const fetch = require("node-fetch");

const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Start bot
client.on("ready", () => {
    console.log(`Bot logged in as ${client.user.tag}`);
    console.log(`Logged in as ${client.user.tag}`);
});

// Listen for messages
client.on("messageCreate", (message) => {
    console.log("message : ", message)
    console.log(`Message from ${message.author.username}: ${message.content}`);

    if (message.content === "!hello") {
        message.reply("Hello from Express + Discord Bot!");
    }

    if (message.attachments.size > 0) {
        message.attachments.forEach((attachment) => {
            console.log("Attachment found!");
            console.log("Filename:", attachment.name);
            console.log("URL:", attachment.url);
            console.log("Content type:", attachment.contentType); // sometimes available
        });
    }
});

// Create a channel
async function createChannel(channelName) {
    console.log("Creating channel with name:", channelName);

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    console.log("Guild fetched:", guild.name);

    const result = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
    });

    console.log("Channel created:", result.name);
    return result;
}


async function createPrivateChannel(channelName, allowedMemberIds = []) {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);

    // Set permissions: deny @everyone
    const permissionOverwrites = [
        {
            id: guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel]
        }
    ];

    // Give access to selected members
    allowedMemberIds.forEach(id => {
        permissionOverwrites.push({
            id: id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    });

    // Optionally, allow admins to view the channel
    const adminRole = guild.roles.cache.find(role =>
        role.permissions.has(PermissionFlagsBits.Administrator)
    );
    if (adminRole) {
        permissionOverwrites.push({
            id: adminRole.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
            ]
        });
    }

    // Create the private text channel
    const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: permissionOverwrites
    });

    console.log("Private channel created:", channel.name);
    return channel;
}


async function addMemberToChannel(channelId, memberId) {
    try {
        // Fetch the channel
        const channel = await client.channels.fetch(channelId);
        if (!channel) return console.log("Channel not found");

        // Add permission overwrite for this member
        await channel.permissionOverwrites.edit(memberId, {
            ViewChannel: true,        // allow them to see the channel
            SendMessages: true,       // allow them to send messages
            ReadMessageHistory: true  // allow them to read old messages
        });

        console.log(`Member ${memberId} now has access to channel ${channel.name}`);
    } catch (error) {
        console.error("Failed to add member to channel:", error);
    }
}

// Create an invite link for a channel
async function createInvite(channelId) {
    const channel = await client.channels.fetch(channelId);
    return channel.createInvite({ maxAge: 3600, maxUses: 1 });
}

async function deleteChannel(channelId) {
    try {
        // Fetch the channel
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.log("Channel not found!");
            return;
        }

        // Delete the channel
        await channel.delete();
        console.log(`Channel ${channel.name} deleted successfully`);
    } catch (err) {
        console.error("Error deleting channel:", err);
    }
}


async function sendMessageToChannel(channelId, content) {
    try {
        // Fetch the channel by ID
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.log("Channel not found!");
            return;
        }

        // Send the message
        await channel.send(content);
        console.log(`Message sent to channel ${channel.name}`);
    } catch (err) {
        console.error("Error sending message:", err);
    }
}


async function sendFileToChannel(channelId, filePathOrUrl, content = "") {
    try {
        // Fetch the channel
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.log("Channel not found!");
            return;
        }

        // Send the file (can include optional text content)
        await channel.send({
            content: content,          // optional text
            files: [filePathOrUrl]     // path or URL of file
        });

        console.log(`File sent to channel ${channel.name}`);
    } catch (err) {
        console.error("Error sending file:", err);
    }
}

async function sendBufferToChannel(channelId, buffer, fileName, content = "") {
    try {
        const channel = await client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
            throw new Error("Channel not found or not text-based");
        }

        // Send the buffer as a file attachment with original name
        const message = await channel.send({
            content: content,
            files: [{ attachment: buffer, name: fileName }]
        });

        console.log(`Buffer sent to channel ${channel.name} as ${fileName}`);
        return message;
    } catch (err) {
        console.error("Error sending buffer:", err);
        throw err;
    }
}



// type: 0 → text channel
// type: 2 → voice channel
async function getAllChannelIds(guildId) {
    try {
        // Fetch the guild (server) by ID
        const guild = await client.guilds.fetch(guildId);
        console.log("Guild fetched:", guild.name);

        // Fetch all channels in the guild
        await guild.channels.fetch(); // make sure cache is populated

        // Map channel names to IDs
        const channels = guild.channels.cache.map(channel => ({
            id: channel.id,
            name: channel.name,
            type: channel.type
        }));

        return channels; // returns an array of {id, name, type}
    } catch (error) {
        console.error("Failed to get channels:", error);
    }
}

async function getAllUsers(guildId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        console.log("Guild fetched:", guild.name);

        // Fetch all members
        const getUsers = await guild.members.fetch(); // populates cache with all members
        console.log("Members fetched:", getUsers);

        // Map user details
        const users = guild.members.cache.map(member => ({
            id: member.user.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            tag: member.user.tag,
            isBot: member.user.bot
        }));
        console.log("Users fetched:", users);
        return users; // array of user details
    } catch (error) {
        console.error("Failed to fetch users:", error);
    }
}



module.exports = { client, createChannel, createInvite, deleteChannel, sendMessageToChannel, getAllChannelIds, getAllUsers, sendBufferToChannel, sendFileToChannel, addMemberToChannel, createPrivateChannel };

