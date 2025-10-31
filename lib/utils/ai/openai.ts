import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://router.huggingface.co/v1',
});

export default openai;