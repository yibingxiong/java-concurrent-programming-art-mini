const fs = require('fs')
const path = require('path')
const ROOT_PATH = path.join(__dirname, '..')
const child_process = require('child_process')
const copydir = require('copy-dir');

child_process.execSync('git checkout gh-pages')
child_process.execSync('git merge master')
child_process.execSync("gitbook build")

console.log('编译中...')



const BOOK_PATH = path.join(ROOT_PATH, '_book')
const dirs = fs.readdirSync(BOOK_PATH)
for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i]
    if (dir !== 'bin') {
        copydir.sync(path.join(BOOK_PATH, dir), path.join(BOOK_PATH, '..', dir), {
            utimes: true,  // keep add time and modify time
            mode: true,    // keep file mode
            cover: true    // cover file when exists, default is true
        });
    }
}

