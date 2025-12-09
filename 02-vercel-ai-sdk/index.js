// 02-vercel-ai-sdk/index.js

import { anthropic } from '@ai-sdk/anthropic';
import { generateText, tool } from 'ai';
import { z } from 'zod';

/**
 * APPROACH 2: VERCEL AI SDK (ANTHROPIC EDITION)
 * 
 * This is the modern, "Web-First" way to build agents.
 * 
 * KEY DIFFERENCES VS MANUAL:
 * 1. Declarative Tools: You bind the implementation directly to the definition using `tool()`.
 * 2. Automatic Looping: The `maxSteps` parameter tells the SDK "you are allowed to loop N times".
 * 3. Type Safety: It uses Zod to validate LLM inputs automatically before your function ever runs.
 */

// 1. Define the Agent Logic
// -----------------------
async function runAgent(userQuery) {
    console.log(`\n > [User Input] "${userQuery}"`);

    // The SDK abstracts the entire loop into a single function call.
    const { text, steps } = await generateText({
        model: anthropic('claude-3-5-sonnet-20241022'),
        prompt: userQuery,

        // 2. Define Tools
        // ---------------
        // Notice how the definition (description/parameters) and implementation (execute)
        // are bundled together. No splitting "schema" and "function" manually.
        tools: {
            getWeather: tool({
                description: 'Get the current weather in a given location',
                parameters: z.object({
                    location: z.string().describe('The city and state, e.g. San Francisco, CA'),
                }),
                execute: async ({ location }) => {
                    console.log(`\n > [Tool Action] Checking weather for: ${location}...`);
                    if (location.toLowerCase().includes('london')) return 'Raining, 15°C';
                    if (location.toLowerCase().includes('paris')) return 'Cloudy, 18°C';
                    return 'Sunny, 25°C';
                },
            }),
        },

        // 3. Enable Agency
        // ----------------
        // This simple number enables the "Agentic Loop". 
        // If > 1, the model can call a tool, see the result, and call another tool (or answer).
        maxSteps: 5,
    });

    // 4. Result
    // ---------
    console.log(`\n > [Agent Response] ${text} `);

    // Optional: Inspect the "Thought Process"
    // console.log('Steps taken:', steps);
}

// Run the demo
runAgent('What is the weather in London?');
