/**
 * Normalizes external data into the canonical internal model format.
 */
export interface Normalizer<ExternalType, InternalType> {
  normalize(data: ExternalType): InternalType;
}
