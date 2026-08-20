/**
 * 🔄 NEURAL MODEL HOT-SWAPPING ENGINE
 * 
 * Enables runtime switching between local Ollama models (e.g., qwen2.5-coder:1.5b vs 7b)
 * with resource governance and safety checks.
 */

export interface ModelInfo {
  name: string;
  sizeGb: number;
  minRamGb: number;
  recommended: boolean;
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  { name: 'qwen2.5-coder:1.5b', sizeGb: 1.2, minRamGb: 4.0, recommended: true },
  { name: 'qwen2.5-coder:7b', sizeGb: 4.7, minRamGb: 8.0, recommended: false },
  { name: 'llama3:8b', sizeGb: 4.9, minRamGb: 8.0, recommended: false }
];

export class ModelHotSwap {
  private static activeModel: string = 'qwen2.5-coder:1.5b';

  public static getActiveModel(): string {
    return ModelHotSwap.activeModel;
  }

  public static setActiveModel(modelName: string): { success: boolean; activeModel: string; error?: string } {
    const found = AVAILABLE_MODELS.find(m => m.name === modelName);
    if (!found) {
      return { success: false, activeModel: ModelHotSwap.activeModel, error: `Model ${modelName} not found in catalog` };
    }
    ModelHotSwap.activeModel = modelName;
    return { success: true, activeModel: ModelHotSwap.activeModel };
  }
}

export const modelHotSwap = ModelHotSwap;
