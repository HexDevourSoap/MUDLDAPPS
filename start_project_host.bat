@echo off
cd /d "%~dp0vue-backend"
start cmd /k "node index.js"

cd /d "%~dp0vue-frontend"
start cmd /k "npm run dev -- --host"

start chrome https://localhost:5173/
