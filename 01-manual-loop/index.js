// 01-manual-loop/index.js

import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();

/**
 * APPROACH 1: THE MANUAL CONTROL LOOP (ANTHROPIC EDITION)
 * 
 * CORE CONCEPTS:
 * 1. The History: Anthropic expects an array of `{ role: 'user' | 'assistant', content: ... }`.
 * 2. Tool Definitions: Similar JSON schema, but structured slightly differently in the request.
 * 3. The Loop: We check for `stop_reason === 'tool_use'`.
 */

// 1. Setup the Client
// -------------------
// You will need an ANTHROPIC_API_KEY in your .env file
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// 2. Define Your "Hands" (The Tools)
// ----------------------------------
function getWeather(location) {
    console.log(`\n> [Tool Action] Checking weather for: ${location}...`);
    if (location.toLowerCase().includes('london')) return 'Raining, 15°C';
    if (location.toLowerCase().includes('paris')) return 'Cloudy, 18°C';
    return 'Sunny, 25°C';
}

// 3. Define the Tool Schemas
// --------------------------
const tools = [
    {
        name: 'getWeather',
        description: 'Get the current weather in a given location',
        input_schema: {
            type: 'object',
            properties: {
                location: {
                    type: 'string',
                    description: 'The city and state, e.g. San Francisco, CA',
                },
            },
            required: ['location'],
        },
    },
];

// 4. The Agent Loop
// -----------------
async function runAgent(userQuery) {
    console.log(`\n> [User Input] "${userQuery}"`);

    // Initialize conversation history
    const messages = [
        { role: 'user', content: userQuery },
    ];

    while (true) {
        // STEP A: THINK
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: messages,
            tools: tools,
        });

        // Add the assistant's response to history
        // Anthropic returns the full content block (text + tool_use blocks)
        messages.push({
            role: 'assistant',
            content: response.content,
        });

        // STEP B: CHECK
        // If the stop reason wasn't 'tool_use', we are done.
        if (response.stop_reason !== 'tool_use') {
            // Find the text content to print
            const textBlock = response.content.find(block => block.type === 'text');
            if (textBlock) {
                console.log(`\n> [Agent Response] ${textBlock.text}`);
            }
            break;
        }

        // STEP C: ACT
        // The model wants to use tools. 
        // We need to construct a 'tool_result' message for EACH tool use block.
        // Unlike OpenAI, Anthropic expects the results in a separate 'user' block 
        // containing 'tool_result' items.

        // We scan the content for blocks of type 'tool_use'
        const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
        const toolResultContent = [];

        for (const toolUse of toolUseBlocks) {
            const fnName = toolUse.name;
            const fnArgs = toolUse.input;

            if (fnName === 'getWeather') {
                const result = getWeather(fnArgs.location);

                // Construct the result block
                toolResultContent.push({
                    type: 'tool_result',
                    tool_use_id: toolUse.id,
                    content: result,
                });
            }
        }

        // STEP D: OBSERVE
        // Add the results back to history as a USER message containing tool results
        messages.push({
            role: 'user',
            content: toolResultContent,
        });

        // Loop continues...
    }
}

runAgent('What is the weather in London?');
