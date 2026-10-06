# TMC Planner

## Pre-Task Planning Safety app (`/safety`)

A mobile-friendly page where team members **record** their pre-task plan by voice. The
transcript is sent to the **TMC Pre-Task Planning Safety agent** (Copilot Studio) and the
agent's response is shown on screen. They can keep going back and forth with the agent by
voice or text until the plan is complete, then download the transcript.

**How it works**

- Speech-to-text runs in the browser (Web Speech API: Chrome, Edge, Safari incl. iPhone).
  The transcript lands in an editable box so the team member can fix it before sending.
- Messages go to the agent over the Bot Framework **Direct Line** API (the same channel
  Copilot Studio uses for custom apps). Agent replies render markdown, Adaptive Cards and
  suggested-reply buttons. Optional "read replies aloud".
- The agent secret never reaches the phone: `POST /api/directline/token` exchanges it
  server-side for a short-lived, conversation-scoped token.

**Connect it to your agent**

1. In Copilot Studio, publish the agent, then pick one option:
   - **No authentication** agent: *Channels > Mobile app* > copy the **Token Endpoint**
     into `COPILOT_TOKEN_ENDPOINT`.
   - **Web channel security** enabled: *Settings > Security > Web channel security* >
     copy **Secret 1** into `DIRECTLINE_SECRET`.
2. `cp .env.example .env.local` and fill in that value (on Vercel/Azure, add it as an
   environment variable instead).
3. `npm install && npm run dev`, open `http://localhost:3000/safety`.

Microphone access requires HTTPS (or `localhost`). Firefox has no speech recognition, so
users there can type instead.

---

## About this template

Welcome to the ArtifactBin template project! This repository serves as a starting point for deploying React components created on [ArtifactBin.com](https://artifactbin.com) to Vercel.

## Overview

This template project is designed to work seamlessly with ArtifactBin.com, allowing you to quickly deploy your React components to Vercel with just a few clicks. The project structure is set up to accommodate the React component you create on ArtifactBin.com.

## Project Structure

```
/
├── app/
│   └── page.tsx    # Your React component will be placed here
├── public/
│   └── ...         # Static assets
├── .gitignore
├── next.config.js
├── package.json
├── README.md
└── tsconfig.json
```

# Usage

1. Clone this repository or use it as a template.
2. Replace the content in src/app/page.tsx with your React component from ArtifactBin.
3. Deploy to Vercel using the button above.

For more detailed instructions, visit [ArtifactBin.com](https://artifactbin.com).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/)

## Customization

After deployment, you can further customize your project by cloning it from Vercel and making additional changes. Some ideas for customization:

- Add more pages or components
- Customize the layout in `app/layout.tsx`
- Add global styles in `app/globals.css`
- Configure Next.js options in `next.config.js`

## Requirements

This template project uses:

- [Next.js 14](https://nextjs.org/)
- [React 18](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

## Local Development

If you want to run this project locally:

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Contributing

We welcome contributions to improve this template project! Please feel free to submit issues or pull requests.

## Support

If you encounter any problems or have questions, please file an issue on the [ArtifactBin GitHub repository](https://github.com/artifactbin/template-project/issues) or contact support@artifactbin.com.

## License

This template project is released under the MIT License. See the [LICENSE](LICENSE) file for details.
