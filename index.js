import Anthropic from "@anthropic-ai/sdk";
import config from "./config.js";
import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import e from "express";

// Create Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/info", async (req, res) => {
    try {
        let token = req.query.token;

        if (!token) {
            return res.status(400).json({ success: false, remaining: 0 });
        }

        const response = await axios.get(config.limit_handler, {
            params: {
                token: token,
                method: "getLimits",
            },
        });

        if (response.data.success) {
            return res.json({ success: true, remaining: response.data.requests_left });
        }

        return res.status(400).json({ success: false, remaining: 0 });
    } catch (error) {
        res.status(500).json({ success: false, remaining: 0 });
    }
});

app.post("/complete", async (req, res) => {
    try {
        let prompt = req.body.prompt;
        let system = req.body.system ?? "";
        let token = req.query.token;

        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required" });
        }

        if (!token) {
            return res.status(400).json({ error: "Token is required" });
        }

        const token_response = await axios.get(config.limit_handler, {
            params: {
                token: token,
                method: "consumeRequest",
            },
        });

        if (!token_response.data.success) {
            return res.json({ info: "Invalid Token or Out of Tokens", response: "" });
        }

        const anthropic = new Anthropic({
            apiKey: config.tokens.claude,
        });

        let msg;

        if(system != ""){
            msg = await anthropic.messages.create({
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 1024,
                system: system,
                messages: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            });
        }
        else{
            msg = await anthropic.messages.create({
                model: "claude-3-7-sonnet-20250219",
                max_tokens: 1024,
                messages: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ]
            });
        }

        msg = msg ?? {};

        console.log(msg);

        return res.json({ response: msg });
    } catch (error) {
        console.log(error);
        res.json({ info: "Internal Server Error", response: "" });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
