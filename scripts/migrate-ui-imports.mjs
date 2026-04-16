import fs from 'fs';
import path from 'path';

// The root folders to search
const foldersToScan = [
    path.resolve(process.cwd(), 'apps/desktop/src'),
    path.resolve(process.cwd(), 'apps/web/src')
];

// The components we moved
const components = ["button", "card", "dropdown-menu", "input", "progress", "skeleton"];

// Function to recursively get all files in a directory
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    
    let files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
};

let filesChangedCount = 0;

console.log('🚀 Starting UI Import Migration...');

foldersToScan.forEach(folder => {
    const files = getAllFiles(folder);
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;

        // Replace imports like: import { Button } from "@/components/ui/button"
        // And also relative imports like: import { Button } from "../../components/ui/button"
         components.forEach(comp => {
            // Match any path ending in components/ui/{comp}
            const regex = new RegExp(`from\\s+['"].*?components/ui/${comp}['"]`, 'g');
            content = content.replace(regex, `from "@lekhaly/ui"`);
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            filesChangedCount++;
        }
    });
});

console.log(`✅ Migration complete! Updated ${filesChangedCount} files to use @lekhaly/ui.`);

// Delete the old unused desktop components folder
const desktopUIDir = path.resolve(process.cwd(), 'apps/desktop/src/components/ui');
if (fs.existsSync(desktopUIDir)) {
    console.log(`🗑️ Deleting redundant desktop UI components folder...`);
    fs.rmSync(desktopUIDir, { recursive: true, force: true });
    console.log(`✅ Deleted.`);
}
