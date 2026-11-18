import OpenAI from "openai";

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY is not set");

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey,
});

const completion = await client.chat.completions.create({
  model: "openai/gpt-oss-120b",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(completion.choices[0]?.message.content);
