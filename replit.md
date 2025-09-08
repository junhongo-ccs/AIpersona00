# Overview

This is a Next.js application that simulates AI personas interacting with web pages to evaluate user experience and friction. The system combines web scraping (via Cheerio), OpenAI's language models, and a simple JSON-based data storage to create think-aloud protocol simulations. Users can test how different personas (novice users, busy professionals, accessibility-focused users) would interact with websites, generating insights about usability and potential friction points.

# User Preferences

Preferred communication style: Simple, everyday language.
Styling preference: Plain CSS/inline styles - no Tailwind CSS (causes parsing issues)

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Plain CSS and inline styles (Tailwind removed due to compatibility issues)
- **State Management**: React hooks (useState, useEffect) for local component state
- **UI Pattern**: Single-page application with real-time status updates and data fetching

## Backend Architecture
- **API Routes**: Next.js API routes with Node.js runtime
- **Web Scraping**: Cheerio library for HTML parsing instead of full browser automation
- **Data Processing**: Server-side HTML analysis to extract page elements (headings, buttons, form fields)
- **Response Format**: Structured JSON responses with status, timing, and extracted UI data

## Data Storage
- **Database**: Simple JSON file-based storage system (chatlogs.json)
- **Location**: Local filesystem in `/out` directory
- **Schema**: Flat structure with logs containing id, timestamp, persona, URL, utterance, next_action, and friction_score
- **Operations**: Basic CRUD operations with in-memory array manipulation and file I/O

## AI Integration
- **Provider**: OpenAI API for language model interactions
- **Use Case**: Persona simulation - AI generates realistic user thoughts and next actions based on page content
- **Input Processing**: Extracted page elements (title, headings, clickable elements, form fields) fed to AI model
- **Output Structure**: Structured responses with user utterance, intended next action, and friction scoring

## Persona System
- **Configuration**: Static persona definitions with traits and goals
- **Types**: Three predefined personas - digital novice (50s), busy professional (20s), accessibility-focused user (40s)
- **Simulation**: Each persona has distinct behavioral patterns and interaction preferences

# External Dependencies

## Core Framework Dependencies
- **Next.js**: Full-stack React framework for both frontend and API backend
- **React/React-DOM**: Frontend UI library and renderer
- **TypeScript**: Static type checking and enhanced developer experience

## AI and Data Processing
- **OpenAI**: Language model API for persona simulation and natural language generation
- **Cheerio**: Server-side HTML parsing and DOM manipulation (jQuery-like API for Node.js)

## Styling and UI
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS/Autoprefixer**: CSS processing and browser compatibility

## Development Tools
- **TypeScript compiler**: Type checking and compilation
- **Node.js types**: TypeScript definitions for Node.js APIs

## Notable Architectural Decisions
- **Cheerio over Playwright**: Simplified web scraping approach using static HTML parsing instead of full browser automation for better performance and reliability in serverless environments
- **JSON file storage**: Lightweight data persistence solution avoiding database complexity for prototype/demo purposes
- **Server-side AI processing**: All OpenAI API calls handled on backend to protect API keys and enable server-side rendering