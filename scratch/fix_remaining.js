const fs = require('fs');

const pathMap = {
    standard: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/general-math/calc_standard.html',
    scientific: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/general-math/calc_scientific.html',
    fractions: 'c:/Users/hp/Downloads/New-smart-hub--main (4)/New-smart-hub--main/frontend/public/calculators/general-math/calc_fractions.html'
};

// Standard
if (fs.existsSync(pathMap.standard)) {
    let content = fs.readFileSync(pathMap.standard, 'utf8');
    // replace standard chooseOp('*') button
    content = content.replace(/calc\.chooseOp\('\*'\)"[^>]*>[^<]+/g, 'calc.chooseOp(\'*\')" class="bg-secondary-fixed text-on-secondary-fixed py-8 rounded-xl font-bold text-2xl hover:bg-secondary-fixed-dim shadow-sm transition-all">×');
    // replace standard chooseOp('-') button
    content = content.replace(/calc\.chooseOp\('-'\)"[^>]*>[^<]+/g, 'calc.chooseOp(\'-\')" class="bg-secondary-fixed text-on-secondary-fixed py-8 rounded-xl font-bold text-2xl hover:bg-secondary-fixed-dim shadow-sm transition-all">−');
    fs.writeFileSync(pathMap.standard, content, 'utf8');
    console.log('Fixed Standard Remaining');
}

// Scientific
if (fs.existsSync(pathMap.scientific)) {
    let content = fs.readFileSync(pathMap.scientific, 'utf8');
    // replace scientific append('*') button
    content = content.replace(/append\('\*'\)"[^>]*>[^<]+/g, 'append(\'*\')" class="calc-btn p-6 bg-secondary-fixed text-on-secondary-fixed rounded-xl text-xl font-bold hover:bg-primary hover:text-white">×');
    fs.writeFileSync(pathMap.scientific, content, 'utf8');
    console.log('Fixed Scientific Remaining');
}

// Fractions
if (fs.existsSync(pathMap.fractions)) {
    let content = fs.readFileSync(pathMap.fractions, 'utf8');
    // replace fractions multiplication option
    content = content.replace(/<option value="\*">[^<]+<\/option>/g, '<option value="*">×</option>');
    fs.writeFileSync(pathMap.fractions, content, 'utf8');
    console.log('Fixed Fractions Remaining');
}
