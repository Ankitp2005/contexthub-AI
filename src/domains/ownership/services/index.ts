// ownership domain — services
export { parseCodeownersFile } from "./parser";
export { getFileOwnership } from "./retrieval";
export type { OwnershipContext } from "./retrieval";
export { computeOwnershipScores, getPrimaryOwner } from "./confidence";
export type { OwnershipScore, CommitActivityRow } from "./confidence";
