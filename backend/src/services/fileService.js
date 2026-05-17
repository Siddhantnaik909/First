const fs = require('fs').promises;
const path = require('path');
const { memoryStore } = require('../store/memoryStore');

const PUBLIC_DIR = path.resolve(__dirname, '../../../frontend/public');

/**
 * Robust Cross-Platform Path Security Helper
 * Prevents directory traversal attacks by validating resolved boundaries.
 */
function safeResolve(filePath, allowRoot = false) {
    if (!filePath) {
        if (allowRoot) return PUBLIC_DIR;
        throw new Error('Path cannot be empty');
    }
    
    const resolvedPublic = path.resolve(PUBLIC_DIR);
    const resolvedTarget = path.resolve(PUBLIC_DIR, filePath);
    
    // Relative path from PUBLIC_DIR to target
    const relative = path.relative(resolvedPublic, resolvedTarget);
    
    // Verify target path remains nested inside PUBLIC_DIR
    const isSafe = !relative.startsWith('..') && !path.isAbsolute(relative);
    if (!isSafe) {
        throw new Error('Invalid path: Directory traversal detected');
    }
    
    if (!allowRoot && relative === '') {
        throw new Error('Access to root directory is not allowed');
    }
    
    return resolvedTarget;
}

/**
 * List files in directory
 */
async function listFiles(dir = '.') {
    try {
        const fullPath = safeResolve(dir, true);
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
        const fullPath = safeResolve(filePath);
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
        const fullPath = safeResolve(filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf8');
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
        const fullPath = safeResolve(dirPath);
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
        const oldFull = safeResolve(oldPath);
        const newFull = safeResolve(newPath);
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
        const sourceFull = safeResolve(sourcePath);
        const targetFull = safeResolve(targetPath);
        await fs.copyFile(sourceFull, targetFull);
        memoryStore.serverLogs.unshift(`[ADMIN] Copied: ${sourcePath} → ${targetPath}`);
        return { message: 'File copied' };
    } catch (err) {
        console.error('Copy error:', err);
        throw new Error(`Failed to copy: ${err.message}`);
    }
}

/**
 * Delete file or directory (dynamically checks FS node type)
 */
async function deleteFile(filePath) {
    try {
        const fullPath = safeResolve(filePath);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
            await fs.rm(fullPath, { recursive: true, force: true });
        } else {
            await fs.unlink(fullPath);
        }
        memoryStore.serverLogs.unshift(`[ADMIN] Deleted: ${filePath}`);
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
