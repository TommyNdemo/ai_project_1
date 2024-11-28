const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to fetch Groq Chat Completion
async function getGroqChatCompletion(topic) {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: `Explain the importance of ${topic}`,
                },
            ],
            model: "llama3-8b-8192",
        });
        return chatCompletion.choices[0]?.message?.content || "No explanation available.";
    } catch (error) {
        console.error("Error fetching Groq completion:", error);
        return "Failed to fetch Groq explanation.";
    }
}

// API Endpoint
app.post("/api/fetchResources", async (req, res) => {
    const { topic } = req.body;

    try {
        // Fetch Groq Explanation
        const groqExplanation = await getGroqChatCompletion(topic);

        // Fetch YouTube Videos
        const youtubeResponse = await axios.get(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${topic}&key=${YOUTUBE_API_KEY}`
        );
        const youtubeVideos = youtubeResponse.data.items.map((video) => ({
            title: video.snippet.title,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        }));

        // Fetch Google Books
        const booksResponse = await axios.get(
            `https://www.googleapis.com/books/v1/volumes?q=${topic}`
        );
        const books = booksResponse.data.items.map((book) => ({
            title: book.volumeInfo.title,
            link: book.volumeInfo.infoLink,
        }));

        res.json({ groqExplanation, youtubeVideos, books });
    } catch (error) {
        console.error("Error fetching resources:", error);
        res.status(500).json({ error: "Failed to fetch resources." });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
