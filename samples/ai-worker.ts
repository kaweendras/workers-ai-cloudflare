import * as dontenv from "dotenv";

dontenv.config();

interface Message {
  role: string;
  content: string;
}

interface ModelInput {
  messages: Message[];
}

interface ModelResponse {
  [key: string]: any;
}

const token = process.env.CLOUDFLARE_API_TOKEN as string;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID as string;

export async function run(
  model: string,
  input: ModelInput
): Promise<ModelResponse> {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/bd2043184a78e979130586fdf2abfaf8/ai/run/${model}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      method: "POST",
      body: JSON.stringify(input),
    }
  );
  const result = await response.json();
  return result;
}

(async () => {
  try {
    const response = await run("@cf/meta/llama-4-scout-17b-16e-instruct", {
      messages: [
        {
          role: "system",
          content: "You are a friendly assistan that helps write stories",
        },
        {
          role: "user",
          content:
            "Write a short story about a llama that goes on a journey to find an orange cloud ",
        },
      ],
    });
    console.log(JSON.stringify(response));
  } catch (error) {
    console.error("Error:", error);
  }
})();
