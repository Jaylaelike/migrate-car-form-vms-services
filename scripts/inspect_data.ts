import fs from 'fs';
import path from 'path';

const carsSqlPath = path.join(process.cwd(), 'online_reporting.sql');
const carsSqlContent = fs.readFileSync(carsSqlPath, 'utf8');

const carsRegex = /\((\d+),\s*'([^']*)',\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*(\d+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*(\d+|NULL),\s*([\d\.]+|NULL),\s*([\d\.]+|NULL),\s*('?[^',]*'?|NULL),\s*('?[^',]*'?|NULL),\s*'([^']*)',\s*'([^']*)',\s*('?[^',]*'?|NULL)\)/g;

let match;
const carUsers = new Set<string>();

while ((match = carsRegex.exec(carsSqlContent)) !== null) {
    const carUser = match[16]; // 16th capture group corresponds to carUser
    carUsers.add(carUser);
}

console.log('Unique carUser values:', Array.from(carUsers));
