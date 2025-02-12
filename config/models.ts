// config/models.ts
export interface ModelConfig {
    id: string;
    name: string;
    displayName: string;
    provider: 'openrouter';
    modelName: string;
    temperature?: number;
    maxTokens: number;
    description?: string;
    pricing?: string;
  }
  
  export const TRANSLATION_MODELS: ModelConfig[] = [
    {
      id: 'deepseek',
      name: 'deepseek-r1',
      displayName: 'DeepSeek R1',
      provider: 'openrouter',
      modelName: 'deepseek/deepseek-r1:free',
      temperature: 0.7,
      maxTokens: 10000,
      description: 'DeepSeek R1 (12.8B), nyílt forrású nyelvi modell kiváló utasításkövetési képességekkel',
      pricing: 'Ingyenes'
    },
    {
      id: 'mistral',
      name: 'mistral-7b-instruct',
      displayName: 'Mistral 7B Instruct',
      provider: 'openrouter',
      modelName: 'mistralai/mistral-7b-instruct:free',
      temperature: 0.7,
      maxTokens: 10000,
      description: 'Nagy teljesítményű, iparági standard 7.3B paraméteres modell optimalizált sebességgel',
      pricing: 'Ingyenes'
    },
    {
      id: 'openchat',
      name: 'openchat-7b',
      displayName: 'OpenChat 7B',
      provider: 'openrouter',
      modelName: 'openchat/openchat-7b:free',
      temperature: 0.7,
      maxTokens: 10000,
      description: 'A Mistral 7B-n alapuló nyílt forrású chatbot modell, kibővített kontextussal',
      pricing: 'Ingyenes'
    },
    {
      id: 'gemini',
      name: 'gemini-2-flash',
      displayName: 'Gemini 2.0 Flash',
      provider: 'openrouter',
      modelName: 'google/gemini-2.0-flash-exp:free',
      temperature: 0.7,
      maxTokens: 1000000,
      description: 'Gyors kísérleti változata a Gemini 2.0-nak, Google legújabb nyelvi modelljének',
      pricing: 'Ingyenes'
    },
    {
      id: 'gemma',
      name: 'gemma-2-9b',
      displayName: 'Gemma 2 9B',
      provider: 'openrouter',
      modelName: 'google/gemma-2-9b-it:free',
      temperature: 0.7,
      maxTokens: 10000,
      description: 'A Google kompakt és hatékony nyelvi modellje, kiváló utasításkövetési képességekkel',
      pricing: 'Ingyenes'
    },
    {
      id: 'llama',
      name: 'llama-3-70b',
      displayName: 'LLaMA 3 70B',
      provider: 'openrouter',
      modelName: 'meta-llama/llama-3.1-70b-instruct:free',
      temperature: 0.7,
      maxTokens: 10000,
      description: 'A Meta legnagyobb és legerősebb nyílt forrású nyelvi modellje, 70B paraméterrel',
      pricing: 'Ingyenes'
    }
  ]; 
  
  export const getModelById = (id: string): ModelConfig | undefined => {
    return TRANSLATION_MODELS.find(model => model.id === id);
  };
  
  export const getModelConfig = (id: string): ModelConfig => {
    const model = getModelById(id);
    if (!model) {
      throw new Error(`Invalid model ID: ${id}`);
    }
    return model;
  };
  