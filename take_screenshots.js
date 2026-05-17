const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function getAllProjectUrls() {
    const publicDir = path.join(__dirname, 'frontend/public');
    const allUrls = [];
    
    async function scanDir(dir) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath);
            } else if (entry.name.endsWith('.html')) {
                const relativePath = path.relative(publicDir, fullPath).replace(/\\/g, '/');
                allUrls.push(`http://localhost:3000/${relativePath}`);
            }
        }
    }
    
    await scanDir(publicDir);
    return allUrls;
}

async function captureScreenshots() {
    const outDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir);
    }

    const urls = await getAllProjectUrls();
    console.log(`Found ${urls.length} project pages to capture in 4K`);

    // Launch playwright
    const browser = await chromium.launch({ headless: true });
    
    for (const url of urls) {
        // Create context with high deviceScaleFactor to fix blur
        const context = await browser.newContext({
            viewport: { width: 3840, height: 2160 }, // 4K resolution
            deviceScaleFactor: 2, // Ultra high quality, anti-blur
            reducedMotion: 'no-preference'
        });
        
        const page = await context.newPage();
        
        // Append ?screenshot=true to deal with fixed headers and padding issues
        let targetUrl = url;
        if (targetUrl.includes('?')) {
            targetUrl += '&screenshot=true';
        } else {
            targetUrl += '?screenshot=true';
        }

        console.log(`Capturing ${targetUrl}...`);
        
        try {
            await page.goto(targetUrl, { waitUntil: 'load', timeout: 45000 });
            
            // Force animations complete, JS render
            await page.evaluate(() => window.dispatchEvent(new Event('load')));
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(3000); // Extra for complex pages
            
            const pathname = new URL(targetUrl).pathname.slice(1) || 'index';
            const timestamp = Date.now();
            const fileName = pathname.replace(/[\\/]/g, '_') + `.${timestamp}.png`;
            const outputPath = path.join(outDir, fileName);
            
            // Ultra high quality PNG
            await page.screenshot({ 
                path: outputPath, 
                fullPage: true 
            });
            
            console.log(`Saved: ${outputPath}`);
        } catch (e) {
            console.error(`Failed to capture ${url}:`, e.message);
        }
        
        await context.close();
    }
    
    await browser.close();
    console.log('All screenshots captured successfully.');
}

captureScreenshots().catch(err => {
    console.error('Error running script:', err);
});
