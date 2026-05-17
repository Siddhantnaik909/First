const fs = require('fs');
const file = 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/fun/calc_magic_8_ball.html';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/center\.textContent = "[^"]+";/g, (match) => {
    if (match.includes('?') || match.includes('8')) {
        return match;
    }
    return 'center.textContent = "●";';
});
fs.writeFileSync(file, content, 'utf8');
console.log('Done magic 8-ball generic!');
