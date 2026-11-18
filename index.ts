import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGroq } from "@langchain/groq";
import readline from "readline/promises";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY is not set");

const llm = new ChatGroq({
  model: "openai/gpt-oss-120b",
  temperature: 0,
  apiKey,
});

// node - Function that calls the model
async function callModel(state: typeof MessagesAnnotation.State) {
  console.log("Calling LLM...");
  const response = await llm.invoke(state.messages);
  return { messages: [response] };
}

// Define a new graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addEdge("agent", "__end__");

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

    const finalState = await runWorkflow.invoke({
      messages: [{ role: "user", content: userInput }],
    });
    console.log("Agent:", finalState.messages.at(-1)?.content);
  }

  rl.close();
}

main();
