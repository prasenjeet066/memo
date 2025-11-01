import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://router.huggingface.co/v1',
});

export default openai;