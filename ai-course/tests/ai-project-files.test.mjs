import test from 'node:test';
import assert from 'node:assert/strict';
import {indexedDB} from 'fake-indexeddb';
import * as files from '../src/ai-projects/files.mjs';
const realIndexedDB=globalThis.indexedDB;globalThis.indexedDB=indexedDB;
process.on('exit',()=>{globalThis.indexedDB=realIndexedDB;});
test('committed attachment bytes persist and deletion removes only unreferenced files',async()=>{
 assert.equal(typeof files.deleteAttachmentFiles,'function','attachment cleanup is required');
 const resources=await files.commitFiles([{id:'remove-key',kind:'file',pendingFile:new Blob(['删除的附件'])},{id:'keep-key',kind:'file',pendingFile:new Blob(['仍引用的附件'])}]);
 assert.equal(resources[0].storageKey,'remove-key');assert.equal(resources[0].pendingFile,undefined);assert.equal(await (await files.readAttachment('remove-key')).text(),'删除的附件');
 const before=[{info:{resources:[{storageKey:'remove-key'},{storageKey:'keep-key'}]}},{info:{resources:[{storageKey:'keep-key'}]}}];
 const after=[{info:{resources:[{storageKey:'keep-key'}]}}];assert.deepEqual(files.attachmentKeysToRemove(before,after),['remove-key']);
 await files.deleteAttachmentFiles(files.attachmentKeysToRemove(before,after));await assert.rejects(files.readAttachment('remove-key'),/不存在/);assert.equal(await (await files.readAttachment('keep-key')).text(),'仍引用的附件');
});
