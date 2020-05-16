const fs = require('fs')
const path = require('path')
const ROOT_PATH = path.join(__dirname, '..')
const child_process = require('child_process')

child_process.execSync("gitbook build")

console.log('编译中')

child_process.execSync('git checkout gh-pages')

const BOOK_PATH = path.join(ROOT_PATH, '_book')
const dirs = fs.readdirSync(BOOK_PATH)
for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i]
    fs.copyFileSync(path.join(BOOK_PATH, dir), path.join(BOOK_PATH, '..', dir));
}

