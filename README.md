# Meme Sharing Platform

A full-stack meme generator and sharing platform built with Next.js and Instant DB.

## Features

- **Create Memes**: Upload images or use templates, add customizable text overlays
- **Post Memes**: Share your creations with the community (requires authentication)
- **Browse Feed**: View all posted memes in a beautiful grid layout
- **Upvote System**: Upvote your favorite memes (requires authentication)
- **Real-time Updates**: See new memes and upvotes instantly
- **User Authentication**: Magic link authentication with 6-digit verification code

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Instant DB** - Real-time database and authentication
- **React** - UI library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx             # Meme creation page
│   └── feed/
│       └── page.tsx         # Meme feed page
├── components/
│   ├── AuthButton.tsx       # Authentication component
│   ├── MemeCanvas.tsx       # Canvas component for meme editing
│   ├── MemeCard.tsx         # Meme card for feed display
│   ├── NavLink.tsx          # Navigation link component
│   ├── TextBoxList.tsx      # Text boxes management UI
│   └── UpvoteButton.tsx     # Upvote button component
├── lib/
│   ├── db.ts                # Instant DB initialization
│   └── schema.ts            # Database schema definition
├── styles/
│   └── globals.css          # Global styles
└── public/
    └── assets/              # Template images
```

## Usage

### Creating a Meme

1. Navigate to the "Create" page
2. Upload an image or select a template
3. Add text overlays with customizable font size and color
4. Drag text boxes to position them
5. Click "Download Meme" to save locally
6. Click "Post Meme" to share with the community (requires sign-in)

### Browsing the Feed

1. Navigate to the "Feed" page
2. Browse all posted memes
3. Upvote memes you like (requires sign-in)
4. See real-time updates as new memes are posted

### Authentication

1. Click "Sign In" in the header
2. Enter your email address
3. Check your email for the 6-digit verification code
4. Enter the code to complete sign-in

## Database Schema

- **memes**: Stores meme images (base64), text configurations, and metadata
- **upvotes**: Tracks which users upvoted which memes
- **users**: User accounts (managed by Instant DB auth)

## License

MIT
