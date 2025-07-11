# Everything extension for Raycast for Windows

![short demo](./assets/demo.gif)

Based on https://github.com/PuttTim/windows-terminal project structure & setup

I used Everything CLI, so in theory, every es.exe command line argument for filtering should work.

to install it:
- install Node JS (winget install -e --id OpenJS.NodeJS)
- install Everything CLI (winget install --id=voidtools.Everything.Cli -e)
- clone the repository
- run: “npm ci” then “npm run dev”, which adds it to Raycast

> Author Note: Search Files is not working on my machine, so I created this as a temporary workaround
