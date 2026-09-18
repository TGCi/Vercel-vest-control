@echo off
REM Opens the LOCAL agent file (VestAgent.html) as an app window on the vest PC.
REM Keep VestAgent.html in the SAME folder as this .bat.
setlocal
set "P=%~dp0VestAgent.html"
set "P=%P:\=/%"
set "URL=file:///%P%"
set "EDGE1=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
set "EDGE2=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
set "CHROME1=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
set "CHROME2=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if exist "%EDGE1%"   ( start "" "%EDGE1%"   --app="%URL%" & goto :eof )
if exist "%EDGE2%"   ( start "" "%EDGE2%"   --app="%URL%" & goto :eof )
if exist "%CHROME1%" ( start "" "%CHROME1%" --app="%URL%" & goto :eof )
if exist "%CHROME2%" ( start "" "%CHROME2%" --app="%URL%" & goto :eof )
start "" "%URL%"
