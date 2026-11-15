import assert from 'node:assert/strict';
import {test} from 'node:test';
import {restoreAuthSession} from '../src/auth-session.js';

test('session restoration renews through the auth provider before verifying the user',async()=>{
 const calls=[],user={id:'account-a'};
 assert.equal(await restoreAuthSession({refreshSession:async()=>{calls.push('refresh');},getUser:async()=>{calls.push('getUser');return user;}}),user);
 assert.deepEqual(calls,['refresh','getUser']);
});
test('failed renewal never invents authentication or prevents a verified session read',async()=>{
 const calls=[];
 assert.equal(await restoreAuthSession({refreshSession:async()=>{calls.push('refresh');throw Error('expired');},getUser:async()=>{calls.push('getUser');return null;}}),null);
 assert.deepEqual(calls,['refresh','getUser']);
 await assert.rejects(restoreAuthSession({refreshSession:async()=>{},getUser:async()=>{throw Error('offline');}}),/offline/);
});
// Real SDK persistence, failed switches, logout and recovery are exercised by
// test-supabase-account.mjs; the production account UI by test-multi-production.mjs.
