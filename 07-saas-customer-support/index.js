// 07-saas-customer-support/index.js

import { StateGraph, END } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import dotenv from 'dotenv';
dotenv.config();

/**
 * APPROACH 7: SAAS CUSTOMER SUPPORT (With LangSmith Observability)
 * 
 * SCENARIO: A Technical Support Bot for "SuperCloud API".
 * 
 * WHY LANGSMITH?
 * When you have a support bot, you need to know:
 * 1. "Why did it give the wrong answer?" (Tracing)
 * 2. "Is it retrieving the right docs?" (Retriever Evaluation)
 * 3. "Are users happy?" (Feedback Loop)
 * 
 * This agent performs Retrieval Augmented Generation (RAG) and logs
 * every step to LangSmith for the developer to inspect.
 */

// 1. Mock Knowledge Base (The "Docs")
// -----------------------------------
const KNOWLEDGE_BASE = [
    { id: 1, text: "The API rate limit is 1000 requests per minute for Pro users." },
    { id: 2, text: "To reset your API key, go to Settings > Security > Rotate Keys." },
    { id: 3, text: "Error 500 means the server is down. Check status.supercloud.com." },
    { id: 4, text: "The SDK supports Python 3.8+ and Node.js 14+." }
];

// 2. Setup State
// --------------
const AgentState = {
    question: null,
    retrievedDocs: [],
    answer: null,
};

// 3. Setup Model
// --------------
const model = new ChatAnthropic({
    modelName: "claude-3-5-sonnet-20241022",
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// 4. Nodes
// --------

// A. Retriever Node (Finds relevant info)
async function nodeRetrieve(state) {
    console.log(`\n[Agent] Searching docs for: "${state.question}"...`);

    // Naive keyword match for demo. In real life, use vector search.
    const query = state.question.toLowerCase();
    const docs = KNOWLEDGE_BASE.filter(doc => {
        const words = query.split(" ");
        return words.some(w => w.length > 3 && doc.text.toLowerCase().includes(w));
    });

    // Fallback
    const finalDocs = docs.length > 0 ? docs : [{ text: "No relevant documentation found." }];

    console.log(`  > Found ${finalDocs.length} articles.`);
    return { retrievedDocs: finalDocs };
}

// B. Generator Node (Writes the answer)
async function nodeGenerate(state) {
    console.log(`\n[Agent] Generating Answer...`);

    const context = state.retrievedDocs.map(d => `- ${d.text}`).join("\n");

    const response = await model.invoke([
        ["system", "You are a helpful support agent. Answer the user using ONLY the context provided below. If unsure, say 'I don't know'."],
        ["user", `Context:\n${context}\n\nQuestion: ${state.question}`]
    ]);

    return { answer: response.content };
}

// 5. Build Graph
// --------------
const workflow = new StateGraph({
    channels: {
        question: { reducer: (x, y) => y ?? x, default: () => null },
        retrievedDocs: { reducer: (x, y) => y ?? x, default: () => [] },
        answer: { reducer: (x, y) => y ?? x, default: () => null },
    }
});

workflow.addNode("retrieve", nodeRetrieve);
workflow.addNode("generate", nodeGenerate);

workflow.setEntryPoint("retrieve");
workflow.addEdge("retrieve", "generate");
workflow.addEdge("generate", END);

// 6. Run with LangSmith Enabled
// -----------------------------
const app = workflow.compile();

async function runDemo() {

    if (!process.env.LANGCHAIN_API_KEY) {
        console.warn("\n!!! WARNING: LANGCHAIN_API_KEY is not set. You won't see traces in LangSmith. !!!\n");
    } else {
        console.log("\n>>> LangSmith Tracing is ENABLED. Check your dashboard at smith.langchain.com <<<");
    }

    // Question 1: Easy hit
    const q1 = "What is the rate limit?";
    console.log(`\n--- User asks: "${q1}" ---`);
    const res1 = await app.invoke({ question: q1 });
    console.log(`Agent: ${res1.answer}`);

    // Question 2: Edge case
    const q2 = "How do I fix a 500 error?";
    console.log(`\n--- User asks: "${q2}" ---`);
    const res2 = await app.invoke({ question: q2 });
    console.log(`Agent: ${res2.answer}`);

    // Question 3: Out of domain
    const q3 = "How do I cook pasta?";
    console.log(`\n--- User asks: "${q3}" ---`);
    const res3 = await app.invoke({ question: q3 });
    console.log(`Agent: ${res3.answer}`);
}

runDemo();
