const fs = require('fs');
const path = require('path');
const sizeOf = require('image-size');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun, WidthType, BorderStyle, TextRun, AlignmentType, HeadingLevel } = require('docx');

const screenshotsDir = path.join(__dirname, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
    console.error('Screenshots directory not found!');
    process.exit(1);
}

// Get all PNG files
let files = fs.readdirSync(screenshotsDir)
    .filter(f => f.endsWith('.png'))
    .map(f => path.join(screenshotsDir, f));

// Sort by modification time (newest first)
files.sort((a, b) => fs.statSync(b).mtime.getTime() - fs.statSync(a).mtime.getTime());

console.log(`Found ${files.length} screenshots, sorted chronologically`);

if (files.length === 0) {
    console.error('No images found in screenshots directory!');
    process.exit(1);
}

// A4 limits to keep 2x3 grid fitting
const MAX_CELL_WIDTH = 340;  // in pixels/points
const MAX_CELL_HEIGHT = 280;

function calcDimensions(w, h, maxW, maxH) {
    const ratio = Math.min(maxW / w, maxH / h);
    return {
        width: Math.floor(w * ratio),
        height: Math.floor(h * ratio)
    };
}

// Generate the table grid
function createGrid(imageFiles) {
    const rows = [];
    
    for (let r = 0; r < 3; r++) {
        const rowCells = [];
        for (let c = 0; c < 2; c++) {
            const index = r * 2 + c;
            const file = imageFiles[index];
            
            let cellChildren = [];
            
            if (file) {
                const dims = {width: 1440, height: 2500}; // Fixed high-res viewport dimensions
                const scaled = calcDimensions(dims.width, dims.height, MAX_CELL_WIDTH, MAX_CELL_HEIGHT);
                
                const title = path.basename(file, '.png');
                
                cellChildren = [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({ text: title.toUpperCase(), bold: true, size: 24 })
                        ]
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new ImageRun({
                                data: fs.readFileSync(file),
                                transformation: {
                                    width: scaled.width,
                                    height: scaled.height
                                }
                            })
                        ]
                    })
                ];
            } else {
                cellChildren = [new Paragraph("")]; // Empty cell
            }
            
            rowCells.push(new TableCell({
                children: cellChildren,
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 200, bottom: 200, left: 100, right: 100 }
            }));
        }
        
        rows.push(new TableRow({ children: rowCells }));
    }
    
    return new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.DASHED, size: 1, color: "E2E8F0" },
            insideVertical: { style: BorderStyle.DASHED, size: 1, color: "E2E8F0" }
        }
    });
}

// Chunk files into groups of 6 (for 2x3 grids over multiple pages)
const chunks = [];
for (let i = 0; i < files.length; i += 6) {
    chunks.push(files.slice(i, i + 6));
}

const docChildren = [];
chunks.forEach((chunk, i) => {
    docChildren.push(
        new Paragraph({
            text: `Smart Hub ScreenFlow - Page ${i + 1}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
        })
    );
    docChildren.push(createGrid(chunk));
});

const doc = new Document({
    sections: [{
        properties: {
            page: {
                margin: { top: 720, right: 720, bottom: 720, left: 720 } // 0.5 inch margins
            }
        },
        children: docChildren
    }]
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync('Smart_Hub_Screenshots_Grid.docx', buffer);
    console.log('Successfully created Smart_Hub_Screenshots_Grid.docx');
}).catch(err => {
    console.error('Error creating docx:', err);
});
