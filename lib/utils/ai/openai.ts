import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.api_hugg,
  baseURL: 'https://router.huggingface.co/v1',
});

export default openai;