import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import readline from "readline/promises";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";
import { AIMessage } from "@langchain/core/messages";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY is not set");

// tools for our LLM
const webSearchTool = new TavilySearch({
  maxResults: 3,
  topic: "general",
  // includeAnswer: false,
  // includeRawContent: false,
  // includeImages: false,
  // includeImageDescriptions: false,
  // searchDepth: "basic",
  // timeRange: "day",
  // includeDomains: [],
  // excludeDomains: [],
});

const tools: any = [webSearchTool]; // we can add more tools here in the future
const toolNode = new ToolNode(tools);

// create a new ChatGroq instance with the model and tools
const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  apiKey,
}).bindTools(tools);

// node - Function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  console.log("Calling LLM...");
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

// conditional edge - Function that checks if we should continue the conversation
function shouldContinue(state: typeof MessagesAnnotation.State) {
  // check you condition whether to call a tool or not
  const lastMessage = state.messages[state.messages.length - 1];
  if (AIMessage.isInstance(lastMessage) && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "--end--";
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel) // node that calls the LLM model
  .addNode("tools", toolNode) // node that calls the tools
  .addEdge("__start__", "agent") // initial edge to start the workflow
  .addEdge("tools", "agent") // edge to go back to the agent after calling a tool
  .addConditionalEdges("agent", shouldContinue); // conditional edge to decide whether to call a tool or end the workflow

// Compile the graph into a Langchain runnable
const runWorkflow = workflow.compile();

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.toLowerCase() === "bye") {
      break;
    }

    // we are invoking the compiled workflow with the user input
    const finalState = await runWorkflow.invoke({
      messages: [{ role: "user", content: userInput }],
    });
    console.log("Agent:", finalState.messages.at(-1)?.content);
  }

  rl.close();
}

main();
