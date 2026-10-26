/* ---------------------------------------------------------------------------
 * Hints and model solutions, one entry per problem in problems.js, keyed by id.
 *
 *   hints      graded, most general first; trusted HTML
 *   solution   a complete file that passes every check for the problem
 *   explain    why the solution works and the trap it avoids; trusted HTML
 *
 * Run `pnpm verify` after changing a problem or a solution: it compiles each
 * solution with the real checker and fails if one no longer passes.
 * ------------------------------------------------------------------------- */

/* Template tag for C sources, as in problems.js. */
const C = (strings, ...values) => String.raw(strings, ...values).replace(/^\n/, '');

export const HINTS = {
  bit_ops: {
    hints: [
      'Each helper combines <code>value</code> with a mask that has only the chosen bit set. Which bitwise operator sets, clears, flips or tests a bit?',
      'Build the mask with <code>1u &lt;&lt; position</code>. Use OR to set, AND with the inverted mask to clear, XOR to toggle, and AND to test.',
      'Clear is <code>value &amp; ~(1u &lt;&lt; position)</code>. Write <code>1u</code>, not <code>1</code>: <code>1 &lt;&lt; 31</code> shifts into the sign bit of a signed int, which is undefined behaviour.',
    ],
    explain: 'Every operation is one mask, <code>1u &lt;&lt; position</code>, combined with <code>|</code>, <code>&amp; ~</code>, <code>^</code> or <code>&amp;</code>. The unsigned <code>1u</code> is the point: a signed <code>1 &lt;&lt; 31</code> overflows into the sign bit. <code>test_bit</code> shifts the value down so it returns exactly 0 or 1, rather than a mask like <code>0x80000000u</code> that does not fit in an <code>int</code>.',
    solution: C`
#include <limits.h>
#include <stdio.h>

/* Return value with bit position set to 1. */
unsigned int set_bit(unsigned int value, unsigned int position)
{
    return value | (1u << position);
}

/* Return value with bit position cleared to 0. */
unsigned int clear_bit(unsigned int value, unsigned int position)
{
    return value & ~(1u << position);
}

/* Return value with bit position inverted. */
unsigned int toggle_bit(unsigned int value, unsigned int position)
{
    return value ^ (1u << position);
}

/* Return nonzero when the selected bit is set, otherwise return 0. */
int test_bit(unsigned int value, unsigned int position)
{
    return (int)((value >> position) & 1u);
}

int main(void)
{
    unsigned int value = 0u;
    value = set_bit(value, 3u);
    printf("bit 3 set: %s\n", test_bit(value, 3u) ? "yes" : "no");
    return 0;
}
`,
  },
  count_bits: {
    hints: [
      'You can check all 32 bits one by one, but there is a trick that removes one set bit per step. Think about what subtracting 1 does to the lowest set bit.',
      '<code>x &amp; (x - 1)</code> clears the lowest set bit. Loop until <code>x</code> is 0 and count the iterations. A power of two has exactly one set bit, so clearing it leaves 0.',
      'Loop shape: <code>while (x) { x &amp;= x - 1; count++; }</code>. For powers of two return <code>x != 0 &amp;&amp; (x &amp; (x - 1)) == 0</code>; leaving out the <code>x != 0</code> test makes 0 count as a power of two.',
    ],
    explain: 'Subtracting 1 flips the lowest set bit and every zero below it, so <code>x &amp; (x - 1)</code> removes exactly that bit and the loop runs once per set bit instead of 32 times (Kernighan\'s method). The trap is 0: it has no bits set, so <code>is_power_of_two</code> must reject it explicitly.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Return the number of bits in x that are 1. */
unsigned count_set_bits(uint32_t x)
{
    unsigned count = 0u;
    while (x != 0u) {
        x &= x - 1u;    /* clear the lowest set bit */
        count++;
    }
    return count;
}

/* Return true when x is a power of two (exactly one bit set). */
bool is_power_of_two(uint32_t x)
{
    return x != 0u && (x & (x - 1u)) == 0u;
}
`,
  },
  bit_field: {
    hints: [
      'Both helpers need the same mask: <code>width</code> ones, shifted up to <code>pos</code>. The hard part is building that mask when <code>width</code> is 32.',
      'Build a low mask of <code>width</code> ones. Get: shift <code>reg</code> right by <code>pos</code> and AND with the mask. Set: clear the field in <code>reg</code>, then OR in the new value shifted to <code>pos</code> and masked.',
      'Mask: <code>width &gt;= 32u ? 0xFFFFFFFFu : (1u &lt;&lt; width) - 1u</code>. Writing <code>(1u &lt;&lt; 32) - 1</code> is undefined behaviour, and on ARM it often gives 0 instead of all ones.',
    ],
    explain: 'Setting a field is a read-modify-write: clear it with <code>reg &amp; ~mask</code>, then OR in the new value masked to the field, so neighbouring bits and any oversized <code>value</code> bits are left alone. The probe is width 32: shifting a 32-bit value by 32 is undefined, so the full-width mask is special-cased instead of computed as <code>(1u &lt;&lt; 32) - 1</code>.',
    solution: C`
#include <stdint.h>

/* A mask with the low width bits set, valid for width 1..32. */
static uint32_t low_mask(unsigned width)
{
    return width >= 32u ? UINT32_MAX : (UINT32_C(1) << width) - 1u;
}

/* Return the width-bit field of reg that starts at bit pos. */
uint32_t field_get(uint32_t reg, unsigned pos, unsigned width)
{
    return (reg >> pos) & low_mask(width);
}

/* Return reg with the width-bit field at pos replaced by value. */
uint32_t field_set(uint32_t reg, unsigned pos, unsigned width, uint32_t value)
{
    uint32_t mask = low_mask(width) << pos;
    return (reg & ~mask) | ((value << pos) & mask);
}
`,
  },
  reverse_bits: {
    hints: [
      'For the bit reversal, take bits off one end of <code>x</code> and push them onto the other end of the result. Byte swapping is the same idea with 8-bit chunks.',
      'Loop 32 times: shift the result left, OR in the lowest bit of <code>x</code>, then shift <code>x</code> right. For the byte swap, move each byte to its mirrored position with a shift and a mask.',
      'Loop body: <code>r = (r &lt;&lt; 1) | (x &amp; 1u); x &gt;&gt;= 1;</code>. Byte swap: <code>(x &lt;&lt; 24) | ((x &lt;&lt; 8) &amp; 0x00FF0000u) | ((x &gt;&gt; 8) &amp; 0x0000FF00u) | (x &gt;&gt; 24)</code>. Keep everything unsigned so right shifts fill with zeros.',
    ],
    explain: 'The loop moves the lowest bit of <code>x</code> into the result 32 times, so bit 0 ends up as bit 31; the byte swap moves each byte with a shift and masks off what does not belong. Everything stays <code>uint32_t</code>: with a signed type, right shifts can copy the sign bit and left shifts into it are undefined.',
    solution: C`
#include <stdint.h>

/* Return x with its bit order reversed (bit 0 <-> bit 31). */
uint32_t reverse_bits(uint32_t x)
{
    uint32_t r = 0u;
    for (unsigned i = 0u; i < 32u; i++) {
        r = (r << 1) | (x & 1u);
        x >>= 1;
    }
    return r;
}

/* Return x with its byte order reversed (0x12345678 -> 0x78563412). */
uint32_t swap_bytes32(uint32_t x)
{
    return (x << 24)
         | ((x << 8) & 0x00FF0000u)
         | ((x >> 8) & 0x0000FF00u)
         | (x >> 24);
}
`,
  },
  bcd: {
    hints: [
      'In packed BCD each nibble holds one decimal digit: the tens digit goes in the high nibble and the units digit in the low nibble. Which two operators split a number into tens and units?',
      'To encode, put <code>value / 10</code> in the high nibble and <code>value % 10</code> in the low one. To decode, take the high nibble times 10 plus the low nibble. Validity is just "each nibble is at most 9".',
      'Encode: <code>(uint8_t)(((value / 10u) &lt;&lt; 4) | (value % 10u))</code>. Decode: <code>(bcd &gt;&gt; 4) * 10u + (bcd &amp; 0x0Fu)</code>. A common slip is <code>bcd &gt;&gt; 4 * 10</code>: <code>*</code> binds tighter than <code>&gt;&gt;</code>, so it shifts by 40.',
    ],
    explain: 'Each nibble is one decimal digit, so encoding is divide and modulo by 10 and decoding is <code>high * 10 + low</code>. <code>bcd_is_valid</code> checks both nibbles separately: a byte such as <code>0x5A</code> is a legal binary value but not a legal BCD one, and decoding it blindly would give 60 instead of an error.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Convert value (0..99) to packed BCD: 45 -> 0x45. */
uint8_t bin_to_bcd(uint8_t value)
{
    return (uint8_t)(((value / 10u) << 4) | (value % 10u));
}

/* Convert packed BCD to binary: 0x45 -> 45. */
uint8_t bcd_to_bin(uint8_t bcd)
{
    return (uint8_t)((bcd >> 4) * 10u + (bcd & 0x0Fu));
}

/* Return true when both nibbles of bcd are decimal digits (0..9). */
bool bcd_is_valid(uint8_t bcd)
{
    return (bcd >> 4) <= 9u && (bcd & 0x0Fu) <= 9u;
}
`,
  },
  highest_bit: {
    hints: [
      'For the highest set bit, a simple version shifts <code>x</code> right until it is 0 and counts the shifts. For the power of two, once you know the highest bit you know which power to try.',
      'A faster <code>highest_set_bit</code> is a binary search: if the top 16 bits are non-zero, add 16 and shift right by 16; then do the same for 8, 4, 2 and 1. For <code>next_power_of_two</code>, decrement, copy the top bit into every lower bit, then add 1.',
      'Smearing: <code>x--; x |= x &gt;&gt; 1; x |= x &gt;&gt; 2; x |= x &gt;&gt; 4; x |= x &gt;&gt; 8; x |= x &gt;&gt; 16; return x + 1u;</code>. Handle 0 first: <code>0 - 1</code> wraps to all ones and the result would be 0, not 1. Do not compute <code>1u &lt;&lt; (highest + 1)</code> for 32: shifting by 32 is undefined.',
    ],
    explain: 'The binary search halves the window five times (16, 8, 4, 2, 1), so it always takes exactly five steps. Smearing turns <code>x - 1</code> into a run of ones below its top bit, and adding 1 carries into the next power of two; the decrement is what keeps an exact power unchanged. Unsigned wraparound makes values above <code>0x80000000</code> come out as 0 with no undefined shift, and 0 is special-cased because <code>0 - 1</code> would wrap the same way.',
    solution: C`
#include <stdint.h>

/* Return the index (0..31) of the most significant 1 bit in x, or -1 for 0. */
int highest_set_bit(uint32_t x)
{
    if (x == 0u) {
        return -1;
    }
    int n = 0;
    if (x >= UINT32_C(1) << 16) { n += 16; x >>= 16; }
    if (x >= UINT32_C(1) << 8)  { n += 8;  x >>= 8; }
    if (x >= UINT32_C(1) << 4)  { n += 4;  x >>= 4; }
    if (x >= UINT32_C(1) << 2)  { n += 2;  x >>= 2; }
    if (x >= UINT32_C(1) << 1)  { n += 1; }
    return n;
}

/* Return the smallest power of two >= x. Returns 1 for 0, and 0 when x is
   above 0x80000000 (the result would not fit in 32 bits). */
uint32_t next_power_of_two(uint32_t x)
{
    if (x == 0u) {
        return 1u;
    }
    x--;                /* so an exact power of two maps to itself */
    x |= x >> 1;
    x |= x >> 2;
    x |= x >> 4;
    x |= x >> 8;
    x |= x >> 16;
    return x + 1u;      /* wraps to 0 when x was above 0x80000000 */
}
`,
  },
  bitmap_alloc: {
    hints: [
      'Turn a block number into a word index and a bit mask: <code>block / 32</code> picks the word, <code>block % 32</code> picks the bit. Allocating is "find the first 0 bit, set it"; freeing is "check the bit is 1, clear it".',
      'In <code>bm_alloc</code>, skip any word equal to <code>0xFFFFFFFF</code> (all used), then scan its bits from 0 upward. In <code>bm_free</code>, check the range before you index the array, then reject the call if the bit is already 0.',
      'Build masks with <code>UINT32_C(1) &lt;&lt; bit</code>, never <code>1 &lt;&lt; bit</code>: for bit 31 the signed shift overflows, which is undefined behaviour. The range check is <code>block &lt; 0 || block &gt;= BM_BLOCKS</code>; forgetting the negative case lets <code>bm_free(bm, -1)</code> write outside the array.',
    ],
    explain: 'Each block maps to one bit, so alloc is a scan for the lowest 0 bit (whole full words are skipped in one compare) and free is a test-and-clear. Testing the bit before clearing it is what turns a silent double free into an error, and range-checking first keeps a bad index from reaching the array. Using unsigned masks matters at block 31, where <code>1 &lt;&lt; 31</code> on an <code>int</code> is undefined.',
    solution: C`
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
    for (int w = 0; w < BM_BLOCKS / BM_WORD_BITS; w++) {
        bm->words[w] = 0u;
    }
}

/* Mark the lowest free block used and return its index, or -1 when full. */
int bm_alloc(Bitmap *bm)
{
    for (int w = 0; w < BM_BLOCKS / BM_WORD_BITS; w++) {
        if (bm->words[w] == UINT32_MAX) {
            continue;   /* every block in this word is used */
        }
        for (int b = 0; b < BM_WORD_BITS; b++) {
            uint32_t mask = UINT32_C(1) << b;
            if ((bm->words[w] & mask) == 0u) {
                bm->words[w] |= mask;
                return w * BM_WORD_BITS + b;
            }
        }
    }
    return -1;
}

/* Free a block. Return false if block is out of range or already free. */
bool bm_free(Bitmap *bm, int block)
{
    if (block < 0 || block >= BM_BLOCKS) {
        return false;
    }
    uint32_t *word = &bm->words[block / BM_WORD_BITS];
    uint32_t mask = UINT32_C(1) << (block % BM_WORD_BITS);
    if ((*word & mask) == 0u) {
        return false;   /* double free, or never allocated */
    }
    *word &= ~mask;
    return true;
}

/* Return the number of used blocks. */
int bm_count_used(const Bitmap *bm)
{
    int count = 0;
    for (int w = 0; w < BM_BLOCKS / BM_WORD_BITS; w++) {
        for (uint32_t x = bm->words[w]; x != 0u; x &= x - 1u) {
            count++;
        }
    }
    return count;
}
`,
  },
  align: {
    hints: [
      'With a power-of-two <code>align</code>, the low bits of an aligned address are all zero. Which mask covers those low bits?',
      '<code>align - 1</code> has ones in exactly the low bits. To round up, add <code>align - 1</code>, then clear those bits. An address is aligned when those bits are already zero.',
      'Round up with <code>(x + align - 1) &amp; ~(align - 1)</code> and test with <code>(x &amp; (align - 1)) == 0</code>. This only works when <code>align</code> is a power of two.',
    ],
    explain: 'For a power of two, <code>align - 1</code> is a mask of the low bits that must be zero. Adding it pushes any non-aligned value past the next boundary, and <code>&amp; ~(align - 1)</code> drops it back onto that boundary, while a value that is already aligned stays put. The trick fails for non-powers of two such as 12, because <code>align - 1</code> is then not a contiguous mask.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Round x up to the next multiple of align (a power of two). */
uintptr_t align_up(uintptr_t x, uintptr_t align)
{
    return (x + align - 1u) & ~(align - 1u);
}

/* Return true when x is a multiple of align (a power of two). */
bool is_aligned(uintptr_t x, uintptr_t align)
{
    return (x & (align - 1u)) == 0u;
}
`,
  },
  my_memmove: {
    hints: [
      'Copying front to back is fine unless <code>dst</code> starts inside the source. What happens to source bytes you have not read yet?',
      'If <code>dst</code> is below <code>src</code>, copy forward; otherwise copy backward from the last byte. Work through <code>unsigned char</code> pointers, since <code>void *</code> cannot be indexed.',
      'Backward loop: <code>while (n--) d[n] = s[n];</code>. Comparing <code>(uintptr_t)d &lt; (uintptr_t)s</code> avoids the undefined <code>&lt;</code> between pointers to different objects.',
    ],
    explain: 'When <code>dst</code> is after <code>src</code> and the regions overlap, a forward copy overwrites source bytes before it reads them, so the copy runs from the end instead; when <code>dst</code> is before <code>src</code>, forward is safe. That direction check is what memcpy skips, which is why memcpy can be faster but is undefined on overlapping buffers.',
    solution: C`
#include <stddef.h>
#include <stdint.h>

/* Copy n bytes from src to dst, correctly even if they overlap. Return dst. */
void *my_memmove(void *dst, const void *src, size_t n)
{
    unsigned char *d = dst;
    const unsigned char *s = src;

    if (d == s || n == 0u) {
        return dst;
    }
    /* Relational < between unrelated pointers is undefined, so compare as integers. */
    if ((uintptr_t)d < (uintptr_t)s) {
        for (size_t i = 0u; i < n; i++) {
            d[i] = s[i];
        }
    } else {
        while (n-- > 0u) {
            d[n] = s[n];
        }
    }
    return dst;
}
`,
  },
  mem_pool: {
    hints: [
      'A free block is not being used for anything else, so its own first bytes can hold the pointer to the next free block. The pool only has to remember the head of that list.',
      'In <code>pool_init</code>, walk the buffer in <code>block_size</code> steps and push each block onto the free list. <code>pool_alloc</code> pops the head and <code>pool_free</code> pushes onto it, both O(1).',
      'Treat a block as <code>void **</code>: push is <code>*(void **)block = pool-&gt;free_list; pool-&gt;free_list = block;</code>. Check the arguments before you touch the buffer, and do the pointer arithmetic on <code>unsigned char *</code>, not <code>void *</code>.',
    ],
    explain: 'The free list lives inside the free blocks themselves (each one stores the next pointer in its first bytes), so the pool needs no extra memory and alloc and free are a single pop or push, O(1) with no fragmentation. The interviewer usually probes why <code>block_size</code> must be at least <code>sizeof(void *)</code> and pointer-aligned, and what happens on a double free: the block is pushed twice and handed out to two owners.',
    solution: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

typedef struct Pool {
    void *free_list;    /* first free block, or NULL */
    size_t block_size;
} Pool;

bool pool_init(Pool *pool, void *buffer, size_t block_size, size_t block_count)
{
    if (pool == NULL || buffer == NULL || block_size < sizeof(void *) || block_count == 0u) {
        return false;
    }
    unsigned char *base = buffer;
    pool->block_size = block_size;
    pool->free_list = NULL;
    /* Push from the last block down, so the list hands out blocks in address order. */
    for (size_t i = block_count; i-- > 0u;) {
        void *block = base + i * block_size;
        *(void **)block = pool->free_list;
        pool->free_list = block;
    }
    return true;
}

void *pool_alloc(Pool *pool)
{
    void *block = pool->free_list;
    if (block != NULL) {
        pool->free_list = *(void **)block;
    }
    return block;
}

void pool_free(Pool *pool, void *block)
{
    if (block == NULL) {
        return;
    }
    *(void **)block = pool->free_list;
    pool->free_list = block;
}
`,
  },
  aligned_alloc: {
    hints: [
      'malloc cannot give you the alignment, so ask it for more bytes than you need and pick an aligned address inside that block. Then ask yourself: what does <code>aligned_free</code> need in order to call <code>free</code>?',
      'Allocate <code>size + alignment - 1 + sizeof(void *)</code> bytes. Skip <code>sizeof(void *)</code> bytes from the start, round that address up to <code>alignment</code>, and store the malloc pointer in the slot just before the returned address. <code>aligned_free</code> reads that slot and frees it.',
      'Round up with <code>(addr + alignment - 1) &amp; ~(uintptr_t)(alignment - 1)</code> on a <code>uintptr_t</code>, and store with <code>((void **)aligned)[-1] = raw;</code>. Pitfall: <code>size + overhead</code> can wrap around to a tiny number, so check <code>size &gt; SIZE_MAX - overhead</code> first. Skipping the pointer slot <em>before</em> rounding keeps that slot pointer-aligned even for alignment 1 or 2.',
    ],
    explain: 'Over-allocating by <code>alignment - 1</code> guarantees an aligned address fits inside the block, and the extra <code>sizeof(void *)</code> leaves room to store the original malloc pointer just below it, which is all <code>aligned_free</code> needs. Because malloc\'s result is pointer-aligned and the slot is skipped before rounding, the stored pointer is itself aligned for any power-of-two alignment, and the overflow check stops a huge <code>size</code> from wrapping into a tiny allocation that the caller would then overrun.',
    solution: C`
#include <stddef.h>
#include <stdint.h>
#include <stdlib.h>

/* Return size bytes aligned to alignment (a power of two), or NULL. */
void *aligned_malloc(size_t size, size_t alignment)
{
    if (alignment == 0u || (alignment & (alignment - 1u)) != 0u) {
        return NULL;
    }
    size_t overhead = alignment - 1u + sizeof(void *);
    if (size > SIZE_MAX - overhead) {
        return NULL;
    }
    void *raw = malloc(size + overhead);
    if (raw == NULL) {
        return NULL;
    }
    uintptr_t addr = (uintptr_t)raw + sizeof(void *);
    addr = (addr + alignment - 1u) & ~(uintptr_t)(alignment - 1u);
    void **block = (void **)addr;
    block[-1] = raw;                    /* remember what malloc returned */
    return block;
}

/* Free a block returned by aligned_malloc. NULL is allowed. */
void aligned_free(void *p)
{
    if (p != NULL) {
        free(((void **)p)[-1]);
    }
}
`,
  },
  list_reverse: {
    hints: [
      'Walk the list once and turn each <code>next</code> pointer around. Before you overwrite a node\'s <code>next</code>, what do you need to save?',
      'Keep three pointers: <code>prev</code> (the already-reversed part, starting at <code>NULL</code>), <code>cur</code>, and <code>next</code>. Each step points <code>cur</code> back at <code>prev</code> and moves both forward.',
      'Loop body: <code>next = cur-&gt;next; cur-&gt;next = prev; prev = cur; cur = next;</code>, and return <code>prev</code>. Saving <code>cur-&gt;next</code> first is the step people forget, which loses the rest of the list.',
    ],
    explain: 'Each step saves <code>cur-&gt;next</code>, points <code>cur</code> back at <code>prev</code>, and advances, so after one pass every link is reversed and <code>prev</code> is the old tail. It uses O(1) memory and no recursion, and it handles the empty and one-node lists without special cases; the old head ends up with <code>next == NULL</code>, terminating the new list.',
    solution: C`
#include <stddef.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

/* Return the number of nodes in the list. */
size_t list_length(const Node *head)
{
    size_t n = 0u;
    for (; head != NULL; head = head->next) {
        n++;
    }
    return n;
}

/* Reverse the list in place and return the new head. */
Node *list_reverse(Node *head)
{
    Node *prev = NULL;
    Node *cur = head;
    while (cur != NULL) {
        Node *next = cur->next;
        cur->next = prev;
        prev = cur;
        cur = next;
    }
    return prev;
}
`,
  },
  list_cycle: {
    hints: [
      'Two runners on a circular track, one twice as fast as the other, must meet eventually. On a straight track the fast one reaches the end first.',
      'Move <code>slow</code> one node and <code>fast</code> two nodes per step. If they ever point to the same node there is a loop; if <code>fast</code> reaches <code>NULL</code> there is not. When <code>fast</code> runs off the end of a loop-free list, <code>slow</code> is at the middle.',
      'Loop shape: <code>while (fast &amp;&amp; fast-&gt;next) { slow = slow-&gt;next; fast = fast-&gt;next-&gt;next; ... }</code>. Check both <code>fast</code> and <code>fast-&gt;next</code> before taking two steps, or you dereference <code>NULL</code> on an even-length list.',
    ],
    explain: 'Inside a loop the fast pointer gains one node per step on the slow one, so it must land on it within one lap; without a loop it hits <code>NULL</code> first. That is O(1) memory and never writes to the list. The same two-speed walk finds the middle, because when <code>fast</code> has covered the list <code>slow</code> has covered half; the <code>fast &amp;&amp; fast-&gt;next</code> guard is what interviewers watch for.',
    solution: C`
#include <stdbool.h>
#include <stddef.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

/* Return true when the list loops back on itself instead of ending in NULL. */
bool list_has_cycle(const Node *head)
{
    const Node *slow = head;
    const Node *fast = head;
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            return true;
        }
    }
    return false;
}

/* Return the middle node (the second middle one for an even count), or NULL. */
const Node *list_middle(const Node *head)
{
    const Node *slow = head;
    const Node *fast = head;
    while (fast != NULL && fast->next != NULL) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}
`,
  },
  str_copy: {
    hints: [
      'You always need the full length of <code>src</code> for the return value, but you may only write <code>size - 1</code> characters plus a NUL. Handle <code>size == 0</code> before anything else.',
      'Copy characters while there is room (<code>i + 1 &lt; size</code>) and the source has not ended, write the NUL, then return <code>my_strlen(src)</code>. With <code>size == 0</code>, return the length without touching <code>dst</code>.',
      'Copy loop: <code>for (i = 0; i + 1 &lt; size &amp;&amp; src[i] != \'\\0\'; i++) dst[i] = src[i]; dst[i] = \'\\0\';</code>. Writing <code>i &lt; size - 1</code> instead underflows to <code>SIZE_MAX</code> when <code>size</code> is 0.',
    ],
    explain: 'The copy stops one byte short of <code>size</code> so there is always room for the NUL, and returning the full source length (as <code>strlcpy</code> and <code>snprintf</code> do) lets the caller detect truncation with <code>ret &gt;= size</code>. The traps are <code>size == 0</code>, where <code>size - 1</code> underflows, and <code>strncpy</code>, which leaves the buffer unterminated when the source is too long.',
    solution: C`
#include <stddef.h>

/* Return the number of characters before the terminating NUL. */
size_t my_strlen(const char *s)
{
    const char *p = s;
    while (*p != '\0') {
        p++;
    }
    return (size_t)(p - s);
}

/* Copy src into dst, a buffer of size bytes, always NUL-terminating when
   size > 0. Return the length of src so the caller can detect truncation. */
size_t safe_strcpy(char *dst, const char *src, size_t size)
{
    if (size > 0u) {
        size_t i = 0u;
        for (; i + 1u < size && src[i] != '\0'; i++) {
            dst[i] = src[i];
        }
        dst[i] = '\0';
    }
    return my_strlen(src);
}
`,
  },
  cli_split: {
    hints: [
      'Walk the line with one pointer. At any moment you are either between words or inside a word.',
      'Repeat: skip separators; if you hit the NUL you are done; otherwise record the word start, scan to the next separator, and overwrite it with a NUL.',
      'Check <code>if (argc == max_args) return -1;</code> before storing a new word, not after. The classic bug is stepping past the original NUL after the last word and reading beyond the string.',
    ],
    explain: 'Each pass skips separators, records a word start and terminates the word, so leading, trailing and repeated separators fall out naturally. The capacity check happens before <code>argv[argc]</code> is written, so the array is never overrun, and the loop stops at the original NUL instead of stepping past it.',
    solution: C`
#include <stddef.h>

/* Split line in place into words separated by spaces or tabs. Store a pointer
   to each word in argv and return the word count, or -1 if there are more
   than max_args words. */
int split_args(char *line, char *argv[], int max_args)
{
    int argc = 0;
    char *p = line;

    for (;;) {
        while (*p == ' ' || *p == '\t')
            p++;
        if (*p == '\0')
            break;
        if (argc == max_args)
            return -1;
        argv[argc++] = p;
        while (*p != '\0' && *p != ' ' && *p != '\t')
            p++;
        if (*p == '\0')
            break;
        *p++ = '\0';
    }
    return argc;
}
`,
  },
  itoa: {
    hints: [
      'Peeling digits off with <code>% base</code> and <code>/ base</code> gives them least significant first, and a negative <code>value</code> needs its magnitude. Where can you hold both safely?',
      'Validate the base, then take the magnitude as an <code>unsigned</code>, collect digits into a small scratch array, work out the total length (plus 1 for a <code>-</code>), and only then check it against <code>size</code> and copy the digits out in reverse.',
      'Magnitude: <code>unsigned mag = value &lt; 0 ? 0u - (unsigned)value : (unsigned)value;</code>. Writing <code>-value</code> overflows for <code>INT_MIN</code>, and a <code>while (mag != 0)</code> loop prints nothing for 0, so use <code>do ... while</code>. The fit test is <code>len + 1 &gt; size</code>, or <code>len &gt;= size</code>.',
    ],
    explain: 'Converting to <code>unsigned</code> before negating is defined modular arithmetic, so <code>INT_MIN</code> becomes 2147483648 instead of overflowing. Building the digits in a scratch array sized for the binary worst case lets the function measure the result before touching <code>buf</code>, so a short buffer gets a clean empty string rather than a truncated number that looks valid.',
    solution: C`
#include <limits.h>
#include <stddef.h>

/* Write value in base 2..16 to buf, a buffer of size bytes. Return the number
   of characters written (not counting the NUL), or 0 if base is invalid or the
   result does not fit; then buf holds "" when size > 0. */
size_t int_to_str(int value, unsigned base, char *buf, size_t size)
{
    static const char digits[] = "0123456789abcdef";
    char tmp[sizeof(int) * CHAR_BIT];   /* enough for base 2 */
    size_t n = 0u;

    if (size > 0u)
        buf[0] = '\0';
    if (base < 2u || base > 16u)
        return 0u;

    /* Negate in unsigned arithmetic: -INT_MIN would overflow an int. */
    unsigned mag = value < 0 ? 0u - (unsigned)value : (unsigned)value;
    do {
        tmp[n++] = digits[mag % base];
        mag /= base;
    } while (mag != 0u);

    size_t len = n + (value < 0 ? 1u : 0u);
    if (len >= size)
        return 0u;

    size_t i = 0u;
    if (value < 0)
        buf[i++] = '-';
    while (n > 0u)
        buf[i++] = tmp[--n];
    buf[i] = '\0';
    return len;
}
`,
  },
  reverse_words: {
    hints: [
      'What happens to the word order if you reverse the whole string character by character? What is wrong with each word afterwards?',
      'Reverse the entire string, then walk it and reverse each word back. A helper that reverses <code>len</code> characters starting at a pointer does both jobs.',
      'A word ends at a space or at the NUL, so loop <code>for (i = 0; i &lt;= len; i++)</code> and reverse <code>s + start</code> for <code>i - start</code> characters whenever <code>s[i]</code> is <code>\' \'</code> or <code>\'\\0\'</code>. Stopping at <code>i &lt; len</code> forgets the last word.',
    ],
    explain: 'Reversing the whole string puts the words in the right order but each one backwards; reversing every word again fixes the letters. Each character moves twice, so it is O(n) time with only a few index variables, and spaces stay where the mirror image puts them, so the length never changes.',
    solution: C`
#include <stddef.h>
#include <string.h>

/* Reverse the len characters starting at p. */
static void reverse_span(char *p, size_t len)
{
    size_t i = 0u;
    while (len > i + 1u) {
        len--;
        char t = p[i];
        p[i] = p[len];
        p[len] = t;
        i++;
    }
}

/* Reverse the order of the space-separated words in s, in place. */
void reverse_words(char *s)
{
    size_t len = strlen(s);
    size_t start = 0u;

    reverse_span(s, len);
    for (size_t i = 0u; i <= len; i++) {
        if (s[i] == ' ' || s[i] == '\0') {
            reverse_span(s + start, i - start);
            start = i + 1u;
        }
    }
}
`,
  },
  endian: {
    hints: [
      'Build the value from individual bytes with shifts and ORs; never reinterpret the buffer as a wider type.',
      'Big-endian puts <code>p[0]</code> in the top byte; little-endian puts it in the bottom byte. Writing is the reverse: shift the value right and keep one byte at a time.',
      'Cast before shifting: <code>(uint32_t)p[0] &lt;&lt; 24</code>. Without the cast <code>p[0]</code> is promoted to <code>int</code>, and shifting 0xFF into bit 31 is undefined behaviour.',
    ],
    explain: 'Byte-wise access works at any alignment and gives the same answer on any host byte order, unlike <code>*(uint32_t *)p</code>, which can fault on unaligned addresses and breaks strict aliasing. Casting each byte to <code>uint32_t</code> before the shift avoids the signed-<code>int</code> overflow that <code>p[0] &lt;&lt; 24</code> hits when the top bit is set.',
    solution: C`
#include <stdint.h>

uint16_t read_be16(const uint8_t *p)
{
    return (uint16_t)(((unsigned)p[0] << 8) | p[1]);
}

uint32_t read_be32(const uint8_t *p)
{
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) |
           ((uint32_t)p[2] << 8) | (uint32_t)p[3];
}

uint32_t read_le32(const uint8_t *p)
{
    return ((uint32_t)p[3] << 24) | ((uint32_t)p[2] << 16) |
           ((uint32_t)p[1] << 8) | (uint32_t)p[0];
}

void write_be32(uint8_t *p, uint32_t value)
{
    p[0] = (uint8_t)(value >> 24);
    p[1] = (uint8_t)(value >> 16);
    p[2] = (uint8_t)(value >> 8);
    p[3] = (uint8_t)value;
}
`,
  },
  ring_buffer: {
    hints: [
      'Keep two indices, one where the next byte goes in and one where the oldest byte comes out, and use <code>count</code> to tell full from empty.',
      'Push writes at <code>head</code> and advances it; pop reads at <code>tail</code> and advances it. Both wrap back to 0 when they reach <code>capacity</code>.',
      'Advance with <code>if (++rb-&gt;head == rb-&gt;capacity) rb-&gt;head = 0;</code>. Test <code>count == capacity</code> before pushing; with zero capacity that test is already true, so you never index an empty array or take a modulo by zero.',
    ],
    explain: 'The <code>count</code> field removes the classic ambiguity where <code>head == tail</code> could mean either full or empty, so every slot is usable. Wrapping with a compare instead of <code>%</code> works for any capacity, and the full check runs first so a zero-capacity buffer is rejected before any index is touched.',
    solution: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

/* The checker provides this API declaration. Implement all three functions. */
typedef struct RingBuffer {
    uint8_t *data;
    size_t capacity;
    size_t head;
    size_t tail;
    size_t count;
} RingBuffer;

void rb_init(RingBuffer *rb, uint8_t *storage, size_t capacity)
{
    rb->data = storage;
    rb->capacity = capacity;
    rb->head = 0;
    rb->tail = 0;
    rb->count = 0;
}

bool rb_push(RingBuffer *rb, uint8_t value)
{
    if (rb->count == rb->capacity)  /* also rejects capacity 0 */
        return false;
    rb->data[rb->head] = value;
    if (++rb->head == rb->capacity)
        rb->head = 0;
    rb->count++;
    return true;
}

bool rb_pop(RingBuffer *rb, uint8_t *out)
{
    if (rb->count == 0)
        return false;
    *out = rb->data[rb->tail];
    if (++rb->tail == rb->capacity)
        rb->tail = 0;
    rb->count--;
    return true;
}
`,
  },
  crc16: {
    hints: [
      'Treat the CRC as a 16-bit shift register: each data bit enters at the top, and when a 1 falls out of bit 15 you XOR in the polynomial.',
      'For each byte, XOR it into the high byte with <code>crc ^= (uint16_t)(byte &lt;&lt; 8)</code>, then do 8 rounds of shift-left with a conditional XOR of <code>0x1021</code>.',
      'Inside the bit loop: <code>crc = (crc &amp; 0x8000u) ? (uint16_t)((crc &lt;&lt; 1) ^ 0x1021u) : (uint16_t)(crc &lt;&lt; 1);</code>. Test bit 15 before shifting, and truncate back to 16 bits, because <code>crc &lt;&lt; 1</code> is computed as an <code>int</code>.',
    ],
    explain: 'XORing each byte into the top of the register and shifting it out MSB first is the non-reflected CRC, and the bit-15 test decides whether the polynomial is applied before that bit is lost. The <code>uint16_t</code> casts keep the register at 16 bits after integer promotion; forgetting them leaves stray high bits and gives the wrong check value.',
    solution: C`
#include <stddef.h>
#include <stdint.h>

/* CRC-16/CCITT-FALSE: poly 0x1021, init 0xFFFF, no reflection, no final XOR. */
uint16_t crc16_ccitt(const uint8_t *data, size_t len)
{
    uint16_t crc = 0xFFFFu;

    for (size_t i = 0; i < len; i++) {
        crc ^= (uint16_t)(data[i] << 8);
        for (int bit = 0; bit < 8; bit++) {
            if (crc & 0x8000u)
                crc = (uint16_t)((crc << 1) ^ 0x1021u);
            else
                crc = (uint16_t)(crc << 1);
        }
    }
    return crc;
}
`,
  },
  parse_u32: {
    hints: [
      'Accumulate digit by digit, but make sure the next <code>value * 10 + digit</code> fits before you compute it.',
      'Reject an empty string up front, reject any character that is not <code>0</code>-<code>9</code>, and only write <code>*out</code> after the whole string has been accepted.',
      'Overflow test before the multiply: <code>if (value &gt; (UINT32_MAX - digit) / 10u) return false;</code>. Checking after the multiply is too late, because unsigned arithmetic has already wrapped.',
    ],
    explain: 'The test <code>value &gt; (UINT32_MAX - digit) / 10</code> is the exact condition for <code>value * 10 + digit</code> overflowing, so it accepts 4294967295 and rejects 4294967296 without needing a wider type. Writing <code>*out</code> only at the end means a caller never sees a half-parsed value on failure.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Parse a decimal string into *out. Return false (and leave *out alone) on bad input or overflow. */
bool parse_u32(const char *s, uint32_t *out)
{
    uint32_t value = 0u;

    if (*s == '\0')
        return false;
    for (; *s != '\0'; s++) {
        if (*s < '0' || *s > '9')
            return false;
        uint32_t digit = (uint32_t)(*s - '0');
        if (value > (UINT32_MAX - digit) / 10u)
            return false;
        value = value * 10u + digit;
    }
    *out = value;
    return true;
}
`,
  },
  saturate: {
    hints: [
      'Two <code>int16_t</code> values can produce a sum or product that does not fit in 16 bits. Do the arithmetic in a type where it always fits, then decide what to return.',
      'Compute in <code>int32_t</code>, then clamp to <code>INT16_MIN</code>..<code>INT16_MAX</code> with one helper shared by all three functions. For Q15, the 32-bit product is Q30, so add half of the last bit you drop (<code>0x4000</code>) and shift right by 15.',
      '<code>q15_mul</code> is <code>clamp16(((int32_t)a * b + 0x4000) &gt;&gt; 15)</code>, and the clamp catches -1 &times; -1 = 32768. The classic bug is <code>(int16_t)(a + b)</code>, which wraps, or an overflow test like <code>if (a + b &gt; INT16_MAX)</code> done in 16-bit thinking; and for <code>sat_sub16</code>, negating <code>b</code> breaks on <code>INT16_MIN</code>.',
    ],
    explain: 'Any sum, difference or product of two <code>int16_t</code> values fits in <code>int32_t</code> (the largest product is 2<sup>30</sup>), so computing wide and clamping once is both correct and free of undefined behaviour. Adding <code>0x4000</code> before the arithmetic shift rounds to nearest instead of always toward -infinity, and the clamp turns the single unrepresentable product, -1 &times; -1, into 32767.',
    solution: C`
#include <stdint.h>

/* Clamp a 32-bit intermediate result to the int16_t range. */
static int16_t clamp16(int32_t x)
{
    if (x > INT16_MAX)
        return INT16_MAX;
    if (x < INT16_MIN)
        return INT16_MIN;
    return (int16_t)x;
}

/* Return a + b clamped to the int16_t range. */
int16_t sat_add16(int16_t a, int16_t b)
{
    return clamp16((int32_t)a + b);
}

/* Return a - b clamped to the int16_t range. */
int16_t sat_sub16(int16_t a, int16_t b)
{
    return clamp16((int32_t)a - b);
}

/* Return a * b in Q15, rounded to nearest (halves up), saturating -1 * -1. */
int16_t q15_mul(int16_t a, int16_t b)
{
    int32_t product = (int32_t)a * b;           /* Q30, |product| <= 2^30 */
    return clamp16((product + 0x4000) >> 15);   /* round, back to Q15 */
}
`,
  },
  moving_average: {
    hints: [
      'Re-adding the whole window on every call works, but costs N additions per sample. Keep a running total instead, and adjust it as one sample enters and one leaves.',
      'Use <code>samples[]</code> as a circular buffer with a write index and a count. On each add: once the window is full, subtract the sample about to be overwritten; store the new sample, add it to the sum, advance the index, and divide by the count.',
      'Round with <code>(sum + count / 2u) / count</code>. Make the sum a <code>uint32_t</code>: 16 samples of 65535 need 20 bits, so a <code>uint16_t</code> sum wraps on the second full-scale sample. And do not subtract the old slot before the window has filled: it holds garbage or zero, not a sample.',
    ],
    explain: 'The sum always equals the total of the samples in the buffer, so each add is one subtraction, one addition and one division however long the window is. Dividing by <code>count</code> rather than <code>window</code> gives a correct average during warm-up, adding <code>count / 2</code> before the division rounds to nearest instead of always down, and a 32-bit sum holds 16 full-scale samples with room to spare.',
    solution: C`
#include <stdint.h>

#define MA_MAX_WINDOW 16u

typedef struct MovingAverage {
    uint16_t samples[MA_MAX_WINDOW];   /* the most recent samples */
    uint8_t window;                    /* samples to average, 1..MA_MAX_WINDOW */
    uint8_t count;                     /* samples held, up to window */
    uint8_t next;                      /* slot the next sample goes in */
    uint32_t sum;                      /* total of the samples held: up to 20 bits */
} MovingAverage;

/* Reset the filter and set the window length (1..MA_MAX_WINDOW). */
void ma_init(MovingAverage *ma, uint8_t window)
{
    *ma = (MovingAverage){ .window = window };
}

/* Add one sample and return the rounded average of the last window samples
   (or of all samples so far, while the window is still filling). */
uint16_t ma_add(MovingAverage *ma, uint16_t sample)
{
    if (ma->count == ma->window) {
        ma->sum -= ma->samples[ma->next];   /* oldest sample leaves */
    } else {
        ma->count++;
    }
    ma->samples[ma->next] = sample;
    ma->sum += sample;
    ma->next = (uint8_t)((ma->next + 1u) % ma->window);

    return (uint16_t)((ma->sum + ma->count / 2u) / ma->count);
}
`,
  },
  lut_interp: {
    hints: [
      'Deal with the ends first: anything at or beyond the first or last breakpoint returns that end value. That also handles a one-point table. What is left is finding the segment that contains <code>x</code>.',
      'This solution uses a binary search: keep <code>xs[lo] &lt;= x &lt; xs[hi]</code> and halve the range until <code>hi == lo + 1</code> (a linear scan is fine for a short table). Then compute the exact value in that segment as one fraction over <code>dx = xs[hi] - xs[lo]</code>.',
      'Numerator: <code>ys[lo] * dx + (x - xs[lo]) * (ys[hi] - ys[lo])</code>, every term in <code>int64_t</code>, since even <code>dx</code> can exceed 32 bits. Divide once with rounding: <code>(num + dx / 2) / dx</code> when <code>num &gt;= 0</code>, <code>(num - dx / 2) / dx</code> otherwise. Rounding only the step and adding it to <code>ys[lo]</code> rounds -2.5 to -2.',
    ],
    explain: 'Clamping first means the arithmetic only ever sees an <code>x</code> inside the table, so <code>x - xs[0]</code> cannot overflow for <code>INT32_MIN</code>. Putting the whole result over one denominator and rounding once gives exact breakpoints and correct ties on both sides of zero, and 64-bit intermediates hold every product the ±10<sup>9</sup> range allows (at most about 6 × 10<sup>18</sup>).',
    solution: C`
#include <stddef.h>
#include <stdint.h>

/* Look up x in a table of n strictly increasing breakpoints xs[] with values
   ys[], interpolating linearly between breakpoints and clamping outside. */
int32_t lut_interp(const int32_t *xs, const int32_t *ys, size_t n, int32_t x)
{
    if (x <= xs[0]) {
        return ys[0];
    }
    if (x >= xs[n - 1u]) {
        return ys[n - 1u];
    }

    /* Binary search for the segment with xs[lo] <= x < xs[hi]. */
    size_t lo = 0u, hi = n - 1u;
    while (hi - lo > 1u) {
        size_t mid = lo + (hi - lo) / 2u;
        if (xs[mid] <= x) {
            lo = mid;
        } else {
            hi = mid;
        }
    }

    /* y = num / dx exactly; round once, halves away from zero. */
    int64_t dx = (int64_t)xs[hi] - xs[lo];
    int64_t num = (int64_t)ys[lo] * dx + ((int64_t)x - xs[lo]) * ((int64_t)ys[hi] - ys[lo]);
    int64_t half = dx / 2;
    return (int32_t)(num >= 0 ? (num + half) / dx : (num - half) / dx);
}
`,
  },
  prefix_mask: {
    hints: [
      'A /n mask is n one bits followed by 32 - n zero bits, so it is all-ones shifted left by some amount.',
      'Use <code>0xFFFFFFFF &lt;&lt; (32 - n)</code>, but handle /0 separately. For subnet membership, mask both addresses and compare. For a mask, check that the inverted mask is a run of low one bits, then count the ones.',
      'The pitfall: <code>0xFFFFFFFFu &lt;&lt; 32</code> is undefined, so return 0 for /0. A mask is contiguous when <code>(~mask &amp; (~mask + 1u)) == 0</code>.',
    ],
    explain: 'Special-casing /0 avoids the undefined shift by 32, which on x86 silently becomes a shift by 0 and turns /0 into /32. Masking both <code>ip</code> and <code>net</code> ignores host bits in <code>net</code>, and the <code>host &amp; (host + 1)</code> test accepts exactly the masks whose inverse is a contiguous run of low ones.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Return the netmask for a prefix length 0..32, e.g. 24 -> 0xFFFFFF00. */
uint32_t prefix_to_mask(unsigned prefix_len)
{
    if (prefix_len == 0u)
        return 0u;              /* shifting by 32 would be undefined */
    if (prefix_len > 32u)
        prefix_len = 32u;
    return 0xFFFFFFFFu << (32u - prefix_len);
}

/* Return true when ip is inside the subnet net/prefix_len. */
bool ip_in_subnet(uint32_t ip, uint32_t net, unsigned prefix_len)
{
    uint32_t mask = prefix_to_mask(prefix_len);
    return (ip & mask) == (net & mask);
}

/* Return the prefix length of mask, or -1 if it is not a contiguous mask. */
int mask_to_prefix(uint32_t mask)
{
    uint32_t host = ~mask;

    /* host must look like 0...01...1; adding 1 then clears every set bit. */
    if ((host & (host + 1u)) != 0u)
        return -1;

    int len = 0;
    while (mask != 0u) {
        len++;
        mask <<= 1;
    }
    return len;
}
`,
  },
  parse_ipv4: {
    hints: [
      'Parse exactly four parts in a loop, expecting a dot before every part except the first, and check for the NUL only after the fourth.',
      'For each part, require at least one digit, reject a <code>0</code> followed by another digit, read at most 3 digits, and check the value is at most 255. Build the result with <code>addr = (addr &lt;&lt; 8) | part</code>.',
      'Limit the digit count while reading: <code>if (++digits &gt; 3) return false;</code>. If you only check the value after the loop, a long digit run like <code>4294967297</code> wraps around and can pass.',
    ],
    explain: 'A fixed four-iteration loop with an explicit dot check and a final NUL test rejects empty parts, extra parts and trailing junk in one structure. Capping each part at three digits before checking 255 means the accumulator can never overflow, and rejecting leading zeros avoids the octal ambiguity that <code>inet_aton</code> has.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Parse "a.b.c.d" into a host-order address, e.g. "192.168.1.10" -> 0xC0A8010A.
   Return false and leave *out unchanged on bad input. */
bool parse_ipv4(const char *s, uint32_t *out)
{
    uint32_t addr = 0u;

    for (int part = 0; part < 4; part++) {
        if (part > 0) {
            if (*s != '.')
                return false;
            s++;
        }
        if (*s < '0' || *s > '9')
            return false;
        if (s[0] == '0' && s[1] >= '0' && s[1] <= '9')
            return false;       /* leading zero */

        unsigned value = 0u;
        int digits = 0;
        while (*s >= '0' && *s <= '9') {
            if (++digits > 3)
                return false;
            value = value * 10u + (unsigned)(*s - '0');
            s++;
        }
        if (value > 255u)
            return false;
        addr = (addr << 8) | value;
    }
    if (*s != '\0')
        return false;
    *out = addr;
    return true;
}
`,
  },
  mac_addr: {
    hints: [
      'Parse into a temporary array and copy it into <code>mac</code> only once the whole string has been validated.',
      'Write a small helper that turns one hex character into 0-15 or -1. Each byte is two hex digits; between bytes you need a <code>:</code>, and after the sixth byte you need the NUL. For formatting, index into <code>"0123456789abcdef"</code> with each nibble.',
      'High nibble is <code>mac[i] &gt;&gt; 4</code>, low is <code>mac[i] &amp; 0x0F</code>. Multicast is <code>(mac[0] &amp; 0x01) != 0</code>; remember <code>out[17] = \'\\0\'</code>, and do not write past index 17.',
    ],
    explain: 'Validating into a temporary and copying at the end keeps <code>mac</code> untouched on failure, and checking for the NUL after six bytes rejects trailing characters. Formatting by nibble lookup writes exactly 17 characters and a NUL, and multicast is only the I/G bit of the first byte, so broadcast is also multicast.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

static int hex_value(char c)
{
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return c - 'a' + 10;
    if (c >= 'A' && c <= 'F') return c - 'A' + 10;
    return -1;
}

/* Parse "aa:bb:cc:dd:ee:ff" into mac. Return false and leave mac unchanged on bad input. */
bool mac_parse(const char *s, uint8_t mac[6])
{
    uint8_t tmp[6];

    for (int i = 0; i < 6; i++) {
        if (i > 0 && *s++ != ':')
            return false;
        int hi = hex_value(s[0]);
        if (hi < 0)
            return false;
        int lo = hex_value(s[1]);
        if (lo < 0)
            return false;
        tmp[i] = (uint8_t)(hi << 4 | lo);
        s += 2;
    }
    if (*s != '\0')
        return false;
    for (int i = 0; i < 6; i++)
        mac[i] = tmp[i];
    return true;
}

/* Write mac as "aa:bb:cc:dd:ee:ff" (lower case) plus a terminating NUL. */
void mac_format(const uint8_t mac[6], char out[18])
{
    static const char digits[] = "0123456789abcdef";

    for (int i = 0; i < 6; i++) {
        out[i * 3] = digits[mac[i] >> 4];
        out[i * 3 + 1] = digits[mac[i] & 0x0F];
        out[i * 3 + 2] = (i < 5) ? ':' : '\0';
    }
}

bool mac_is_multicast(const uint8_t mac[6])
{
    return (mac[0] & 0x01u) != 0u;
}

bool mac_is_broadcast(const uint8_t mac[6])
{
    for (int i = 0; i < 6; i++)
        if (mac[i] != 0xFFu)
            return false;
    return true;
}
`,
  },
  inet_checksum: {
    hints: [
      'Add 16-bit words into a wider accumulator so no carry is lost, and deal with the carries once at the end.',
      'Build each word from two bytes as big-endian, pad an odd last byte with a zero low byte, fold the high half of the sum back into the low half until nothing is left above bit 15, then complement.',
      'Use <code>sum += ((uint32_t)data[i] &lt;&lt; 8) | data[i + 1]</code>, then <code>while (sum &gt;&gt; 16) sum = (sum &amp; 0xFFFFu) + (sum &gt;&gt; 16);</code>. Fold in a loop, not once: the first fold can carry again.',
    ],
    explain: 'Assembling each word from bytes is endian-independent and safe on unaligned buffers, and a 32-bit accumulator holds every carry for any Ethernet-sized packet. The fold runs in a loop because adding the carry back can itself overflow bit 15, which is the bug interviewers look for.',
    solution: C`
#include <stddef.h>
#include <stdint.h>

/* RFC 1071 Internet checksum over len bytes. */
uint16_t inet_checksum(const uint8_t *data, size_t len)
{
    uint32_t sum = 0u;
    size_t i = 0;

    for (; i + 1 < len; i += 2) {
        sum += ((uint32_t)data[i] << 8) | data[i + 1];
    }
    if (i < len) {
        sum += (uint32_t)data[i] << 8;   /* odd byte: pad low byte with 0 */
    }

    /* End-around carry: a single fold can produce a new carry. */
    while (sum >> 16) {
        sum = (sum & 0xFFFFu) + (sum >> 16);
    }
    return (uint16_t)~sum;
}
`,
  },
  eth_header: {
    hints: [
      'Read the EtherType at offset 12 first; its value decides where everything after it lives and how many bytes you need.',
      'Check for 14 bytes, copy the two MACs, read the big-endian EtherType. If it is <code>0x8100</code>, check for 18 bytes, split the TCI, and read the real EtherType at offset 16.',
      'With <code>tci = (frame[14] &lt;&lt; 8) | frame[15]</code>: priority is <code>tci &gt;&gt; 13</code> and VLAN ID is <code>tci &amp; 0x0FFF</code>. Masking with <code>0x1FFF</code> pulls in the DEI bit, and forgetting to zero the VLAN fields for untagged frames leaves junk.',
    ],
    explain: 'The length is checked before each read that depends on it: 14 bytes to see the EtherType, then 18 only once a tag is known to be present. Fields are assembled from bytes so the frame can sit at any address, and the TCI is split with <code>&gt;&gt; 13</code> and <code>&amp; 0x0FFF</code> so the DEI bit never leaks into the VLAN ID.',
    solution: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>

typedef struct EthInfo {
    uint8_t dst[6];
    uint8_t src[6];
    bool has_vlan;           /* true when an 802.1Q tag is present */
    uint16_t vlan_id;        /* 12-bit VLAN ID, 0 when untagged */
    uint8_t priority;        /* 3-bit priority (PCP), 0 when untagged */
    uint16_t ethertype;      /* payload type, e.g. 0x0800 for IPv4 */
    size_t payload_offset;   /* where the payload starts in the frame */
} EthInfo;

static uint16_t rd16(const uint8_t *p)
{
    return (uint16_t)((p[0] << 8) | p[1]);
}

/* Parse the Ethernet header at the start of frame. Return false if it is too short. */
bool eth_parse(const uint8_t *frame, size_t len, EthInfo *info)
{
    if (len < 14u) {
        return false;
    }

    uint16_t type = rd16(frame + 12);
    if (type == 0x8100u) {
        if (len < 18u) {
            return false;
        }
        uint16_t tci = rd16(frame + 14);
        info->has_vlan = true;
        info->priority = (uint8_t)(tci >> 13);
        info->vlan_id = tci & 0x0FFFu;
        info->ethertype = rd16(frame + 16);
        info->payload_offset = 18u;
    } else {
        info->has_vlan = false;
        info->priority = 0u;
        info->vlan_id = 0u;
        info->ethertype = type;
        info->payload_offset = 14u;
    }

    memcpy(info->dst, frame, 6u);
    memcpy(info->src, frame + 6, 6u);
    return true;
}
`,
  },
  ipv4_header: {
    hints: [
      'Treat every length in the header as untrusted: each one must be checked against the bytes you actually received before you use it.',
      'Go in the required order: 20 bytes, version nibble, IHL (at least 5 and <code>IHL * 4 &lt;= len</code>), total length (between the header length and <code>len</code>), then the checksum over <code>IHL * 4</code> bytes. Only then fill <code>*info</code>.',
      'Summing the whole header including its checksum field gives <code>0xFFFF</code> after folding when it is valid. A fragment is <code>(flags &amp; 0x2000) || (flags &amp; 0x1FFF)</code>; checking only MF misses the last fragment.',
    ],
    explain: 'Each length field is bounded by <code>len</code> before anything reads past byte 20, so a lying IHL or total length cannot become an out-of-bounds read; that ordering is what the interviewer is really testing. The checksum covers all <code>IHL * 4</code> bytes including options, and a fragment is detected by MF <em>or</em> a nonzero offset so the final fragment is not missed.',
    solution: C`
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

static uint16_t rd16(const uint8_t *p)
{
    return (uint16_t)((p[0] << 8) | p[1]);
}

static uint32_t rd32(const uint8_t *p)
{
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | p[3];
}

/* Validate the IPv4 header at the start of pkt (len bytes received). On IP_OK fill *info. */
IpStatus ipv4_parse(const uint8_t *pkt, size_t len, Ipv4Info *info)
{
    if (len < 20u) {
        return IP_TOO_SHORT;
    }
    if ((pkt[0] >> 4) != 4u) {
        return IP_BAD_VERSION;
    }

    size_t hlen = (size_t)(pkt[0] & 0x0Fu) * 4u;
    if (hlen < 20u || hlen > len) {
        return IP_BAD_IHL;
    }

    uint16_t total = rd16(pkt + 2);
    if (total < hlen || total > len) {
        return IP_BAD_LENGTH;
    }

    /* A header that includes a correct checksum sums to 0xFFFF. */
    uint32_t sum = 0u;
    for (size_t i = 0; i < hlen; i += 2) {
        sum += rd16(pkt + i);
    }
    while (sum >> 16) {
        sum = (sum & 0xFFFFu) + (sum >> 16);
    }
    if (sum != 0xFFFFu) {
        return IP_BAD_CHECKSUM;
    }

    uint16_t frag = rd16(pkt + 6);
    info->header_len = hlen;
    info->total_len = total;
    info->ttl = pkt[8];
    info->protocol = pkt[9];
    info->src = rd32(pkt + 12);
    info->dst = rd32(pkt + 16);
    info->is_fragment = (frag & 0x2000u) != 0u || (frag & 0x1FFFu) != 0u;
    return IP_OK;
}
`,
  },
  mac_table: {
    hints: [
      'The key is the pair (MAC, VLAN), and learning is really "find, else insert". Write one helper that finds an entry by key and use it everywhere.',
      'In <code>fdb_learn</code>, update the entry if the key exists; otherwise take the first unused slot, or fail if there is none. Ageing walks every used entry and clears <code>used</code> when it is too old.',
      'Compute the age as <code>now - e-&gt;last_seen</code> in <code>uint32_t</code>, which stays correct across wrap; comparing <code>now &gt; last_seen + max_age</code> breaks when the sum wraps. Remove only when the age is strictly greater than <code>max_age</code>.',
    ],
    explain: 'Searching for the existing (MAC, VLAN) key before claiming a free slot is what prevents duplicates and lets a full table still refresh known stations. Ageing uses <code>now - last_seen</code> in unsigned arithmetic, which is the elapsed time modulo 2<sup>32</sup> and so survives the tick counter wrapping, where <code>last_seen + max_age &lt; now</code> would not.',
    solution: C`
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
    memset(fdb, 0, sizeof *fdb);
}

/* Return the index of the entry for mac on vlan, or -1. An index rather than
   a pointer serves both the const lookup and learn without a cast. */
static int fdb_find(const Fdb *fdb, const uint8_t mac[6], uint16_t vlan)
{
    for (unsigned i = 0; i < FDB_SIZE; i++) {
        const FdbEntry *e = &fdb->entries[i];
        if (e->used && e->vlan == vlan && memcmp(e->mac, mac, 6u) == 0) {
            return (int)i;
        }
    }
    return -1;
}

/* A frame from mac on vlan arrived on port at tick now. Add or update the
   entry. Return false if a new entry is needed and the table is full. */
bool fdb_learn(Fdb *fdb, const uint8_t mac[6], uint16_t vlan, uint16_t port, uint32_t now)
{
    int found = fdb_find(fdb, mac, vlan);
    FdbEntry *e = found >= 0 ? &fdb->entries[found] : NULL;

    for (unsigned i = 0; e == NULL && i < FDB_SIZE; i++) {
        if (!fdb->entries[i].used) {
            e = &fdb->entries[i];
            e->used = true;
            memcpy(e->mac, mac, 6u);
            e->vlan = vlan;
        }
    }
    if (e == NULL) {
        return false;   /* table full */
    }
    e->port = port;
    e->last_seen = now;
    return true;
}

/* Return the port for mac on vlan, or -1 if unknown (the switch then floods). */
int fdb_lookup(const Fdb *fdb, const uint8_t mac[6], uint16_t vlan)
{
    int found = fdb_find(fdb, mac, vlan);
    return found >= 0 ? fdb->entries[found].port : -1;
}

/* Remove entries not seen for more than max_age ticks. Return how many were removed. */
unsigned fdb_age(Fdb *fdb, uint32_t now, uint32_t max_age)
{
    unsigned removed = 0u;
    for (unsigned i = 0; i < FDB_SIZE; i++) {
        FdbEntry *e = &fdb->entries[i];
        /* Unsigned subtraction gives the right age even after the tick counter wraps. */
        if (e->used && (uint32_t)(now - e->last_seen) > max_age) {
            e->used = false;
            removed++;
        }
    }
    return removed;
}
`,
  },
  reg_poll: {
    hints: [
      'This is a bounded loop: the read count is the loop counter, and the condition is checked right after each read.',
      'Loop from 1 to <code>max_reads</code>; read once per pass, return the pass number as soon as the masked value matches, and return -1 when the loop ends.',
      'The test is <code>(read_reg(ctx) &amp; mask) == expect</code>. Writing <code>value &amp; mask == expect</code> parses as <code>value &amp; (mask == expect)</code>, and a <code>do</code>/<code>while</code> reads once even when <code>max_reads</code> is 0.',
    ],
    explain: 'The loop condition is the timeout, so it can never spin forever, and returning at the first match means no extra read. Parenthesising <code>(value &amp; mask)</code> avoids the precedence trap, and a <code>for</code> loop that tests before reading handles <code>max_reads == 0</code> without touching the hardware.',
    solution: C`
#include <stdint.h>

/* Reads the current value of a status register. */
typedef uint32_t (*RegRead)(void *ctx);

/* Read until (value & mask) == expect, at most max_reads times.
   Return the number of reads used, or -1 on timeout. */
int wait_for_bits(RegRead read_reg, void *ctx, uint32_t mask, uint32_t expect, unsigned max_reads)
{
    for (unsigned reads = 1u; reads <= max_reads; reads++) {
        if ((read_reg(ctx) & mask) == expect) {
            return (int)reads;
        }
    }
    return -1;
}
`,
  },
  sensor_temp: {
    hints: [
      'A two\'s complement field is negative when its top bit is set; you can compute its value without any shift that touches the sign bit of a signed type.',
      'Mask the value down to <code>bits</code> bits, and if the sign bit <code>m = 1u &lt;&lt; (bits - 1)</code> is set, subtract 2<sup>bits</sup>. For the temperature, build the 16-bit word, shift it right by 4, sign-extend 12 bits, then scale.',
      'Avoid <code>1u &lt;&lt; bits</code> when <code>bits</code> is 32: mask with <code>(m &lt;&lt; 1) - 1u</code> (unsigned wrap makes that all ones) or <code>m | (m - 1u)</code>. Return <code>steps * 625 / 10</code> on a signed value so division truncates toward zero.',
    ],
    explain: 'The sign bit is found with <code>1u &lt;&lt; (bits - 1)</code>, which stays in range for <code>bits == 32</code>, and a negative value is built as <code>(value - sign) - sign</code> in signed pieces so nothing relies on implementation-defined conversion or right-shifting a negative number. The temperature is scaled with integer math on the signed step count, so <code>-1 * 625 / 10</code> truncates to -62 as required.',
    solution: C`
#include <stdint.h>

/* Sign-extend the low bits bits (1..32) of value. */
int32_t sign_extend(uint32_t value, unsigned bits)
{
    uint32_t sign = 1u << (bits - 1u);
    value &= sign | (sign - 1u);   /* keep the low bits; no shift by 32 */

    if (value & sign) {
        /* value - 2^bits, computed without overflowing int32_t */
        return (int32_t)(value - sign) - (int32_t)(sign - 1u) - 1;
    }
    return (int32_t)value;
}

/* Convert the two register bytes to milli-degrees Celsius. */
int32_t temp_millicelsius(uint8_t msb, uint8_t lsb)
{
    uint32_t raw = ((uint32_t)msb << 8) | lsb;
    int32_t steps = sign_extend(raw >> 4, 12u);
    return steps * 625 / 10;
}
`,
  },
  soft_timer: {
    hints: [
      'Store when each timer\'s current period started and how long it is, not an absolute deadline. With unsigned arithmetic, <code>now - start</code> is the true elapsed time even after the tick counter wraps.',
      'In <code>timers_poll</code>, a timer is due when <code>(uint32_t)(now - start) &gt;= period</code>. A repeating timer then moves <code>start</code> on by one period (to its old deadline); a one-shot clears <code>active</code>. Do that before calling the callback.',
      'Comparing <code>now &gt;= start + period</code> breaks at the wrap: near 0xFFFFFFF0 the deadline overflows to a small number and the timer fires at once. Re-arming with <code>start = now</code> lets every late poll push the schedule back. Freeing a one-shot after its callback returns means a callback that restarts itself can find the table full, and range-check the handle in <code>timer_stop</code> before indexing.',
    ],
    explain: 'Unsigned subtraction is modulo 2<sup>32</sup>, so <code>now - start</code> measures elapsed ticks correctly across the wrap as long as no period exceeds about 49 days. Advancing <code>start += period</code> keeps a repeating timer on its original grid however late the poll is, and updating the slot before the callback runs means the callback sees a consistent table: it can stop its own timer or start a new one in the slot just freed.',
    solution: C`
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
    for (int i = 0; i < MAX_TIMERS; i++) {
        timers[i] = (SoftTimer){ .active = false };
    }
}

/* Start a timer due period_ms after now. Return its handle 0..MAX_TIMERS-1,
   or -1 if no slot is free, callback is NULL or period_ms is 0. */
int timer_start(uint32_t now, uint32_t period_ms, bool repeat, TimerCallback callback, void *ctx)
{
    if (callback == NULL || period_ms == 0u) {
        return -1;
    }
    for (int i = 0; i < MAX_TIMERS; i++) {
        if (!timers[i].active) {
            timers[i] = (SoftTimer){
                .active = true, .repeat = repeat, .start = now,
                .period = period_ms, .callback = callback, .ctx = ctx,
            };
            return i;
        }
    }
    return -1;
}

/* Stop a running timer. Return false for a bad handle or a stopped timer. */
bool timer_stop(int handle)
{
    if (handle < 0 || handle >= MAX_TIMERS || !timers[handle].active) {
        return false;
    }
    timers[handle].active = false;
    return true;
}

/* Call the callback of every timer that is due at tick now. */
void timers_poll(uint32_t now)
{
    for (int i = 0; i < MAX_TIMERS; i++) {
        SoftTimer *t = &timers[i];
        if (!t->active || (uint32_t)(now - t->start) < t->period) {
            continue;
        }
        TimerCallback callback = t->callback;
        void *ctx = t->ctx;
        if (t->repeat) {
            t->start += t->period;   /* next deadline on the original grid */
        } else {
            t->active = false;       /* free the slot before the callback */
        }
        callback(ctx);
    }
}
`,
  },
  debounce: {
    hints: [
      'Only count samples that disagree with the current output; anything that agrees means the change was a bounce.',
      'If the sample equals <code>state</code>, reset <code>count</code>. Otherwise increment it, and when it reaches <code>threshold</code>, flip <code>state</code> and reset <code>count</code>.',
      'The core is <code>if (raw == d-&gt;state) d-&gt;count = 0; else if (++d-&gt;count &gt;= d-&gt;threshold) { d-&gt;state = raw; d-&gt;count = 0; }</code>. Forgetting to reset the count after accepting a change makes the next edge switch too early.',
    ],
    explain: 'The counter measures how long the input has disagreed with the output, so any sample that agrees resets it and a bounce never accumulates. Resetting the count when the change is accepted means the next edge has to earn its full <code>threshold</code> too; with a two-level input there is no need to remember which level is pending.',
    solution: C`
#include <stdbool.h>

typedef struct Debouncer {
    bool state;          /* debounced output */
    unsigned count;      /* consecutive samples that differ from state */
    unsigned threshold;  /* samples needed to accept a change */
} Debouncer;

void debounce_init(Debouncer *d, bool initial, unsigned threshold)
{
    d->state = initial;
    d->count = 0u;
    d->threshold = threshold;
}

/* Take one raw sample and return the debounced state. */
bool debounce_update(Debouncer *d, bool raw)
{
    if (raw == d->state) {
        d->count = 0u;
    } else if (++d->count >= d->threshold) {
        d->state = raw;
        d->count = 0u;
    }
    return d->state;
}
`,
  },
  fan_control: {
    hints: [
      'Each level has two thresholds, and which one applies depends on the current level. Decide the new level from the temperature and the old level together.',
      'Check from the top down: invalid gives HIGH; at or above 70 °C gives HIGH; staying HIGH needs at least 65 °C; at or above 50 °C gives LOW; staying on at LOW needs the fan already on and at least 45 °C; otherwise OFF.',
      'For example, <code>else if (f-&gt;level == FAN_HIGH &amp;&amp; t &gt;= 65000) level = FAN_HIGH;</code>. Handle <code>TEMP_INVALID</code> first: it is <code>INT32_MIN</code>, so the normal rules would read it as very cold and turn the fan off.',
    ],
    explain: 'Turn-on thresholds apply from any level, while the lower turn-off thresholds apply only when the fan is already at or above that level, which is the hysteresis that stops flapping. Testing <code>TEMP_INVALID</code> first matters because <code>INT32_MIN</code> would otherwise look like an extremely cold reading and switch the fan off on a sensor failure.',
    solution: C`
#include <stdint.h>

#define TEMP_INVALID INT32_MIN   /* the sensor could not be read */

typedef enum { FAN_OFF, FAN_LOW, FAN_HIGH } FanLevel;

typedef struct FanCtl {
    FanLevel level;
} FanCtl;

/* Start with the fan off. */
void fan_init(FanCtl *f)
{
    f->level = FAN_OFF;
}

/* Take one reading in milli-degrees C and return the new fan level. */
FanLevel fan_update(FanCtl *f, int32_t temp_mc)
{
    FanLevel prev = f->level;
    FanLevel next;

    if (temp_mc == TEMP_INVALID || temp_mc >= 70000) {
        next = FAN_HIGH;   /* fail safe when the sensor is unreadable */
    } else if (prev == FAN_HIGH && temp_mc >= 65000) {
        next = FAN_HIGH;
    } else if (temp_mc >= 50000) {
        next = FAN_LOW;
    } else if (prev != FAN_OFF && temp_mc >= 45000) {
        next = FAN_LOW;    /* falling from LOW or HIGH */
    } else {
        next = FAN_OFF;
    }

    f->level = next;
    return next;
}
`,
  },
  bug_adc_macros: {
    hints: [
      'Both bugs are in the two <code>#define</code> lines and how they are used. Expand each macro by hand at its call site in <code>adc_peak_mv</code>, with the actual argument text pasted in.',
      'One macro has a precedence bug: its parameter is not parenthesised, so an argument like <code>peak - offset_counts</code> splits apart. The other evaluates an argument twice, and that argument has a side effect.',
      'Write <code>((count) * ADC_FULL_SCALE_MV / ADC_MAX_COUNT)</code>, and read the sample into a local before comparing: <code>uint16_t sample = adc_read(); peak = MAX(peak, sample);</code>. Otherwise <code>MAX</code> calls <code>adc_read</code> a second time whenever the new sample wins, and returns that second sample.',
    ],
    explain: '<code>ADC_TO_MV(peak - offset_counts)</code> expanded to <code>peak - offset_counts * 3300u / 4095u</code>, because the macro parameter was not in parentheses. <code>MAX(peak, adc_read())</code> pasted the call into both the comparison and the result, so the ADC was read again whenever the new sample was larger, consuming an extra sample and returning a value that was never compared.',
    solution: C`
#include <stdint.h>

#define ADC_FULL_SCALE_MV  3300u
#define ADC_MAX_COUNT      4095u

/* Convert a 12-bit ADC count to millivolts, rounding down. */
#define ADC_TO_MV(count)   ((count) * ADC_FULL_SCALE_MV / ADC_MAX_COUNT)

/* The larger of two values. */
#define MAX(a, b)          ((a) > (b) ? (a) : (b))

/* Provided by the HAL: start a conversion, wait for it and return the
   12-bit result. Every call consumes one new sample. */
uint16_t adc_read(void);

/* Take n samples (n >= 1) and return the largest one in millivolts, after
   subtracting the board's fixed offset. offset_counts is never larger
   than a sample. */
uint32_t adc_peak_mv(unsigned n, uint16_t offset_counts)
{
    uint16_t peak = 0u;

    for (unsigned i = 0u; i < n; i++) {
        uint16_t sample = adc_read();
        peak = MAX(peak, sample);
    }
    return ADC_TO_MV(peak - offset_counts);
}
`,
  },
  bug_hex_checksum: {
    hints: [
      'One bug is in the summing loop of <code>frame_sum16</code>; the other is in what <code>sum16_to_hex</code> leaves in <code>out</code> after the loop. Try a frame containing the byte 0x80.',
      'The first is a sign-extension bug: plain <code>char</code> is signed here, so bytes 0x80 to 0xFF are added as negative numbers. The second is a string that is never terminated.',
      'Add <code>(uint8_t)frame[i]</code> so each byte counts as 0 to 255, and write <code>out[4] = \'\\0\';</code> after the loop. The original only looked right because test buffers happened to hold a zero after the four digits.',
    ],
    explain: '<code>sum += frame[i]</code> promoted a signed <code>char</code> such as 0x80 to the <code>int</code> -128, so binary bytes were subtracted instead of added; casting to <code>uint8_t</code> first makes every byte 0 to 255. <code>sum16_to_hex</code> wrote four digits but no NUL, so the caller\'s string ran on into whatever followed in memory.',
    solution: C`
#include <stddef.h>
#include <stdint.h>

static const char hex_digits[] = "0123456789ABCDEF";

/* 16-bit additive checksum: the sum of every byte of the frame, each byte
   taken as an unsigned value 0..255, modulo 65536. */
uint16_t frame_sum16(const char *frame, size_t len)
{
    uint16_t sum = 0u;

    for (size_t i = 0u; i < len; i++) {
        sum += (uint8_t)frame[i];
    }
    return sum;
}

/* Write sum as exactly four uppercase hex digits followed by a NUL, so out
   must hold at least 5 bytes. 0x01AF becomes "01AF". */
void sum16_to_hex(uint16_t sum, char *out)
{
    for (int i = 0; i < 4; i++) {
        out[i] = hex_digits[(sum >> (12 - 4 * i)) & 0xFu];
    }
    out[4] = '\0';
}

/* Append the checksum of frame[0..len) as hex text at frame + len. The
   caller guarantees room for 5 more bytes. Return the new length. */
size_t frame_append_sum(char *frame, size_t len)
{
    sum16_to_hex(frame_sum16(frame, len), frame + len);
    return len + 4u;
}
`,
  },
  bug_be_counters: {
    hints: [
      'One bug is in the return expression of <code>be32_read</code>; the other is in the copy loop of <code>parse_counters</code>. Try a counter whose first byte is 0x80, and count how many elements of <code>out</code> the loop writes.',
      'The first is integer promotion: <code>p[0]</code> becomes a signed <code>int</code> before the shift, so <code>0x80 &lt;&lt; 24</code> overflows. The second is an off-by-one in the loop bound.',
      'Cast before shifting: <code>((uint32_t)p[0] &lt;&lt; 24)</code> (and the same for the other bytes), and loop with <code>i &lt; n</code>. With <code>&lt;=</code> the loop copies <code>n + 1</code> counters and writes one element past what the caller allowed.',
    ],
    explain: 'A <code>uint8_t</code> is promoted to <code>int</code> before <code>&lt;&lt;</code>, so <code>p[0] &lt;&lt; 24</code> with <code>p[0] &gt;= 0x80</code> shifts into the sign bit, which is undefined behaviour; casting to <code>uint32_t</code> first keeps the shift unsigned. The loop bound <code>i &lt;= n</code> copied one counter too many, writing past the <code>max</code> elements the caller provided and reading past the counters in the frame.',
    solution: C`
#include <stddef.h>
#include <stdint.h>

/* Read a big-endian (network order) 32-bit value from p. */
uint32_t be32_read(const uint8_t *p)
{
    return ((uint32_t)p[0] << 24) | ((uint32_t)p[1] << 16) | ((uint32_t)p[2] << 8) | p[3];
}

/* A counters report is one count byte N followed by N big-endian 32-bit
   counters. Copy the first min(N, max) counters into out and return how
   many were copied. Return -1 if len is too short to hold all N. */
int parse_counters(const uint8_t *frame, size_t len, uint32_t *out, size_t max)
{
    if (len < 1u) {
        return -1;
    }
    size_t n = frame[0];
    if (len < 1u + 4u * n) {
        return -1;
    }
    if (n > max) {
        n = max;
    }
    for (size_t i = 0u; i < n; i++) {
        out[i] = be32_read(&frame[1u + 4u * i]);
    }
    return (int)n;
}
`,
  },
  bug_tick_timeout: {
    hints: [
      'One bug is in the arithmetic of <code>ms_to_ticks</code>; the other is the comparison in <code>tick_expired</code>. Try 1500 ms, and a deadline just after the counter wraps to 0.',
      'The first is integer division done before multiplication, which throws away the remainder. The second is a direct comparison of two wrapping tick values.',
      'Multiply first: <code>ms * TICK_HZ / 1000u</code> (one hour is 3,686,400,000, which still fits in 32 bits). Compare the difference instead of the values: <code>(now - deadline) &lt; 0x80000000u</code>. The unsigned subtraction wraps the same way the counter does, so it measures how far <code>now</code> is past the deadline.',
    ],
    explain: '<code>ms / 1000u * TICK_HZ</code> dropped everything below a whole second, so 1500 ms became 1024 ticks and 10 ms became 0; multiplying first keeps the precision. <code>now &gt;= deadline</code> is wrong once a deadline wraps past 0 (it looks smaller than <code>now</code>, so it fires at once) or <code>now</code> wraps (it looks smaller than the deadline); testing whether the unsigned difference <code>now - deadline</code> is below 2^31 works across the wrap.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

#define TICK_HZ 1024u   /* the RTC tick interrupt runs at 1024 Hz */

/* Convert milliseconds to ticks, rounding down. ms is at most 3600000
   (one hour). */
uint32_t ms_to_ticks(uint32_t ms)
{
    return ms * TICK_HZ / 1000u;
}

/* The tick counter is a free-running uint32_t that wraps to 0 about every
   48.5 days. Return the tick at which a timeout of ms starting at now
   expires. */
uint32_t deadline_after(uint32_t now, uint32_t ms)
{
    return now + ms_to_ticks(ms);
}

/* Return true once now has reached or passed deadline. This must keep
   working when the counter wraps between the start and the deadline;
   timeouts are always shorter than 2^31 ticks. */
bool tick_expired(uint32_t now, uint32_t deadline)
{
    return (now - deadline) < 0x80000000u;
}
`,
  },
  bug_encoder_fuse: {
    hints: [
      'One bug is in the return expression of <code>status_quality</code>; the other is in <code>midpoint_u32</code>. Work out <code>status_quality(0xA3)</code> by hand, and try two positions near <code>UINT32_MAX</code>.',
      'The first is operator precedence: <code>&gt;&gt;</code> binds tighter than <code>&amp;</code>. The second is unsigned overflow: <code>a + b</code> wraps before the division.',
      'Write <code>(status &amp; ST_QUALITY_MASK) &gt;&gt; ST_QUALITY_SHIFT</code>; without the parentheses it masked with <code>0xF0 &gt;&gt; 4</code>, which is <code>0x0F</code>, and returned the valid bits. For the midpoint, halve before adding: <code>a / 2u + b / 2u + (a &amp; b &amp; 1u)</code>, where the last term adds back the 1 lost when both are odd.',
    ],
    explain: '<code>status &amp; ST_QUALITY_MASK &gt;&gt; ST_QUALITY_SHIFT</code> parsed as <code>status &amp; (0xF0 &gt;&gt; 4)</code>, so it returned bits 3 to 0 instead of 7 to 4. <code>(a + b) / 2u</code> wraps modulo 2^32 when the sum passes <code>UINT32_MAX</code>, so large positions came out near zero; halving each operand first cannot overflow.',
    solution: C`
#include <stdbool.h>
#include <stdint.h>

/* Status byte from the dual encoder front end:
   bit 0      encoder A reading valid
   bit 1      encoder B reading valid
   bits 7..4  signal quality, 0 (worst) to 15 (best) */
#define ST_A_VALID        0x01u
#define ST_B_VALID        0x02u
#define ST_QUALITY_MASK   0xF0u
#define ST_QUALITY_SHIFT  4u
#define MIN_QUALITY       4u

/* Return the 4-bit signal quality field. */
unsigned status_quality(uint8_t status)
{
    return (status & ST_QUALITY_MASK) >> ST_QUALITY_SHIFT;
}

/* Midpoint of two positions, rounded down. Positions use the full
   uint32_t range. */
uint32_t midpoint_u32(uint32_t a, uint32_t b)
{
    return a / 2u + b / 2u + (a & b & 1u);
}

/* Fuse the two encoder positions into *pos. Return false if the quality
   is below MIN_QUALITY or neither reading is valid. */
bool encoder_fuse(uint32_t a, uint32_t b, uint8_t status, uint32_t *pos)
{
    bool a_ok = (status & ST_A_VALID) != 0u;
    bool b_ok = (status & ST_B_VALID) != 0u;

    if (status_quality(status) < MIN_QUALITY || (!a_ok && !b_ok)) {
        return false;
    }
    *pos = (a_ok && b_ok) ? midpoint_u32(a, b) : (a_ok ? a : b);
    return true;
}
`,
  },
  bug_uart_ring: {
    hints: [
      'All three bugs are in <code>rb_put</code> and <code>rb_get</code>; <code>rb_init</code>, <code>rb_count</code> and <code>rb_read</code> are correct. For each, compare the code with the comment above the struct, and trace 9 puts into an empty FIFO.',
      'One is a full test with the wrong boundary. One is an order-of-operations bug: the index is advanced before the byte is stored. One is an array index that is never wrapped into range.',
      'Refuse the byte when <code>rb_count(rb) &gt;= RB_SIZE</code>; write <code>rb->buf[rb->head &amp; RB_MASK] = byte; rb->head++;</code> so the byte goes into the slot <code>rb_get</code> reads next (and the ISR publishes it only once it is stored); and read <code>rb->buf[rb->tail &amp; RB_MASK]</code>, because <code>tail</code> counts up to 255 and indexes far past the 8-byte array.',
    ],
    explain: 'The full test <code>&gt; RB_SIZE</code> let a ninth byte in, overwriting the oldest one. The pre-increment <code>++rb-&gt;head</code> stored each byte one slot ahead of where <code>rb_get</code> looks, and advanced <code>head</code> before the data was there for a concurrent reader. <code>rb_get</code> indexed with the raw free-running <code>tail</code>, which runs past the end of <code>buf</code> after 8 bytes; it must be masked like <code>head</code>.',
    solution: C`
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#define RB_SIZE 8u                  /* a power of two that divides 256 */
#define RB_MASK (RB_SIZE - 1u)

/* head and tail are free-running counters that wrap at 256. The ISR
   stores a byte and then advances head; the main loop takes a byte and
   then advances tail. Index the array with counter & RB_MASK. */
typedef struct {
    uint8_t buf[RB_SIZE];
    uint8_t head;
    uint8_t tail;
} uart_rb_t;

void rb_init(uart_rb_t *rb) { rb->head = 0u; rb->tail = 0u; }

/* Number of bytes stored, 0..RB_SIZE. */
size_t rb_count(const uart_rb_t *rb) { return (uint8_t)(rb->head - rb->tail); }

/* Called from the RX interrupt. Return false and drop the byte if full. */
bool rb_put(uart_rb_t *rb, uint8_t byte)
{
    if (rb_count(rb) >= RB_SIZE) {
        return false;
    }
    rb->buf[rb->head & RB_MASK] = byte;
    rb->head++;
    return true;
}

/* Take the oldest byte. Return false if the FIFO is empty. */
bool rb_get(uart_rb_t *rb, uint8_t *out)
{
    if (rb->head == rb->tail) {
        return false;
    }
    *out = rb->buf[rb->tail & RB_MASK];
    rb->tail++;
    return true;
}

/* Copy up to max bytes into dst in FIFO order; return how many. */
size_t rb_read(uart_rb_t *rb, uint8_t *dst, size_t max)
{
    size_t n = 0u;
    while (n < max && rb_get(rb, &dst[n])) {
        n++;
    }
    return n;
}
`,
  },
};
