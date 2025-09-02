export interface ImageCompletionInterface {
  id: string;
  provider: string;
  model: string;
  object: string;
  created: number;
  choices: ImageCompletionChoice[];
}

export interface ImageCompletionChoice {
  logprobs: unknown | null;
  finish_reason: string;
  native_finish_reason: string;
  index: number;
  message: ImageCompletionMessage;
}

export interface ImageCompletionMessage {
  role: string;
  content: string;
  refusal: unknown | null;
  reasoning: unknown | null;
  images: ImageCompletionResult[];
}

export interface ImageCompletionResult {
  type: string;
  image_url: {
    url: string;
    index?: number;
  };
}
