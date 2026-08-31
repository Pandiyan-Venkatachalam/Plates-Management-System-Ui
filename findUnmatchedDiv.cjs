const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// We will find all div tags and their positions
let tags = [];
let pos = 0;

while (true) {
  let nextOpen = content.indexOf('<div', pos);
  let nextClose = content.indexOf('</div>', pos);
  
  if (nextOpen === -1 && nextClose === -1) break;
  
  if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
    tags.push({ type: 'open', pos: nextOpen, line: getLine(nextOpen) });
    pos = nextOpen + 4;
  } else {
    tags.push({ type: 'close', pos: nextClose, line: getLine(nextClose) });
    pos = nextClose + 6;
  }
}

let stack = [];
for (let t of tags) {
  if (t.type === 'open') {
    stack.push(t);
  } else {
    if (stack.length === 0) {
      console.log(`Extra closing div at line ${t.line}`);
    } else {
      stack.pop();
    }
  }
}

if (stack.length > 0) {
  console.log('Unclosed divs:');
  for (let s of stack) {
    console.log(`Opening div at line ${s.line}: "${content.substring(s.pos, content.indexOf('>', s.pos) + 1).replace(/\n/g, ' ')}"`);
  }
} else {
  console.log('All divs matched!');
}

function getLine(pos) {
  return content.substring(0, pos).split('\n').length;
}
