import fs from 'fs';
import path from 'path';

import { validateGlobalBehavioralBankArray } from '../src/lib/global-behavior-bank-validator';

const p = path.join(process.cwd(), 'content', 'questions', 'global-behavioral-v2', 'bank.json');
const raw = fs.readFileSync(p, 'utf8');
const data: unknown = JSON.parse(raw);
const rows = validateGlobalBehavioralBankArray(data, p);
console.log(`OK: ${rows.length} items validated at ${p}`);
