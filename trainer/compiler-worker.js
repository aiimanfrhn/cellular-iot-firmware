import { createCompiler } from '@live-codes/clang-wasm';
import { runChecks } from './checks.js';

let compilerPromise;

async function getCompiler() {
  if (!compilerPromise) {
    self.postMessage({type:'loading', message:'Loading browser compiler…'});
    let lastPercent = -1;
    compilerPromise = createCompiler('c', {
      baseUrl:new URL('/clang/', self.location.href),
      onProgress:(value) => {
        const percent = Math.floor(value * 100);
        if (percent === lastPercent) return;
        lastPercent = percent;
        self.postMessage({type:'loading', message:`Downloading browser compiler · ${percent}%`});
      }
    });
  }
  return compilerPromise;
}

self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'check') return;
  const {exercise, filename, code} = event.data;
  let compiler;
  try {
    compiler = await getCompiler();
  } catch (error) {
    self.postMessage({type:'result', result:{passed:false,phase:'setup',message:'Could not initialize the browser compiler. Check your connection, refresh, and retry.',output:String(error),checks:[]}});
    return;
  }
  try {
    self.postMessage({type:'loading', message:'Compiling and running checks…'});
    self.postMessage({type:'result', result:await runChecks(compiler, exercise, filename, code)});
  } catch (error) {
    self.postMessage({type:'result', result:{passed:false,phase:'setup',message:'The checker hit an unexpected error. Refresh the page and try again.',output:String(error),checks:[]}});
  }
});

getCompiler().then(() => self.postMessage({type:'ready'})).catch((error) => {
  self.postMessage({type:'loading', message:`Compiler setup failed: ${String(error)}`});
});
