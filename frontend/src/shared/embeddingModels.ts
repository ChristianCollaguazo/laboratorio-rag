import type { ProviderConfig } from './api/contracts'

const openAiDimensionLimits: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
}

export function embeddingDimensionLimit(config: ProviderConfig): number | null {
  if (config.provider !== 'openai') return null
  return openAiDimensionLimits[config.model] ?? null
}

export function normalizeEmbeddingConfig(config: ProviderConfig): ProviderConfig {
  const limit = embeddingDimensionLimit(config)
  if (limit !== null && config.dimensions !== null && config.dimensions !== undefined && config.dimensions > limit) {
    return { ...config, dimensions: limit }
  }
  return config
}
