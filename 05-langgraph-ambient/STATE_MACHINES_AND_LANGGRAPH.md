# State Machines & LangGraph: A Comprehensive Guide

## Table of Contents
1. [What is a State Machine?](#what-is-a-state-machine)
2. [Why State Machines for AI Agents?](#why-state-machines-for-ai-agents)
3. [LangGraph Overview](#langgraph-overview)
4. [Core Concepts](#core-concepts)
5. [StateGraph Deep Dive](#stategraph-deep-dive)
6. [Patterns & Architectures](#patterns--architectures)
7. [Comparison with Alternatives](#comparison-with-alternatives)
8. [Best Practices](#best-practices)
9. [Real-World Use Cases](#real-world-use-cases)

---

## What is a State Machine?

A **Finite State Machine (FSM)** is a computational model that can be in exactly one of a finite number of states at any given time. It transitions between states in response to inputs.

### Components of a State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                     STATE MACHINE                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   STATES          TRANSITIONS        ACTIONS                │
│   ┌─────┐         ─────────►         ┌─────────┐           │
│   │ S1  │                            │ do_x()  │           │
│   └─────┘         Triggered by       └─────────┘           │
│   ┌─────┐         events/inputs                            │
│   │ S2  │                                                  │
│   └─────┘         Conditional                              │
│   ┌─────┐         based on                                 │
│   │ S3  │         current state                            │
│   └─────┘                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Classic Example: Traffic Light

```
     ┌──────────┐
     │  GREEN   │
     └────┬─────┘
          │ timer
          ▼
     ┌──────────┐
     │  YELLOW  │
     └────┬─────┘
          │ timer
          ▼
     ┌──────────┐
     │   RED    │──────┐
     └──────────┘      │ timer
          ▲            │
          └────────────┘
```

### Mathematical Definition

A state machine is defined as a 5-tuple: **(Q, Σ, δ, q₀, F)**

| Symbol | Meaning | Example |
|--------|---------|---------|
| Q | Set of states | {GREEN, YELLOW, RED} |
| Σ | Input alphabet | {timer_expired} |
| δ | Transition function | δ(GREEN, timer) = YELLOW |
| q₀ | Initial state | GREEN |
| F | Final/accepting states | ∅ (none, loops forever) |

---

## Why State Machines for AI Agents?

Traditional LLM calls are **stateless**:
```
User → LLM → Response (done)
```

But real-world tasks require **stateful workflows**:
```
User → Check Inventory → Process Payment → Ship Order → Notify User
         ↓ out of stock
       Notify User → END
```

### The Problem with Simple Chains

```javascript
// Simple chain - no control flow
const result = await llm.invoke(prompt1)
  .then(r => llm.invoke(prompt2))
  .then(r => llm.invoke(prompt3));

// What if step 2 fails?
// What if we need to loop?
// What if we need human approval?
// What if we need to branch based on LLM output?
```

### State Machines Solve This

| Challenge | State Machine Solution |
|-----------|----------------------|
| **Conditional branching** | Transitions based on state/output |
| **Loops and retries** | Edges back to previous states |
| **Persistence** | State survives between steps |
| **Human-in-the-loop** | Pause at specific states |
| **Error handling** | Dedicated error states |
| **Observability** | Clear visualization of flow |

---

## LangGraph Overview

**LangGraph** is a library built on top of LangChain that lets you build **stateful, multi-actor applications with LLMs** using a graph-based approach.

### Key Philosophy

> "LLM applications are not just chains of prompts, they are **graphs** of interconnected reasoning steps."

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         LANGGRAPH                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   NODES      │    │    EDGES     │    │    STATE     │       │
│  │  (Functions) │───▶│ (Transitions)│───▶│  (Channels)  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ LLM calls    │    │ Conditional  │    │ Reducers     │       │
│  │ Tool calls   │    │ routing      │    │ Persistence  │       │
│  │ Any function │    │ Parallel     │    │ Checkpoints  │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### LangGraph vs LangChain

| Feature | LangChain | LangGraph |
|---------|-----------|-----------|
| Flow type | Linear chains | Directed graphs |
| Control flow | Sequential | Conditional, parallel, cyclic |
| State | Passed through chain | Centralized, persistent |
| Best for | Simple pipelines | Complex agent workflows |
| Cycles | ❌ Not supported | ✅ Supported |
| Human-in-the-loop | Limited | First-class support |

---

## Core Concepts

### 1. State (Channels)

State is the **memory** of your graph. It's defined as channels that persist data between node executions.

```javascript
const workflow = new StateGraph({
    channels: {
        // Each channel has a name, reducer, and default
        messages: { 
            reducer: (existing, new_) => [...existing, ...new_], 
            default: () => [] 
        },
        currentStep: { 
            reducer: (x, y) => y ?? x, 
            default: () => "start" 
        },
        retryCount: { 
            reducer: (x, y) => y ?? x, 
            default: () => 0 
        },
    }
});
```

#### Reducer Functions

Reducers define **how state updates are merged**:

| Reducer Type | Behavior | Use Case |
|--------------|----------|----------|
| `(x, y) => y ?? x` | Replace (keep new if exists) | Single values |
| `(x, y) => [...x, ...y]` | Append | Message history |
| `(x, y) => ({...x, ...y})` | Merge objects | Complex state |
| `(x, y) => x + y` | Accumulate | Counters |

### 2. Nodes

Nodes are **functions** that:
- Receive the current state
- Perform work (LLM calls, API calls, computations)
- Return state updates

```javascript
async function myNode(state) {
    // Read from state
    const { messages, currentStep } = state;
    
    // Do work
    const response = await llm.invoke(messages);
    
    // Return updates (partial state)
    return {
        messages: [response],
        currentStep: "next"
    };
}

workflow.addNode("my_node", myNode);
```

#### Node Types

```
┌────────────────────────────────────────────────────────────┐
│                      NODE TYPES                            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   LLM Node  │  │  Tool Node  │  │ Router Node │        │
│  │             │  │             │  │             │        │
│  │ Calls model │  │ Executes    │  │ Just routes │        │
│  │ Returns AI  │  │ external    │  │ (no work)   │        │
│  │ response    │  │ tools/APIs  │  │             │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Human Node  │  │ Branch Node │  │ Aggregate   │        │
│  │             │  │             │  │             │        │
│  │ Waits for   │  │ Splits into │  │ Combines    │        │
│  │ human input │  │ parallel    │  │ parallel    │        │
│  │             │  │ paths       │  │ results     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 3. Edges

Edges define **how nodes connect** and when transitions occur.

#### Simple Edge
```javascript
// Always go from A to B
workflow.addEdge("node_a", "node_b");
```

#### Conditional Edge
```javascript
// Route based on state
workflow.addConditionalEdges(
    "node_a",           // Source node
    routingFunction,    // Function that returns next node name
    {                   // Map of possible destinations
        "option1": "node_b",
        "option2": "node_c",
        [END]: END
    }
);

function routingFunction(state) {
    if (state.error) return END;
    if (state.needsReview) return "option1";
    return "option2";
}
```

### 4. Entry & Exit Points

```javascript
// Where the graph starts
workflow.setEntryPoint("first_node");

// END is a special constant for termination
import { END } from "@langchain/langgraph";

// Conditional termination
if (done) return END;
```

---

## StateGraph Deep Dive

### Complete Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    STATEGRAPH LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEFINE SCHEMA          2. ADD NODES          3. ADD EDGES   │
│  ┌─────────────────┐       ┌────────────┐       ┌────────────┐  │
│  │ new StateGraph({│       │ addNode()  │       │ addEdge()  │  │
│  │   channels: {   │  ───▶ │ addNode()  │  ───▶ │ addCond()  │  │
│  │     ...         │       │ addNode()  │       │ setEntry() │  │
│  │   }             │       └────────────┘       └────────────┘  │
│  │ })              │                                            │
│  └─────────────────┘                                            │
│                                                                  │
│  4. COMPILE                 5. INVOKE                           │
│  ┌─────────────────┐       ┌────────────────────────────────┐   │
│  │ const app =     │       │ const result = await app.invoke│   │
│  │   workflow      │  ───▶ │   ({ initial: "state" })       │   │
│  │   .compile()    │       │                                │   │
│  └─────────────────┘       │ // Or stream:                  │   │
│                            │ for await (const s of          │   │
│                            │   app.stream({})) { ... }      │   │
│                            └────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Execution Model

When you call `app.invoke()`:

```
                         INVOKE
                           │
                           ▼
              ┌────────────────────────┐
              │  Initialize State      │
              │  (apply defaults)      │
              └───────────┬────────────┘
                          │
                          ▼
              ┌────────────────────────┐
              │  Execute Entry Node    │◄─────────────┐
              └───────────┬────────────┘              │
                          │                           │
                          ▼                           │
              ┌────────────────────────┐              │
              │  Apply State Updates   │              │
              │  (run reducers)        │              │
              └───────────┬────────────┘              │
                          │                           │
                          ▼                           │
              ┌────────────────────────┐              │
              │  Evaluate Edges        │              │
              │  (find next node)      │              │
              └───────────┬────────────┘              │
                          │                           │
                ┌─────────┴─────────┐                 │
                │                   │                 │
                ▼                   ▼                 │
         ┌───────────┐      ┌─────────────┐          │
         │   END     │      │ Next Node   │──────────┘
         └───────────┘      └─────────────┘
                │
                ▼
         Return Final State
```

### State Update Mechanics

```javascript
// Node returns partial state
function myNode(state) {
    return { 
        count: state.count + 1,
        // messages not returned = unchanged
    };
}

// Reducer merges it
channels: {
    count: { 
        reducer: (old, new_) => new_ ?? old,  // Replace
        default: () => 0 
    },
    messages: {
        reducer: (old, new_) => [...old, ...new_],  // Append
        default: () => []
    }
}
```

---

## Patterns & Architectures

### Pattern 1: Simple Sequential

```
START ──▶ Step 1 ──▶ Step 2 ──▶ Step 3 ──▶ END
```

```javascript
workflow.addEdge("step1", "step2");
workflow.addEdge("step2", "step3");
workflow.addEdge("step3", END);
```

### Pattern 2: Conditional Branching

```
                    ┌──▶ Process A ──┐
START ──▶ Router ──┤                 ├──▶ END
                    └──▶ Process B ──┘
```

```javascript
workflow.addConditionalEdges("router", 
    (state) => state.type === "A" ? "process_a" : "process_b",
    { "process_a": "process_a", "process_b": "process_b" }
);
workflow.addEdge("process_a", END);
workflow.addEdge("process_b", END);
```

### Pattern 3: Loop with Exit Condition

```
         ┌────────────────────┐
         │                    │
         ▼                    │
START ──▶ Process ──▶ Check ──┤
                        │     │
                        ▼     │
                       END ◄──┘ (when done)
```

```javascript
// This is what your Ambient Agent uses!
workflow.addConditionalEdges("check",
    (state) => state.done ? END : "process",
    { [END]: END, "process": "process" }
);
```

### Pattern 4: Parallel Execution (Fan-out/Fan-in)

```
              ┌──▶ Worker 1 ──┐
START ──▶ Split ──▶ Worker 2 ──▶ Merge ──▶ END
              └──▶ Worker 3 ──┘
```

```javascript
// LangGraph handles this with multiple edges from one node
workflow.addEdge("split", "worker1");
workflow.addEdge("split", "worker2");
workflow.addEdge("split", "worker3");
workflow.addEdge("worker1", "merge");
workflow.addEdge("worker2", "merge");
workflow.addEdge("worker3", "merge");
```

### Pattern 5: Human-in-the-Loop

```
START ──▶ AI Draft ──▶ Human Review ──▶ AI Finalize ──▶ END
                            │
                            ▼
                    (waits for input)
```

```javascript
// Using checkpointing for persistence
const checkpointer = new MemorySaver();
const app = workflow.compile({ checkpointer });

// Invoke and pause at human node
const state = await app.invoke({}, { 
    configurable: { thread_id: "123" }
});

// Later, resume with human input
await app.invoke(
    { humanApproval: true },
    { configurable: { thread_id: "123" }}
);
```

### Pattern 6: Multi-Agent Collaboration

```
              ┌──────────────────────────────────────┐
              │                                      │
              ▼                                      │
START ──▶ Supervisor ──▶ Agent 1 ──┬──▶ Supervisor ─┤
              │                    │        │       │
              └────▶ Agent 2 ──────┘        ▼       │
                                          END ◄────┘
```

```javascript
function supervisorRouter(state) {
    const lastMessage = state.messages.at(-1);
    if (lastMessage.content.includes("DONE")) return END;
    if (state.task === "research") return "agent1";
    return "agent2";
}
```

---

## Comparison with Alternatives

### LangGraph vs Alternatives

| Feature | LangGraph | LangChain LCEL | AutoGen | CrewAI |
|---------|-----------|----------------|---------|--------|
| **Paradigm** | Graph | Chain | Multi-agent chat | Role-based |
| **Cycles** | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **State** | Explicit channels | Implicit | Message history | Shared |
| **Visualization** | Built-in | Limited | No | No |
| **Checkpointing** | ✅ Native | ❌ Manual | ❌ Manual | ❌ Manual |
| **Streaming** | ✅ Full | ✅ Token-level | Limited | Limited |
| **Complexity** | Medium | Low | High | Medium |

### When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│                    DECISION TREE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Need just a simple prompt chain?                               │
│  └── YES ──▶ Use LangChain LCEL                                 │
│  └── NO ──▶                                                     │
│                                                                  │
│  Need cycles, loops, or complex branching?                      │
│  └── YES ──▶ Use LangGraph                                      │
│  └── NO ──▶                                                     │
│                                                                  │
│  Need multiple autonomous agents chatting?                      │
│  └── YES ──▶ Consider AutoGen or CrewAI                         │
│  └── NO ──▶                                                     │
│                                                                  │
│  Need human-in-the-loop with persistence?                       │
│  └── YES ──▶ LangGraph (best native support)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Best Practices

### 1. State Design

```javascript
// ❌ BAD: Everything in one big object
channels: {
    data: { reducer: (x, y) => ({...x, ...y}), default: () => ({}) }
}

// ✅ GOOD: Separate channels for separate concerns
channels: {
    messages: { reducer: appendReducer, default: () => [] },
    currentStep: { reducer: replaceReducer, default: () => "start" },
    errorCount: { reducer: replaceReducer, default: () => 0 },
    metadata: { reducer: mergeReducer, default: () => ({}) },
}
```

### 2. Node Granularity

```javascript
// ❌ BAD: One mega-node that does everything
async function doEverything(state) {
    const research = await llm.invoke("research...");
    const analysis = await llm.invoke("analyze...");
    const summary = await llm.invoke("summarize...");
    return { result: summary };
}

// ✅ GOOD: Separate nodes for each responsibility
async function nodeResearch(state) { /* ... */ }
async function nodeAnalyze(state) { /* ... */ }
async function nodeSummarize(state) { /* ... */ }
```

### 3. Error Handling

```javascript
// ✅ Include error states in your graph
workflow.addNode("handle_error", async (state) => {
    console.error("Error occurred:", state.error);
    return { errorHandled: true };
});

workflow.addConditionalEdges("risky_operation",
    (state) => state.error ? "handle_error" : "next_step",
    { "handle_error": "handle_error", "next_step": "next_step" }
);
```

### 4. Timeouts and Retries

```javascript
async function nodeWithRetry(state) {
    const MAX_RETRIES = 3;
    
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const result = await llm.invoke(/*...*/);
            return { result, retryCount: i };
        } catch (error) {
            if (i === MAX_RETRIES - 1) {
                return { error: error.message };
            }
            await sleep(1000 * Math.pow(2, i)); // Exponential backoff
        }
    }
}
```

### 5. Testing

```javascript
// Test individual nodes
describe("nodeAnalyze", () => {
    it("should mark urgent news as shouldAlert=true", async () => {
        const state = { latestNews: { content: "CRITICAL: Market crash!" }};
        const result = await nodeAnalyze(state);
        expect(result.shouldAlert).toBe(true);
    });
});

// Test full graph with mock state
describe("Full workflow", () => {
    it("should reach END on completion", async () => {
        const app = workflow.compile();
        const result = await app.invoke({ done: true });
        expect(result.status).toBe("complete");
    });
});
```

---

## Real-World Use Cases

### 1. Customer Support Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                CUSTOMER SUPPORT WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Query                                                     │
│      │                                                          │
│      ▼                                                          │
│  ┌───────────┐    simple    ┌─────────────┐                    │
│  │ Classify  │─────────────▶│ Auto-Reply  │──▶ END             │
│  │ Intent    │              └─────────────┘                    │
│  └───────────┘                                                  │
│      │ complex                                                  │
│      ▼                                                          │
│  ┌───────────┐              ┌─────────────┐                    │
│  │ Search    │─────────────▶│ Generate    │                    │
│  │ Knowledge │              │ Response    │                    │
│  │ Base      │              └──────┬──────┘                    │
│  └───────────┘                     │                           │
│                                    ▼                            │
│                           ┌─────────────┐    yes   ┌─────────┐ │
│                           │ Needs Human │─────────▶│ Escalate│ │
│                           │ Review?     │          └─────────┘ │
│                           └──────┬──────┘                      │
│                                  │ no                          │
│                                  ▼                              │
│                              Send Reply ──▶ END                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Code Review Agent

```
PR Submitted
     │
     ▼
┌─────────────┐
│ Fetch Diff  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Security    │────▶│ Style       │────▶│ Logic       │
│ Check       │     │ Check       │     │ Check       │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                           ▼
                   ┌─────────────┐
                   │ Aggregate   │
                   │ Findings    │
                   └──────┬──────┘
                          │
            ┌─────────────┴─────────────┐
            │                           │
            ▼                           ▼
     ┌─────────────┐            ┌─────────────┐
     │ Auto-Approve│            │ Request     │
     │ (no issues) │            │ Changes     │
     └─────────────┘            └─────────────┘
```

### 3. Research Agent (ReAct Pattern)

```
┌─────────────────────────────────────────────────────────────────┐
│                    ReAct AGENT LOOP                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                    ┌──────────────────┐                         │
│                    │                  │                         │
│  Question ────────▶│     REASON       │                         │
│                    │  (LLM thinks)    │                         │
│                    └────────┬─────────┘                         │
│                             │                                    │
│                             ▼                                    │
│                    ┌──────────────────┐                         │
│                    │      ACT         │                         │
│                    │  (Use tools)     │                         │
│                    └────────┬─────────┘                         │
│                             │                                    │
│                    ┌────────┴────────┐                          │
│                    │                 │                          │
│                    ▼                 ▼                          │
│             ┌───────────┐    ┌───────────┐                     │
│             │  Search   │    │ Calculate │    ... more tools   │
│             │  Web      │    │           │                     │
│             └─────┬─────┘    └─────┬─────┘                     │
│                   │                │                            │
│                   └────────┬───────┘                           │
│                            │                                    │
│                            ▼                                    │
│                    ┌──────────────────┐                         │
│                    │    OBSERVE       │                         │
│                    │ (Process result) │                         │
│                    └────────┬─────────┘                         │
│                             │                                    │
│               ┌─────────────┴─────────────┐                     │
│               │                           │                     │
│               ▼                           ▼                     │
│        ┌─────────────┐            ┌─────────────┐              │
│        │ Need more   │───────────▶│   REASON    │ (loop)       │
│        │ info?       │            └─────────────┘              │
│        └──────┬──────┘                                         │
│               │ no                                              │
│               ▼                                                 │
│        ┌─────────────┐                                         │
│        │ Final       │                                         │
│        │ Answer      │──────────────▶ END                      │
│        └─────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Your Ambient Agent Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                 AMBIENT MONITORING PATTERN                       │
│                 (05-langgraph-ambient)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              ┌─────────────────────────────────┐                │
│              │                                 │                │
│              ▼                                 │                │
│      ┌─────────────┐                          │                │
│      │ CHECK_FEED  │──── no data ─────────────┤                │
│      │  (poll)     │                          │                │
│      └──────┬──────┘                          │                │
│             │ has data                        │                │
│             ▼                                 │                │
│      ┌─────────────┐                          │                │
│      │  ANALYZE    │                          │                │
│      │ (LLM judge) │                          │                │
│      └──────┬──────┘                          │                │
│             │                                 │                │
│       ┌─────┴─────┐                           │                │
│       │           │                           │                │
│       ▼           ▼                           │                │
│   not urgent   urgent                         │                │
│       │           │                           │                │
│       │     ┌─────────────┐                   │                │
│       │     │ ALERT_USER  │                   │                │
│       │     │ (interrupt) │                   │                │
│       │     └──────┬──────┘                   │                │
│       │            │                          │                │
│       └────────────┴──────────────────────────┘                │
│                                                                  │
│  KEY INSIGHT: The graph LOOPS, it doesn't end.                  │
│  This is what makes it "ambient" - always watching.             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary

### State Machines

- **What**: Computational models with discrete states and transitions
- **Why**: Control complex workflows with predictable behavior
- **When**: Any multi-step process with conditional logic

### LangGraph

- **What**: Graph-based framework for stateful LLM applications
- **Why**: Cycles, persistence, human-in-the-loop, observability
- **When**: Complex agents that go beyond simple chains

### Key Takeaways

1. **State is explicit** - Design your channels carefully
2. **Nodes are pure** - Take state in, return updates out
3. **Edges define flow** - Conditional routing is powerful
4. **Cycles are okay** - Loop until conditions are met
5. **Compile once, invoke many** - Graph is reusable
6. **Stream for UX** - Don't wait for full completion

---

## Further Reading

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangGraph GitHub](https://github.com/langchain-ai/langgraph)
- [State Machine Design Patterns](https://en.wikipedia.org/wiki/Finite-state_machine)
- [ReAct Paper](https://arxiv.org/abs/2210.03629)

---

*Generated for the agent0 repository - 05-langgraph-ambient example*
