import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    memes: i.entity({
      email: i.string().optional(),
      caption: i.string().optional(),
      createdAt: i.number(),
      imagePath: i.string().optional(),
      imageUrl: i.string().optional(),
      // Keep existing fields for meme creation functionality
      imageData: i.string().optional(),
      textBoxes: i.string().optional(),
      canvasWidth: i.number().optional(),
      canvasHeight: i.number().optional(),
    }),
    votes: i.entity({
      createdAt: i.number(),
      userMemoryKey: i.string().optional(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageUrl: i.string().optional(),
      type: i.string().optional(),
    }),
  },
  links: {
    // Meme author (who created the meme)
    memeAuthor: {
      forward: { on: 'memes', has: 'one', label: 'author' },
      reverse: { on: '$users', has: 'many', label: 'authoredMemes' },
    },
    // Meme owner (who owns the meme - might be different from author)
    memeOwner: {
      forward: { on: 'memes', has: 'one', label: 'owner' },
      reverse: { on: '$users', has: 'many', label: 'ownedMemes' },
    },
    // Votes to memes (which meme was voted on)
    voteMeme: {
      forward: { on: 'votes', has: 'one', label: 'meme' },
      reverse: { on: 'memes', has: 'many', label: 'votes' },
    },
    // Votes to users (who voted)
    voteUser: {
      forward: { on: 'votes', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'many', label: 'voteGiven' },
    },
    // User linked guest users (for multi-account linking)
    linkedGuestUsers: {
      forward: { on: '$users', has: 'many', label: 'linkedGuestUsers' },
      reverse: { on: '$users', has: 'one', label: 'linkedPrimaryUser' },
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
