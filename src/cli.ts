#!/usr/bin/env node
import { run } from './index';
import path from 'path';

run(path.join(process.cwd(), 'coverage/coverage-final.json'));
