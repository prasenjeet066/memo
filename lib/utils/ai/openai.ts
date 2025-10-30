import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.openrouter,
  baseURL: "https://openrouter.ai/api/v1",
});

export default openai;