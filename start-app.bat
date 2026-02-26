@echo off
:: Navigate to the project directory
cd /d "f:\Uphaar\Cypher\Fashion AI\fashn-ai-web"

:: Check if node_modules exists, if not, install them
if not exist node_modules (
    npm install
)

:: Start the development server
npm run dev
