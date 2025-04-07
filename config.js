require("dotenv").config();

module.exports = {
    tokens: {
        claude: process.env.CLAUDE_TOKEN,
    },
    limit_handler: "https://claude.dssoftware.ru/",
};
