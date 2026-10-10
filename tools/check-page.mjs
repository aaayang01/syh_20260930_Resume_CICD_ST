// 自检脚本：检查个人主页项目结构与内容
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let pass = 0;
let fail = 0;
const errors = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    errors.push(name);
    console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`);
  }
}

console.log('=== 项目结构检查 ===');
check('index.html 存在', existsSync(join(root, 'index.html')));
check('styles.css 存在', existsSync(join(root, 'styles.css')));
check('tools/check-page.mjs 存在', existsSync(join(root, 'tools', 'check-page.mjs')));

let html = '';
let css = '';
try {
  html = readFileSync(join(root, 'index.html'), 'utf-8');
  css = readFileSync(join(root, 'styles.css'), 'utf-8');
} catch (e) {
  console.log('\n无法读取文件，终止检查。');
  process.exit(1);
}

console.log('\n=== index.html 内容检查 ===');
check('包含 <!DOCTYPE html>', /<!DOCTYPE html>/i.test(html));
check('包含 <html> 标签', /<html[^>]*>/i.test(html));
check('包含 <head> 和 <body>', /<head>[\s\S]*<\/head>/i.test(html) && /<body>[\s\S]*<\/body>/i.test(html));
check('包含 <title>', /<title>[\s\S]*?<\/title>/i.test(html));
check('title 非空', /<title>\s*\S[\s\S]*?<\/title>/i.test(html));
check('引用了 styles.css', /<link[^>]*href=["']styles\.css["']/i.test(html) || /<link[^>]*href=["']\.\/styles\.css["']/i.test(html));
check('包含 <h1> 标题', /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html));
check('h1 有实际文字内容', /<h1[^>]*>\s*\S[\s\S]*?<\/h1>/i.test(html));
check('包含自我介绍段落 <p>', /<p[^>]*>[\s\S]*?<\/p>/i.test(html));
check('段落有实际文字', /<p[^>]*>\s*\S[\s\S]*?<\/p>/i.test(html));

console.log('\n=== styles.css 内容检查 ===');
check('styles.css 非空', css.trim().length > 0);
check('包含 body 样式', /body\s*\{/i.test(css));
check('包含颜色/背景等样式声明', /(color|background|background-color)\s*:/i.test(css));

console.log('\n=== 内容真实性检查 ===');
const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
const pMatches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map(m => m[1]);
const allText = (h1Match?.[1] ?? '') + ' ' + pMatches.join(' ');

check('标题不是占位符', !/这里.{0,3}标题|标题.{0,3}这里|your name|your title|xxx|示例标题|模板标题/i.test(h1Match?.[1] ?? ''));
check('段落不是占位符', !/这里.{0,5}内容|你的.{0,5}介绍|lorem ipsum|示例文本|placeholder text/i.test(allText));
check('标题有实质内容（不少于 2 个字）', (h1Match?.[1]?.replace(/<[^>]+>/g, '').trim().length ?? 0) >= 2);
check('至少有一个段落文字不少于 10 字', pMatches.some(p => p.replace(/<[^>]+>/g, '').trim().length >= 10));

console.log('\n=== 检查结果 ===');
console.log(`通过: ${pass}  失败: ${fail}`);
if (fail === 0) {
  console.log('🎉 所有检查通过！页面结构完整且内容真实。');
  process.exit(0);
} else {
  console.log('⚠️  以下检查未通过：');
  errors.forEach(e => console.log('   - ' + e));
  process.exit(1);
}
