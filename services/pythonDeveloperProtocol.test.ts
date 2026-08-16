// @ts-ignore Node's strip-types runner needs the explicit extension; production imports stay extensionless.
import { inferPythonTaskMode, modeLabel, verificationCommandFor, developerStatusLine } from './pythonDeveloperProtocol.ts';

if (inferPythonTaskMode('Why did this traceback happen?') !== 'debug') throw new Error('debug mode failed');
if (inferPythonTaskMode('Build a Python file that reads CSV') !== 'build') throw new Error('build mode failed');
if (inferPythonTaskMode('Review memory and performance') !== 'review') throw new Error('review mode failed');
if (inferPythonTaskMode('Run the approved script') !== 'operate') throw new Error('operate mode failed');
if (modeLabel('debug') !== 'DEBUG') throw new Error('label failed');
if (!verificationCommandFor('build a file').includes('py_compile')) throw new Error('build verification failed');
if (!developerStatusLine('review this slow script').includes('REVIEW')) throw new Error('status line failed');

console.log('python developer protocol: PASS');
