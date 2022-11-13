import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const promptTemplate =
  "I am a highly creative artist. Any question you ask me I will respond with objects and themes to include in the painting.\n\nQ: What did I have for breakfast?\nA: Fried egg, ham, Swiss cheese, two thick slices of French toast, coffee table, scenic landscape\n\nQ: Who was president of the United States in 1955?\nA: Dwight D. Eisenhower, portrait, strong, vivid colors\n\nQ: Which party did he belong to?\nA: Republican Party, poster, propaganda, flag\n\nQ: How am I going to die?\nA: Medieval torture device, cold, gruesome, dark\n\nQ: How does a telescope work?\nA: Lenses or mirrors, light, zooming, technical, drawing\n\nQ: Where were the 1992 Olympics held?\nA: Barcelona, Spain, colorful, vibrant\n\nQ: What am I having for lunch?\nA: A big juicy hamburger, lettuce, tomato, onion, pickles, cheese, outdoor patio, sunny day\n\nQ: What am I having for dinner?\nA: A big juicy steak, baked potato, green beans, dinner table, candlelight\n\nQ: Where should I go travel?\nA: The Eiffel Tower, France, Europe, love, romance\n\nQ: ";

export async function openAIAskQuestion(question: string) {
  const last = question.charAt(question.length - 1);
  if (last !== "?") {
    question += "?";
  }
  const response = await openai.createCompletion({
    model: "text-davinci-002",
    prompt: promptTemplate + question + "\n",
    temperature: 0,
    max_tokens: 100,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ["\n"],
  });
  console.log(response.data);
  console.log(response.data.choices);
  const choices = response.data.choices;
  if (!choices || choices.length === 0) {
    return false;
  }
  const answer = choices[0].text;
  if (!answer || answer === "A:") {
    return false;
  }

  return answer?.replace("A: ", "") || false;
}
