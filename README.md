# AI-Driven Rule Automation System for RooCode

## 📌 What the project does

This project is an AI-driven rule automation system designed to enhance RooCode code generation. It integrates AI to analyze code, extract new rules, and automatically apply them to the codebase, ensuring code quality and consistency. The system features a Main Control Process (MCP) that orchestrates various components, including a rules database, AI-powered analysis tools, and an interactive mode for direct code adjustments.

## ⚙️ Requirements and dependencies

*   **Node.js:** v18 or higher
*   **npm:** v8 or higher
*   **Environment Paths:** Ensure that the necessary environment variables (AI_URL,AI_KEY,MODEL)

## ▶️ How to run the project

### Local MCP Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```
2.  **Configure environment variables:**

    Create a `.env` file in the project root with the following variables:

    *   `WORKSPACE_PATH`: The path to the project you want to analyze.
    *   `CONVERSATION_ID`: The ID of the conversation for the AI to use (optional).

    Example `.env` file:

    ```env
    WORKSPACE_PATH=/path/to/your/roocode/project
    CONVERSATION_ID=123
    ```
3.  **Start the local MCP:**

    ```bash
    npm start
    ```

### Client Launching

1.  **Open a new terminal** in the project directory.
2.  **Run the client interface:**

    ```bash
    node client.js
    ```

    This will connect to the local MCP and provide an interactive command-line interface.

## 🧪 How to test or debug

*   **Logs:** Check the `error-logs.txt` file for any errors or issues during the execution of the system.
*   **Mock Rules:** You can create mock rules in the `ressources/` directory to test the rule application process.
*   **Client Debugging:** Use the `console.log` statements in `client.js` to debug the client interface.

## 🧰 Description of tools and their purpose

The `tools/` directory contains various scripts used by the AI automation engine:

*   **ai\_analyze.js:** Analyzes code using AI models.
*   **ai\_gateway\_handler.js:** Handles requests to the AI gateway.
*   **analyze\_code.js:** Analyzes code for potential issues and violations.
*   **analyze\_file.js:** Analyzes a single file for potential issues and violations.
*   **apply\_rule.js:** Applies a specific rule to the codebase.
*   **apply\_rules.js:** Applies a set of rules to the codebase.
*   **delete\_rule.js:** Deletes a rule from the rule set.
*   **list\_rules.js:** Lists all available rules.
*   **process\_message.js:** Processes messages within the MCP.

## 🧠 How the AI components work

1.  **AI-Driven Rule Extraction (ai\_gateway\_handler.js):** This component analyzes files or documents to automatically extract new, applicable rules. It uses AI models to understand the code and identify patterns that can be formalized as rules.
2.  **AI Automation Engine (ai\_gateway.js):** This engine applies matching rules based on the current project context. It communicates with the rules database (`db.service.js`) to fetch relevant rules and uses the tools in the `tools/` directory to modify the project accordingly.

## 📂 Project folder structure

```
.
├── .env                    # Environment configuration file
├── .roo                    # RooCode configuration directory
├── ai_gateway.js           # AI automation engine
├── client.js               # Client interface
├── config                  # Configuration files
├── conversations           # Conversation history
├── error-logs.txt          # Error logs
├── index.js                # Main control process (MCP)
├── logger.js               # Logging utility
├── manifest.json           # Project manifest
├── package-lock.json       # npm package lock file
├── package.json            # npm package configuration
├── README.md               # Project README
├── ressources              # Resources directory (e.g., mock rules)
├── services                # Services (e.g., rules database)
│   └── db.service.js       # Rules database service
└── tools                   # Automation tools
    ├── ai_analyze.js
    ├── ai_gateway_handler.js
    ├── analyze_code.js
    ├── analyze_file.js
    ├── apply_rule.js
    ├── apply_rules.js
    ├── delete_rule.js
    ├── list_rules.js
    └── process_message.js
```

## 📝 Example command to start everything

1.  **Start the local MCP:**

    ```bash
    npm start
    ```
2.  **In a separate terminal, launch the client:**

    ```bash
    node client.js
    ```

This will start the local rule application system and allow you to interact with it through the client interface.

## 🚀 How to use the system in relation to the rules

To effectively use this system, you can start by asking for something related to the rules. For instance, you might request the system to "list all rules related to code style" or "apply accessibility rules to the current project." The AI will then process your request, fetch the relevant rules from the database, and use the appropriate tools to analyze or modify the codebase accordingly.
