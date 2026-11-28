import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {once} from 'node:events';
import {createLabServer} from '../api/server.mjs';
import {workshops,receipt,list,reserve} from '../vue/src/http.mjs';
import {POST} from '../next/app/api/reservas/route.js';
async function withApi(fn){const server=createLabServer().listen(0,'127.0.0.1'); await once(server,'listening'); try {await fn('http://127.0.0.1:'+server.address().port)} finally {await new Promise(resolve=>server.close(resolve));}}
test('contratos',()=>{assert.throws(()=>workshops([{id:'react',seats:'dos'}]));assert.throws(()=>receipt({seats:0}));assert.deepEqual(workshops([]),[])});
test('cliente HTTP y conflicto',()=>withApi(async base=>{assert.equal((await list(base))[0].seats,2);assert.equal((await reserve({workshopId:'react',seats:2},base)).remaining,0);await assert.rejects(reserve({workshopId:'react',seats:1},base),/409/);await assert.rejects(reserve({workshopId:'react',seats:0},base),/422/);assert.equal((await list(base))[0].seats,0)}));
test('módulos iguales',async()=>assert.equal(await readFile(new URL('../vue/src/http.mjs',import.meta.url),'utf8'),await readFile(new URL('../next/lib/http.mjs',import.meta.url),'utf8')));
test('Route Handler conserva estado',()=>withApi(async base=>{const previous=process.env.API_BASE_URL;process.env.API_BASE_URL=base;try{const req=()=>new Request('http://localhost/api/reservas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workshopId:'react',seats:2})});assert.equal((await POST(req())).status,201);assert.equal((await POST(req())).status,409)}finally{if(previous===undefined)delete process.env.API_BASE_URL;else process.env.API_BASE_URL=previous}}));
