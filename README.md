## mangapuppet

#### Scraping tool for scraping recent chapters of some manga websites.

For development, run the script with:

 1. `npm i`

 2. `npm start` (without building) or `npm run start:prod` (builds and run the prod file)

 Recent Chapters will be logged on the console.

 Bundling:

 `npm pack`

Running bundled app:

1. Bundling generates a file called: `mangapuppet@1.0.0`

2. Then install: `npm install mangapuppet-1.0.0.tgz `

3. Run with: `node node_modules/mangapuppet/src/index.js`