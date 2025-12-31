const express = require("express");
require("dotenv").config();
// import fetch from 'node-fetch';
const fs = require("fs");
const path = require("path");



const app = express();
app.use(express.json());

const { client, createChannel, createInvite, deleteChannel, sendMessageToChannel, getAllChannelIds, getAllUsers, addMemberToChannel, sendBufferToChannel, sendFileToChannel, createPrivateChannel } = require("./discordBot");

// API: Create Channel
app.post("/create-channel", async (req, res) => {
    try {
        const { name } = req.body;
        console.log("req.body:", req.body);
        const channel = await createChannel(name);
        console.log("channel create : ", channel)
        console.log('hello')
        res.json({ success: true, channelId: channel.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



app.delete("/delete-channel", async (req, res) => {
    try {
        console.log("req.body:", req.body);
        const { channelId } = req.body; // JSON body: { "channelId": "1234567890" }
        console.log(
            "channelId to delete : ", channelId
        )
        await deleteChannel(channelId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// API: Create Invite Link
app.post("/create-invite", async (req, res) => {
    try {
        const { channelId } = req.body;
        const invite = await createInvite(channelId);
        res.json({ link: invite.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.post("/send-message", async (req, res) => {
    try {
        const { channelId, content } = req.body; // { "channelId": "123", "content": "Hello!" }
        await sendMessageToChannel(channelId, content);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/getAllChannelIds", async (req, res) => {
    try {
        const { guildId } = req.body; // { "guildId": "1234567890" }   
        const channelIds = await getAllChannelIds(guildId);
        res.json({ channelIds });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

app.post("/getAllUsers", async (req, res) => {
    try {
        const { guildId } = req.body; // { "guildId": "1234567890" } 
        const users = await getAllUsers(guildId);
        console.log("users:", users);
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

app.post("/addMemberToChannel", async (req, res) => {
    try {
        const { channelId, memberId } = req.body; // { "channelId": "1234567890", "memberId": "0987654321" } 
        const result = await addMemberToChannel(channelId, memberId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

app.post("/createPrivateChannel", async (req, res) => {
    try {
        const { channelName, memberIds } = req.body; // { "channelName": "private-channel", "memberIds": ["id1", "id2"] }
        const channel = await createPrivateChannel(channelName, memberIds);
        res.json({ success: true, channelId: channel.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})


app.post("/sendFileToChannel", async (req, res) => {
    try {
        const { channelId, filePathOrUrl, content } = req.body; // { "channelId": "123", "filePathOrUrl": "path_or_url", "content": "Optional message" }    
        const result = await sendFileToChannel(channelId, filePathOrUrl, content);
        res.json({ success: true, result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// app.post("/sendBufferToChannel", async (req, res) => {
//     try {
//         const { channelId, imageUrl, fileName, content } = req.body;

//         if (!channelId || !imageUrl || !fileName) {
//             return res.status(400).json({ error: "Missing required fields" });
//         }

//         const channel = await client.channels.fetch(channelId);
//         if (!channel || !channel.isTextBased()) {
//             return res.status(404).json({ error: "Channel not found or not text-based" });
//         }

//         const fullPath = path.resolve(imageUrl); // make absolute path
//         console.log("fullPath:", fullPath);

//         const message = await channel.send({
//             content: content || "",
//             files: [{ attachment: fullPath, name: fileName }]
//         });

//         res.json({ success: true, messageId: message.id });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: err.message });
//     }
// });




// Start express server

app.post("/sendBufferToChannel", async (req, res) => {
    try {
        const { channelId, filePath, content } = req.body; // no need for fileName anymore

        if (!channelId || !filePath) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const fullPath = path.resolve(filePath);
        if (!fs.existsSync(fullPath)) {
            return res.status(404).json({ error: "File not found" });
        }

        // Extract original file name from path
        const originalFileName = path.basename(fullPath);

        const buffer = fs.readFileSync(fullPath);

        // Send the file buffer to Discord with original name
        const message = await sendBufferToChannel(channelId, buffer, originalFileName, content);

        res.json({ success: true, messageId: message.id, message: "File sent successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});



app.listen(3000, () => {
    console.log(" Express API running on port 3000");
});

// Login bot
client.login(process.env.DISCORD_TOKEN);
