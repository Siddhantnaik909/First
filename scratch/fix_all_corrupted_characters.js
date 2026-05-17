const fs = require('fs');

const pathMap = {
    standard: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/general-math/calc_standard.html',
    scientific: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/general-math/calc_scientific.html',
    fractions: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/general-math/calc_fractions.html',
    quadratic: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/students/calc_quadratic.html',
    capacitor: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/electronics/calc_capacitor_code.html',
    age: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/date-time/calc_age.html'
};

// 1. Standard
if (fs.existsSync(pathMap.standard)) {
    let content = fs.readFileSync(pathMap.standard, 'utf8');
    content = content.replace(/>Ã·<\/button>/g, '>÷</button>');
    content = content.replace(/>Ã×<\/button>/g, '>×</button>');
    content = content.replace(/>Ã¢Ë†â€“<\/button>/g, '>−</button>');
    content = content.replace(/\.replace\('\*','Ã—'\)\.replace\('\/','Ã·'\)/g, ".replace('*','×').replace('/','÷')");
    fs.writeFileSync(pathMap.standard, content, 'utf8');
    console.log('Fixed Standard');
}

// 2. Scientific
if (fs.existsSync(pathMap.scientific)) {
    let content = fs.readFileSync(pathMap.scientific, 'utf8');
    content = content.replace(/>âˆš<\/button>/g, '>√</button>');
    content = content.replace(/>Ã·<\/button>/g, '>÷</button>');
    content = content.replace(/>Ã×<\/button>/g, '>×</button>');
    content = content.replace(/>Ï€<\/button>/g, '>π</button>');
    content = content.replace(/High Precision Math "Â¢ Smart Hub Core/g, 'High Precision Math • Smart Hub Core');
    fs.writeFileSync(pathMap.scientific, content, 'utf8');
    console.log('Fixed Scientific');
}

// 3. Fractions
if (fs.existsSync(pathMap.fractions)) {
    let content = fs.readFileSync(pathMap.fractions, 'utf8');
    content = content.replace(/value="\*">Ã×<\/option>/g, 'value="*">×</option>');
    content = content.replace(/value="\/">Ã·<\/option>/g, 'value="/">÷</option>');
    content = content.replace(/replace\('\*','Ã—'\)\.replace\('\/','Ã·'\)/g, "replace('*','×').replace('/','÷')");
    fs.writeFileSync(pathMap.fractions, content, 'utf8');
    console.log('Fixed Fractions');
}

// 4. Quadratic
if (fs.existsSync(pathMap.quadratic)) {
    let content = fs.readFileSync(pathMap.quadratic, 'utf8');
    content = content.replace(/axÃ‚Â²/g, 'ax²');
    content = content.replace(/\$\{a\}xÃ‚Â²/g, '${a}x²');
    fs.writeFileSync(pathMap.quadratic, content, 'utf8');
    console.log('Fixed Quadratic');
}

// 5. Capacitor Code
if (fs.existsSync(pathMap.capacitor)) {
    let content = fs.readFileSync(pathMap.capacitor, 'utf8');
    content = content.replace(/Formula: AB Ã— 10\^C/g, 'Formula: AB × 10^C');
    fs.writeFileSync(pathMap.capacitor, content, 'utf8');
    console.log('Fixed Capacitor');
}

// 6. Age
if (fs.existsSync(pathMap.age)) {
    let content = fs.readFileSync(pathMap.age, 'utf8');
    content = content.replace(/Birthday Today! Ã°Å¸Å½â€°/g, 'Birthday Today! 🎉');
    fs.writeFileSync(pathMap.age, content, 'utf8');
    console.log('Fixed Age');
}

console.log('All character encoding fixes completed!');
