export interface Normalizer<ExternalType, InternalType> {
    normalize(data: ExternalType): InternalType;
}
