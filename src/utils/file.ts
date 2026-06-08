import fs from 'fs-extra';
import path from 'path';
import ejs from 'ejs';

/**
 * Copies a template file or directory to a destination, rendering EJS templates.
 */
export async function copyTemplate(src: string, dest: string, data: Record<string, any> = {}) {
  if (!(await fs.pathExists(src))) {
    throw new Error(`Template not found at ${src}`);
  }

  const stat = await fs.stat(src);

  if (stat.isDirectory()) {
    await fs.ensureDir(dest);
    const files = await fs.readdir(src);
    for (const file of files) {
      await copyTemplate(path.join(src, file), path.join(dest, file), data);
    }
  } else {
    if (src.endsWith('.ejs')) {
      const destPath = dest.replace(/\.ejs$/, '');
      const content = await fs.readFile(src, 'utf-8');
      const rendered = ejs.render(content, data);
      await fs.writeFile(destPath, rendered);
    } else {
      await fs.copy(src, dest);
    }
  }
}

/**
 * Updates a package.json file in the destination folder.
 */
export async function updatePackageJson(dest: string, updates: any) {
  const pkgPath = path.join(dest, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    const pkg = await fs.readJson(pkgPath);
    const updatedPkg = { ...pkg };
    
    // Deep merge simple properties like dependencies, devDependencies, scripts
    for (const key in updates) {
      if (typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        updatedPkg[key] = { ...updatedPkg[key], ...updates[key] };
      } else {
        updatedPkg[key] = updates[key];
      }
    }
    
    await fs.writeJson(pkgPath, updatedPkg, { spaces: 2 });
  }
}
