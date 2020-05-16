const fs = require('fs')
const path = require('path')
const ROOT_PATH=path.join(__dirname, '..')

const dirs = fs.readdirSync(ROOT_PATH, {encoding: 'utf-8'}).sort();

/*
* [前言](README.md)
* [第01章-在idea怎么调试jdk源码](第01章-在idea怎么调试jdk源码/README.md)
* [第02章-并发编程基础](第02章-并发编程基础/README.md)
    * [01-线程的定义和意义](第02章-并发编程基础/01-线程的定义和意义.md)
    * [02-创建线程的三种方式](第02章-并发编程基础/02-创建线程的三种方式.md)
    * [03-线程的一些属性](第02章-并发编程基础/03-线程的一些属性.md)
    * [04-线程同步](第02章-并发编程基础/04-线程同步.md)
    * [05-线程间的通信](第02章-并发编程基础/05-线程间的通信.md)
    * [06-控制线程](第02章-并发编程基础/06-控制线程.md)
    * [07-线程的生命周期](第02章-并发编程基础/07-线程的生命周期.md)
    * [08-ThreadLocal](第02章-并发编程基础/08-ThreadLocal.md)
    * [09-原子类](第02章-并发编程基础/09-原子类.md)
*/

let outputStr = `
# 目录

* [前言](README.md)
`;

for (let i = 0; i<dirs.length; i++) {
    let dir = dirs[i];
    if (/^第\d+章/.test(dir)) {
       outputStr+= `
* [${dir}](${dir}/README.md)
        `;

        const chapterPath = path.join(ROOT_PATH, dir);
        const sections = fs.readdirSync(chapterPath, {encoding: 'utf-8'}).sort();
        for (let j = 0; j<sections.length; j++) {
            const section = sections[j];
            if (/^\d+/.test(section)) {
                const sectionName = section.substring(0, section.lastIndexOf('.'));
                outputStr+=`
    * [${sectionName}](${dir}/${section})
                `
            }
        }
    }
}

console.log('输出目录如下：')
console.log('=======================================')
console.log(outputStr)
console.log('=======================================')

fs.writeFileSync(path.join(ROOT_PATH, 'SUMMARY.md'), outputStr, {encoding: 'utf-8'})

console.log('输出成功');