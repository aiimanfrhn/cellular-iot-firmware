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

/* Bump when checks get stricter, so earlier local passes must be re-run. */
export const CHECKER_VERSION = 3;

export const TOPICS = [
  'Bits and registers', 'Memory and pointers', 'Lists and strings', 'Data and protocols',
  'Math and signal processing', 'Networking', 'Platform and hardware', 'State machines',
];

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
  {
    id: 'bcd', topic: 'Bits and registers', title: 'BCD for an RTC chip', summary: 'Binary to packed BCD and back',
    difficulty: 'Easy', minutes: 10, filename: 'bcd.c',
    description: 'Real-time clock chips such as the DS1307 and DS3231 store seconds, minutes and hours as packed BCD: one decimal digit per nibble, so 45 seconds reads back as 0x45, not 0x2D. Write the two conversions an RTC driver needs, plus a check that rejects a byte that is not valid BCD, such as a value read from a chip that was never initialised.',
    requirements: '<ul><li><code>bin_to_bcd</code> converts 0 to 99 into packed BCD: 45 becomes <code>0x45</code>. You may assume <code>value &lt;= 99</code>.</li><li><code>bcd_to_bin</code> converts packed BCD back: <code>0x59</code> becomes 59. You may assume the input is valid BCD.</li><li><code>bcd_is_valid</code> returns true only when both nibbles are 0 to 9, so <code>0x5A</code> and <code>0xA0</code> are rejected.</li></ul>',
    followups: [
      'Why do RTC chips store time in BCD rather than plain binary?',
      'On a DS1307, bit 7 of the seconds register is the clock-halt flag. What happens if you convert the raw register without masking it, and how do you write the seconds back without stopping the clock?',
      'How would you add two packed BCD numbers, for example <code>0x38 + 0x45</code>, and get <code>0x83</code>? What does the "decimal adjust" step do?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Convert value (0..99) to packed BCD: 45 -> 0x45. */
uint8_t bin_to_bcd(uint8_t value)
{
    /* TODO */
    (void)value;
    return 0u;
}

/* Convert packed BCD to binary: 0x45 -> 45. */
uint8_t bcd_to_bin(uint8_t bcd)
{
    /* TODO */
    (void)bcd;
    return 0u;
}

/* Return true when both nibbles of bcd are decimal digits (0..9). */
bool bcd_is_valid(uint8_t bcd)
{
    /* TODO */
    (void)bcd;
    return false;
}
`,
    prelude: C`
static int trainer_round_trip(void) {
    for (unsigned v = 0u; v <= 99u; v++) {
        uint8_t b = bin_to_bcd((uint8_t)v);
        if (!bcd_is_valid(b) || bcd_to_bin(b) != v || (b >> 4) != v / 10u || (b & 0x0Fu) != v % 10u) return 0;
    }
    return 1;
}
static int trainer_valid_count(void) {
    unsigned valid = 0u;
    for (unsigned b = 0u; b <= 0xFFu; b++) if (bcd_is_valid((uint8_t)b)) valid++;
    return valid == 100u;
}
`,
    checks: [
      ['0 converts to 0x00', 'bin_to_bcd(0u) == 0x00u'],
      ['9 converts to 0x09', 'bin_to_bcd(9u) == 0x09u'],
      ['10 converts to 0x10', 'bin_to_bcd(10u) == 0x10u'],
      ['45 converts to 0x45', 'bin_to_bcd(45u) == 0x45u'],
      ['99 converts to 0x99', 'bin_to_bcd(99u) == 0x99u'],
      ['0x59 converts to 59', 'bcd_to_bin(0x59u) == 59u'],
      ['0x10 converts to 10', 'bcd_to_bin(0x10u) == 10u'],
      ['0x99 converts to 99', 'bcd_to_bin(0x99u) == 99u'],
      ['every value 0 to 99 round-trips', 'trainer_round_trip()'],
      ['0x00, 0x59 and 0x99 are valid BCD', 'bcd_is_valid(0x00u) && bcd_is_valid(0x59u) && bcd_is_valid(0x99u)'],
      ['a low nibble above 9 is invalid', '!bcd_is_valid(0x5Au) && !bcd_is_valid(0x0Fu)'],
      ['a high nibble above 9 is invalid', '!bcd_is_valid(0xA0u) && !bcd_is_valid(0xFFu)'],
      ['exactly 100 of the 256 byte values are valid', 'trainer_valid_count()'],
    ],
  },
  {
    id: 'highest_bit', topic: 'Bits and registers', title: 'Highest set bit and next power of two', summary: 'Find MSB, round up to 2^n',
    difficulty: 'Medium', minutes: 15, filename: 'highest_bit.c',
    description: 'Sizing a buffer or a hash table to the next power of two, picking a clock prescaler, or finding the highest-priority pending interrupt all come down to locating the most significant 1 bit. Implement both helpers without compiler built-ins, and pin down the edge cases at 0 and at the top of the range.',
    requirements: '<ul><li><code>highest_set_bit</code> returns the index (0 to 31) of the most significant 1 bit in <code>x</code>, or -1 when <code>x</code> is 0.</li><li><code>next_power_of_two</code> returns the smallest power of two that is <code>&gt;= x</code>: 5 gives 8, 8 gives 8.</li><li>Defined edge cases: <code>next_power_of_two(0)</code> returns 1, and any <code>x</code> above <code>0x80000000</code> returns 0, because the answer does not fit in 32 bits.</li><li>Do not use compiler built-ins such as <code>__builtin_clz</code>.</li></ul>',
    followups: [
      'Your loop checks up to 32 bits. Can you find the highest set bit in exactly 5 steps with a binary search on halves?',
      'Explain the bit-smearing trick: <code>x--; x |= x &gt;&gt; 1; x |= x &gt;&gt; 2; ... x++;</code>. Why the <code>x--</code>, and what happens at 0?',
      'ARM has <code>CLZ</code> and RISC-V Zbb has <code>clz</code>. How do they relate to this function, and how do RTOS schedulers use them to pick the highest-priority ready task?',
    ],
    starter: C`
#include <stdint.h>

/* Return the index (0..31) of the most significant 1 bit in x, or -1 for 0. */
int highest_set_bit(uint32_t x)
{
    /* TODO */
    (void)x;
    return -1;
}

/* Return the smallest power of two >= x. Returns 1 for 0, and 0 when x is
   above 0x80000000 (the result would not fit in 32 bits). */
uint32_t next_power_of_two(uint32_t x)
{
    /* TODO */
    return x;
}
`,
    prelude: C`
static int trainer_every_single_bit(void) {
    for (int i = 0; i < 32; i++) {
        uint32_t bit = UINT32_C(1) << i;
        if (highest_set_bit(bit) != i || highest_set_bit(bit | 1u) != i) return 0;
        if (i > 0 && highest_set_bit(bit - 1u) != i - 1) return 0;
    }
    return 1;
}
static int trainer_every_power(void) {
    for (int i = 0; i < 32; i++) {
        uint32_t p = UINT32_C(1) << i;
        if (next_power_of_two(p) != p) return 0;
        if (i < 31 && next_power_of_two(p + 1u) != p << 1) return 0;
    }
    return 1;
}
`,
    checks: [
      ['0 has no set bit: -1', 'highest_set_bit(0u) == -1'],
      ['1 has its highest bit at 0', 'highest_set_bit(1u) == 0'],
      ['0x80000000 has its highest bit at 31', 'highest_set_bit(0x80000000u) == 31'],
      ['all ones has its highest bit at 31', 'highest_set_bit(0xFFFFFFFFu) == 31'],
      ['0x00012345 has its highest bit at 16', 'highest_set_bit(0x00012345u) == 16'],
      ['every bit position 0 to 31 is found', 'trainer_every_single_bit()'],
      ['next power of two of 0 is 1', 'next_power_of_two(0u) == 1u'],
      ['next power of two of 1 is 1', 'next_power_of_two(1u) == 1u'],
      ['3 rounds up to 4 and 5 to 8', 'next_power_of_two(3u) == 4u && next_power_of_two(5u) == 8u'],
      ['1000 rounds up to 1024', 'next_power_of_two(1000u) == 1024u'],
      ['powers of two are unchanged, one more doubles', 'trainer_every_power()'],
      ['0x80000000 stays 0x80000000', 'next_power_of_two(0x80000000u) == 0x80000000u'],
      ['above 0x80000000 returns 0', 'next_power_of_two(0x80000001u) == 0u && next_power_of_two(0xFFFFFFFFu) == 0u'],
    ],
    forbid: [['no compiler built-ins such as __builtin_clz', /__builtin_/]],
  },
  {
    id: 'bitmap_alloc', topic: 'Bits and registers', title: 'Bitmap block allocator', summary: 'One bit per block',
    difficulty: 'Medium', minutes: 20, filename: 'bitmap_alloc.c',
    description: 'Flash sector managers, DMA descriptor pools and file systems often track 64 equal blocks with one bit each instead of a free list: the state fits in two words and is easy to save or inspect in a debugger. Implement a 64-block allocator over an array of uint32_t words, where a 1 bit means the block is in use.',
    requirements: '<ul><li>Block <code>n</code> is bit <code>n % 32</code> of <code>words[n / 32]</code>; 1 means used.</li><li><code>bm_init</code> marks every block free. <code>bm_alloc</code> marks the lowest-numbered free block used and returns its index, or -1 when all 64 are used.</li><li><code>bm_free</code> returns false, and changes nothing, when <code>block</code> is out of range (below 0 or above 63) or already free, which catches a double free.</li><li><code>bm_count_used</code> returns how many blocks are in use. Keep the struct and the function signatures.</li></ul>',
    followups: [
      'Instead of testing bits one by one, how can you find the lowest 0 bit of a word in one expression? (Hint: <code>~w &amp; (w + 1)</code>.)',
      'Two RTOS tasks call <code>bm_alloc</code> at the same time. What can go wrong, and how would you fix it with and without disabling interrupts?',
      'How would you allocate <em>n</em> contiguous blocks, for example a 3-sector flash write?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

#define BM_BLOCKS 64
#define BM_WORD_BITS 32

/* Block n is bit (n % 32) of words[n / 32]; 1 = used, 0 = free. */
typedef struct Bitmap {
    uint32_t words[BM_BLOCKS / BM_WORD_BITS];
} Bitmap;

/* Mark every block free. */
void bm_init(Bitmap *bm)
{
    /* TODO */
    (void)bm;
}

/* Mark the lowest free block used and return its index, or -1 when full. */
int bm_alloc(Bitmap *bm)
{
    /* TODO */
    (void)bm;
    return -1;
}

/* Free a block. Return false if block is out of range or already free. */
bool bm_free(Bitmap *bm, int block)
{
    /* TODO */
    (void)bm;
    (void)block;
    return false;
}

/* Return the number of used blocks. */
int bm_count_used(const Bitmap *bm)
{
    /* TODO */
    (void)bm;
    return 0;
}
`,
    prelude: C`
static int trainer_init_clears(void) {
    Bitmap bm;
    memset(&bm, 0xA5, sizeof bm);
    bm_init(&bm);
    return bm_count_used(&bm) == 0 && bm_alloc(&bm) == 0;
}
static int trainer_in_order(void) {
    Bitmap bm; bm_init(&bm);
    return bm_alloc(&bm) == 0 && bm_alloc(&bm) == 1 && bm_alloc(&bm) == 2 && bm_count_used(&bm) == 3;
}
static int trainer_reuse(void) {
    Bitmap bm; bm_init(&bm);
    for (int i = 0; i < 5; i++) if (bm_alloc(&bm) != i) return 0;
    if (!bm_free(&bm, 2) || bm_count_used(&bm) != 4) return 0;
    return bm_alloc(&bm) == 2 && bm_alloc(&bm) == 5;
}
static int trainer_lowest_first(void) {
    Bitmap bm; bm_init(&bm);
    for (int i = 0; i < 6; i++) if (bm_alloc(&bm) != i) return 0;
    if (!bm_free(&bm, 4) || !bm_free(&bm, 1)) return 0;
    return bm_alloc(&bm) == 1 && bm_alloc(&bm) == 4 && bm_alloc(&bm) == 6;
}
static int trainer_fill(Bitmap *bm) {
    bm_init(bm);
    for (int i = 0; i < 64; i++) if (bm_alloc(bm) != i) return 0;
    return 1;
}
static int trainer_full(void) {
    Bitmap bm;
    return trainer_fill(&bm) && bm_alloc(&bm) == -1 && bm_alloc(&bm) == -1 && bm_count_used(&bm) == 64;
}
static int trainer_free_last(void) {
    Bitmap bm;
    if (!trainer_fill(&bm) || !bm_free(&bm, 63)) return 0;
    return bm_count_used(&bm) == 63 && bm_alloc(&bm) == 63 && bm_alloc(&bm) == -1;
}
static int trainer_double_free(void) {
    Bitmap bm; bm_init(&bm);
    for (int i = 0; i < 8; i++) if (bm_alloc(&bm) != i) return 0;
    return bm_free(&bm, 5) && !bm_free(&bm, 5) && bm_count_used(&bm) == 7;
}
static int trainer_never_allocated(void) {
    Bitmap bm; bm_init(&bm);
    if (bm_alloc(&bm) != 0) return 0;
    return !bm_free(&bm, 10) && !bm_free(&bm, 40) && bm_count_used(&bm) == 1;
}
static int trainer_cross_word(void) {
    Bitmap bm; bm_init(&bm);
    for (int i = 0; i < 33; i++) if (bm_alloc(&bm) != i) return 0;
    return bm.words[0] == 0xFFFFFFFFu && bm.words[1] == 1u && bm_count_used(&bm) == 33;
}
static int trainer_free_cross_word(void) {
    Bitmap bm; bm_init(&bm);
    for (int i = 0; i < 34; i++) if (bm_alloc(&bm) != i) return 0;
    if (!bm_free(&bm, 32) || !bm_free(&bm, 31)) return 0;
    if (bm.words[0] != 0x7FFFFFFFu || bm.words[1] != 2u) return 0;
    return bm_alloc(&bm) == 31 && bm_alloc(&bm) == 32 && bm_alloc(&bm) == 34;
}
static int trainer_out_of_range(void) {
    Bitmap bm;
    if (!trainer_fill(&bm)) return 0;
    return !bm_free(&bm, -1) && !bm_free(&bm, 64) && !bm_free(&bm, 1000) && bm_count_used(&bm) == 64;
}
`,
    checks: [
      ['bm_init frees every block', 'trainer_init_clears()'],
      ['allocates 0, 1, 2 in order', 'trainer_in_order()'],
      ['a freed block is reused', 'trainer_reuse()'],
      ['the lowest free block is always chosen', 'trainer_lowest_first()'],
      ['all 64 blocks, then -1 when full', 'trainer_full()'],
      ['block 63 can be freed and reallocated', 'trainer_free_last()'],
      ['double free is rejected', 'trainer_double_free()'],
      ['freeing a never-allocated block is rejected', 'trainer_never_allocated()'],
      ['block 32 is bit 0 of the second word', 'trainer_cross_word()'],
      ['blocks 31 and 32 free and reallocate across the word boundary', 'trainer_free_cross_word()'],
      ['out-of-range blocks -1 and 64 are rejected', 'trainer_out_of_range()'],
    ],
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
  {
    id: 'aligned_alloc', topic: 'Memory and pointers', title: 'Aligned malloc and free', summary: 'Over-allocate, stash the pointer',
    difficulty: 'Medium', minutes: 20, filename: 'aligned_alloc.c',
    description: 'A classic: DMA engines, cache maintenance and some peripherals need buffers aligned to 32, 64 or even 4096 bytes, but malloc only promises alignment for ordinary types. Build aligned_malloc and aligned_free on top of malloc and free by over-allocating, rounding the address up, and storing the original malloc pointer just before the block you return so aligned_free can find it.',
    requirements: '<ul><li><code>aligned_malloc</code> returns a block of at least <code>size</code> usable bytes whose address is a multiple of <code>alignment</code>, or <code>NULL</code> if malloc fails.</li><li>Return <code>NULL</code> when <code>alignment</code> is 0 or not a power of two, and when <code>size</code> plus your overhead would overflow <code>size_t</code>.</li><li>Small alignments such as 1 and 2 must work too, and the stored pointer must itself be correctly aligned (the checker traps misaligned accesses).</li><li><code>aligned_free</code> releases a block from <code>aligned_malloc</code>; <code>aligned_free(NULL)</code> does nothing.</li><li>Use <code>uintptr_t</code> for address arithmetic. Do not call <code>aligned_alloc</code>, <code>posix_memalign</code> or <code>memalign</code>.</li></ul>',
    followups: [
      'Why must the original pointer be stored, and why just before the returned block rather than in a global table?',
      'How many bytes does each allocation waste in the worst case? How would you reduce that for a 4096-byte alignment?',
      'A DMA buffer is aligned to 32 bytes but its size is 40. Why can cache invalidation on a Cortex-M7 still corrupt a neighbouring variable, and how do you size the buffer to avoid it?',
    ],
    starter: C`
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

/* Return size bytes aligned to alignment (a power of two), or NULL. */
void *aligned_malloc(size_t size, size_t alignment)
{
    /* TODO: over-allocate, round up, store the original pointer before the block */
    (void)size;
    (void)alignment;
    return NULL;
}

/* Free a block returned by aligned_malloc. NULL is allowed. */
void aligned_free(void *p)
{
    /* TODO: recover the original pointer and free it */
    (void)p;
}
`,
    prelude: C`
#include <stdlib.h>
static int trainer_try(size_t size, size_t alignment) {
    unsigned char *p = aligned_malloc(size, alignment);
    if (p == NULL || ((uintptr_t)p & (alignment - 1u)) != 0u) { aligned_free(p); return 0; }
    for (size_t i = 0; i < size; i++) p[i] = (unsigned char)(i * 7u + 3u);
    for (size_t i = 0; i < size; i++) if (p[i] != (unsigned char)(i * 7u + 3u)) { aligned_free(p); return 0; }
    aligned_free(p);
    return 1;
}
static int trainer_small_alignments(void) {
    return trainer_try(13u, 1u) && trainer_try(13u, 2u) && trainer_try(1u, 4u);
}
static int trainer_no_overlap(void) {
    unsigned char *a = aligned_malloc(64u, 64u), *b = aligned_malloc(64u, 64u);
    int ok = a != NULL && b != NULL;
    if (ok) {
        memset(a, 0x11, 64u); memset(b, 0x22, 64u);
        for (size_t i = 0; i < 64u; i++) if (a[i] != 0x11u || b[i] != 0x22u) ok = 0;
    }
    aligned_free(a); aligned_free(b);
    return ok;
}
static int trainer_cycles(void) {
    unsigned char *live[8] = {0};
    size_t sizes[8] = {0};
    int ok = 1;
    for (unsigned i = 0u; i < 2000u && ok; i++) {
        unsigned slot = i % 8u;
        if (live[slot] && (live[slot][0] != slot || live[slot][sizes[slot] - 1u] != slot)) ok = 0;
        aligned_free(live[slot]);
        size_t size = (size_t)(i * 37u) % 500u + 1u, alignment = (size_t)1 << (i % 13u);
        live[slot] = aligned_malloc(size, alignment);
        sizes[slot] = size;
        if (live[slot] == NULL || ((uintptr_t)live[slot] & (alignment - 1u)) != 0u) ok = 0;
        else memset(live[slot], (int)slot, size);
    }
    for (unsigned s = 0u; s < 8u; s++) aligned_free(live[s]);
    return ok;
}
static int trainer_releases(void) {
    /* 4096 x 1 MiB is far more than a 32-bit address space: this only
       passes if aligned_free really gives the memory back. */
    for (unsigned i = 0u; i < 4096u; i++) {
        void *p = aligned_malloc((size_t)1 << 20, 4096u);
        if (p == NULL) return 0;
        aligned_free(p);
    }
    return 1;
}
static int trainer_bad_alignment(void) {
    return aligned_malloc(16u, 3u) == NULL && aligned_malloc(16u, 24u) == NULL && aligned_malloc(16u, 100u) == NULL;
}
static int trainer_overflow(void) {
    void *p = aligned_malloc(SIZE_MAX, 16u), *q = aligned_malloc(SIZE_MAX - 4u, 64u);
    int ok = p == NULL && q == NULL;
    aligned_free(p); aligned_free(q);
    return ok;
}
static int trainer_free_null(void) {
    aligned_free(NULL);
    return 1;
}
`,
    checks: [
      ['8-byte alignment, all 100 bytes writable', 'trainer_try(100u, 8u)'],
      ['16-byte alignment', 'trainer_try(1u, 16u) && trainer_try(33u, 16u)'],
      ['64-byte (cache line) alignment', 'trainer_try(1000u, 64u)'],
      ['256-byte alignment', 'trainer_try(300u, 256u)'],
      ['4096-byte (page) alignment, all 5000 bytes writable', 'trainer_try(5000u, 4096u)'],
      ['alignments 1, 2 and 4 work too', 'trainer_small_alignments()'],
      ['two live blocks do not overlap', 'trainer_no_overlap()'],
      ['2000 mixed alloc and free cycles keep data intact', 'trainer_cycles()'],
      ['NULL for alignment 0', 'aligned_malloc(16u, 0u) == NULL'],
      ['NULL for alignments 3, 24 and 100', 'trainer_bad_alignment()'],
      ['NULL when size plus overhead overflows', 'trainer_overflow()'],
      ['aligned_free(NULL) is safe', 'trainer_free_null()'],
      ['aligned_free really releases memory', 'trainer_releases()'],
    ],
    forbid: [['does not call aligned_alloc, posix_memalign or memalign', /\b(aligned_alloc|posix_memalign|memalign|_aligned_malloc)\s*\(/]],
  },

  /* ====================================================== Lists and strings */
  {
    id: 'list_reverse', topic: 'Lists and strings', title: 'Reverse a linked list', summary: 'Re-point every next link',
    difficulty: 'Easy', minutes: 10, filename: 'list_reverse.c',
    description: 'The most-asked pointer question in C interviews. Count the nodes of a singly linked list, then reverse it in place. Network stacks and drivers keep packets, timers and requests in lists like this.',
    requirements: '<ul><li><code>list_length</code> returns the number of nodes; an empty list (<code>NULL</code>) has length 0.</li><li><code>list_reverse</code> reverses the list in place and returns the new head.</li><li>Do not allocate memory or swap values between nodes; change only the <code>next</code> pointers.</li></ul>',
    followups: [
      'Write the recursive version. Why is it risky on a small embedded or kernel stack?',
      'The Linux kernel embeds <code>struct list_head</code> inside each object. How does <code>container_of</code> get back to the object?',
      'When would you choose an array over a linked list on a CPU with caches?',
    ],
    starter: C`
#include <stddef.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

/* Return the number of nodes in the list. */
size_t list_length(const Node *head)
{
    /* TODO */
    (void)head;
    return 0u;
}

/* Reverse the list in place and return the new head. */
Node *list_reverse(Node *head)
{
    /* TODO */
    return head;
}
`,
    prelude: C`
static Node trainer_nodes[8];
static Node *trainer_build(const int *values, size_t n) {
    for (size_t i = 0; i < n; i++) { trainer_nodes[i].value = values[i]; trainer_nodes[i].next = i + 1 < n ? &trainer_nodes[i + 1] : NULL; }
    return n ? &trainer_nodes[0] : NULL;
}
static int trainer_is(const Node *head, const int *values, size_t n) {
    for (size_t i = 0; i < n; i++, head = head->next) if (!head || head->value != values[i]) return 0;
    return head == NULL;
}
static int trainer_reverse(const int *in, const int *want, size_t n) { return trainer_is(list_reverse(trainer_build(in, n)), want, n); }
static int trainer_relinks(void) {
    Node *head = list_reverse(trainer_build((const int[]){1, 2, 3}, 3u));
    return head == &trainer_nodes[2] && trainer_nodes[2].next == &trainer_nodes[1] && trainer_nodes[0].next == NULL;
}
static int trainer_twice(void) {
    const int v[5] = {5, 4, 3, 2, 1};
    return trainer_is(list_reverse(list_reverse(trainer_build(v, 5u))), v, 5u);
}
`,
    checks: [
      ['empty list reverses to NULL', 'list_reverse(NULL) == NULL'],
      ['one node', 'trainer_reverse((const int[]){7}, (const int[]){7}, 1u)'],
      ['two nodes', 'trainer_reverse((const int[]){1, 2}, (const int[]){2, 1}, 2u)'],
      ['five nodes', 'trainer_reverse((const int[]){1, 2, 3, 4, 5}, (const int[]){5, 4, 3, 2, 1}, 5u)'],
      ['nodes are relinked, not values swapped', 'trainer_relinks()'],
      ['reversing twice restores the list', 'trainer_twice()'],
      ['length of an empty list is 0', 'list_length(NULL) == 0u'],
      ['length of five nodes', 'list_length(trainer_build((const int[]){1, 2, 3, 4, 5}, 5u)) == 5u'],
    ],
    forbid: [['does not call malloc', /\b(malloc|calloc|realloc)\s*\(/]],
  },
  {
    id: 'list_cycle', topic: 'Lists and strings', title: 'Find a loop and the middle', summary: 'Slow and fast pointers',
    difficulty: 'Medium', minutes: 15, filename: 'list_cycle.c',
    description: 'A corrupted list whose tail points back into itself hangs any code that walks it. Detect that loop with two pointers moving at different speeds, then use the same trick to find the middle node in one pass.',
    requirements: '<ul><li><code>list_has_cycle</code> returns true when following <code>next</code> from <code>head</code> never reaches <code>NULL</code>.</li><li><code>list_middle</code> returns the middle node; with an even count, the second of the two middle nodes. Return <code>NULL</code> for an empty list.</li><li>Use O(1) extra memory and do not modify the list.</li></ul>',
    followups: [
      'Why are the slow and fast pointers guaranteed to meet inside a loop?',
      'Once they meet, how do you find the node where the loop starts?',
      'In real firmware, what bugs leave a list looped like this?',
    ],
    starter: C`
#include <stdbool.h>
#include <stddef.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

/* Return true when the list loops back on itself instead of ending in NULL. */
bool list_has_cycle(const Node *head)
{
    /* TODO */
    (void)head;
    return false;
}

/* Return the middle node (the second middle one for an even count), or NULL. */
const Node *list_middle(const Node *head)
{
    /* TODO */
    return head;
}
`,
    prelude: C`
static Node trainer_nodes[1000];
/* Link n nodes valued 0..n-1. If loop_to >= 0 the last node points back to that index. */
static const Node *trainer_list(size_t n, int loop_to) {
    for (size_t i = 0; i < n; i++) { trainer_nodes[i].value = (int)i; trainer_nodes[i].next = i + 1 < n ? &trainer_nodes[i + 1] : NULL; }
    if (n && loop_to >= 0) trainer_nodes[n - 1].next = &trainer_nodes[loop_to];
    return n ? &trainer_nodes[0] : NULL;
}
static int trainer_middle(size_t n, size_t want) { return list_middle(trainer_list(n, -1)) == &trainer_nodes[want]; }
static int trainer_untouched(void) {
    (void)list_has_cycle(trainer_list(6u, 2));
    for (size_t i = 0; i < 5; i++) if (trainer_nodes[i].next != &trainer_nodes[i + 1] || trainer_nodes[i].value != (int)i) return 0;
    return trainer_nodes[5].next == &trainer_nodes[2];
}
`,
    checks: [
      ['empty list has no cycle', '!list_has_cycle(NULL)'],
      ['single node, no cycle', '!list_has_cycle(trainer_list(1u, -1))'],
      ['node pointing to itself', 'list_has_cycle(trainer_list(1u, 0))'],
      ['tail links back to the head', 'list_has_cycle(trainer_list(2u, 0))'],
      ['tail links into the middle', 'list_has_cycle(trainer_list(7u, 3))'],
      ['long list without a cycle', '!list_has_cycle(trainer_list(1000u, -1))'],
      ['long list whose tail points to itself', 'list_has_cycle(trainer_list(1000u, 999))'],
      ['the list is not modified', 'trainer_untouched()'],
      ['middle of an empty list is NULL', 'list_middle(NULL) == NULL'],
      ['middle of 1 node', 'trainer_middle(1u, 0u)'],
      ['middle of 5 nodes is the 3rd', 'trainer_middle(5u, 2u)'],
      ['middle of 4 nodes is the 3rd', 'trainer_middle(4u, 2u)'],
    ],
  },
  {
    id: 'str_copy', topic: 'Lists and strings', title: 'Safe string copy', summary: 'strlen and a strlcpy',
    difficulty: 'Easy', minutes: 10, filename: 'str_copy.c',
    description: 'Interface names, hostnames and CLI arguments get copied into fixed-size buffers all the time, and overflowing one is a classic security bug. Write strlen, then a copy that never overruns the destination and tells the caller when it had to truncate.',
    requirements: '<ul><li><code>my_strlen</code> returns the number of characters before the terminating NUL.</li><li><code>safe_strcpy</code> copies at most <code>size - 1</code> characters and always NUL-terminates when <code>size &gt; 0</code>. With <code>size == 0</code> it writes nothing.</li><li>It returns the length of <code>src</code>, so a return value <code>&gt;= size</code> means the copy was truncated.</li><li>Do not call library string functions such as <code>strcpy</code>, <code>strncpy</code>, <code>strlen</code> or <code>memcpy</code>.</li></ul>',
    followups: [
      'Why is <code>strncpy</code> a trap? What does it do when the source is too long, and when it is short?',
      'How does returning the source length (like <code>strlcpy</code> and <code>snprintf</code>) let the caller detect truncation?',
      'What should happen if <code>src</code> and <code>dst</code> overlap?',
    ],
    starter: C`
#include <stddef.h>

/* Return the number of characters before the terminating NUL. */
size_t my_strlen(const char *s)
{
    /* TODO */
    (void)s;
    return 0u;
}

/* Copy src into dst, a buffer of size bytes, always NUL-terminating when
   size > 0. Return the length of src so the caller can detect truncation. */
size_t safe_strcpy(char *dst, const char *src, size_t size)
{
    /* TODO */
    (void)dst;
    (void)src;
    (void)size;
    return 0u;
}
`,
    prelude: C`
/* Copy into a 16-byte buffer filled with '#', then check the result, the
   return value, and that nothing at or past dst[size] was written. */
static int trainer_copy(const char *src, size_t size, const char *want, size_t ret) {
    char buf[16];
    memset(buf, '#', sizeof buf);
    if (safe_strcpy(buf, src, size) != ret) return 0;
    if (size == 0u) return buf[0] == '#';
    if (strcmp(buf, want) != 0) return 0;
    for (size_t i = size; i < sizeof buf; i++) if (buf[i] != '#') return 0;
    return 1;
}
`,
    checks: [
      ['strlen of an empty string', 'my_strlen("") == 0u'],
      ['strlen of hello', 'my_strlen("hello") == 5u'],
      ['copies a string that fits', 'trainer_copy("vlan10", 16u, "vlan10", 6u)'],
      ['exact fit: size is length + 1', 'trainer_copy("abc", 4u, "abc", 3u)'],
      ['one byte short truncates', 'trainer_copy("abcd", 4u, "abc", 4u)'],
      ['long name truncates and terminates', 'trainer_copy("GigabitEthernet1/0/1", 8u, "Gigabit", 20u)'],
      ['size 1 gives an empty string', 'trainer_copy("abc", 1u, "", 3u)'],
      ['size 0 writes nothing', 'trainer_copy("abc", 0u, "", 3u)'],
    ],
    forbid: [['does not call library string functions', /\b(strcpy|strncpy|strlcpy|stpcpy|strlen|strnlen|memcpy|memmove|sprintf|snprintf)\s*\(/]],
  },
  {
    id: 'cli_split', topic: 'Lists and strings', title: 'Split a CLI command', summary: 'Tokenise in place',
    difficulty: 'Medium', minutes: 20, filename: 'cli_split.c',
    description: 'Network devices are configured through a command line: "show vlan 10", "interface gi1/0/1". Before a command can be dispatched it has to be split into words. Do it in place, without copying, the way an argc/argv parser does.',
    requirements: '<ul><li>Words are separated by any number of spaces or tabs. Leading and trailing separators are ignored.</li><li>Write a NUL over the separator after each word, store a pointer to each word in <code>argv</code>, and return the number of words.</li><li>Return <code>-1</code> if the line has more than <code>max_args</code> words; <code>argv</code> may then hold anything.</li><li>Do not use <code>strtok</code>, <code>strtok_r</code> or <code>strsep</code>.</li></ul>',
    followups: [
      'Why is <code>strtok</code> unsafe in a multithreaded CLI daemon?',
      'How would you support quoted arguments such as <code>description "uplink to core"</code>?',
      'After splitting, how would you dispatch to a handler? Sketch a table of names and function pointers.',
    ],
    starter: C`
#include <stddef.h>

/* Split line in place into words separated by spaces or tabs. Store a pointer
   to each word in argv and return the word count, or -1 if there are more
   than max_args words. */
int split_args(char *line, char *argv[], int max_args)
{
    /* TODO */
    (void)line;
    (void)argv;
    (void)max_args;
    return 0;
}
`,
    prelude: C`
/* Split a copy of text and compare the result with up to three expected words. */
static int trainer_split(const char *text, int max, int want, const char *w0, const char *w1, const char *w2) {
    char line[64];
    char *argv[4] = {NULL, NULL, NULL, NULL};
    const char *words[3] = {w0, w1, w2};
    strcpy(line, text);
    int n = split_args(line, argv, max);
    if (n != want) return 0;
    for (int i = 0; i < n && i < 3; i++) {
        uintptr_t at = (uintptr_t)argv[i], start = (uintptr_t)line;
        if (!argv[i] || at < start || at >= start + sizeof line || strcmp(argv[i], words[i]) != 0) return 0;
    }
    return 1;
}
`,
    checks: [
      ['splits show vlan 10', 'trainer_split("show vlan 10", 4, 3, "show", "vlan", "10")'],
      ['skips repeated spaces', 'trainer_split("show   ip  route", 4, 3, "show", "ip", "route")'],
      ['ignores leading and trailing spaces', 'trainer_split("  show ip  ", 4, 2, "show", "ip", "")'],
      ['tabs separate words too', 'trainer_split("interface\tgi1/0/1", 4, 2, "interface", "gi1/0/1", "")'],
      ['an empty line has 0 words', 'trainer_split("", 4, 0, "", "", "")'],
      ['a blank line has 0 words', 'trainer_split("  \t  ", 4, 0, "", "", "")'],
      ['exactly max_args words is fine', 'trainer_split("a b c d", 4, 4, "a", "b", "c")'],
      ['too many words returns -1', 'trainer_split("a b c d e", 4, -1, "", "", "")'],
      ['max_args 0', 'trainer_split("a", 0, -1, "", "", "") && trainer_split("", 0, 0, "", "", "")'],
    ],
    forbid: [['does not use strtok or strsep', /\b(strtok|strtok_r|strsep)\s*\(/]],
  },
  {
    id: 'itoa', topic: 'Lists and strings', title: 'Integer to string', summary: 'itoa in any base, INT_MIN included',
    difficulty: 'Medium', minutes: 20, filename: 'itoa.c',
    description: 'Small targets often drop printf to save flash, so firmware ends up formatting numbers by hand for logs, CLI output and AT commands. Write an itoa that handles any base from 2 to 16, never overruns the caller\'s buffer, and gets the one value everybody forgets right: INT_MIN.',
    requirements: '<ul><li>Write <code>value</code> in <code>base</code> 2 to 16 using digits <code>0-9</code> and lowercase <code>a-f</code>, with a leading <code>-</code> for negative values in every base (so -255 in base 16 is <code>-ff</code>). No prefix such as <code>0x</code>, no leading zeros.</li><li>On success write the NUL-terminated string to <code>buf</code> and return its length, not counting the NUL.</li><li>Return <code>0</code> if <code>base</code> is outside 2 to 16 or the string plus its NUL does not fit in <code>size</code> bytes. On failure, if <code>size &gt; 0</code>, <code>buf</code> holds an empty string; with <code>size == 0</code> nothing is written. Never write at or past <code>buf[size]</code>.</li><li><code>INT_MIN</code> must work. Negating it as an <code>int</code> is signed overflow, which the checker traps.</li><li>Do not use <code>sprintf</code>, <code>snprintf</code> or their <code>v</code> variants.</li></ul>',
    followups: [
      'Why is <code>-value</code> undefined for <code>INT_MIN</code>, and why does converting to <code>unsigned</code> first fix it?',
      'Digits come out least significant first. Compare reversing in place with filling a scratch buffer from the end. Which uses less stack?',
      'On a Cortex-M0 there is no hardware divide. How would you print a <code>uint32_t</code> in decimal without calling a division routine per digit?',
    ],
    starter: C`
#include <limits.h>
#include <stddef.h>

/* Write value in base 2..16 to buf, a buffer of size bytes. Return the number
   of characters written (not counting the NUL), or 0 if base is invalid or the
   result does not fit; then buf holds "" when size > 0. */
size_t int_to_str(int value, unsigned base, char *buf, size_t size)
{
    /* TODO */
    (void)value;
    (void)base;
    (void)buf;
    (void)size;
    return 0u;
}
`,
    prelude: C`
#include <limits.h>
/* Format into a 40-byte buffer filled with '#', then check the return value,
   the text, and that nothing at or past buf[size] was written. */
static int trainer_itoa(int value, unsigned base, size_t size, const char *want, size_t ret) {
    char buf[40];
    memset(buf, '#', sizeof buf);
    if (int_to_str(value, base, buf, size) != ret) return 0;
    for (size_t i = size; i < sizeof buf; i++) if (buf[i] != '#') return 0;
    if (size == 0u) return 1;
    return strcmp(buf, want) == 0;
}
`,
    checks: [
      ['zero is 0', 'trainer_itoa(0, 10u, 16u, "0", 1u)'],
      ['positive decimal', 'trainer_itoa(1234, 10u, 16u, "1234", 4u)'],
      ['negative decimal', 'trainer_itoa(-1234, 10u, 16u, "-1234", 5u)'],
      ['INT_MAX in decimal', 'trainer_itoa(INT_MAX, 10u, 16u, "2147483647", 10u)'],
      ['INT_MIN in decimal', 'trainer_itoa(INT_MIN, 10u, 16u, "-2147483648", 11u)'],
      ['hex uses lowercase digits', 'trainer_itoa(255, 16u, 16u, "ff", 2u) && trainer_itoa(0xBEEF, 16u, 16u, "beef", 4u)'],
      ['negative hex keeps the minus sign', 'trainer_itoa(-255, 16u, 16u, "-ff", 3u)'],
      ['INT_MAX and INT_MIN in hex', 'trainer_itoa(INT_MAX, 16u, 16u, "7fffffff", 8u) && trainer_itoa(INT_MIN, 16u, 16u, "-80000000", 9u)'],
      ['binary', 'trainer_itoa(5, 2u, 16u, "101", 3u) && trainer_itoa(-5, 2u, 16u, "-101", 4u) && trainer_itoa(0, 2u, 16u, "0", 1u)'],
      ['INT_MIN in binary', 'trainer_itoa(INT_MIN, 2u, 40u, "-10000000000000000000000000000000", 33u)'],
      ['exact fit: size is length + 1', 'trainer_itoa(1234, 10u, 5u, "1234", 4u) && trainer_itoa(-42, 10u, 4u, "-42", 3u)'],
      ['one byte short fails with an empty string', 'trainer_itoa(1234, 10u, 4u, "", 0u) && trainer_itoa(-42, 10u, 3u, "", 0u)'],
      ['size 1 and size 0', 'trainer_itoa(7, 10u, 1u, "", 0u) && trainer_itoa(7, 10u, 0u, "", 0u)'],
      ['invalid bases 0, 1 and 17 fail', 'trainer_itoa(10, 1u, 16u, "", 0u) && trainer_itoa(10, 17u, 16u, "", 0u) && trainer_itoa(10, 0u, 16u, "", 0u)'],
    ],
    forbid: [['does not use sprintf or snprintf', /\b(sprintf|snprintf|vsprintf|vsnprintf)\s*\(/]],
  },
  {
    id: 'reverse_words', topic: 'Lists and strings', title: 'Reverse the words', summary: 'In place, O(1) extra space',
    difficulty: 'Easy', minutes: 15, filename: 'reverse_words.c',
    description: 'A favourite whiteboard question: reverse the order of the words in a sentence, so "the quick fox" becomes "fox quick the". The catch is that you must do it in place with constant extra memory, which rules out splitting into an array of words or building a second string.',
    requirements: '<ul><li><code>s</code> is a NUL-terminated string of words separated by single spaces, with no leading or trailing spaces. It may be empty.</li><li>Rearrange it in place so the words appear in reverse order; the letters inside each word keep their order.</li><li>The length of the string does not change, and nothing past its NUL is written.</li><li>Use O(1) extra space: no second buffer sized to the input, and no <code>malloc</code>.</li></ul>',
    followups: [
      'Your solution reverses each character twice. What is its time complexity, and why is that still optimal?',
      'How does your code behave with multiple spaces between words, or leading and trailing spaces? What would you change to collapse them?',
      'How would you rotate an array left by <code>k</code> places in place? (Hint: the same trick.)',
    ],
    starter: C`
#include <stddef.h>
#include <string.h>

/* Reverse the order of the space-separated words in s, in place. */
void reverse_words(char *s)
{
    /* TODO */
    (void)s;
}
`,
    prelude: C`
/* Reverse a copy of text in a 64-byte buffer filled with '#', then compare the
   result and check that nothing past the NUL was written. */
static int trainer_rev(const char *text, const char *want) {
    char buf[64];
    size_t n = strlen(text);
    memset(buf, '#', sizeof buf);
    memcpy(buf, text, n + 1u);
    reverse_words(buf);
    if (strcmp(buf, want) != 0) return 0;
    for (size_t i = n + 1u; i < sizeof buf; i++) if (buf[i] != '#') return 0;
    return 1;
}
static int trainer_len_kept(const char *text) {
    char buf[64];
    size_t n = strlen(text);
    memcpy(buf, text, n + 1u);
    reverse_words(buf);
    return strlen(buf) == n;
}
`,
    checks: [
      ['one word is unchanged', 'trainer_rev("hello", "hello")'],
      ['two words swap', 'trainer_rev("hello world", "world hello")'],
      ['the quick fox', 'trainer_rev("the quick fox", "fox quick the")'],
      ['several words', 'trainer_rev("show ip route vrf mgmt", "mgmt vrf route ip show")'],
      ['words of different lengths', 'trainer_rev("a bb ccc dddd", "dddd ccc bb a")'],
      ['an empty string stays empty', 'trainer_rev("", "")'],
      ['a single character', 'trainer_rev("x", "x")'],
      ['single-character words', 'trainer_rev("a b c d", "d c b a")'],
      ['letters inside words keep their order', 'trainer_rev("ab cd", "cd ab")'],
      ['repeated words', 'trainer_rev("go go stop", "stop go go")'],
      ['total length is preserved', 'trainer_len_kept("interface gigabit ethernet one")'],
    ],
    forbid: [['does not allocate memory', /\b(malloc|calloc|realloc|alloca|strdup)\s*\(/]],
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

  /* ============================================ Math and signal processing */
  {
    id: 'saturate', topic: 'Math and signal processing', title: 'Saturating and Q15 arithmetic', summary: 'Clamp, do not wrap',
    difficulty: 'Medium', minutes: 20, filename: 'saturate.c',
    description: 'Audio codecs, motor control and sensor filters run on 16-bit fixed-point samples. When a sum overflows, wrapping turns a loud positive peak into a full-scale negative one: an audible crack, or a control loop driving hard the wrong way. Write the saturating add and subtract that DSP code relies on, and a Q15 fractional multiply, where 16-bit values represent fractions from -1 to just under +1.',
    requirements: '<ul><li><code>sat_add16</code> and <code>sat_sub16</code> return <code>a + b</code> and <code>a - b</code>, clamped to the <code>int16_t</code> range: results above <code>INT16_MAX</code> become <code>INT16_MAX</code>, results below <code>INT16_MIN</code> become <code>INT16_MIN</code>.</li><li>In Q15 an <code>int16_t</code> <code>v</code> stands for <code>v / 32768</code>, so 16384 is 0.5 and -32768 is -1.0. <code>q15_mul</code> returns <code>a &times; b</code> in Q15, rounded to the nearest Q15 value with exact halves rounded up (toward +infinity).</li><li>The only Q15 product that does not fit is -1 &times; -1 = +1.0; it saturates to <code>32767</code>.</li><li>No signed overflow anywhere: the checker traps it. You may assume <code>&gt;&gt;</code> on a negative <code>int32_t</code> is an arithmetic shift, as it is on GCC, Clang and Arm compilers.</li></ul>',
    followups: [
      'Why do audio and control loops saturate instead of wrapping? What does a wrapped overflow sound like, or do to a PID output?',
      'Arm has <code>QADD16</code>, <code>QSUB16</code> and <code>SSAT</code>, and sets the sticky Q flag on saturation. How would you use them from C, and why might you check the Q flag?',
      'What does Q15 mean, and why is the product of two Q15 numbers Q30? When would you choose Q31 or floating point instead?',
    ],
    starter: C`
#include <stdint.h>

/* Return a + b clamped to the int16_t range. */
int16_t sat_add16(int16_t a, int16_t b)
{
    /* TODO */
    (void)a;
    (void)b;
    return 0;
}

/* Return a - b clamped to the int16_t range. */
int16_t sat_sub16(int16_t a, int16_t b)
{
    /* TODO */
    (void)a;
    (void)b;
    return 0;
}

/* Return a * b in Q15, rounded to nearest (halves up), saturating -1 * -1. */
int16_t q15_mul(int16_t a, int16_t b)
{
    /* TODO */
    (void)a;
    (void)b;
    return 0;
}
`,
    prelude: C`
`,
    checks: [
      ['add without overflow', 'sat_add16(1000, 2000) == 3000 && sat_add16(-1000, 500) == -500'],
      ['add clamps at INT16_MAX', 'sat_add16(30000, 10000) == INT16_MAX && sat_add16(INT16_MAX, 1) == INT16_MAX'],
      ['add clamps at INT16_MIN', 'sat_add16(-30000, -10000) == INT16_MIN && sat_add16(INT16_MIN, -1) == INT16_MIN'],
      ['add of opposite extremes does not clamp', 'sat_add16(INT16_MAX, INT16_MIN) == -1'],
      ['subtract without overflow', 'sat_sub16(5000, 7000) == -2000 && sat_sub16(-5000, -7000) == 2000'],
      ['subtract clamps at INT16_MAX', 'sat_sub16(INT16_MAX, -1) == INT16_MAX && sat_sub16(30000, -10000) == INT16_MAX'],
      ['0 - INT16_MIN clamps to INT16_MAX', 'sat_sub16(0, INT16_MIN) == INT16_MAX'],
      ['INT16_MIN - 1 clamps to INT16_MIN', 'sat_sub16(INT16_MIN, 1) == INT16_MIN && sat_sub16(-30000, 10000) == INT16_MIN'],
      ['0.5 x 0.5 = 0.25', 'q15_mul(16384, 16384) == 8192'],
      ['signs: 0.5 x -0.5 and -0.5 x -0.5', 'q15_mul(16384, -16384) == -8192 && q15_mul(-16384, -16384) == 8192'],
      ['-1 x -1 saturates to 32767', 'q15_mul(INT16_MIN, INT16_MIN) == INT16_MAX'],
      ['-1 x x is -x', 'q15_mul(INT16_MIN, 16384) == -16384 && q15_mul(INT16_MIN, INT16_MAX) == -INT16_MAX'],
      ['rounds to nearest, halves up', 'q15_mul(1, 16384) == 1 && q15_mul(3, 8192) == 1 && q15_mul(-1, 16384) == 0'],
      ['negative products round to nearest', 'q15_mul(-3, 8192) == -1 && q15_mul(-1, 8192) == 0'],
      ['almost 1 squared, and zero', 'q15_mul(INT16_MAX, INT16_MAX) == 32766 && q15_mul(0, INT16_MIN) == 0'],
    ],
  },
  {
    id: 'moving_average', topic: 'Math and signal processing', title: 'Moving average filter', summary: 'Smooth ADC samples in O(1)',
    difficulty: 'Easy', minutes: 15, filename: 'moving_average.c',
    description: 'A 12- or 16-bit ADC reading a battery voltage or a pressure sensor jitters by a few counts from sample to sample. A moving average over the last N samples smooths that out. Keep a running sum so each new sample costs the same small amount of work however long the window is, and do it in integers: many small MCUs have no FPU.',
    requirements: '<ul><li><code>ma_init</code> resets the filter and sets the window: 1 to <code>MA_MAX_WINDOW</code> (16) samples, fixed until the next init. The struct may hold garbage before init.</li><li><code>ma_add</code> takes one sample and returns the average of the last <code>window</code> samples. Until the window has filled, average over the samples seen so far.</li><li>Round to nearest, halves up: 1 and 2 average to 2. Samples can be anything up to 65535.</li><li>Add the fields you need to the struct. Keep the work per sample constant: do not re-sum the window, and do not use floating point.</li></ul>',
    followups: [
      'Why is the running sum O(1) per sample, and what happens to it if a single bit flips in RAM?',
      'If the window is a power of two, how do you replace the division, and why does that matter on a Cortex-M0?',
      'An exponential moving average needs no sample buffer at all. How does <code>avg += (sample - avg) &gt;&gt; k</code> compare, and what is the trap with negative numbers and integer precision?',
    ],
    starter: C`
#include <stdint.h>

#define MA_MAX_WINDOW 16u

typedef struct MovingAverage {
    uint16_t samples[MA_MAX_WINDOW];   /* the most recent samples */
    uint8_t window;                    /* samples to average, 1..MA_MAX_WINDOW */
    /* TODO: add the fields you need */
} MovingAverage;

/* Reset the filter and set the window length (1..MA_MAX_WINDOW). */
void ma_init(MovingAverage *ma, uint8_t window)
{
    /* TODO */
    (void)ma;
    (void)window;
}

/* Add one sample and return the rounded average of the last window samples
   (or of all samples so far, while the window is still filling). */
uint16_t ma_add(MovingAverage *ma, uint16_t sample)
{
    /* TODO */
    (void)ma;
    (void)sample;
    return 0u;
}
`,
    prelude: C`
/* Feed in[] to a fresh filter (garbage before init) and compare every output with want[]. */
static int trainer_run(uint8_t window, const uint16_t *in, const uint16_t *want, size_t n) {
    MovingAverage ma;
    memset(&ma, 0xA5, sizeof ma);
    ma_init(&ma, window);
    for (size_t i = 0; i < n; i++) {
        if (ma_add(&ma, in[i]) != want[i]) return 0;
    }
    return 1;
}
/* Full-scale samples: the sum needs 20 bits. Then let zeros push them out. */
static int trainer_full_scale(void) {
    MovingAverage ma;
    ma_init(&ma, 16u);
    for (int i = 0; i < 40; i++) {
        if (ma_add(&ma, 65535u) != 65535u) return 0;
    }
    for (uint32_t k = 1u; k <= 16u; k++) {
        if (ma_add(&ma, 0u) != (uint16_t)(((16u - k) * 65535u + 8u) / 16u)) return 0;
    }
    return 1;
}
/* Pseudo-random samples checked against a filter that re-sums every time. */
static int trainer_reference(uint8_t window, unsigned steps) {
    MovingAverage ma;
    uint16_t hist[16] = {0};
    uint32_t seed = 12345u;
    memset(&ma, 0x5A, sizeof ma);
    ma_init(&ma, window);
    for (unsigned i = 0; i < steps; i++) {
        seed = seed * 1664525u + 1013904223u;
        uint16_t s = (uint16_t)(seed >> 16);
        hist[i % window] = s;
        unsigned have = i + 1u < window ? i + 1u : window;
        uint32_t sum = 0u;
        for (unsigned k = 0; k < have; k++) sum += hist[k];
        if (ma_add(&ma, s) != (sum + have / 2u) / have) return 0;
    }
    return 1;
}
/* Two filters used in turn must not share state. */
static int trainer_two_filters(void) {
    MovingAverage a, b;
    ma_init(&a, 2u);
    ma_init(&b, 4u);
    return ma_add(&a, 100u) == 100u && ma_add(&b, 8u) == 8u
        && ma_add(&a, 200u) == 150u && ma_add(&b, 0u) == 4u
        && ma_add(&a, 300u) == 250u && ma_add(&b, 0u) == 3u;
}
/* Re-init after use starts over with the new window. */
static int trainer_reinit(void) {
    MovingAverage ma;
    ma_init(&ma, 4u);
    ma_add(&ma, 1000u);
    ma_add(&ma, 3000u);
    ma_init(&ma, 2u);
    return ma_add(&ma, 10u) == 10u && ma_add(&ma, 20u) == 15u && ma_add(&ma, 30u) == 25u;
}
`,
    checks: [
      ['the first sample returns itself', 'trainer_run(4u, (const uint16_t[]){1234u}, (const uint16_t[]){1234u}, 1u)'],
      ['averages what it has while warming up', 'trainer_run(4u, (const uint16_t[]){10u, 20u, 30u}, (const uint16_t[]){10u, 15u, 20u}, 3u)'],
      ['averages the full window once filled', 'trainer_run(4u, (const uint16_t[]){10u, 20u, 30u, 40u}, (const uint16_t[]){10u, 15u, 20u, 25u}, 4u)'],
      ['old samples roll out of the window', 'trainer_run(4u, (const uint16_t[]){10u, 20u, 30u, 40u, 50u, 60u}, (const uint16_t[]){10u, 15u, 20u, 25u, 35u, 45u}, 6u) && trainer_run(3u, (const uint16_t[]){100u, 0u, 0u, 0u}, (const uint16_t[]){100u, 50u, 33u, 0u}, 4u)'],
      ['halves round up', 'trainer_run(2u, (const uint16_t[]){1u, 2u}, (const uint16_t[]){1u, 2u}, 2u) && trainer_run(4u, (const uint16_t[]){10u, 15u}, (const uint16_t[]){10u, 13u}, 2u)'],
      ['rounds to nearest, not down', 'trainer_run(4u, (const uint16_t[]){0u, 0u, 0u, 3u}, (const uint16_t[]){0u, 0u, 0u, 1u}, 4u) && trainer_run(3u, (const uint16_t[]){1u, 2u, 2u}, (const uint16_t[]){1u, 2u, 2u}, 3u) && trainer_run(3u, (const uint16_t[]){1u, 1u, 2u}, (const uint16_t[]){1u, 1u, 1u}, 3u)'],
      ['full-scale samples do not overflow the sum', 'trainer_full_scale()'],
      ['window 1 passes samples straight through', 'trainer_run(1u, (const uint16_t[]){5u, 65535u, 0u, 7u}, (const uint16_t[]){5u, 65535u, 0u, 7u}, 4u)'],
      ['window 16 matches a re-summing reference', 'trainer_reference(16u, 200u)'],
      ['window 5 matches a re-summing reference', 'trainer_reference(5u, 200u)'],
      ['two filters keep separate state', 'trainer_two_filters()'],
      ['ma_init resets a used filter', 'trainer_reinit()'],
    ],
    forbid: [['does not use floating point', /\b(float|double)\b/]],
  },
  {
    id: 'lut_interp', topic: 'Math and signal processing', title: 'Lookup table interpolation', summary: 'Calibrate a sensor in integers',
    difficulty: 'Medium', minutes: 20, filename: 'lut_interp.c',
    description: 'An NTC thermistor, a fuel-level sender or a pressure sensor rarely has a straight-line response, so firmware converts raw ADC counts to engineering units with a calibration table of breakpoints and draws straight lines between them. Implement that lookup with integer arithmetic only: clamp outside the table, return table points exactly, and round in between. The tables can span large ranges, so watch the intermediate products.',
    requirements: '<ul><li><code>xs</code> holds <code>n</code> (at least 1) strictly increasing breakpoints and <code>ys</code> the value at each. All table values lie within ±1 000 000 000; <code>x</code> can be any <code>int32_t</code>.</li><li>At or below <code>xs[0]</code> return <code>ys[0]</code>; at or above <code>xs[n-1]</code> return <code>ys[n-1]</code>.</li><li>Between <code>xs[i]</code> and <code>xs[i+1]</code> return the exact value <code>ys[i] + (x - xs[i]) * (ys[i+1] - ys[i]) / (xs[i+1] - xs[i])</code> rounded to the nearest integer, halves away from zero (like <code>lround</code>): 2.5 gives 3 and -2.5 gives -3. A breakpoint returns its <code>ys</code> exactly.</li><li><code>ys</code> may increase or decrease. Use integers only, and no intermediate result may overflow.</li></ul>',
    followups: [
      'Binary search or a linear scan: which would you use for a 16-point table, and for a 1000-point one? What if consecutive calls usually land in the same segment?',
      'Why mark the tables <code>const</code>, and where does that put them on a microcontroller? What changes if the calibration is measured per unit at the factory?',
      'You are given 200 measured points but have room for 16 breakpoints. How do you choose them, and how do you bound the error?',
    ],
    starter: C`
#include <stddef.h>
#include <stdint.h>

/* Look up x in a table of n strictly increasing breakpoints xs[] with values
   ys[], interpolating linearly between breakpoints and clamping outside. */
int32_t lut_interp(const int32_t *xs, const int32_t *ys, size_t n, int32_t x)
{
    /* TODO */
    (void)xs;
    (void)ys;
    (void)n;
    (void)x;
    return 0;
}
`,
    prelude: C`
/* NTC thermistor: ADC counts to tenths of a degree C. Hotter means fewer counts. */
static const int32_t trainer_ntc_x[] = {500, 1000, 2000, 3000, 3500};
static const int32_t trainer_ntc_y[] = {1000, 600, 250, 0, -150};
static const int32_t trainer_neg_x[] = {-1000, 0, 1000};
static const int32_t trainer_neg_y[] = {-500, 0, 2000};
/* Every x across a 64-point table, compared with exact rational rounding. */
static int trainer_sweep(void) {
    int32_t xs[64], ys[64];
    for (int32_t i = 0; i < 64; i++) { xs[i] = i * 10; ys[i] = i * i; }
    for (int32_t x = -5; x <= 640; x++) {
        int32_t want;
        if (x <= 0) want = 0;
        else if (x >= 630) want = 3969;
        else {
            int32_t i = x / 10, k = x % 10;
            want = (10 * i * i + k * (2 * i + 1) + 5) / 10;
        }
        if (lut_interp(xs, ys, 64u, x) != want) return 0;
    }
    return 1;
}
static int trainer_all_points(void) {
    for (size_t i = 0; i < 5u; i++) {
        if (lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, trainer_ntc_x[i]) != trainer_ntc_y[i]) return 0;
    }
    for (size_t i = 0; i < 3u; i++) {
        if (lut_interp(trainer_neg_x, trainer_neg_y, 3u, trainer_neg_x[i]) != trainer_neg_y[i]) return 0;
    }
    return 1;
}
`,
    checks: [
      ['below the table clamps to the first value', 'lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 0) == 1000 && lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 499) == 1000'],
      ['above the table clamps to the last value', 'lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 3501) == -150 && lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 4095) == -150'],
      ['extreme inputs clamp without overflow', 'lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, INT32_MIN) == 1000 && lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, INT32_MAX) == -150'],
      ['every breakpoint returns its value exactly', 'trainer_all_points()'],
      ['interpolates between points', 'lut_interp((const int32_t[]){0, 100}, (const int32_t[]){0, 1000}, 2u, 25) == 250 && lut_interp((const int32_t[]){0, 100}, (const int32_t[]){0, 1000}, 2u, 50) == 500'],
      ['decreasing NTC curve', 'lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 750) == 800 && lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 1500) == 425 && lut_interp(trainer_ntc_x, trainer_ntc_y, 5u, 3250) == -75'],
      ['negative breakpoints and values', 'lut_interp(trainer_neg_x, trainer_neg_y, 3u, -250) == -125 && lut_interp(trainer_neg_x, trainer_neg_y, 3u, 500) == 1000 && lut_interp(trainer_neg_x, trainer_neg_y, 3u, -999) == -500'],
      ['rounds to nearest, not toward zero', 'lut_interp((const int32_t[]){0, 3}, (const int32_t[]){0, 1}, 2u, 1) == 0 && lut_interp((const int32_t[]){0, 3}, (const int32_t[]){0, 1}, 2u, 2) == 1 && lut_interp((const int32_t[]){0, 3}, (const int32_t[]){0, -1}, 2u, 2) == -1'],
      ['halves round away from zero', 'lut_interp((const int32_t[]){0, 2}, (const int32_t[]){0, 1}, 2u, 1) == 1 && lut_interp((const int32_t[]){0, 2}, (const int32_t[]){0, -1}, 2u, 1) == -1'],
      ['negative halves round away from zero, not up', 'lut_interp((const int32_t[]){0, 2}, (const int32_t[]){-3, -2}, 2u, 1) == -3 && lut_interp((const int32_t[]){0, 2}, (const int32_t[]){2, 3}, 2u, 1) == 3'],
      ['a one-point table returns its value', 'lut_interp((const int32_t[]){100}, (const int32_t[]){42}, 1u, 100) == 42 && lut_interp((const int32_t[]){100}, (const int32_t[]){42}, 1u, -5) == 42 && lut_interp((const int32_t[]){100}, (const int32_t[]){42}, 1u, 500) == 42'],
      ['products past 32 bits do not overflow', 'lut_interp((const int32_t[]){0, 100000}, (const int32_t[]){0, 100000}, 2u, 50001) == 50001'],
      ['full +-1e9 span does not overflow', 'lut_interp((const int32_t[]){-1000000000, 1000000000}, (const int32_t[]){1000000000, -1000000000}, 2u, 1) == -1 && lut_interp((const int32_t[]){-1000000000, 1000000000}, (const int32_t[]){1000000000, -1000000000}, 2u, -999999999) == 999999999'],
      ['every x across a 64-point table', 'trainer_sweep()'],
    ],
  },

  /* ============================================================= Networking */
  {
    id: 'prefix_mask', topic: 'Networking', title: 'Subnet masks and prefixes', summary: '/24, /0 and /32',
    difficulty: 'Easy', minutes: 15, filename: 'prefix_mask.c',
    description: 'Routing tables, ACLs and interface addresses all use prefix lengths such as 192.168.1.0/24. Convert between prefix lengths and masks, and test whether an address is in a subnet. Addresses are host-order uint32_t values: 192.168.1.0 is 0xC0A80100.',
    requirements: '<ul><li><code>prefix_to_mask</code> returns the mask for a prefix length from 0 to 32: 24 gives <code>0xFFFFFF00</code>, 0 gives 0, 32 gives <code>0xFFFFFFFF</code>.</li><li><code>ip_in_subnet</code> returns true when <code>ip</code> is inside <code>net/prefix_len</code>. Bits of <code>net</code> outside the prefix are ignored.</li><li><code>mask_to_prefix</code> returns the prefix length of a valid mask, or -1 if its 1 bits are not contiguous from the top.</li><li>Careful: shifting a 32-bit value by 32 is undefined behaviour.</li></ul>',
    followups: [
      'How many usable hosts are in a /26, and why do you subtract 2? What is a /31 used for?',
      'A router has routes for 10.0.0.0/8 and 10.1.0.0/16. Which does it use for 10.1.2.3, and why?',
      'Why do ACL entries on some platforms use wildcard masks (0.0.0.255) instead?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Return the netmask for a prefix length 0..32, e.g. 24 -> 0xFFFFFF00. */
uint32_t prefix_to_mask(unsigned prefix_len)
{
    /* TODO */
    (void)prefix_len;
    return 0u;
}

/* Return true when ip is inside the subnet net/prefix_len. */
bool ip_in_subnet(uint32_t ip, uint32_t net, unsigned prefix_len)
{
    /* TODO */
    (void)ip;
    (void)net;
    (void)prefix_len;
    return false;
}

/* Return the prefix length of mask, or -1 if it is not a contiguous mask. */
int mask_to_prefix(uint32_t mask)
{
    /* TODO */
    (void)mask;
    return -1;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['/24 is 255.255.255.0', 'prefix_to_mask(24u) == 0xFFFFFF00u'],
      ['/1 is 128.0.0.0', 'prefix_to_mask(1u) == 0x80000000u'],
      ['/32 is all ones', 'prefix_to_mask(32u) == 0xFFFFFFFFu'],
      ['/0 is zero', 'prefix_to_mask(0u) == 0u'],
      ['192.168.1.77 is in 192.168.1.0/24', 'ip_in_subnet(0xC0A8014Du, 0xC0A80100u, 24u)'],
      ['192.168.2.5 is not in 192.168.1.0/24', '!ip_in_subnet(0xC0A80205u, 0xC0A80100u, 24u)'],
      ['10.1.2.3 is in 10.0.0.0/8', 'ip_in_subnet(0x0A010203u, 0x0A000000u, 8u)'],
      ['/0 matches every address', 'ip_in_subnet(0x08080808u, 0u, 0u)'],
      ['/32 matches only that host', 'ip_in_subnet(0x0A000001u, 0x0A000001u, 32u) && !ip_in_subnet(0x0A000002u, 0x0A000001u, 32u)'],
      ['host bits in net are ignored', 'ip_in_subnet(0xC0A80105u, 0xC0A801FFu, 24u)'],
      ['255.255.255.0 is /24', 'mask_to_prefix(0xFFFFFF00u) == 24'],
      ['masks for /0 and /32', 'mask_to_prefix(0u) == 0 && mask_to_prefix(0xFFFFFFFFu) == 32'],
      ['non-contiguous masks are rejected', 'mask_to_prefix(0xFF00FF00u) == -1 && mask_to_prefix(0x00FFFFFFu) == -1 && mask_to_prefix(0xFFFFFF01u) == -1'],
    ],
  },
  {
    id: 'parse_ipv4', topic: 'Networking', title: 'Parse an IPv4 address', summary: 'Strict dotted quad',
    difficulty: 'Medium', minutes: 20, filename: 'parse_ipv4.c',
    description: 'Turn text such as "192.168.1.10" from a config file or CLI into a host-order uint32_t (0xC0A8010A). Be strict: lenient address parsers have caused real security bugs, because "010.0.0.1" means 8.0.0.1 to inet_aton, which reads leading zeros as octal.',
    requirements: '<ul><li>Accept exactly four decimal parts separated by single dots. Each part is 1 to 3 digits with a value from 0 to 255.</li><li>Reject leading zeros such as <code>01</code> (but <code>0</code> alone is fine), and anything else: spaces, signs, letters, empty parts, trailing characters.</li><li>On success store the value in <code>*out</code> and return true. On failure return false and leave <code>*out</code> unchanged.</li><li>Do not use <code>inet_pton</code>, <code>inet_aton</code>, <code>sscanf</code>, <code>strtoul</code> or <code>atoi</code>.</li></ul>',
    followups: [
      'Why does <code>1.2.3.4294967297</code> slip through a parser that only checks each part after the loop?',
      'You store the result in <code>struct sockaddr_in</code>. Where does <code>htonl</code> come in?',
      'What makes IPv6 text harder to parse? Think about <code>::</code> and embedded IPv4.',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Parse "a.b.c.d" into a host-order address, e.g. "192.168.1.10" -> 0xC0A8010A.
   Return false and leave *out unchanged on bad input. */
bool parse_ipv4(const char *s, uint32_t *out)
{
    /* TODO */
    (void)s;
    (void)out;
    return false;
}
`,
    prelude: C`
static int trainer_ok(const char *s, uint32_t want) { uint32_t v = 12345u; return parse_ipv4(s, &v) && v == want; }
static int trainer_bad(const char *s) { uint32_t v = 12345u; return !parse_ipv4(s, &v) && v == 12345u; }
`,
    checks: [
      ['parses 192.168.1.10', 'trainer_ok("192.168.1.10", 0xC0A8010Au)'],
      ['parses 10.0.0.1', 'trainer_ok("10.0.0.1", 0x0A000001u)'],
      ['parses 0.0.0.0', 'trainer_ok("0.0.0.0", 0u)'],
      ['parses 255.255.255.255', 'trainer_ok("255.255.255.255", 0xFFFFFFFFu)'],
      ['rejects a part above 255', 'trainer_bad("256.1.1.1") && trainer_bad("1.1.1.300")'],
      ['rejects 3 or 5 parts', 'trainer_bad("1.2.3") && trainer_bad("1.2.3.4.5")'],
      ['rejects empty parts', 'trainer_bad("1..2.3") && trainer_bad(".1.2.3") && trainer_bad("1.2.3.")'],
      ['rejects leading zeros', 'trainer_bad("01.2.3.4") && trainer_bad("1.2.3.004")'],
      ['rejects long digit runs', 'trainer_bad("1.2.3.4294967297") && trainer_bad("1.2.3.99999999999")'],
      ['rejects an empty string', 'trainer_bad("")'],
      ['rejects spaces, signs and letters', 'trainer_bad(" 1.2.3.4") && trainer_bad("1.2.3.4 ") && trainer_bad("1.2.+3.4") && trainer_bad("1.2.3.4a") && trainer_bad("a.b.c.d")'],
    ],
    forbid: [['does not use library parsers', /\b(inet_\w+|strto\w+|atoi|atol|atoll|sscanf)\s*\(/]],
  },
  {
    id: 'mac_addr', topic: 'Networking', title: 'MAC addresses', summary: 'Parse, format, classify',
    difficulty: 'Medium', minutes: 20, filename: 'mac_addr.c',
    description: 'Every switch port, ARP entry and forwarding table works with 6-byte MAC addresses. Parse and print the usual colon form, and classify an address as multicast or broadcast the way a switch does when deciding whether to flood a frame.',
    requirements: '<ul><li><code>mac_parse</code> accepts exactly six 2-digit hex bytes separated by colons, upper or lower case. On bad input return false and leave <code>mac</code> unchanged.</li><li><code>mac_format</code> writes 17 lower-case characters plus a NUL, such as <code>00:1a:2b:3c:4d:5e</code>.</li><li><code>mac_is_multicast</code>: the lowest bit of the first byte is 1. <code>mac_is_broadcast</code>: all six bytes are <code>0xFF</code>.</li><li>Do not use <code>sscanf</code>, <code>sprintf</code>, <code>snprintf</code> or <code>strtol</code>.</li></ul>',
    followups: [
      'What does the second-lowest bit of the first byte (locally administered) mean?',
      'How does an IPv4 multicast group map to a <code>01:00:5e</code> MAC, and why do 32 groups share each MAC?',
      'How does a switch treat broadcast, multicast and unknown unicast frames differently?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>

/* Parse "aa:bb:cc:dd:ee:ff" into mac. Return false and leave mac unchanged on bad input. */
bool mac_parse(const char *s, uint8_t mac[6])
{
    /* TODO */
    (void)s;
    (void)mac;
    return false;
}

/* Write mac as "aa:bb:cc:dd:ee:ff" (lower case) plus a terminating NUL. */
void mac_format(const uint8_t mac[6], char out[18])
{
    /* TODO */
    (void)mac;
    out[0] = '\0';
}

bool mac_is_multicast(const uint8_t mac[6])
{
    /* TODO */
    (void)mac;
    return false;
}

bool mac_is_broadcast(const uint8_t mac[6])
{
    /* TODO */
    (void)mac;
    return false;
}
`,
    prelude: C`
static const uint8_t trainer_mac[6] = {0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E};
static const uint8_t trainer_bcast[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
static int trainer_parse(const char *s, const uint8_t *want) {
    uint8_t mac[6] = {9, 9, 9, 9, 9, 9};
    return mac_parse(s, mac) && memcmp(mac, want, 6u) == 0;
}
static int trainer_bad(const char *s) {
    static const uint8_t same[6] = {9, 9, 9, 9, 9, 9};
    uint8_t mac[6] = {9, 9, 9, 9, 9, 9};
    return !mac_parse(s, mac) && memcmp(mac, same, 6u) == 0;
}
static int trainer_format(const uint8_t *mac, const char *want) {
    char out[20];
    memset(out, '#', sizeof out);
    mac_format(mac, out);
    return strcmp(out, want) == 0 && out[18] == '#';
}
`,
    checks: [
      ['parses lower case', 'trainer_parse("00:1a:2b:3c:4d:5e", trainer_mac)'],
      ['parses upper case', 'trainer_parse("00:1A:2B:3C:4D:5E", trainer_mac)'],
      ['parses broadcast', 'trainer_parse("ff:ff:ff:ff:ff:ff", trainer_bcast)'],
      ['rejects too few or too many bytes', 'trainer_bad("00:1a:2b:3c:4d") && trainer_bad("00:1a:2b:3c:4d:5e:6f")'],
      ['rejects single hex digits', 'trainer_bad("0:1a:2b:3c:4d:5e")'],
      ['rejects bad characters and separators', 'trainer_bad("00:1g:2b:3c:4d:5e") && trainer_bad("00-1a-2b-3c-4d-5e")'],
      ['rejects trailing characters', 'trainer_bad("00:1a:2b:3c:4d:5e ") && trainer_bad("00:1a:2b:3c:4d:5e:")'],
      ['rejects an empty string', 'trainer_bad("")'],
      ['formats in lower case', 'trainer_format(trainer_mac, "00:1a:2b:3c:4d:5e")'],
      ['formats high bytes', 'trainer_format((const uint8_t[]){0xAB, 0xCD, 0xEF, 0x01, 0x23, 0x45}, "ab:cd:ef:01:23:45")'],
      ['broadcast is broadcast and multicast', 'mac_is_broadcast(trainer_bcast) && mac_is_multicast(trainer_bcast)'],
      ['01:00:5e:00:00:01 is multicast only', 'mac_is_multicast((const uint8_t[]){0x01, 0x00, 0x5E, 0x00, 0x00, 0x01}) && !mac_is_broadcast((const uint8_t[]){0x01, 0x00, 0x5E, 0x00, 0x00, 0x01})'],
      ['unicast is neither', '!mac_is_multicast(trainer_mac) && !mac_is_broadcast(trainer_mac)'],
      ['ff:ff:ff:ff:ff:fe is not broadcast', '!mac_is_broadcast((const uint8_t[]){0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFE})'],
    ],
    forbid: [['does not use sscanf, sprintf or strtol', /\b(sscanf|sprintf|snprintf|strto\w+)\s*\(/]],
  },
  {
    id: 'inet_checksum', topic: 'Networking', title: 'Internet checksum', summary: 'RFC 1071, as in IPv4 and UDP',
    difficulty: 'Medium', minutes: 20, filename: 'inet_checksum.c',
    description: 'IPv4, ICMP, UDP and TCP headers all carry the same 16-bit checksum: the ones\' complement of the ones\' complement sum of the data. Implement it. A correct header summed together with its own checksum gives 0, which is how a receiver checks it.',
    requirements: '<ul><li>Add the data as 16-bit big-endian words: <code>data[0]</code> is the high byte of the first word.</li><li>If <code>len</code> is odd, the last byte is the high byte of a final word whose low byte is 0.</li><li>Fold every carry out of bit 15 back into the low 16 bits (end-around carry), then return the bitwise complement.</li><li>Empty input returns <code>0xFFFF</code>. Do not cast <code>data</code> to <code>uint16_t *</code>; it may be unaligned.</li></ul>',
    followups: [
      'A router decrements the TTL. How can it update the checksum without summing the whole header again (RFC 1624)?',
      'Why does the ones\' complement sum give the same answer on big- and little-endian CPUs once the bytes are swapped back?',
      'Why does IPv6 have no header checksum, and what is checksum offload on a NIC?',
    ],
    starter: C`
#include <stddef.h>
#include <stdint.h>

/* RFC 1071 Internet checksum over len bytes. */
uint16_t inet_checksum(const uint8_t *data, size_t len)
{
    /* TODO */
    (void)data;
    (void)len;
    return 0u;
}
`,
    prelude: C`
/* Example IPv4 header with its correct checksum 0xB861 in bytes 10 and 11. */
static const uint8_t trainer_hdr[20] = {
    0x45, 0x00, 0x00, 0x73, 0x00, 0x00, 0x40, 0x00, 0x40, 0x11,
    0xB8, 0x61, 0xC0, 0xA8, 0x00, 0x01, 0xC0, 0xA8, 0x00, 0xC7,
};
static int trainer_zeroed(size_t off) {
    uint8_t buf[21];
    memcpy(buf + off, trainer_hdr, 20u);
    buf[off + 10] = buf[off + 11] = 0u;
    return inet_checksum(buf + off, 20u) == 0xB861u;
}
static int trainer_many_ones(void) {
    uint8_t buf[1500];
    memset(buf, 0xFF, sizeof buf);
    return inet_checksum(buf, sizeof buf) == 0x0000u;
}
`,
    checks: [
      ['IPv4 header example gives 0xB861', 'trainer_zeroed(0u)'],
      ['a header with a valid checksum sums to 0', 'inet_checksum(trainer_hdr, 20u) == 0u'],
      ['empty input gives 0xFFFF', 'inet_checksum(trainer_hdr, 0u) == 0xFFFFu'],
      ['one byte is padded with a zero low byte', 'inet_checksum((const uint8_t[]){0x01}, 1u) == 0xFEFFu'],
      ['odd length after full words', 'inet_checksum((const uint8_t[]){0x12, 0x34, 0x56}, 3u) == 0x97CBu'],
      ['end-around carry is added back', 'inet_checksum((const uint8_t[]){0xFF, 0xFF, 0x00, 0x01}, 4u) == 0xFFFEu'],
      ['1500 bytes of 0xFF keep every carry', 'trainer_many_ones()'],
      ['reads only len bytes', 'inet_checksum(trainer_hdr, 2u) == 0xBAFFu'],
      ['works on an unaligned buffer', 'trainer_zeroed(1u)'],
    ],
  },
  {
    id: 'eth_header', topic: 'Networking', title: 'Ethernet and VLAN header', summary: 'Parse 802.1Q tags',
    difficulty: 'Medium', minutes: 20, filename: 'eth_header.c',
    description: 'An Ethernet II frame starts with the destination MAC (6 bytes), the source MAC (6 bytes) and a 2-byte EtherType. If the EtherType is 0x8100, a 4-byte 802.1Q VLAN tag sits there instead: a 2-byte TCI (3-bit priority, 1-bit DEI, 12-bit VLAN ID) followed by the real EtherType. Parse it.',
    requirements: '<ul><li>Return false if the frame is shorter than 14 bytes, or shorter than 18 bytes when it carries a tag. Otherwise fill every field of <code>*info</code> and return true.</li><li>Multi-byte fields are big-endian. For an untagged frame, <code>has_vlan</code> is false and <code>vlan_id</code> and <code>priority</code> are 0.</li><li><code>payload_offset</code> is where the payload starts: 14, or 18 when tagged. Handle one tag only.</li><li>The DEI bit is not part of the VLAN ID.</li></ul>',
    followups: [
      'Q-in-Q stacks an outer tag with EtherType 0x88A8. How would you extend your parser?',
      'An EtherType below 0x0600 is really a length (IEEE 802.3). How should the parser treat those frames?',
      'VLAN IDs 0 and 4095 are reserved. What do they mean, and what should the switch do with them?',
    ],
    starter: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct EthInfo {
    uint8_t dst[6];
    uint8_t src[6];
    bool has_vlan;           /* true when an 802.1Q tag is present */
    uint16_t vlan_id;        /* 12-bit VLAN ID, 0 when untagged */
    uint8_t priority;        /* 3-bit priority (PCP), 0 when untagged */
    uint16_t ethertype;      /* payload type, e.g. 0x0800 for IPv4 */
    size_t payload_offset;   /* where the payload starts in the frame */
} EthInfo;

/* Parse the Ethernet header at the start of frame. Return false if it is too short. */
bool eth_parse(const uint8_t *frame, size_t len, EthInfo *info)
{
    /* TODO */
    (void)frame;
    (void)len;
    (void)info;
    return false;
}
`,
    prelude: C`
static const uint8_t trainer_untagged[20] = {
    0x00, 0x1A, 0x2B, 0x3C, 0x4D, 0x5E,  0x02, 0x00, 0x00, 0x00, 0x00, 0x01,  0x08, 0x00,
    0x45, 0x00, 0x00, 0x14, 0x00, 0x00,
};
static const uint8_t trainer_tagged[22] = {
    0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,  0x02, 0x00, 0x00, 0x00, 0x00, 0x02,  0x81, 0x00,  0xA0, 0x64,  0x86, 0xDD,
    0x60, 0x00, 0x00, 0x00,
};
/* Fill info with junk first so fields the parser forgets to set are caught. */
static void trainer_junk(EthInfo *info) {
    memset(info->dst, 0xEE, 6u); memset(info->src, 0xEE, 6u);
    info->has_vlan = true; info->vlan_id = 0xFFFFu; info->priority = 0xFFu; info->ethertype = 0u; info->payload_offset = 999u;
}
static int trainer_untagged_ok(size_t len, size_t off) {
    uint8_t buf[24]; EthInfo info;
    memcpy(buf + off, trainer_untagged, len);
    trainer_junk(&info);
    return eth_parse(buf + off, len, &info) && memcmp(info.dst, trainer_untagged, 6u) == 0 && memcmp(info.src, trainer_untagged + 6, 6u) == 0
        && !info.has_vlan && info.vlan_id == 0u && info.priority == 0u && info.ethertype == 0x0800u && info.payload_offset == 14u;
}
/* Parse the tagged frame with its TCI replaced by tci. */
static int trainer_tag(uint16_t tci, size_t len, uint16_t vid, uint8_t pcp) {
    uint8_t buf[22]; EthInfo info;
    memcpy(buf, trainer_tagged, sizeof buf);
    buf[14] = (uint8_t)(tci >> 8); buf[15] = (uint8_t)tci;
    trainer_junk(&info);
    return eth_parse(buf, len, &info) && memcmp(info.dst, trainer_tagged, 6u) == 0 && memcmp(info.src, trainer_tagged + 6, 6u) == 0
        && info.has_vlan && info.vlan_id == vid && info.priority == pcp && info.ethertype == 0x86DDu && info.payload_offset == 18u;
}
static int trainer_fails(const uint8_t *frame, size_t len) { EthInfo info; return !eth_parse(frame, len, &info); }
`,
    checks: [
      ['untagged IPv4 frame', 'trainer_untagged_ok(20u, 0u)'],
      ['exactly 14 bytes is enough', 'trainer_untagged_ok(14u, 0u)'],
      ['works at an odd address', 'trainer_untagged_ok(20u, 1u)'],
      ['13 bytes is too short', 'trainer_fails(trainer_untagged, 13u) && trainer_fails(trainer_untagged, 0u)'],
      ['VLAN 100, priority 5, IPv6 payload', 'trainer_tag(0xA064u, 22u, 100u, 5u)'],
      ['tagged frame of exactly 18 bytes', 'trainer_tag(0xA064u, 18u, 100u, 5u)'],
      ['tagged frame needs 18 bytes', 'trainer_fails(trainer_tagged, 17u) && trainer_fails(trainer_tagged, 15u)'],
      ['DEI bit is not part of the VLAN ID', 'trainer_tag(0x1FFFu, 22u, 0xFFFu, 0u)'],
      ['priority 7, VLAN 4094', 'trainer_tag(0xEFFEu, 22u, 4094u, 7u)'],
    ],
  },
  {
    id: 'ipv4_header', topic: 'Networking', title: 'Validate an IPv4 header', summary: 'Every check a router makes',
    difficulty: 'Hard', minutes: 30, filename: 'ipv4_header.c',
    description: 'Before a packet reaches the CPU\'s IP stack, platform code often has to sanity-check it: is it really IPv4, do the length fields agree with the bytes received, does the checksum verify? A wrong length field trusted here is a buffer overrun. Validate the header and extract its key fields.',
    requirements: '<ul><li>Check in this order and return the first problem: fewer than 20 bytes (<code>IP_TOO_SHORT</code>); version not 4; IHL below 5 or <code>IHL * 4</code> beyond <code>len</code>; total length below the header length or beyond <code>len</code>; header checksum (over all <code>IHL * 4</code> bytes, including options) does not verify.</li><li>Byte 0 holds the version (high nibble) and IHL (low nibble). Bytes 2–3: total length. Bytes 6–7: flags and fragment offset (MF is <code>0x2000</code>, offset is the low 13 bits). Byte 8: TTL, byte 9: protocol, bytes 12–15 and 16–19: source and destination.</li><li>On <code>IP_OK</code> fill every field of <code>*info</code>; addresses are host order. Read bytes individually; <code>pkt</code> may be unaligned.</li></ul>',
    followups: [
      'Why must the length fields be checked against the bytes actually received before anything else uses them?',
      'Fragments arrive on the CPU path of a switch. What limits would you put on reassembly, and why?',
      'Each error should bump a drop counter. How would you expose those counters for debugging in the field?',
    ],
    starter: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef enum {
    IP_OK,
    IP_TOO_SHORT,      /* fewer than 20 bytes */
    IP_BAD_VERSION,    /* version is not 4 */
    IP_BAD_IHL,        /* header length below 20 bytes or beyond len */
    IP_BAD_LENGTH,     /* total length below the header length or beyond len */
    IP_BAD_CHECKSUM,   /* header checksum does not verify */
} IpStatus;

typedef struct Ipv4Info {
    size_t header_len;   /* IHL * 4 */
    uint16_t total_len;
    uint8_t ttl;
    uint8_t protocol;    /* 1 ICMP, 6 TCP, 17 UDP */
    uint32_t src;        /* host order: 192.168.0.1 is 0xC0A80001 */
    uint32_t dst;
    bool is_fragment;    /* MF flag set or fragment offset nonzero */
} Ipv4Info;

/* Validate the IPv4 header at the start of pkt (len bytes received). On IP_OK fill *info. */
IpStatus ipv4_parse(const uint8_t *pkt, size_t len, Ipv4Info *info)
{
    /* TODO */
    (void)pkt;
    (void)len;
    (void)info;
    return IP_TOO_SHORT;
}
`,
    prelude: C`
/* Example UDP packet header: total length 115, TTL 64, 192.168.0.1 -> 192.168.0.199. */
static const uint8_t trainer_base[20] = {
    0x45, 0x00, 0x00, 0x73, 0x00, 0x00, 0x40, 0x00, 0x40, 0x11,
    0xB8, 0x61, 0xC0, 0xA8, 0x00, 0x01, 0xC0, 0xA8, 0x00, 0xC7,
};
static uint32_t trainer_store[30];   /* 120 bytes, 4-byte aligned */
static uint8_t *trainer_reset(size_t off) {
    uint8_t *p = (uint8_t *)trainer_store + off;
    memset(trainer_store, 0, sizeof trainer_store);
    memcpy(p, trainer_base, 20u);
    return p;
}
/* Recompute the header checksum after a test changes a field. */
static void trainer_fix(uint8_t *p) {
    size_t n = (size_t)(p[0] & 0x0Fu) * 4u;
    uint32_t sum = 0u;
    p[10] = p[11] = 0u;
    for (size_t i = 0; i + 1 < n; i += 2) sum += ((uint32_t)p[i] << 8) | p[i + 1];
    while (sum >> 16) sum = (sum & 0xFFFFu) + (sum >> 16);
    sum = ~sum & 0xFFFFu;
    p[10] = (uint8_t)(sum >> 8); p[11] = (uint8_t)sum;
}
static int trainer_good(size_t off) {
    uint8_t *p = trainer_reset(off);
    Ipv4Info info = {0};
    return ipv4_parse(p, 115u, &info) == IP_OK && info.header_len == 20u && info.total_len == 115u && info.ttl == 64u
        && info.protocol == 17u && info.src == 0xC0A80001u && info.dst == 0xC0A800C7u && !info.is_fragment;
}
/* Change one byte of the good header, optionally fix the checksum, and parse len bytes. */
static IpStatus trainer_edit(size_t index, uint8_t value, int fix, size_t len) {
    uint8_t *p = trainer_reset(0u);
    Ipv4Info info;
    p[index] = value;
    if (fix) trainer_fix(p);
    return ipv4_parse(p, len, &info);
}
static int trainer_fragment(uint8_t b6, uint8_t b7) {
    uint8_t *p = trainer_reset(0u);
    Ipv4Info info = {0};
    p[6] = b6; p[7] = b7;
    trainer_fix(p);
    return ipv4_parse(p, 115u, &info) == IP_OK && info.is_fragment;
}
/* A 24-byte header: IHL 6 with three NOP options and an end-of-options byte. */
static int trainer_options(int corrupt) {
    uint8_t *p = trainer_reset(0u);
    Ipv4Info info = {0};
    p[0] = 0x46u; p[20] = p[21] = p[22] = 0x01u;
    trainer_fix(p);
    if (!corrupt) return ipv4_parse(p, 115u, &info) == IP_OK && info.header_len == 24u;
    p[21] = 0x07u;
    return ipv4_parse(p, 115u, &info) == IP_BAD_CHECKSUM;
}
`,
    checks: [
      ['valid header is parsed', 'trainer_good(0u)'],
      ['parses at an odd address', 'trainer_good(1u)'],
      ['19 bytes is too short', 'trainer_edit(0u, 0x45u, 1, 19u) == IP_TOO_SHORT'],
      ['version 6 is rejected', 'trainer_edit(0u, 0x65u, 1, 115u) == IP_BAD_VERSION'],
      ['IHL below 5 is rejected', 'trainer_edit(0u, 0x44u, 0, 115u) == IP_BAD_IHL'],
      ['IHL past the received bytes', 'trainer_edit(0u, 0x4Fu, 0, 40u) == IP_BAD_IHL'],
      ['total length beyond the received bytes', 'trainer_edit(3u, 0xC8u, 1, 115u) == IP_BAD_LENGTH'],
      ['total length smaller than the header', 'trainer_edit(3u, 0x10u, 1, 115u) == IP_BAD_LENGTH'],
      ['a changed TTL fails the checksum', 'trainer_edit(8u, 0x3Fu, 0, 115u) == IP_BAD_CHECKSUM'],
      ['checks run in order', 'trainer_edit(0u, 0x65u, 0, 10u) == IP_TOO_SHORT && trainer_edit(0u, 0x65u, 0, 115u) == IP_BAD_VERSION'],
      ['MF flag marks a fragment', 'trainer_fragment(0x20u, 0x00u)'],
      ['nonzero offset marks a fragment', 'trainer_fragment(0x00u, 0xB9u)'],
      ['header with options is 24 bytes', 'trainer_options(0)'],
      ['checksum covers the options', 'trainer_options(1)'],
    ],
  },
  {
    id: 'mac_table', topic: 'Networking', title: 'MAC learning table', summary: 'Learn, look up, age out',
    difficulty: 'Hard', minutes: 30, filename: 'mac_table.c',
    description: 'A switch learns which port each MAC address lives on from the source address of every frame, looks up the destination to forward, and forgets entries that go quiet. Build that forwarding database for a fixed-size table. Entries are keyed by MAC and VLAN together.',
    requirements: '<ul><li><code>fdb_learn</code> adds an entry, or updates the port and <code>last_seen</code> of an existing one (the station moved or is still there). Never create duplicates. Return false only when a new entry is needed and the table is full.</li><li><code>fdb_lookup</code> returns the port for a MAC on a VLAN, or -1 if unknown. The same MAC on two VLANs is two separate entries.</li><li><code>fdb_age</code> removes entries whose age (<code>now - last_seen</code>) is greater than <code>max_age</code> and returns how many it removed. The tick counter can wrap past <code>0xFFFFFFFF</code>, so compute the age with unsigned arithmetic. Removed slots must be reusable.</li><li>You may add fields, but keep the names of the existing types, fields and functions.</li></ul>',
    followups: [
      'Real switches hold 32K or more entries. How would you make lookup O(1), and how do you handle hash collisions?',
      'What happens when the table fills up, and how does a MAC flooding attack exploit that?',
      'In hardware the ASIC usually learns. How does the software table stay in sync with it?',
    ],
    starter: C`
#include <stdbool.h>
#include <stdint.h>
#include <string.h>

#define FDB_SIZE 16

typedef struct FdbEntry {
    bool used;
    uint8_t mac[6];
    uint16_t vlan;
    uint16_t port;
    uint32_t last_seen;   /* tick of the last frame from this MAC */
} FdbEntry;

typedef struct Fdb {
    FdbEntry entries[FDB_SIZE];
} Fdb;

/* Start with an empty table. */
void fdb_init(Fdb *fdb)
{
    /* TODO */
    (void)fdb;
}

/* A frame from mac on vlan arrived on port at tick now. Add or update the
   entry. Return false if a new entry is needed and the table is full. */
bool fdb_learn(Fdb *fdb, const uint8_t mac[6], uint16_t vlan, uint16_t port, uint32_t now)
{
    /* TODO */
    (void)fdb;
    (void)mac;
    (void)vlan;
    (void)port;
    (void)now;
    return false;
}

/* Return the port for mac on vlan, or -1 if unknown (the switch then floods). */
int fdb_lookup(const Fdb *fdb, const uint8_t mac[6], uint16_t vlan)
{
    /* TODO */
    (void)fdb;
    (void)mac;
    (void)vlan;
    return -1;
}

/* Remove entries not seen for more than max_age ticks. Return how many were removed. */
unsigned fdb_age(Fdb *fdb, uint32_t now, uint32_t max_age)
{
    /* TODO */
    (void)fdb;
    (void)now;
    (void)max_age;
    return 0u;
}
`,
    prelude: C`
static Fdb trainer_fdb;
static uint8_t trainer_macs[40][6];
/* MAC address 02:00:00:00:00:n */
static const uint8_t *trainer_m(unsigned n) {
    uint8_t *m = trainer_macs[n];
    m[0] = 0x02u; m[1] = m[2] = m[3] = m[4] = 0u; m[5] = (uint8_t)n;
    return m;
}
static Fdb *trainer_new(void) { memset(&trainer_fdb, 0, sizeof trainer_fdb); trainer_fdb.entries[3].used = true; fdb_init(&trainer_fdb); return &trainer_fdb; }
static unsigned trainer_used(void) { unsigned n = 0; for (unsigned i = 0; i < FDB_SIZE; i++) n += trainer_fdb.entries[i].used; return n; }
static int trainer_learn_lookup(void) {
    Fdb *f = trainer_new();
    return fdb_learn(f, trainer_m(1u), 10u, 3u, 100u) && fdb_learn(f, trainer_m(2u), 10u, 7u, 100u)
        && fdb_lookup(f, trainer_m(1u), 10u) == 3 && fdb_lookup(f, trainer_m(2u), 10u) == 7 && fdb_lookup(f, trainer_m(3u), 10u) == -1;
}
static int trainer_vlans(void) {
    Fdb *f = trainer_new();
    return fdb_learn(f, trainer_m(1u), 10u, 3u, 100u) && fdb_learn(f, trainer_m(1u), 20u, 5u, 100u)
        && fdb_lookup(f, trainer_m(1u), 10u) == 3 && fdb_lookup(f, trainer_m(1u), 20u) == 5 && fdb_lookup(f, trainer_m(1u), 30u) == -1;
}
static int trainer_move(void) {
    Fdb *f = trainer_new();
    return fdb_learn(f, trainer_m(1u), 10u, 3u, 100u) && fdb_learn(f, trainer_m(1u), 10u, 9u, 110u)
        && fdb_lookup(f, trainer_m(1u), 10u) == 9 && trainer_used() == 1u;
}
static int trainer_full(void) {
    Fdb *f = trainer_new();
    for (unsigned n = 0; n < FDB_SIZE; n++) if (!fdb_learn(f, trainer_m(n), 1u, (uint16_t)n, 100u)) return 0;
    return !fdb_learn(f, trainer_m(FDB_SIZE), 1u, 1u, 100u) && fdb_lookup(f, trainer_m(FDB_SIZE), 1u) == -1
        && fdb_lookup(f, trainer_m(0u), 1u) == 0 && fdb_learn(f, trainer_m(5u), 1u, 12u, 120u) && fdb_lookup(f, trainer_m(5u), 1u) == 12;
}
static int trainer_age(void) {
    Fdb *f = trainer_new();
    fdb_learn(f, trainer_m(1u), 1u, 1u, 100u);
    fdb_learn(f, trainer_m(2u), 1u, 2u, 250u);
    return fdb_age(f, 300u, 100u) == 1u && fdb_lookup(f, trainer_m(1u), 1u) == -1 && fdb_lookup(f, trainer_m(2u), 1u) == 2;
}
static int trainer_age_boundary(void) {
    Fdb *f = trainer_new();
    fdb_learn(f, trainer_m(1u), 1u, 1u, 100u);
    return fdb_age(f, 200u, 100u) == 0u && fdb_lookup(f, trainer_m(1u), 1u) == 1 && fdb_age(f, 201u, 100u) == 1u;
}
static int trainer_refresh(void) {
    Fdb *f = trainer_new();
    fdb_learn(f, trainer_m(1u), 1u, 1u, 100u);
    fdb_learn(f, trainer_m(1u), 1u, 1u, 280u);
    return fdb_age(f, 300u, 100u) == 0u && fdb_lookup(f, trainer_m(1u), 1u) == 1;
}
static int trainer_wrap(void) {
    Fdb *f = trainer_new();
    fdb_learn(f, trainer_m(1u), 1u, 4u, 0xFFFFFFF0u);
    return fdb_age(f, 0xFFFFFFF8u, 0x30u) == 0u && fdb_age(f, 0x10u, 0x30u) == 0u && fdb_lookup(f, trainer_m(1u), 1u) == 4
        && fdb_age(f, 0x40u, 0x30u) == 1u;
}
static int trainer_reuse(void) {
    Fdb *f = trainer_new();
    for (unsigned n = 0; n < FDB_SIZE; n++) fdb_learn(f, trainer_m(n), 1u, 1u, 100u);
    if (fdb_age(f, 1000u, 100u) != FDB_SIZE) return 0;
    for (unsigned n = 20; n < 20 + FDB_SIZE; n++) if (!fdb_learn(f, trainer_m(n), 1u, 2u, 1000u)) return 0;
    return fdb_lookup(f, trainer_m(20u + FDB_SIZE - 1u), 1u) == 2 && fdb_lookup(f, trainer_m(0u), 1u) == -1;
}
`,
    checks: [
      ['a new table is empty', 'fdb_lookup(trainer_new(), trainer_m(1u), 1u) == -1 && trainer_used() == 0u'],
      ['learn then look up', 'trainer_learn_lookup()'],
      ['same MAC on two VLANs', 'trainer_vlans()'],
      ['a moved station updates its port', 'trainer_move()'],
      ['full table rejects new MACs but still updates', 'trainer_full()'],
      ['old entries age out', 'trainer_age()'],
      ['age exactly max_age is kept', 'trainer_age_boundary()'],
      ['learning again refreshes the entry', 'trainer_refresh()'],
      ['ageing works across counter wrap', 'trainer_wrap()'],
      ['aged-out slots are reused', 'trainer_reuse()'],
    ],
  },

  /* ================================================== Platform and hardware */
  {
    id: 'reg_poll', topic: 'Platform and hardware', title: 'Poll a register with a timeout', summary: 'Never wait forever',
    difficulty: 'Easy', minutes: 10, filename: 'reg_poll.c',
    description: 'Drivers often wait for hardware: a PHY finishing reset, a link coming up, a DMA engine going idle. A loop that waits forever hangs the whole system when the hardware never answers. A bounded poll turns that into an error you can log and recover from. The register is read through a function pointer so the checker can play the hardware.',
    requirements: '<ul><li>Read the register with <code>read_reg(ctx)</code> until <code>(value &amp; mask) == expect</code>, at most <code>max_reads</code> times.</li><li>Return the number of reads it took, or -1 on timeout. Do not read again after the condition is met or after <code>max_reads</code> reads.</li></ul>',
    followups: [
      'If this read a real memory-mapped register directly, why would the pointer need to be <code>volatile</code>?',
      'Why is a timeout in microseconds better than a count of reads? Look at <code>readl_poll_timeout</code> in Linux.',
      'The PHY never comes out of reset in the field. What would you log, and what would you try next?',
    ],
    starter: C`
#include <stdint.h>

/* Reads the current value of a status register. */
typedef uint32_t (*RegRead)(void *ctx);

/* Read until (value & mask) == expect, at most max_reads times.
   Return the number of reads used, or -1 on timeout. */
int wait_for_bits(RegRead read_reg, void *ctx, uint32_t mask, uint32_t expect, unsigned max_reads)
{
    /* TODO */
    (void)read_reg;
    (void)ctx;
    (void)mask;
    (void)expect;
    (void)max_reads;
    return -1;
}
`,
    prelude: C`
/* Simulated register: returns values[0], values[1], ... then repeats the last one. */
typedef struct TrainerReg { const uint32_t *values; unsigned count; unsigned reads; } TrainerReg;
static uint32_t trainer_read(void *ctx) {
    TrainerReg *r = (TrainerReg *)ctx;
    uint32_t v = r->values[r->reads < r->count ? r->reads : r->count - 1u];
    r->reads++;
    return v;
}
static int trainer_wait(const uint32_t *values, unsigned count, uint32_t mask, uint32_t expect, unsigned max, int want, unsigned want_reads) {
    TrainerReg r = {values, count, 0u};
    return wait_for_bits(trainer_read, &r, mask, expect, max) == want && r.reads == want_reads;
}
`,
    checks: [
      ['ready on the first read', 'trainer_wait((const uint32_t[]){0x1u}, 1u, 0x1u, 0x1u, 5u, 1, 1u)'],
      ['ready on the third read', 'trainer_wait((const uint32_t[]){0x0u, 0x0u, 0x1u}, 3u, 0x1u, 0x1u, 5u, 3, 3u)'],
      ['timeout after exactly max_reads reads', 'trainer_wait((const uint32_t[]){0x0u}, 1u, 0x1u, 0x1u, 4u, -1, 4u)'],
      ['waits for a bit to clear', 'trainer_wait((const uint32_t[]){0x80u, 0x80u, 0x00u}, 3u, 0x80u, 0x00u, 10u, 3, 3u)'],
      ['other bits are ignored', 'trainer_wait((const uint32_t[]){0xFFFFFFFEu, 0x00000001u}, 2u, 0x1u, 0x1u, 5u, 2, 2u)'],
      ['a multi-bit field must match exactly', 'trainer_wait((const uint32_t[]){0x10u, 0x30u, 0x20u}, 3u, 0x30u, 0x20u, 5u, 3, 3u)'],
      ['max_reads 0 never reads', 'trainer_wait((const uint32_t[]){0x1u}, 1u, 0x1u, 0x1u, 0u, -1, 0u)'],
    ],
  },
  {
    id: 'sensor_temp', topic: 'Platform and hardware', title: 'Temperature sensor reading', summary: 'Sign extension, fixed point',
    difficulty: 'Medium', minutes: 15, filename: 'sensor_temp.c',
    description: 'Platform software reads board temperature sensors over I2C to drive fans and raise alarms. A TMP102-style sensor returns two bytes: a 12-bit two\'s complement value in bits 15 to 4, where each step is 0.0625 °C. Sign-extend it and convert it to milli-degrees without floating point.',
    requirements: '<ul><li><code>sign_extend</code> treats the low <code>bits</code> bits of <code>value</code> (1 to 32) as a two\'s complement number and returns it as <code>int32_t</code>. Higher bits of <code>value</code> are ignored.</li><li><code>temp_millicelsius</code> builds the 16-bit register from <code>msb</code> and <code>lsb</code>, takes the 12-bit value in bits 15 to 4 (the low 4 bits are unused), and returns <code>steps * 625 / 10</code> using C integer division, which truncates toward zero.</li><li>Careful: <code>bits</code> can be 32, and a shift by 32 is undefined behaviour.</li></ul>',
    followups: [
      'Right-shifting a negative <code>int</code> is implementation-defined. How do you sign-extend portably?',
      'Walk through the I2C transaction that reads this register: addresses, pointer byte, repeated start.',
      'The sensor stops answering (NACK). What should the fan control and alarm logic do?',
    ],
    starter: C`
#include <stdint.h>

/* Sign-extend the low bits bits (1..32) of value. */
int32_t sign_extend(uint32_t value, unsigned bits)
{
    /* TODO */
    (void)value;
    (void)bits;
    return 0;
}

/* Convert the two register bytes to milli-degrees Celsius. */
int32_t temp_millicelsius(uint8_t msb, uint8_t lsb)
{
    /* TODO */
    (void)msb;
    (void)lsb;
    return 0;
}
`,
    prelude: C`
#include <stdio.h>
`,
    checks: [
      ['positive 12-bit value', 'sign_extend(0x7FFu, 12u) == 2047'],
      ['negative 12-bit values', 'sign_extend(0xFFFu, 12u) == -1 && sign_extend(0x800u, 12u) == -2048'],
      ['8-bit -128', 'sign_extend(0x80u, 8u) == -128 && sign_extend(0x7Fu, 8u) == 127'],
      ['bits above the field are ignored', 'sign_extend(0xABCD07FFu, 12u) == 2047 && sign_extend(0x12345FFFu, 12u) == -1'],
      ['1-bit fields', 'sign_extend(1u, 1u) == -1 && sign_extend(0u, 1u) == 0'],
      ['32-bit fields', 'sign_extend(0xFFFFFFFFu, 32u) == -1 && sign_extend(0x7FFFFFFFu, 32u) == INT32_MAX'],
      ['25 degrees', 'temp_millicelsius(0x19u, 0x00u) == 25000'],
      ['0.25 degrees', 'temp_millicelsius(0x00u, 0x40u) == 250'],
      ['maximum 127.9375 degrees', 'temp_millicelsius(0x7Fu, 0xF0u) == 127937'],
      ['-25 and -55 degrees', 'temp_millicelsius(0xE7u, 0x00u) == -25000 && temp_millicelsius(0xC9u, 0x00u) == -55000'],
      ['-0.0625 degrees truncates toward zero', 'temp_millicelsius(0xFFu, 0xF0u) == -62'],
      ['the low 4 bits are ignored', 'temp_millicelsius(0x19u, 0x0Fu) == 25000'],
    ],
  },
  {
    id: 'soft_timer', topic: 'Platform and hardware', title: 'Software timers', summary: 'Many timers from one tick',
    difficulty: 'Hard', minutes: 30, filename: 'soft_timer.c',
    description: 'An MCU has a handful of hardware timers, but the firmware needs dozens of timeouts: LED blink, watchdog kick, modem retry, sensor sampling. The usual answer is one 1 ms tick counter and a table of software timers checked from the main loop. Implement a fixed table of 8 timers with one-shot and repeating modes. The tick is a free-running uint32_t that wraps every 49.7 days, and the timers must keep working across the wrap.',
    requirements: '<ul><li><code>timers_init</code> stops every timer. <code>timer_start</code> takes a free slot and returns its handle (0 to 7), or -1 if none is free, <code>callback</code> is NULL or <code>period_ms</code> is 0. The timer is first due at <code>now + period_ms</code>.</li><li><code>timer_stop</code> stops a running timer and returns true; it returns false for a handle that is out of range or not running.</li><li><code>timers_poll(now)</code> calls the callback of every due timer, passing its <code>ctx</code>, at most once per timer per call. A one-shot timer then frees its slot. A repeating timer\'s next deadline is its previous deadline plus the period, not <code>now</code> plus the period, so a late poll does not make it drift.</li><li>Times wrap: compare elapsed times (<code>now - start</code>), never absolute deadlines. Update a timer\'s slot before calling its callback, so the callback may start or stop timers, including its own.</li></ul>',
    followups: [
      'Would you call <code>timers_poll</code> from the 1 ms tick interrupt or from the main loop? What does each choice mean for what callbacks may do, and what must be protected?',
      'A callback stops a different timer, or starts a new one, while <code>timers_poll</code> is walking the table. What can go wrong, and how does this design avoid it?',
      'With 500 timers, scanning the table every tick is too slow. How do a sorted delta list or a hierarchical timer wheel (as in the Linux kernel) help?',
    ],
    starter: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define MAX_TIMERS 8

typedef void (*TimerCallback)(void *ctx);

typedef struct SoftTimer {
    bool active;
    bool repeat;
    uint32_t start;          /* tick at which the current period began */
    uint32_t period;         /* in ms (ticks) */
    TimerCallback callback;
    void *ctx;
} SoftTimer;

static SoftTimer timers[MAX_TIMERS];

/* Stop every timer. */
void timers_init(void)
{
    /* TODO */
    (void)timers;
}

/* Start a timer due period_ms after now. Return its handle 0..MAX_TIMERS-1,
   or -1 if no slot is free, callback is NULL or period_ms is 0. */
int timer_start(uint32_t now, uint32_t period_ms, bool repeat, TimerCallback callback, void *ctx)
{
    /* TODO */
    (void)now;
    (void)period_ms;
    (void)repeat;
    (void)callback;
    (void)ctx;
    return -1;
}

/* Stop a running timer. Return false for a bad handle or a stopped timer. */
bool timer_stop(int handle)
{
    /* TODO */
    (void)handle;
    return false;
}

/* Call the callback of every timer that is due at tick now. */
void timers_poll(uint32_t now)
{
    /* TODO */
    (void)now;
}
`,
    prelude: C`
static void trainer_count(void *ctx) { (*(int *)ctx)++; }

static int trainer_one_shot(void) {
    int n = 0;
    timers_init();
    int h = timer_start(100u, 50u, false, trainer_count, &n);
    if (h < 0 || h >= MAX_TIMERS) return 0;
    timers_poll(100u); timers_poll(120u); timers_poll(149u);
    if (n != 0) return 0;
    timers_poll(150u);
    if (n != 1) return 0;
    timers_poll(151u); timers_poll(200u); timers_poll(1000u);
    return n == 1;
}
static int trainer_one_shot_frees(void) {
    int n = 0, other = 0;
    timers_init();
    int h = timer_start(0u, 10u, false, trainer_count, &n);
    timers_poll(10u);
    if (n != 1 || timer_stop(h)) return 0;
    for (int i = 0; i < MAX_TIMERS; i++) {
        if (timer_start(10u, 100u, true, trainer_count, &other) < 0) return 0;
    }
    return 1;
}
static int trainer_repeat(void) {
    int n = 0;
    timers_init();
    if (timer_start(0u, 10u, true, trainer_count, &n) < 0) return 0;
    for (uint32_t t = 1u; t <= 100u; t++) {
        timers_poll(t);
        if (n != (int)(t / 10u)) return 0;
    }
    return 1;
}
static int trainer_no_drift(void) {
    int n = 0;
    timers_init();
    if (timer_start(0u, 10u, true, trainer_count, &n) < 0) return 0;
    timers_poll(13u); if (n != 1) return 0;   /* 3 ms late */
    timers_poll(19u); if (n != 1) return 0;
    timers_poll(20u); if (n != 2) return 0;   /* still on the 10 ms grid */
    timers_poll(29u); if (n != 2) return 0;
    timers_poll(30u); if (n != 3) return 0;
    timers_poll(55u); if (n != 4) return 0;   /* missed 40 and 50: once per poll */
    timers_poll(56u); if (n != 5) return 0;   /* catches up on 50 */
    timers_poll(59u); if (n != 5) return 0;
    timers_poll(60u); return n == 6;
}
static int trainer_stop(void) {
    int n = 0, r = 0;
    timers_init();
    int h = timer_start(0u, 10u, false, trainer_count, &n);
    if (h < 0 || !timer_stop(h)) return 0;
    timers_poll(10u); timers_poll(50u);
    if (n != 0 || timer_stop(h)) return 0;
    int hr = timer_start(50u, 10u, true, trainer_count, &r);
    timers_poll(60u);
    if (r != 1 || !timer_stop(hr)) return 0;
    timers_poll(70u); timers_poll(80u);
    return r == 1;
}
static int trainer_bad_handles(void) {
    timers_init();
    return !timer_stop(-1) && !timer_stop(MAX_TIMERS) && !timer_stop(1000) && !timer_stop(INT32_MIN) && !timer_stop(3);
}
static int trainer_all_slots(void) {
    int n = 0;
    unsigned seen = 0u;
    timers_init();
    for (int i = 0; i < MAX_TIMERS; i++) {
        int h = timer_start(0u, 100u, false, trainer_count, &n);
        if (h < 0 || h >= MAX_TIMERS || (seen & (1u << h))) return 0;
        seen |= 1u << h;
    }
    if (timer_start(0u, 100u, false, trainer_count, &n) != -1) return 0;
    timers_init();
    timers_poll(1000u);
    if (n != 0) return 0;
    for (int i = 0; i < MAX_TIMERS; i++) {
        if (timer_start(1000u, 100u, false, trainer_count, &n) < 0) return 0;
    }
    return 1;
}
static int trainer_reuse(void) {
    int n = 0, h[MAX_TIMERS];
    timers_init();
    for (int i = 0; i < MAX_TIMERS; i++) h[i] = timer_start(0u, 100u, true, trainer_count, &n);
    if (!timer_stop(h[5])) return 0;
    int again = timer_start(0u, 100u, true, trainer_count, &n);
    if (again < 0 || again >= MAX_TIMERS) return 0;
    return timer_start(0u, 100u, true, trainer_count, &n) == -1;
}
static int trainer_bad_args(void) {
    int n = 0;
    timers_init();
    return timer_start(0u, 10u, false, NULL, &n) == -1 && timer_start(0u, 0u, true, trainer_count, &n) == -1;
}
static int trainer_wrap_one_shot(void) {
    int n = 0;
    timers_init();
    if (timer_start(0xFFFFFFF0u, 0x20u, false, trainer_count, &n) < 0) return 0;
    timers_poll(0xFFFFFFF8u); timers_poll(0xFFFFFFFFu); timers_poll(0u); timers_poll(0x0Fu);
    if (n != 0) return 0;
    timers_poll(0x10u);
    return n == 1;
}
static int trainer_wrap_repeat(void) {
    int n = 0;
    uint32_t start = 0xFFFFFFF6u;
    timers_init();
    if (timer_start(start, 5u, true, trainer_count, &n) < 0) return 0;
    for (uint32_t k = 1u; k <= 30u; k++) {
        timers_poll(start + k);
        if (n != (int)(k / 5u)) return 0;
    }
    return 1;
}
static int trainer_independent(void) {
    int a = 0, b = 0, c = 0;
    timers_init();
    if (timer_start(0u, 3u, true, trainer_count, &a) < 0) return 0;
    if (timer_start(0u, 7u, true, trainer_count, &b) < 0) return 0;
    if (timer_start(0u, 5u, false, trainer_count, &c) < 0) return 0;
    for (uint32_t t = 1u; t <= 21u; t++) timers_poll(t);
    return a == 7 && b == 3 && c == 1;
}
/* A repeating timer whose callback stops it on the second call. */
typedef struct TrainerSelf { int handle; int count; } TrainerSelf;
static void trainer_stop_self(void *ctx) {
    TrainerSelf *s = (TrainerSelf *)ctx;
    if (++s->count == 2) (void)timer_stop(s->handle);
}
static int trainer_callback_stops(void) {
    TrainerSelf s = {-1, 0};
    timers_init();
    s.handle = timer_start(0u, 10u, true, trainer_stop_self, &s);
    if (s.handle < 0) return 0;
    for (uint32_t t = 1u; t <= 100u; t++) timers_poll(t);
    return s.count == 2;
}
/* A one-shot that restarts itself from its callback while every other slot is busy. */
static uint32_t trainer_now;
typedef struct TrainerRestart { int count; int failed; } TrainerRestart;
static void trainer_restart(void *ctx) {
    TrainerRestart *r = (TrainerRestart *)ctx;
    if (++r->count < 3 && timer_start(trainer_now, 10u, false, trainer_restart, r) < 0) r->failed = 1;
}
static int trainer_callback_restarts(void) {
    int busy = 0;
    TrainerRestart r = {0, 0};
    timers_init();
    for (int i = 0; i < MAX_TIMERS - 1; i++) {
        if (timer_start(0u, 1000u, true, trainer_count, &busy) < 0) return 0;
    }
    if (timer_start(0u, 10u, false, trainer_restart, &r) < 0) return 0;
    for (trainer_now = 1u; trainer_now <= 100u; trainer_now++) timers_poll(trainer_now);
    return r.count == 3 && !r.failed;
}
`,
    checks: [
      ['a one-shot fires once, at its deadline and not before', 'trainer_one_shot()'],
      ['a fired one-shot frees its slot', 'trainer_one_shot_frees()'],
      ['a repeating timer fires every period', 'trainer_repeat()'],
      ['a late poll does not make a repeating timer drift', 'trainer_no_drift()'],
      ['timer_stop prevents firing', 'trainer_stop()'],
      ['timer_stop rejects bad and idle handles', 'trainer_bad_handles()'],
      ['eight timers, then -1; timers_init frees them all', 'trainer_all_slots()'],
      ['a stopped slot is reused', 'trainer_reuse()'],
      ['timer_start rejects a NULL callback or zero period', 'trainer_bad_args()'],
      ['a one-shot works across the tick wrap', 'trainer_wrap_one_shot()'],
      ['a repeating timer works across the tick wrap', 'trainer_wrap_repeat()'],
      ['timers run independently with their own ctx', 'trainer_independent()'],
      ['a callback can stop its own repeating timer', 'trainer_callback_stops()'],
      ['a one-shot callback can restart itself when the table is full', 'trainer_callback_restarts()'],
    ],
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
  {
    id: 'fan_control', topic: 'State machines', title: 'Fan control with hysteresis', summary: 'Thresholds that do not flap',
    difficulty: 'Medium', minutes: 20, filename: 'fan_control.c',
    description: 'A switch chassis speeds its fans up as it gets hot. With a single threshold, a temperature sitting right on it makes the fan flap on and off every reading. Hysteresis fixes that: each level turns on at one temperature and only turns off a few degrees lower. Readings are in milli-degrees Celsius.',
    requirements: '<ul><li>Start at <code>FAN_OFF</code>. Go to <code>FAN_LOW</code> at 50 °C (50000) or more, and to <code>FAN_HIGH</code> at 70 °C or more.</li><li><code>FAN_HIGH</code> stays on until the temperature is below 65 °C. <code>FAN_LOW</code> (including when falling from HIGH) stays on until it is below 45 °C.</li><li>Levels can jump: OFF straight to HIGH, or HIGH straight to OFF.</li><li><code>TEMP_INVALID</code> means the sensor could not be read: fail safe to <code>FAN_HIGH</code>. The next valid reading applies the normal rules starting from HIGH.</li></ul>',
    followups: [
      'What happens without hysteresis when the temperature hovers at exactly 50 °C?',
      'One failed read versus a dead sensor: how would you tell them apart and raise an alarm?',
      'There are six sensors on the board. Which one should drive the fans?',
    ],
    starter: C`
#include <stdint.h>

#define TEMP_INVALID INT32_MIN   /* the sensor could not be read */

typedef enum { FAN_OFF, FAN_LOW, FAN_HIGH } FanLevel;

typedef struct FanCtl {
    FanLevel level;
} FanCtl;

/* Start with the fan off. */
void fan_init(FanCtl *f)
{
    /* TODO */
    (void)f;
}

/* Take one reading in milli-degrees C and return the new fan level. */
FanLevel fan_update(FanCtl *f, int32_t temp_mc)
{
    /* TODO */
    (void)f;
    (void)temp_mc;
    return FAN_OFF;
}
`,
    prelude: C`
/* Feed readings and compare each level with want: O = off, L = low, H = high. */
static int trainer_run(const int32_t *temps, const char *want) {
    static const char names[] = "OLH";
    FanCtl f;
    fan_init(&f);
    for (size_t i = 0; want[i]; i++) {
        FanLevel level = fan_update(&f, temps[i]);
        if ((unsigned)level > 2u || names[level] != want[i]) return 0;
    }
    return 1;
}
`,
    checks: [
      ['stays off when cool', 'trainer_run((const int32_t[]){25000, 40000, 49999}, "OOO")'],
      ['turns on LOW at 50 C', 'trainer_run((const int32_t[]){49999, 50000}, "OL")'],
      ['LOW holds down to 45 C', 'trainer_run((const int32_t[]){50000, 48000, 45000, 44999}, "LLLO")'],
      ['goes straight to HIGH at 70 C', 'trainer_run((const int32_t[]){20000, 70000}, "OH")'],
      ['HIGH holds down to 65 C', 'trainer_run((const int32_t[]){70000, 66000, 65000, 64999}, "HHHL")'],
      ['HIGH falls to LOW, then OFF', 'trainer_run((const int32_t[]){72000, 60000, 46000, 44000}, "HLLO")'],
      ['HIGH drops straight to OFF', 'trainer_run((const int32_t[]){75000, 30000}, "HO")'],
      ['LOW rises to HIGH', 'trainer_run((const int32_t[]){55000, 69999, 70000}, "LLH")'],
      ['sensor failure forces HIGH', 'trainer_run((const int32_t[]){30000, TEMP_INVALID, TEMP_INVALID}, "OHH")'],
      ['recovers after a failure', 'trainer_run((const int32_t[]){TEMP_INVALID, 66000, 40000}, "HHO")'],
      ['very cold readings stay off', 'trainer_run((const int32_t[]){-40000, -1}, "OO")'],
    ],
  },
];
