// TypeScript types for database entities
// Note: The actual schema is defined in instant.schema.ts
// These types are for TypeScript type safety only

export type Meme = {
  id: string;
  email?: string;
  caption?: string;
  createdAt: number;
  imagePath?: string;
  imageUrl?: string;
  // Legacy fields for meme creation
  imageData?: string;
  textBoxes?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  // Links (populated when queried with links)
  author?: User;
  owner?: User;
  votes?: Vote[];
};

export type Vote = {
  id: string;
  createdAt: number;
  userMemoryKey?: string;
  // Links (populated when queried with links)
  meme?: Meme;
  user?: User;
};

export type User = {
  id: string;
  email?: string;
  imageUrl?: string;
  type?: string;
  // Links (populated when queried with links)
  ownedMemes?: Meme[];
  voteGiven?: Vote[];
  linkedGuestUsers?: User[];
  linkedPrimaryUser?: User;
};
