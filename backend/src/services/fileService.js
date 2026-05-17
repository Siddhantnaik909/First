const fs = require('fs').promises;
const path = require('path');
const { memoryStore } = require('../store/memoryStore');

const PUBLIC_DIR = path.join(__dirname, '../../../frontend/public');

/**
 * List files in directory
 */
async function listFiles(dir = '.') {
    try {
        const fullPath = path.join(PUBLIC_DIR, dir);
        const items = await fs.readdir(fullPath, { withFileTypes: true });
        const fileList = [];
        for (const item of items) {
            const itemPath = path.join(fullPath, item.name);
            const stat = await fs.stat(itemPath);
            fileList.push({
                name: item.name,
                path: dir === '.' ? item.name : `${dir}/${item.name}`,
                isDir: item.isDirectory(),
                size: stat.size,
                modified: stat.mtime
            });
        }
        return fileList.sort((a, b) => {
            if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
            return b.name.localeCompare(a.name);
        });
    } catch (err) {
        console.error('File list error:', err);
        return [];
    }
}

/**
 * Read file content
 */
async function readFile(filePath) {
    try {
        const fullPath = path.join(PUBLIC_DIR, filePath);
        // Security: prevent directory traversal
        if (fullPath.indexOf(PUBLIC_DIR) !== 0) {
            throw new Error('Invalid path');
        }
        return await fs.readFile(fullPath, 'utf8');
    } catch (err) {
        console.error('File read error:', err);
        throw new Error(`Failed to read ${filePath}: ${err.message}`);
    }
}

/**
 * Write/Save file
 */
async function writeFile(filePath, content) {
    try {
        const fullPath = path.join(PUBLIC_DIR, filePath);
        if (fullPath.indexOf(PUBLIC_DIR) !== 0) {
            throw new Error('Invalid path');
        }
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
        // Log the change
        memoryStore.serverLogs.unshift(`[ADMIN] File saved: ${filePath}`);
        return { message: 'File saved successfully' };
    } catch (err) {
        console.error('File write error:', err);
        throw new Error(`Failed to save ${filePath}: ${err.message}`);
    }
}

/**
 * Create directory
 */
async function createDirectory(dirPath) {
    try {
        const fullPath = path.join(PUBLIC_DIR, dirPath);
        if (fullPath.indexOf(PUBLIC_DIR) !== 0) {
            throw new Error('Invalid path');
        }
        await fs.mkdir(fullPath, { recursive: true });
        memoryStore.serverLogs.unshift(`[ADMIN] Directory created: ${dirPath}`);
        return { message: 'Directory created' };
    } catch (err) {
        console.error('Dir create error:', err);
        throw new Error(`Failed to create ${dirPath}: ${err.message}`);
    }
}

/**
 * Rename/Move file or directory
 */
async function rename(oldPath, newPath) {
    try {
        const oldFull = path.join(PUBLIC_DIR, oldPath);
        const newFull = path.join(PUBLIC_DIR, newPath);
        if (oldFull.indexOf(PUBLIC_DIR) !== 0 || newFull.indexOf(PUBLIC_DIR) !== 0) {
            throw new Error('Invalid path');
        }
        await fs.rename(oldFull, newFull);
        memoryStore.serverLogs.unshift(`[ADMIN] Renamed: ${oldPath} → ${newPath}`);
        return { message: 'File moved/renamed' };
    } catch (err) {
        console.error('Rename error:', err);
        throw new Error(`Failed to rename: ${err.message}`);
    }
}

/**
 * Copy file
 */
async function copyFile(sourcePath, targetPath) {
    try {
        const sourceFull = path.join(PUBLIC_DIR, sourcePath);
        const targetFull = path.join(PUBLIC_DIR, targetPath);
        if (sourceFull.indexOf(PUBLIC_DIR) !== 0 || targetFull.indexOf(PUBLIC_DIR) !== 0) {
            throw new Error('Invalid path');
        }
        await fs.copyFile(sourceFull, targetFull);
        memoryStore.serverLogs.unshift(`[ADMIN] Copied: ${sourcePath} → ${targetPath}`);
        return { message: 'File copied' };
    } catch (err) {
        console.error('Copy error:', err);
        throw new Error(`Failed to copy: ${err.message}`);
    }
}

/**
 * Delete file or directory
 */
async function deleteFile(filePath, isDir = false) {
    try {
        const fullPath = path.join(PUBLIC_DIR, filePath);
        if (fullPath.indexOf(PUBLIC_DIR) !== 0) {
            throw new Error('Invalid path');
        }
        if (isDir) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }
        memoryStore.serverLogs.unshift(`[ADMIN] Deleted: ${filePath} (${isDir ? 'dir' : 'file'})`);
        return { message: 'File deleted' };
    } catch (err) {
        console.error('Delete error:', err);
        throw new Error(`Failed to delete: ${err.message}`);
    }
}

module.exports = {
    listFiles,
    readFile,
    writeFile,
    createDirectory,
    rename,
    copyFile,
    deleteFile
};

