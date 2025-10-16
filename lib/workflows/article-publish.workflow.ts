import OpenAI from 'openai';
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: "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",
  
});
async function main() {
  const completion = await openai.chat.completions.create({
    model: "alibaba/tongyi-deepresearch-30b-a3b:free",
    messages: [
      {
        "role": "user",
        "content": "What is the meaning of life?"
      }
    ],
    
  });

  console.log(completion.choices[0].message);
}

main();