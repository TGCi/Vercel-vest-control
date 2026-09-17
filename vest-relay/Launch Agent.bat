@echo off
REM Edit this URL to your deployment, then double-click on the vest PC.
set "URL=https://your-app.vercel.app/agent"

start "" msedge.exe --app="%URL%" && goto :done
start "" chrome.exe --app="%URL%" && goto :done
start "" "%URL%"
:done
