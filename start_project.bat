@echo off
cd /d "%~dp0vue-backend"
start cmd /k "node index.js"

cd /d "%~dp0vue-frontend"
start cmd /k "npm run dev"

start chrome http://localhost:5174/
