# Text Refiner AI

A lightweight, cross-platform desktop application built with Electron and Node.js that allows you to refine any text using your preferred AI provider.

![App Screenshot](assets/screenshot.png) <!-- You should add a real screenshot here -->

## Features

-   **Multiple AI Providers**: Choose between LM Studio (for local models), OpenAI, or OpenRouter.
-   **Global Quick Refine**: Select text in any application, press `Ctrl+Shift+R`, and a small window will appear to refine your text.
-   **Customizable Refinement**: Select from different refinement modes like Formal, Casual, Concise, Professional, and Creative.
-   **Secure API Key Storage**: Your API keys are stored securely in your system's credential manager.
-   **Right-Click to Refine**: Right-click within the app's text area to refine selected text.

## Installation

_Build instructions and pre-built binaries are coming soon._

To run the application from the source, you'll need [Node.js](https://nodejs.org/) installed.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/dendynetti/windows-text-refiner.git
    cd windows-text-refiner
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the application:**
    ```bash
    npm start
    ```

## How to Use

### 1. Configure Your AI Provider

-   Open the application and go to `File > Settings`.
-   Select your preferred provider from the dropdown menu.

#### LM Studio

1.  Select "LM Studio" as the provider.
2.  Make sure your LM Studio server is running.
3.  The default URL is `http://localhost:1234/v1`. Adjust it if your setup is different.

#### OpenAI

1.  Select "OpenAI" as the provider.
2.  Enter your OpenAI API key.
3.  Click "Save".

#### OpenRouter

1.  Select "OpenRouter" as the provider.
2.  Enter your OpenRouter API key.
3.  The application will automatically fetch the available models for you to choose from.
4.  Select your desired model and click "Save".

### 2. Refine Text

#### In the Main Window

-   Type or paste your text into the "Original Text" box.
-   Select a refinement mode.
-   Click "Refine with AI".
-   Alternatively, select a portion of the text, right-click, and choose "Refine Selection".

#### Using the Global Quick Refine

1.  Select any text in any application (e.g., a web browser, a document, your code editor).
2.  Press `Ctrl+C` to copy the text to your clipboard.
3.  Press `Ctrl+Shift+R`.
4.  The "Quick Refine" window will appear with your text.
5.  Choose a mode and click "Refine".
6.  Click "Copy & Close" to copy the refined text to your clipboard and close the window.
7.  Paste the refined text back into your original application.

## Development

-   **Run in development mode:** `npm start`
-   **Linting:** `npm run lint` (You'll need to add a linting script to `package.json`)
-   **Building for production:** `npm run package` (You'll need to add `electron-builder` and configure it in `package.json`)

## License

This project is licensed under the MIT License. See the [LICENSE.md](LICENSE.md) file for details.