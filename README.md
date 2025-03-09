# Collaborative Editor with Real-Time Chat

<div align="center">
  <br />
  <img src="public/assets/images/logo.png" alt="Project Logo" width="120">
  <br />

  <div>
    <img src="https://img.shields.io/badge/-Next_JS-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=61DAFB" alt="next.js" />
    <img src="https://img.shields.io/badge/-TypeScript-black?style=for-the-badge&logoColor=white&logo=typescript&color=3178C6" alt="typescript" />
    <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="tailwindcss" />
    <img src="https://img.shields.io/badge/-Liveblocks-black?style=for-the-badge&logoColor=white&logo=liveblocks&color=FF2D55" alt="liveblocks" />
    <img src="https://img.shields.io/badge/-Clerk-black?style=for-the-badge&logoColor=white&logo=clerk&color=6C47FF" alt="clerk" />
  </div>

  <h3 align="center">A Modern Collaborative Document Editor with Real-Time Chat</h3>

   <div align="center">
     A powerful collaborative document editor with real-time chat functionality, built with Next.js, Liveblocks, and Clerk.
    </div>
</div>

## 📋 Table of Contents

1. [Introduction](#introduction)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Project Structure](#project-structure)
7. [Deployment](#deployment)
8. [Contributing](#contributing)
9. [License](#license)

## 🤖 Introduction

This collaborative editor allows multiple users to work on documents simultaneously in real-time. It features a rich text editor with formatting options, comments, and a real-time chat system for seamless communication between collaborators.

The application uses Liveblocks for real-time collaboration, Clerk for authentication, and Lexical for the rich text editor. The UI is built with Next.js, TypeScript, and Tailwind CSS.

## ⚙️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: [Clerk](https://clerk.dev/)
- **Real-time Collaboration**: [Liveblocks](https://liveblocks.io/)
- **Rich Text Editor**: [Lexical](https://lexical.dev/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Monitoring**: [Sentry](https://sentry.io/)

## 🔋 Features

- **Real-time Document Editing**: Collaborate on documents with multiple users in real-time
- **Rich Text Formatting**: Format text with bold, italic, headings, lists, and more
- **Comments**: Add comments to specific parts of the document
- **Real-time Chat**: Communicate with collaborators through the integrated chat system
- **User Presence**: See who's currently viewing and editing the document
- **Typing Indicators**: Know when someone is typing in the chat
- **Document Sharing**: Share documents with specific users with different permission levels
- **Authentication**: Secure user authentication with Clerk
- **Responsive Design**: Works on desktop and mobile devices

## 🤸 Quick Start

### Prerequisites

- Node.js 18+ and npm
- A Liveblocks account for real-time collaboration
- A Clerk account for authentication

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Chuskibot/Collabrator-Software.git
   cd Collabrator-Software
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API keys (see [Environment Variables](#environment-variables) section).

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Liveblocks
LIVEBLOCKS_SECRET_KEY=your_liveblocks_secret_key

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 📁 Project Structure

```
collaborative-editor/
├── app/                    # Next.js app directory
│   ├── (auth)/             # Authentication routes
│   ├── (root)/             # Main application routes
│   ├── api/                # API routes
│   └── layout.tsx          # Root layout
├── components/             # React components
│   ├── chat/               # Chat system components
│   ├── editor/             # Editor components
│   ├── ui/                 # UI components
│   └── ...                 # Other components
├── lib/                    # Utility functions and libraries
│   ├── actions/            # Server actions
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
├── styles/                 # Global styles
├── types/                  # TypeScript type definitions
├── liveblocks.config.ts    # Liveblocks configuration
└── ...                     # Configuration files
```

## 🚀 Deployment

### Deploying to Vercel

1. Create a Vercel account if you don't have one.
2. Connect your GitHub repository to Vercel.
3. Configure the environment variables in the Vercel dashboard.
4. Deploy the application.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">
  <h3>Happy Collaborating! 🚀</h3>
</div>
