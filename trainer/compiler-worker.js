import { createCompiler } from '@live-codes/clang-wasm';

const BIT_TESTS = String.raw`
#include <limits.h>
#include <stdio.h>
#define CHECK(label, expression) do { if (!(expression)) { fprintf(stderr, "FAIL: %s\n", label); return 1; } printf("PASS: %s\n", label); } while (0)
int main(void) {
    const unsigned int top_bit = (unsigned int)(sizeof(unsigned int) * CHAR_BIT - 1u);
    CHECK("set bit", set_bit(0u, 3u) == 8u);
    CHECK("clear bit", clear_bit(8u, 3u) == 0u);
    CHECK("toggle bit on", toggle_bit(0u, 3u) == 8u);
    CHECK("toggle bit off", toggle_bit(8u, 3u) == 0u);
    CHECK("test set and clear", test_bit(8u, 3u) != 0 && test_bit(0u, 3u) == 0);
    CHECK("highest valid bit", test_bit(set_bit(0u, top_bit), top_bit) != 0);
    return 0;
}
`;

const RING_TESTS = String.raw`
#include <stdio.h>
#define CHECK(label, expression) do { if (!(expression)) { fprintf(stderr, "FAIL: %s\n", label); return 1; } printf("PASS: %s\n", label); } while (0)
static int check_fifo(void) {
    uint8_t storage[3] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 11u) || !rb_push(&rb, 22u)) return 0;
    if (!rb_pop(&rb, &out) || out != 11u) return 0;
    if (!rb_pop(&rb, &out) || out != 22u) return 0;
    return 1;
}
static int check_full(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    if (!rb_push(&rb, 1u) || !rb_push(&rb, 2u) || rb_push(&rb, 3u)) return 0;
    if (!rb_pop(&rb, &out) || out != 1u) return 0;
    if (!rb_pop(&rb, &out) || out != 2u) return 0;
    return 1;
}
static int check_wraparound(void) {
    uint8_t storage[3] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 10u) || !rb_push(&rb, 20u) || !rb_push(&rb, 30u)) return 0;
    if (!rb_pop(&rb, &out) || out != 10u || !rb_push(&rb, 40u)) return 0;
    if (!rb_pop(&rb, &out) || out != 20u) return 0;
    if (!rb_pop(&rb, &out) || out != 30u) return 0;
    if (!rb_pop(&rb, &out) || out != 40u) return 0;
    return 1;
}
static int check_zero_capacity(void) {
    uint8_t storage[1] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 0u);
    return !rb_push(&rb, 1u) && !rb_pop(&rb, &out);
}
int main(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    CHECK("empty pop", !rb_pop(&rb, &out));
    CHECK("FIFO order", check_fifo());
    CHECK("full buffer rejects extra item", check_full());
    CHECK("wraparound preserves order", check_wraparound());
    CHECK("zero capacity is safe", check_zero_capacity());
    return 0;
}
`;

let compilerPromise;

async function getCompiler() {
  if (!compilerPromise) {
    self.postMessage({type:'loading', message:'Loading browser compiler…'});
    compilerPromise = createCompiler('c', {baseUrl:new URL('/clang/', self.location.href)});
  }
  return compilerPromise;
}

function makeSource(exercise, code) {
  if (exercise === 'bit_ops') {
    return `#define main learner_demo_main\n${code}\n#undef main\n${BIT_TESTS}`;
  }
  if (exercise === 'ring_buffer') return `${code}\n${RING_TESTS}`;
  throw new Error('Unknown exercise.');
}

self.addEventListener('message', async (event) => {
  if (event.data?.type !== 'check') return;
  try {
    const compiler = await getCompiler();
    self.postMessage({type:'loading', message:'Compiling and running checks…'});
    const {output, errors, exitCode} = await compiler.run(makeSource(event.data.exercise, event.data.code), '', {
      compileArgs:['-std=c11','-Wall','-Wextra','-Werror','-pedantic']
    });
    const passed = exitCode === 0 && errors.length === 0;
    self.postMessage({type:'result', result:{
      passed,
      phase:errors.length ? 'compile' : 'run',
      message:passed ? 'All checks passed.' : (errors.length ? 'Compilation failed. Read the compiler output and try again.' : `The checker program exited with code ${exitCode}.`),
      output:output || errors.join('\n'),
      checks:output.split('\n').filter(line => line.startsWith('PASS: ')).map(line => line.slice(6)),
      compiler:'Clang WebAssembly'
    }});
  } catch (error) {
    self.postMessage({type:'result', result:{passed:false,phase:'setup',message:'Could not initialize the browser compiler. Check your connection, refresh, and retry.',output:String(error)}});
  }
});

getCompiler().then(() => self.postMessage({type:'ready'})).catch((error) => {
  self.postMessage({type:'loading', message:`Compiler setup failed: ${String(error)}`});
});
