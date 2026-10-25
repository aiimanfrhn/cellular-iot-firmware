/* ---------------------------------------------------------------------------
 * Interview problem set. The page (app.js) and the checker (checks.js) both
 * read this list, so a new problem only needs an entry here.
 *
 * Each problem has:
 *   id, topic, title, summary, difficulty, minutes, filename
 *   description      one paragraph, plain text
 *   requirements     HTML list (static, trusted)
 *   followups        questions interviewers commonly ask next
 *   starter          C code the learner starts from; it must compile
 *   prelude          C code placed after the learner's code: includes and helpers
 *   checks           [label, C expression] pairs; labels must not contain "
 *   forbid           optional [label, RegExp] pairs; the check fails if the
 *                    learner's code (comments removed) matches
 * ------------------------------------------------------------------------- */

/* Template tag for C sources: keeps backslashes as written and drops the
   first newline, so code can start on the line after the backtick. */
const C = (strings, ...values) => String.raw(strings, ...values).replace(/^\n/, '');

export const TOPICS = ['Bits and registers', 'Memory and pointers', 'Data and protocols', 'State machines'];

export const PROBLEMS = [
  /* ===================================================== Bits and registers */
  {
    id: 'bit_ops', topic: 'Bits and registers', title: 'Bit operations', summary: 'Set, clear, toggle, test',
    difficulty: 'Easy', minutes: 10, filename: 'bit_ops.c',
    description: 'Bit masks show up everywhere in firmware: registers, protocol flags, and compact state. Implement these four helpers safely using unsigned values.',
    requirements: '<ul><li>Implement <code>set_bit</code>, <code>clear_bit</code>, <code>toggle_bit</code>, and <code>test_bit</code>.</li><li>Assume <code>position</code> is within the width of <code>unsigned int</code>; do not use signed shifts.</li><li>Keep the demo <code>main</code> or remove it. The checker tests your functions directly, then runs your <code>main</code> and shows what it prints.</li></ul>',
    followups: [
      'Why is <code>1 &lt;&lt; 31</code> a problem but <code>1u &lt;&lt; 31</code> is fine?',
      'How would you set a bit in a memory-mapped register, and why does the pointer need <code>volatile</code>?',
      'A read-modify-write on a shared register is interrupted by an ISR that writes the same register. What goes wrong, and how do you prevent it?',
    ],
    starter: `#include <limits.h>\n#include <stdio.h>\n\n/* Return value with bit position set to 1. */\nunsigned int set_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: set the selected bit */\n    (void)position;\n    return value;\n}\n\n/* Return value with bit position cleared to 0. */\nunsigned int clear_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: clear the selected bit */\n    (void)position;\n    return value;\n}\n\n/* Return value with bit position inverted. */\nunsigned int toggle_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: toggle the selected bit */\n    (void)position;\n    return value;\n}\n\n/* Return nonzero when the selected bit is set, otherwise return 0. */\nint test_bit(unsigned int value, unsigned int position)\n{\n    /* TODO: test the selected bit */\n    (void)value;\n    (void)position;\n    return 0;\n}\n\nint main(void)\n{\n    unsigned int value = 0u;\n    value = set_bit(value, 3u);\n    printf("bit 3 set: %s\\n", test_bit(value, 3u) ? "yes" : "no");\n    return 0;\n}\n`,
    prelude: C`
#include <limits.h>
#include <stdio.h>
#define TRAINER_TOP_BIT ((unsigned int)(sizeof(unsigned int) * CHAR_BIT - 1u))
`,
    checks: [
      ['set_bit sets the bit', 'set_bit(0u, 3u) == 0x08u'],
      ['set_bit keeps other bits', 'set_bit(0xF0u, 1u) == 0xF2u'],
      ['set_bit on a set bit changes nothing', 'set_bit(0x08u, 3u) == 0x08u'],
      ['clear_bit clears the bit', 'clear_bit(0x08u, 3u) == 0u'],
      ['clear_bit keeps other bits', 'clear_bit(0xFFu, 3u) == 0xF7u'],
      ['toggle_bit turns a bit on', 'toggle_bit(0u, 3u) == 0x08u'],
      ['toggle_bit turns a bit off', 'toggle_bit(0x08u, 3u) == 0u'],
      ['toggle_bit keeps other bits', 'toggle_bit(0xA5u, 0u) == 0xA4u'],
      ['test_bit finds a set bit', 'test_bit(0x08u, 3u) != 0'],
      ['test_bit reports a clear bit as 0', 'test_bit(0xF7u, 3u) == 0'],
      ['highest bit: set and test', 'test_bit(set_bit(0u, TRAINER_TOP_BIT), TRAINER_TOP_BIT) != 0'],
      ['highest bit: clear', 'clear_bit(UINT_MAX, TRAINER_TOP_BIT) == UINT_MAX >> 1'],
    ],
  },
  {
    id: 'count_bits', topic: 'Bits and registers', title: 'Count bits and powers of two', summary: 'Popcount, x & (x - 1)',
    difficulty: 'Easy', minutes: 10, filename: 'count_bits.c',
    description: 'A favourite warm-up question. Count the 1 bits in a 32-bit word, then decide whether a value is a power of two. Both have a neat one-line trick worth knowing.',
    requirements: '<ul><li><code>count_set_bits</code> returns how many bits of <code>x</code> are 1.</li><li><code>is_power_of_two</code> returns true for 1, 2, 4, … and false for 0.</li><li>Do not use compiler built-ins such as <code>__builtin_popcount</code>.</li></ul>',
    followups: [
      'Explain why <code>x &amp; (x - 1)</code> clears the lowest set bit.',
      'Your loop runs 32 times. How can you make it run once per set bit instead?',
      'When would a 256-entry lookup table be worth the flash space?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Return the number of bits in x that are 1. */
unsigned count_set_bits(uint32_t x)
{
    /* TODO */
    (void)x;
    return 0u;
}

/* Return true when x is a power of two (exactly one bit set). */
bool is_power_of_two(uint32_t x)
{
    /* TODO */
    (void)x;
    return false;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['zero has no set bits', 'count_set_bits(0u) == 0u'],
      ['one bit', 'count_set_bits(1u) == 1u'],
      ['scattered bits', 'count_set_bits(0xF0F0u) == 8u'],
      ['top and bottom bits', 'count_set_bits(0x80000001u) == 2u'],
      ['all 32 bits', 'count_set_bits(0xFFFFFFFFu) == 32u'],
      ['1 is a power of two', 'is_power_of_two(1u)'],
      ['64 is a power of two', 'is_power_of_two(64u)'],
      ['top bit is a power of two', 'is_power_of_two(0x80000000u)'],
      ['0 is not a power of two', '!is_power_of_two(0u)'],
      ['96 is not a power of two', '!is_power_of_two(96u)'],
      ['all ones is not a power of two', '!is_power_of_two(0xFFFFFFFFu)'],
    ],
    forbid: [['no __builtin_popcount', /__builtin_popcount/]],
  },
  {
    id: 'bit_field', topic: 'Bits and registers', title: 'Register bit fields', summary: 'Read and write a field',
    difficulty: 'Medium', minutes: 15, filename: 'bit_field.c',
    description: 'Peripheral registers pack several settings into one word, such as a 3-bit prescaler at bits 4 to 6. Write helpers that read and replace a field without disturbing the bits around it.',
    requirements: '<ul><li><code>field_get</code> returns the <code>width</code>-bit field that starts at bit <code>pos</code>.</li><li><code>field_set</code> returns <code>reg</code> with that field replaced by <code>value</code>; bits of <code>value</code> above <code>width</code> are ignored.</li><li>Assume <code>1 &lt;= width &lt;= 32</code> and <code>pos + width &lt;= 32</code>. Careful: <code>width</code> can be 32, and shifting a 32-bit value by 32 is undefined behaviour.</li></ul>',
    followups: [
      'Why is shifting a 32-bit value by 32 undefined, and what does your hardware actually do?',
      'Vendor headers define <code>_Pos</code> and <code>_Msk</code> macros for every field. Why is that better than magic numbers?',
      'When would you use a C bit-field struct for a register, and why do many firmware teams avoid it?',
    ],
    starter: C`
#include <stdint.h>

/* Return the width-bit field of reg that starts at bit pos. */
uint32_t field_get(uint32_t reg, unsigned pos, unsigned width)
{
    /* TODO */
    (void)reg;
    (void)pos;
    (void)width;
    return 0u;
}

/* Return reg with the width-bit field at pos replaced by value. */
uint32_t field_set(uint32_t reg, unsigned pos, unsigned width, uint32_t value)
{
    /* TODO */
    (void)pos;
    (void)width;
    (void)value;
    return reg;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['get a middle byte', 'field_get(0xABCD1234u, 8u, 8u) == 0x12u'],
      ['get the top nibble', 'field_get(0xABCD1234u, 28u, 4u) == 0xAu'],
      ['get a single top bit', 'field_get(0x80000000u, 31u, 1u) == 1u'],
      ['get a 3-bit field', 'field_get(0x00000070u, 4u, 3u) == 7u'],
      ['get the whole word (width 32)', 'field_get(0xDEADBEEFu, 0u, 32u) == 0xDEADBEEFu'],
      ['set into zero', 'field_set(0u, 8u, 4u, 0xAu) == 0xA00u'],
      ['set clears old field bits', 'field_set(0xFFFFFFFFu, 4u, 4u, 0u) == 0xFFFFFF0Fu'],
      ['set keeps neighbouring bits', 'field_set(0x12345678u, 8u, 8u, 0xABu) == 0x1234AB78u'],
      ['set masks an oversized value', 'field_set(0u, 0u, 4u, 0x1Fu) == 0xFu'],
      ['set the whole word (width 32)', 'field_set(0x12345678u, 0u, 32u, 0xCAFEF00Du) == 0xCAFEF00Du'],
    ],
  },
  {
    id: 'reverse_bits', topic: 'Bits and registers', title: 'Reverse bits and swap bytes', summary: 'Bit order, byte order',
    difficulty: 'Medium', minutes: 15, filename: 'reverse_bits.c',
    description: 'Mirror the bit order of a 32-bit word, then swap its byte order. Byte swapping comes up whenever a little-endian MCU talks to a big-endian network or sensor.',
    requirements: '<ul><li><code>reverse_bits</code>: bit 0 becomes bit 31, bit 1 becomes bit 30, and so on.</li><li><code>swap_bytes32</code>: <code>0x12345678</code> becomes <code>0x78563412</code>.</li><li>Do not use compiler built-ins such as <code>__builtin_bswap32</code> or <code>__builtin_bitreverse32</code>.</li></ul>',
    followups: [
      'Can you reverse the bits without a loop, using masks and shifts in five steps?',
      'Many cores have an instruction for this (ARM <code>RBIT</code>, <code>REV</code>). How would you check whether the compiler uses it?',
      'Where have you needed a byte swap in a real protocol?',
    ],
    starter: C`
#include <stdint.h>

/* Return x with its bit order reversed (bit 0 <-> bit 31). */
uint32_t reverse_bits(uint32_t x)
{
    /* TODO */
    return x;
}

/* Return x with its byte order reversed (0x12345678 -> 0x78563412). */
uint32_t swap_bytes32(uint32_t x)
{
    /* TODO */
    return x;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['reverse bit 0 to bit 31', 'reverse_bits(1u) == 0x80000000u'],
      ['reverse bit 31 to bit 0', 'reverse_bits(0x80000000u) == 1u'],
      ['reverse a top nibble', 'reverse_bits(0xF0000000u) == 0xFu'],
      ['reverse a mixed word', 'reverse_bits(0x12345678u) == 0x1E6A2C48u'],
      ['reverse zero and all ones', 'reverse_bits(0u) == 0u && reverse_bits(0xFFFFFFFFu) == 0xFFFFFFFFu'],
      ['swap a mixed word', 'swap_bytes32(0x12345678u) == 0x78563412u'],
      ['swap moves the low byte to the top', 'swap_bytes32(0x000000FFu) == 0xFF000000u'],
      ['swapping twice gives the original', 'swap_bytes32(swap_bytes32(0xCAFEF00Du)) == 0xCAFEF00Du'],
    ],
    forbid: [['no byte-swap or bit-reverse built-ins', /__builtin_(bswap|bitreverse)/]],
  },

  /* ==================================================== Memory and pointers */
  {
    id: 'align', topic: 'Memory and pointers', title: 'Align an address', summary: 'Round up to a boundary',
    difficulty: 'Easy', minutes: 10, filename: 'align.c',
    description: 'DMA buffers, stacks, and allocators all need addresses rounded up to a boundary such as 4, 8, or 4096 bytes. Implement the rounding and a check, using bit masks rather than division.',
    requirements: '<ul><li><code>align_up</code> returns the smallest multiple of <code>align</code> that is <code>&gt;= x</code>.</li><li><code>is_aligned</code> returns true when <code>x</code> is a multiple of <code>align</code>.</li><li>Assume <code>align</code> is a power of two. Try to avoid <code>/</code> and <code>%</code>.</li></ul>',
    followups: [
      'Why does <code>(x + align - 1) &amp; ~(align - 1)</code> only work for powers of two?',
      'What happens on a Cortex-M0 if you read a <code>uint32_t</code> from an odd address?',
      'Why might a DMA buffer need to be aligned to a cache line?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Round x up to the next multiple of align (a power of two). */
uintptr_t align_up(uintptr_t x, uintptr_t align)
{
    /* TODO */
    (void)align;
    return x;
}

/* Return true when x is a multiple of align (a power of two). */
bool is_aligned(uintptr_t x, uintptr_t align)
{
    /* TODO */
    (void)x;
    (void)align;
    return false;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['zero stays zero', 'align_up(0u, 8u) == 0u'],
      ['1 rounds up to 8', 'align_up(1u, 8u) == 8u'],
      ['an aligned value is unchanged', 'align_up(8u, 8u) == 8u'],
      ['9 rounds up to 12 (align 4)', 'align_up(9u, 4u) == 12u'],
      ['align 1 changes nothing', 'align_up(13u, 1u) == 13u'],
      ['page alignment', 'align_up(0x1001u, 0x1000u) == 0x2000u'],
      ['16 is 8-aligned', 'is_aligned(16u, 8u)'],
      ['12 is not 8-aligned', '!is_aligned(12u, 8u)'],
      ['0 is aligned to anything', 'is_aligned(0u, 4u)'],
    ],
  },
  {
    id: 'my_memmove', topic: 'Memory and pointers', title: 'memmove with overlap', summary: 'Copy safely in either direction',
    difficulty: 'Medium', minutes: 15, filename: 'my_memmove.c',
    description: 'Write your own memmove. The interviewer wants to see that you know why memcpy is not enough: when the source and destination overlap, the copy direction matters.',
    requirements: '<ul><li>Copy <code>n</code> bytes from <code>src</code> to <code>dst</code> and return <code>dst</code>.</li><li>The result must be correct even when the two regions overlap in either direction.</li><li>Do not call <code>memcpy</code> or <code>memmove</code>.</li></ul>',
    followups: [
      'Why is memcpy allowed to be faster than memmove?',
      'How would you speed this up by copying a word at a time, and what alignment problems does that bring?',
      'Comparing two unrelated pointers with <code>&lt;</code> is technically undefined in C. How do real libc implementations deal with that?',
    ],
    starter: C`
#include <stddef.h>
#include <stdint.h>

/* Copy n bytes from src to dst, correctly even if they overlap. Return dst. */
void *my_memmove(void *dst, const void *src, size_t n)
{
    /* TODO */
    (void)src;
    (void)n;
    return dst;
}
`,
    prelude: C`
#include <stdio.h>
#include <string.h>
static int trainer_plain_copy(void) {
    uint8_t src[5] = {1, 2, 3, 4, 5}, dst[5] = {0};
    return my_memmove(dst, src, 5u) == dst && memcmp(dst, src, 5u) == 0;
}
static int trainer_overlap_forward(void) {
    uint8_t buf[8] = {1, 2, 3, 4, 5, 6, 7, 8}, want[8] = {1, 2, 1, 2, 3, 4, 5, 6};
    my_memmove(buf + 2, buf, 6u);
    return memcmp(buf, want, 8u) == 0;
}
static int trainer_overlap_backward(void) {
    uint8_t buf[8] = {1, 2, 3, 4, 5, 6, 7, 8}, want[8] = {3, 4, 5, 6, 7, 8, 7, 8};
    my_memmove(buf, buf + 2, 6u);
    return memcmp(buf, want, 8u) == 0;
}
static int trainer_zero_length(void) {
    uint8_t a[2] = {1, 2}, b[2] = {9, 9};
    return my_memmove(b, a, 0u) == b && b[0] == 9u && b[1] == 9u;
}
static int trainer_same_pointer(void) {
    uint8_t buf[4] = {4, 3, 2, 1};
    return my_memmove(buf, buf, 4u) == buf && buf[0] == 4u && buf[3] == 1u;
}
`,
    checks: [
      ['copies separate buffers and returns dst', 'trainer_plain_copy()'],
      ['overlap with dst after src', 'trainer_overlap_forward()'],
      ['overlap with dst before src', 'trainer_overlap_backward()'],
      ['n == 0 changes nothing', 'trainer_zero_length()'],
      ['dst == src is safe', 'trainer_same_pointer()'],
    ],
    forbid: [['does not call memcpy or memmove', /\bmem(cpy|move)\s*\(/]],
  },
  {
    id: 'mem_pool', topic: 'Memory and pointers', title: 'Fixed-block memory pool', summary: 'malloc without the heap',
    difficulty: 'Hard', minutes: 25, filename: 'mem_pool.c',
    description: 'Many firmware projects ban malloc because of fragmentation and unpredictable timing. Build a pool that hands out equal-sized blocks from a static buffer, keeping the free blocks in a linked list stored inside the blocks themselves.',
    requirements: '<ul><li><code>pool_init</code> splits <code>buffer</code> into <code>block_count</code> blocks of <code>block_size</code> bytes. Return false if <code>block_size &lt; sizeof(void *)</code> or <code>block_count</code> is 0.</li><li><code>pool_alloc</code> returns a free block, or <code>NULL</code> when none are left.</li><li><code>pool_free</code> returns a block to the pool; <code>pool_free(pool, NULL)</code> does nothing.</li><li>You may add fields to <code>Pool</code>, but keep its name and the function signatures. The buffer is aligned for pointers, and <code>block_size</code> is a multiple of <code>sizeof(void *)</code>.</li></ul>',
    followups: [
      'Why is pool_alloc O(1), and why does that matter in an interrupt or real-time task?',
      'How would you make this pool safe to use from two RTOS tasks? From an ISR?',
      'How could you detect a double free or a block that was never allocated from this pool?',
    ],
    starter: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct Pool {
    void *free_list;    /* first free block, or NULL */
    size_t block_size;
} Pool;

bool pool_init(Pool *pool, void *buffer, size_t block_size, size_t block_count)
{
    /* TODO: link every block into the free list */
    (void)pool;
    (void)buffer;
    (void)block_size;
    (void)block_count;
    return false;
}

void *pool_alloc(Pool *pool)
{
    /* TODO: take the first block off the free list */
    (void)pool;
    return NULL;
}

void pool_free(Pool *pool, void *block)
{
    /* TODO: push the block back onto the free list */
    (void)pool;
    (void)block;
}
`,
    prelude: C`
#include <stdio.h>
#include <string.h>
#define TRAINER_BLOCK (4u * sizeof(void *))
static void *trainer_storage[4 * 4];   /* room for 4 blocks, pointer aligned */
static int trainer_in_buffer(const void *block) {
    const uint8_t *b = (const uint8_t *)block, *start = (const uint8_t *)trainer_storage;
    return b >= start && b + TRAINER_BLOCK <= start + sizeof trainer_storage && (size_t)(b - start) % TRAINER_BLOCK == 0u;
}
static int trainer_rejects_bad_args(void) {
    Pool pool;
    return !pool_init(&pool, trainer_storage, 1u, 4u) && !pool_init(&pool, trainer_storage, TRAINER_BLOCK, 0u);
}
static int trainer_all_blocks(void) {
    Pool pool; void *got[4];
    if (!pool_init(&pool, trainer_storage, TRAINER_BLOCK, 4u)) return 0;
    for (int i = 0; i < 4; i++) {
        got[i] = pool_alloc(&pool);
        if (!got[i] || !trainer_in_buffer(got[i])) return 0;
        for (int j = 0; j < i; j++) if (got[j] == got[i]) return 0;
    }
    return pool_alloc(&pool) == NULL;
}
static int trainer_no_overlap(void) {
    Pool pool; uint8_t *got[4];
    if (!pool_init(&pool, trainer_storage, TRAINER_BLOCK, 4u)) return 0;
    for (int i = 0; i < 4; i++) { got[i] = pool_alloc(&pool); if (!got[i]) return 0; memset(got[i], 0x10 + i, TRAINER_BLOCK); }
    for (int i = 0; i < 4; i++) for (size_t k = 0; k < TRAINER_BLOCK; k++) if (got[i][k] != 0x10 + i) return 0;
    return 1;
}
static int trainer_free_reuses(void) {
    Pool pool; void *a, *b, *c, *d;
    if (!pool_init(&pool, trainer_storage, TRAINER_BLOCK, 4u)) return 0;
    a = pool_alloc(&pool); b = pool_alloc(&pool); c = pool_alloc(&pool); d = pool_alloc(&pool);
    if (!a || !b || !c || !d || pool_alloc(&pool)) return 0;
    pool_free(&pool, b);
    if (pool_alloc(&pool) != b || pool_alloc(&pool) != NULL) return 0;
    pool_free(&pool, a); pool_free(&pool, d);
    void *x = pool_alloc(&pool), *y = pool_alloc(&pool);
    return x && y && x != y && (x == a || x == d) && (y == a || y == d) && pool_alloc(&pool) == NULL;
}
static int trainer_free_null(void) {
    Pool pool;
    if (!pool_init(&pool, trainer_storage, TRAINER_BLOCK, 1u)) return 0;
    pool_free(&pool, NULL);
    return pool_alloc(&pool) != NULL && pool_alloc(&pool) == NULL;
}
static int trainer_reinit(void) {
    Pool pool;
    if (!pool_init(&pool, trainer_storage, TRAINER_BLOCK, 2u)) return 0;
    if (!pool_alloc(&pool) || !pool_alloc(&pool) || pool_alloc(&pool)) return 0;
    if (!pool_init(&pool, trainer_storage, TRAINER_BLOCK, 2u)) return 0;
    return pool_alloc(&pool) && pool_alloc(&pool) && !pool_alloc(&pool);
}
`,
    checks: [
      ['init rejects tiny blocks and zero count', 'trainer_rejects_bad_args()'],
      ['hands out every block once, then NULL', 'trainer_all_blocks()'],
      ['blocks do not overlap', 'trainer_no_overlap()'],
      ['freed blocks are reused', 'trainer_free_reuses()'],
      ['pool_free(NULL) is ignored', 'trainer_free_null()'],
      ['pool_init resets a used pool', 'trainer_reinit()'],
    ],
    forbid: [['does not call malloc or free', /\b(malloc|calloc|realloc|free)\s*\(/]],
  },

  /* ===================================================== Data and protocols */
  {
    id: 'endian', topic: 'Data and protocols', title: 'Endian-safe byte access', summary: 'Read and write wire formats',
    difficulty: 'Easy', minutes: 10, filename: 'endian.c',
    description: 'Packets, sensor registers and file headers store multi-byte numbers in a fixed byte order. Read and write them byte by byte, so the code works the same on any CPU and at any address.',
    requirements: '<ul><li><code>read_be16</code> and <code>read_be32</code> read big-endian values (most significant byte first).</li><li><code>read_le32</code> reads a little-endian value.</li><li><code>write_be32</code> stores <code>value</code> into exactly four bytes, big-endian.</li><li>Do not cast the byte pointer to <code>uint32_t *</code>; it may be unaligned.</li></ul>',
    followups: [
      'Why is <code>*(uint32_t *)p</code> wrong here even on a little-endian CPU?',
      'In <code>p[0] &lt;&lt; 24</code>, <code>p[0]</code> is promoted to <code>int</code>. When does that bite you?',
      'How do <code>htonl</code> and <code>ntohl</code> relate to these functions?',
    ],
    starter: C`
#include <stdint.h>

uint16_t read_be16(const uint8_t *p)
{
    /* TODO */
    (void)p;
    return 0u;
}

uint32_t read_be32(const uint8_t *p)
{
    /* TODO */
    (void)p;
    return 0u;
}

uint32_t read_le32(const uint8_t *p)
{
    /* TODO */
    (void)p;
    return 0u;
}

void write_be32(uint8_t *p, uint32_t value)
{
    /* TODO */
    (void)p;
    (void)value;
}
`,
    prelude: C`
#include <stdio.h>
static const uint8_t trainer_bytes[5] = {0x00, 0x12, 0x34, 0x56, 0x78};
static int trainer_write(void) {
    uint8_t buf[6] = {0xAA, 0, 0, 0, 0, 0xBB};
    write_be32(buf + 1, 0xCAFEF00Du);
    return buf[0] == 0xAA && buf[1] == 0xCA && buf[2] == 0xFE && buf[3] == 0xF0 && buf[4] == 0x0D && buf[5] == 0xBB;
}
static int trainer_round_trip(void) {
    uint8_t buf[4];
    write_be32(buf, 0x89ABCDEFu);
    return read_be32(buf) == 0x89ABCDEFu;
}
`,
    checks: [
      ['read_be16', 'read_be16(trainer_bytes + 1) == 0x1234u'],
      ['read_be16 with a high byte', 'read_be16((const uint8_t[]){0xFF, 0x01}) == 0xFF01u'],
      ['read_be32 from an odd address', 'read_be32(trainer_bytes + 1) == 0x12345678u'],
      ['read_be32 with the top bit set', 'read_be32((const uint8_t[]){0xFF, 0xFE, 0xFD, 0xFC}) == 0xFFFEFDFCu'],
      ['read_le32', 'read_le32(trainer_bytes + 1) == 0x78563412u'],
      ['read_le32 with the top bit set', 'read_le32((const uint8_t[]){0x01, 0x02, 0x03, 0x80}) == 0x80030201u'],
      ['write_be32 writes exactly four bytes', 'trainer_write()'],
      ['write then read gives the same value', 'trainer_round_trip()'],
    ],
  },
  {
    id: 'ring_buffer', topic: 'Data and protocols', title: 'Ring buffer', summary: 'UART-style byte FIFO',
    difficulty: 'Medium', minutes: 20, filename: 'ring_buffer.c',
    description: 'Implement a fixed-size byte FIFO like the kind used between a UART interrupt and a parser. Use the supplied structure and function signatures.',
    requirements: '<ul><li><code>rb_init</code> creates an empty buffer and stores the caller-provided storage.</li><li><code>rb_push</code> returns false if full; <code>rb_pop</code> returns false if empty.</li><li>Support wraparound, preserve FIFO order, and safely reject zero capacity.</li><li>Optionally add a <code>main</code> to try your buffer; its output appears under the checks.</li></ul>',
    followups: [
      'The UART ISR pushes and the main loop pops. Which fields does each side write, and is it safe without disabling interrupts?',
      'How does the design change if you drop <code>count</code> and only keep head and tail?',
      'Why do many implementations require the capacity to be a power of two?',
    ],
    starter: `#include <stdbool.h>\n#include <stddef.h>\n#include <stdint.h>\n\n/* The checker provides this API declaration. Implement all three functions. */\ntypedef struct RingBuffer {\n    uint8_t *data;\n    size_t capacity;\n    size_t head;\n    size_t tail;\n    size_t count;\n} RingBuffer;\n\nvoid rb_init(RingBuffer *rb, uint8_t *storage, size_t capacity)\n{\n    /* TODO: initialize an empty buffer; capacity may be zero */\n    (void)rb;\n    (void)storage;\n    (void)capacity;\n}\n\nbool rb_push(RingBuffer *rb, uint8_t value)\n{\n    /* TODO: append one byte; return false when full or capacity is zero */\n    (void)rb;\n    (void)value;\n    return false;\n}\n\nbool rb_pop(RingBuffer *rb, uint8_t *out)\n{\n    /* TODO: remove oldest byte; return false when empty */\n    (void)rb;\n    (void)out;\n    return false;\n}\n`,
    prelude: C`
#include <stdio.h>
#include <string.h>
static int trainer_empty_pop(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    return !rb_pop(&rb, &out);
}
static int trainer_init_resets(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb;
    memset(&rb, 0xA5, sizeof rb);
    rb_init(&rb, storage, 2u);
    return !rb_pop(&rb, &out) && rb_push(&rb, 7u) && rb_pop(&rb, &out) && out == 7u;
}
static int trainer_fifo(void) {
    uint8_t storage[3] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 11u) || !rb_push(&rb, 22u)) return 0;
    if (!rb_pop(&rb, &out) || out != 11u) return 0;
    if (!rb_pop(&rb, &out) || out != 22u) return 0;
    return 1;
}
static int trainer_full(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    if (!rb_push(&rb, 1u) || !rb_push(&rb, 2u) || rb_push(&rb, 3u)) return 0;
    if (!rb_pop(&rb, &out) || out != 1u) return 0;
    if (!rb_pop(&rb, &out) || out != 2u) return 0;
    return 1;
}
static int trainer_wraparound(void) {
    uint8_t storage[3] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 3u);
    if (!rb_push(&rb, 10u) || !rb_push(&rb, 20u) || !rb_push(&rb, 30u)) return 0;
    if (!rb_pop(&rb, &out) || out != 10u || !rb_push(&rb, 40u)) return 0;
    if (!rb_pop(&rb, &out) || out != 20u) return 0;
    if (!rb_pop(&rb, &out) || out != 30u) return 0;
    if (!rb_pop(&rb, &out) || out != 40u) return 0;
    return 1;
}
static int trainer_drain_refill(void) {
    uint8_t storage[2] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 2u);
    for (int round = 0; round < 3; round++) {
        if (!rb_push(&rb, 1u) || !rb_push(&rb, 2u) || rb_push(&rb, 3u)) return 0;
        if (!rb_pop(&rb, &out) || out != 1u || !rb_pop(&rb, &out) || out != 2u) return 0;
        if (rb_pop(&rb, &out)) return 0;
    }
    return 1;
}
static int trainer_long_run(void) {
    /* Push three, pop two, many times: the indices wrap again and again. */
    uint8_t storage[4] = {0}, out = 0, next_in = 0, next_out = 0; RingBuffer rb; rb_init(&rb, storage, 4u);
    for (int step = 0; step < 200; step++) {
        if (rb_push(&rb, next_in)) next_in++;
        if (rb_push(&rb, next_in)) next_in++;
        if (rb_push(&rb, next_in)) next_in++;
        for (int i = 0; i < 2; i++) {
            if (!rb_pop(&rb, &out) || out != next_out) return 0;
            next_out++;
        }
    }
    return 1;
}
static int trainer_zero_capacity(void) {
    uint8_t storage[1] = {0}, out = 0; RingBuffer rb; rb_init(&rb, storage, 0u);
    return !rb_push(&rb, 1u) && !rb_pop(&rb, &out);
}
`,
    checks: [
      ['pop from an empty buffer fails', 'trainer_empty_pop()'],
      ['rb_init resets every field', 'trainer_init_resets()'],
      ['FIFO order', 'trainer_fifo()'],
      ['full buffer rejects extra item', 'trainer_full()'],
      ['wraparound preserves order', 'trainer_wraparound()'],
      ['drain and refill repeatedly', 'trainer_drain_refill()'],
      ['long run keeps order across many wraps', 'trainer_long_run()'],
      ['zero capacity is safe', 'trainer_zero_capacity()'],
    ],
  },
  {
    id: 'crc16', topic: 'Data and protocols', title: 'CRC-16/CCITT', summary: 'Bitwise checksum',
    difficulty: 'Medium', minutes: 20, filename: 'crc16.c',
    description: 'Compute the CRC-16/CCITT-FALSE checksum used by many serial protocols and bootloaders: polynomial 0x1021, initial value 0xFFFF, no reflection, no final XOR. Its standard check value is 0x29B1 for the ASCII string "123456789".',
    requirements: '<ul><li>Process the data one byte at a time, most significant bit first.</li><li>For each byte: XOR it into the top of the CRC, then shift 8 times, XORing in <code>0x1021</code> whenever a 1 shifts out of bit 15.</li><li>An empty input returns the initial value <code>0xFFFF</code>.</li></ul>',
    followups: [
      'Why does a CRC catch errors that a simple byte sum misses?',
      'How does a 256-entry lookup table speed this up, and what does it cost?',
      'You compute a CRC and it does not match the device. What parameters would you check first?',
    ],
    starter: C`
#include <stddef.h>
#include <stdint.h>

/* CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no final XOR. */
uint16_t crc16_ccitt(const uint8_t *data, size_t len)
{
    uint16_t crc = 0xFFFFu;
    /* TODO */
    (void)data;
    (void)len;
    return crc;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['standard check value for 123456789', 'crc16_ccitt((const uint8_t *)"123456789", 9u) == 0x29B1u'],
      ['empty input returns 0xFFFF', 'crc16_ccitt((const uint8_t *)"", 0u) == 0xFFFFu'],
      ['single byte A', 'crc16_ccitt((const uint8_t *)"A", 1u) == 0xB915u'],
      ['four zero bytes', 'crc16_ccitt((const uint8_t[]){0, 0, 0, 0}, 4u) == 0x84C0u'],
      ['four 0xFF bytes', 'crc16_ccitt((const uint8_t[]){0xFF, 0xFF, 0xFF, 0xFF}, 4u) == 0x1D0Fu'],
      ['reads only len bytes', 'crc16_ccitt((const uint8_t *)"123456789XYZ", 9u) == 0x29B1u'],
    ],
  },
  {
    id: 'parse_u32', topic: 'Data and protocols', title: 'Parse an unsigned integer', summary: 'Safe atoi with overflow',
    difficulty: 'Medium', minutes: 15, filename: 'parse_u32.c',
    description: 'Write a strict decimal parser for config values and AT command responses. atoi silently returns garbage on bad input; yours must reject anything that is not a clean number that fits in 32 bits.',
    requirements: '<ul><li>Accept one or more digits <code>0</code> to <code>9</code> and nothing else: no sign, spaces, or trailing characters.</li><li>Reject values above <code>4294967295</code>.</li><li>On success store the value in <code>*out</code> and return true. On failure return false and leave <code>*out</code> unchanged.</li><li>Do not use <code>strtoul</code>, <code>atoi</code>, <code>sscanf</code>, or similar.</li></ul>',
    followups: [
      'Show how you detect overflow before it happens, rather than after.',
      'Why is it good practice to leave <code>*out</code> untouched on failure?',
      'How would you extend this to parse <code>+CSQ: 23,99</code> from a modem?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Parse a decimal string into *out. Return false (and leave *out alone) on bad input or overflow. */
bool parse_u32(const char *s, uint32_t *out)
{
    /* TODO */
    (void)s;
    (void)out;
    return false;
}
`,
    prelude: C`
#include <stdio.h>
static int trainer_ok(const char *s, uint32_t want) { uint32_t v = 12345u; return parse_u32(s, &v) && v == want; }
static int trainer_bad(const char *s) { uint32_t v = 12345u; return !parse_u32(s, &v) && v == 12345u; }
`,
    checks: [
      ['parses 0', 'trainer_ok("0", 0u)'],
      ['parses 42', 'trainer_ok("42", 42u)'],
      ['leading zeros are fine', 'trainer_ok("007", 7u)'],
      ['parses the maximum 4294967295', 'trainer_ok("4294967295", 4294967295u)'],
      ['rejects 4294967296 (overflow by one)', 'trainer_bad("4294967296")'],
      ['rejects a much larger number', 'trainer_bad("99999999999")'],
      ['rejects an empty string', 'trainer_bad("")'],
      ['rejects trailing characters', 'trainer_bad("12a")'],
      ['rejects a sign', 'trainer_bad("-1") && trainer_bad("+1")'],
      ['rejects spaces', 'trainer_bad(" 7") && trainer_bad("7 ")'],
    ],
    forbid: [['does not use library number parsers', /\b(strto\w+|atoi|atol|atoll|sscanf)\s*\(/]],
  },

  /* ========================================================= State machines */
  {
    id: 'debounce', topic: 'State machines', title: 'Button debouncer', summary: 'Filter a bouncing input',
    difficulty: 'Medium', minutes: 15, filename: 'debounce.c',
    description: 'A mechanical button bounces for a few milliseconds when pressed. debounce_update is called once per timer tick with the raw pin level. Only report a change after the input has held its new level for a set number of ticks.',
    requirements: '<ul><li><code>debounce_init</code> sets the starting output and the number of ticks (<code>threshold</code>, at least 1) a change must last.</li><li><code>debounce_update</code> returns the debounced output after taking one raw sample.</li><li>The output changes only after <code>threshold</code> consecutive samples differ from it. Any sample equal to the output resets that count.</li></ul>',
    followups: [
      'How do you choose the tick rate and threshold for a real button?',
      'Would you sample in the GPIO interrupt or in a timer interrupt? Why?',
      'How would you debounce 16 buttons at once using bit operations?',
    ],
    starter: C`
#include <stdbool.h>

typedef struct Debouncer {
    bool state;          /* debounced output */
    unsigned count;      /* consecutive samples that differ from state */
    unsigned threshold;  /* samples needed to accept a change */
} Debouncer;

void debounce_init(Debouncer *d, bool initial, unsigned threshold)
{
    /* TODO */
    (void)d;
    (void)initial;
    (void)threshold;
}

/* Take one raw sample and return the debounced state. */
bool debounce_update(Debouncer *d, bool raw)
{
    /* TODO */
    (void)d;
    return raw;
}
`,
    prelude: C`
#include <stdio.h>
/* Feed samples (a string of 0/1) and compare every output with want. */
static int trainer_run(bool initial, unsigned threshold, const char *raw, const char *want) {
    Debouncer d;
    debounce_init(&d, initial, threshold);
    for (int i = 0; raw[i]; i++) {
        bool out = debounce_update(&d, raw[i] == '1');
        if (out != (want[i] == '1')) return 0;
    }
    return 1;
}
`,
    checks: [
      ['stable input keeps the initial state', 'trainer_run(false, 3u, "0000", "0000") && trainer_run(true, 3u, "1111", "1111")'],
      ['press accepted after 3 samples', 'trainer_run(false, 3u, "1111", "0011")'],
      ['short bounce is ignored', 'trainer_run(false, 3u, "1101100", "0000000")'],
      ['bounce resets the count', 'trainer_run(false, 3u, "1101110", "0000011")'],
      ['release is debounced too', 'trainer_run(true, 2u, "0100", "1110")'],
      ['threshold 1 follows the input', 'trainer_run(false, 1u, "0110", "0110")'],
      ['press then release', 'trainer_run(false, 2u, "011110001", "001111000")'],
    ],
  },
];
