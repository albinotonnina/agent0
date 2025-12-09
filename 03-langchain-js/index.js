// 03-langchain-js/index.js

import { ChatAnthropic } from "@langchain/anthropic";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
dotenv.config();

/**
 * APPROACH 3: LANGCHAIN.JS (ANTHROPIC EDITION)
 * 
 * LangChain is a comprehensive framework that provides "Batteries Included" for agents.
 * 
 * KEY CONCEPTS:
 * 1. AgentExecutor: A runtime that manages the loop, error handling, and memory for you.
 * 2. Chains: You compose "Prompt + Model + Output Parser" into a chain.
 * 3. Standardized Tools: heavily abstracted tool classes that plug into any agent type.
 */

async function runAgent(userQuery) {
    console.log(`\n> [User Input] "${userQuery}"`);

    // 1. Setup the Model
    const llm = new ChatAnthropic({
        modelName: "claude-3-5-sonnet-20241022",
        temperature: 0,
    });

    // 2. Define Tools
    // LangChain uses specific classes for tools
    const weatherTool = new DynamicStructuredTool({
        name: "getWeather",
        description: "Get the current weather in a given location",
        schema: z.object({
            location: z.string().describe("The city and state, e.g. San Francisco, CA"),
        }),
        func: async ({ location }) => {
            console.log(`\n> [Tool Action] Checking weather for: ${location}...`);
            if (location.toLowerCase().includes('london')) return 'Raining, 15°C';
            if (location.toLowerCase().includes('paris')) return 'Cloudy, 18°C';
            return 'Sunny, 25°C';
        },
    });

    const tools = [weatherTool];

    // 3. Create the Agent Definition
    // This defines "How" the agent thinks (the prompt structure)
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are a helpful assistant"],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"], // Where the agent's internal thought process goes
    ]);

    const agent = await createToolCallingAgent({
        llm,
        tools,
        prompt,
    });

    // 4. Create the Executor
    // The Executor is the "Loop" manager. It runs the agent, executes tools, and loops back.
    const agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: false, // Set to true to see LangChain's internal logs
    });

    // 5. Run
    const result = await agentExecutor.invoke({
        input: userQuery,
    });

    console.log(`\n> [Agent Response] ${result.output}`);
}

// Run the demo
runAgent("What is the weather in London?");
