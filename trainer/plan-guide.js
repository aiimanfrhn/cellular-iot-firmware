/* ---------------------------------------------------------------------------
 * Study guide and quiz for each day of the training plan, in the same order
 * as PLAN in plan.js (one entry per day). app.js shows them with the concept
 * quiz's guide and quiz views.
 *
 * Each day has:
 *   intro, sections [{ title, body }], tips   the study guide; the sections
 *                                             answer that day's study items
 *   quiz                                      questions in the quiz.js format
 *                                             (id, prompt, options, answer,
 *                                             explain); ids start with dN_
 * All text is static trusted HTML. Keep question ids stable once published.
 * ------------------------------------------------------------------------- */

export const DAY_GUIDES = [
  /* ================================================================= Day 1 */
  {
    intro: 'Bit manipulation is the warm-up question in almost every firmware interview, and register code is built from it. Today: the idioms, why everything should be unsigned, and where variables live.',
    sections: [
      {
        title: 'The four bit idioms',
        body: `<pre><code>x |=  (1u &lt;&lt; n);          /* set bit n    */
x &amp;= ~(1u &lt;&lt; n);          /* clear bit n  */
x ^=  (1u &lt;&lt; n);          /* toggle bit n */
bool on = (x &gt;&gt; n) &amp; 1u;  /* test bit n   */</code></pre>
<p>A <b>field</b> of <i>w</i> bits at position <i>s</i>:</p>
<pre><code>mask  = (1u &lt;&lt; w) - 1u;
value = (reg &gt;&gt; s) &amp; mask;                       /* read  */
reg   = (reg &amp; ~(mask &lt;&lt; s)) | ((value &amp; mask) &lt;&lt; s); /* write */</code></pre>
<p>Two tricks that come up: <code>x &amp; (x - 1)</code> clears the lowest set bit (loop it to count bits), and <code>x != 0 &amp;&amp; (x &amp; (x - 1)) == 0</code> tests for a power of two.</p>`,
      },
      {
        title: 'volatile, and three places drivers need it',
        body: `<p><code>volatile</code> makes the compiler perform every access in the source, because the value can change, or the access has an effect, outside the code it can see.</p>
<ul>
<li><b>Memory-mapped registers</b>: a status register changes by itself; writing a data register sends a byte.</li>
<li><b>Variables shared with an interrupt handler</b> (or a signal handler).</li>
<li><b>Memory written by DMA</b> or by another core that the CPU then polls.</li>
</ul>
<p>It does not make anything atomic, and plain local variables used only by one function never need it.</p>`,
      },
      {
        title: 'Why 1 &lt;&lt; 31 is undefined but 1u &lt;&lt; 31 is fine',
        body: `<p><code>1</code> is a signed <code>int</code>. With a 32-bit <code>int</code>, the result 2<sup>31</sup> does not fit (the maximum is 2<sup>31</sup> − 1), and signed overflow is undefined behaviour. <code>1u</code> is unsigned, where 2<sup>31</sup> fits and overflow would simply wrap. Shifting by the width of the type or more (<code>1u &lt;&lt; 32</code>) is undefined for both.</p>`,
      },
      {
        title: 'Where variables live',
        body: `<ul>
<li>Initialised globals and <code>static</code> variables (including static locals): <code>.data</code>, in RAM, with the initial values copied from flash at start-up.</li>
<li>Zero or uninitialised globals and statics: <code>.bss</code>, zeroed at start-up.</li>
<li>String literals and <code>const</code> globals: <code>.rodata</code>, usually flash. Writing to a string literal is undefined behaviour.</li>
<li>Ordinary locals: the stack. <code>malloc</code> memory: the heap.</li>
</ul>`,
      },
    ],
    tips: [
      'Write masks with unsigned constants (1u, UINT32_C(1)) and say why.',
      'Name your three volatile examples without hesitating: registers, ISR-shared variables, DMA buffers.',
    ],
    quiz: [
      {
        id: 'd1_clear_bit',
        prompt: 'Which line clears bit <code>n</code> of <code>x</code> and leaves the other bits alone?',
        options: ['<code>x &amp;= (1u &lt;&lt; n);</code>', '<code>x ^= (1u &lt;&lt; n);</code>', '<code>x &amp;= ~(1u &lt;&lt; n);</code>', '<code>x |= ~(1u &lt;&lt; n);</code>'],
        answer: 2,
        explain: 'AND with a mask that is all ones except bit <code>n</code>. The first line clears every other bit, the second toggles, and the last sets every bit except <code>n</code>.',
      },
      {
        id: 'd1_lowest_bit',
        prompt: 'What does <code>x &amp; (x - 1)</code> do?',
        options: ['Rounds <code>x</code> down to a power of two.', 'Clears the lowest set bit of <code>x</code>.', 'Returns the lowest set bit of <code>x</code>.', 'Sets the lowest clear bit of <code>x</code>.'],
        answer: 1,
        explain: 'Subtracting 1 flips the lowest set bit and every zero below it, so the AND removes that bit. Repeating it until <code>x</code> is 0 counts the set bits, and the result is 0 after one step only when <code>x</code> is a power of two (or 0).',
      },
      {
        id: 'd1_field_read',
        prompt: 'A 3-bit field occupies bits 4–6 of <code>reg</code>. Which expression reads it?',
        options: ['<code>(reg &gt;&gt; 4) &amp; 0x7u</code>', '<code>reg &amp; 0x70u</code>', '<code>(reg &amp; 0x7u) &gt;&gt; 4</code>', '<code>reg &gt;&gt; 6</code>'],
        answer: 0,
        explain: 'Shift the field down to bit 0, then mask its width. <code>reg &amp; 0x70u</code> isolates the field but leaves it shifted (multiplied by 16).',
      },
      {
        id: 'd1_string_literal',
        prompt: 'With <code>char *s = "hello";</code>, what happens on <code>s[0] = \'H\';</code>?',
        options: ['The string becomes "Hello".', 'It does not compile.', 'Only the local copy on the stack changes.', 'Undefined behaviour: string literals are read-only (typically in <code>.rodata</code>/flash), so it may crash or silently do nothing.'],
        answer: 3,
        explain: 'Declare it <code>const char *s</code> so the compiler catches the write. If you need a modifiable string, use an array: <code>char s[] = "hello";</code> copies the literal into writable memory.',
      },
      {
        id: 'd1_volatile_not_needed',
        prompt: 'Which of these does <b>not</b> need <code>volatile</code>?',
        options: ['A pointer to a UART status register.', 'A local loop counter used only inside one function.', 'A flag set by an interrupt handler and polled by <code>main</code>.', 'A buffer that a DMA engine fills while the CPU polls a byte in it.'],
        answer: 1,
        explain: 'Nothing outside the function can change a local counter, so the compiler is free to keep it in a register. Adding <code>volatile</code> there only makes the code slower.',
      },
    ],
  },

  /* ================================================================= Day 2 */
  {
    intro: 'Today is about reading declarations precisely and knowing what the compiler does with pointer arithmetic, arrays and struct layout.',
    sections: [
      {
        title: 'const and pointers',
        body: `<p>Read declarations from the name outwards, right to left:</p>
<ul>
<li><code>const int *p</code> (same as <code>int const *p</code>): pointer to const int. You may change <code>p</code>, not <code>*p</code>.</li>
<li><code>int *const p</code>: const pointer to int. You may change <code>*p</code>, not <code>p</code>.</li>
<li><code>const int *const p</code>: neither can change.</li>
</ul>
<p>Use <code>const T *</code> for every input parameter a function only reads; it documents intent and lets the compiler catch mistakes.</p>`,
      },
      {
        title: 'Arrays versus pointers',
        body: `<pre><code>int a[10];
sizeof(a);              /* 40: the whole array      */
void f(int a[10]) {
    sizeof(a);          /* 4 or 8: a is an int *    */
}</code></pre>
<p>An array used in an expression (including as a function argument) decays to a pointer to its first element, so the function never sees the length. Pass it separately. <code>sizeof(a) / sizeof(a[0])</code> only works where the array itself is in scope.</p>
<p>Pointer arithmetic is in elements, not bytes: if <code>p</code> is a <code>uint32_t *</code> at 0x1000, <code>p + 1</code> is 0x1004.</p>`,
      },
      {
        title: 'Struct layout, padding and packed',
        body: `<pre><code>struct { char a; int b; char c; }   /* a, 3 pad, b, c, 3 pad = 12 */
struct { int b; char a; char c; }   /* b, a, c, 2 pad        = 8  */</code></pre>
<p>Each member is aligned to its own alignment, and the size is rounded up so arrays of the struct stay aligned. Order members from largest to smallest to shrink it.</p>
<p><code>__attribute__((packed))</code> removes padding. Use it only for exact external layouts, and know the cost: members may be unaligned, so access is slower or faults on some cores, and taking the address of a packed member gives a misaligned pointer.</p>`,
      },
      {
        title: 'Aligning addresses and moving memory',
        body: `<p>Round <code>x</code> up to a power-of-two alignment <code>a</code>: <code>(x + a - 1) &amp; ~(a - 1)</code>. For example 13 aligned to 8 is 16.</p>
<p><code>memmove</code> handles overlapping buffers by copying backwards when the destination is above the source; <code>memcpy</code> with overlap is undefined.</p>`,
      },
    ],
    tips: [
      'Read const declarations right to left, out loud, when asked.',
      'Mention that packed structs trade RAM for slower or faulting unaligned access.',
    ],
    quiz: [
      {
        id: 'd2_const_ptr',
        prompt: 'Given <code>const int *p = &amp;x;</code>, which statement compiles?',
        options: ['<code>*p = 5;</code>', '<code>p = &amp;y;</code>', 'Neither.', 'Both.'],
        answer: 1,
        explain: '<code>p</code> points to a <code>const int</code>: the pointed-to value is read-only through <code>p</code>, but the pointer itself can be redirected.',
      },
      {
        id: 'd2_ptr_const',
        prompt: 'Given <code>int *const p = &amp;x;</code>, which statement compiles?',
        options: ['<code>*p = 5;</code>', '<code>p = &amp;y;</code>', 'Neither.', 'Both.'],
        answer: 0,
        explain: 'Here the pointer is const: it must always point at <code>x</code>, but <code>x</code> can be changed through it. Memory-mapped register pointers are often declared this way.',
      },
      {
        id: 'd2_ptr_arith',
        prompt: '<code>uint32_t *p = (uint32_t *)0x1000;</code> What address is <code>p + 3</code>?',
        options: ['<code>0x1003</code>', '<code>0x1018</code>', '<code>0x1030</code>', '<code>0x100C</code>'],
        answer: 3,
        explain: 'Pointer arithmetic moves in elements: 3 × <code>sizeof(uint32_t)</code> = 12 bytes, so 0x1000 + 0xC.',
      },
      {
        id: 'd2_align_up',
        prompt: 'What does <code>(x + 7) &amp; ~7u</code> compute?',
        options: ['<code>x</code> rounded down to a multiple of 8.', '<code>x</code> modulo 8.', '<code>x</code> rounded up to a multiple of 8.', '<code>x</code> divided by 8.'],
        answer: 2,
        explain: 'Adding 7 pushes any value that is not already a multiple of 8 past the next boundary, and clearing the low three bits drops back to that boundary. It works for any power-of-two alignment: <code>(x + a - 1) &amp; ~(a - 1)</code>.',
      },
      {
        id: 'd2_packed_cost',
        prompt: 'What is the main cost of marking a struct <code>__attribute__((packed))</code>?',
        options: ['Members can be unaligned, so access is slower, or faults on some CPUs, and pointers to members may be misaligned.', 'The struct uses more RAM.', 'The struct can no longer be passed to functions.', 'It disables all compiler optimisation for the file.'],
        answer: 0,
        explain: 'The compiler has to generate byte-by-byte access for unaligned members on strict-alignment cores. Packed structs are for matching exact external layouts, not for general use.',
      },
    ],
  },

  /* ================================================================= Day 3 */
  {
    intro: 'Linked lists test whether you can manipulate pointers without losing nodes. Practise drawing the boxes and arrows before writing code.',
    sections: [
      {
        title: 'Reverse a list',
        body: `<pre><code>struct node *reverse(struct node *head)
{
    struct node *prev = NULL;
    while (head) {
        struct node *next = head-&gt;next;  /* save before overwriting */
        head-&gt;next = prev;
        prev = head;
        head = next;
    }
    return prev;
}</code></pre>
<p>O(n) time, O(1) extra space. Test it on an empty list, one node and two nodes.</p>`,
      },
      {
        title: 'Cycles and the middle: slow and fast pointers',
        body: `<p>Move <code>slow</code> one step and <code>fast</code> two steps. If there is a cycle, they meet inside it (Floyd's algorithm); if <code>fast</code> reaches NULL, there is none. When <code>fast</code> reaches the end of a list without a cycle, <code>slow</code> is at the middle. Both use O(1) memory, unlike recording visited nodes.</p>`,
      },
      {
        title: 'Deleting with a pointer to a pointer',
        body: `<pre><code>void remove_value(struct node **pp, int value)
{
    while (*pp) {
        if ((*pp)-&gt;value == value) {
            struct node *dead = *pp;
            *pp = dead-&gt;next;      /* works for the head too */
            free(dead);
            return;
        }
        pp = &amp;(*pp)-&gt;next;
    }
}</code></pre>
<p><code>pp</code> points at whichever link refers to the current node: the head pointer at first, then a <code>next</code> field. So there is no special case for deleting the head.</p>`,
      },
      {
        title: 'The Linux kernel list',
        body: `<p>Instead of a list of nodes that point at data, the kernel embeds a <code>struct list_head { next, prev }</code> inside each object. One set of list functions then works for every type. <code>container_of(ptr, type, member)</code> gets back to the enclosing object by subtracting <code>offsetof(type, member)</code> from the address of the embedded member. An object can be on several lists at once by embedding several <code>list_head</code>s.</p>`,
      },
      {
        title: 'Array or linked list?',
        body: `<ul>
<li>Lookup by index: array O(1), list O(n).</li>
<li>Insert or delete at a known position: list O(1) (given the node), array O(n) to shift elements.</li>
<li>Cache behaviour: arrays are contiguous, so traversal uses whole cache lines and the prefetcher helps. Lists chase pointers to scattered memory, so in practice arrays are often faster even when the big-O looks worse.</li>
</ul>`,
      },
    ],
    tips: [
      'Say your edge cases before coding: empty list, one node, deleting the head.',
      'Mention container_of if the role involves Linux; it shows you know real kernel code.',
    ],
    quiz: [
      {
        id: 'd3_reverse_cost',
        prompt: 'What are the time and extra-space costs of reversing a singly linked list in place with the three-pointer loop?',
        options: ['O(n) time, O(n) space.', 'O(n²) time, O(1) space.', 'O(log n) time, O(1) space.', 'O(n) time, O(1) space.'],
        answer: 3,
        explain: 'Each node is visited once and only three pointers are kept. The recursive version is also O(n) time, but uses O(n) stack, which matters on a small embedded stack.',
      },
      {
        id: 'd3_floyd',
        prompt: 'In Floyd\'s cycle detection, how do you know the list has a cycle?',
        options: ['The slow pointer reaches NULL.', 'The fast pointer and the slow pointer point at the same node.', 'The fast pointer visits the head twice.', 'The list is longer than a fixed limit.'],
        answer: 1,
        explain: 'Inside a cycle the fast pointer gains one node per step, so it must land on the slow one. Without a cycle, the fast pointer reaches NULL first.',
      },
      {
        id: 'd3_ptr_to_ptr',
        prompt: 'Why delete list nodes through a <code>struct node **</code>?',
        options: ['It removes the special case for deleting the head, because the same code updates the head pointer or a <code>next</code> field.', 'It is faster because it skips half the nodes.', 'It avoids calling <code>free</code>.', 'It is required for doubly linked lists.'],
        answer: 0,
        explain: 'The pointer-to-pointer always refers to the link that points at the current node. Assigning through it relinks the list wherever that link is.',
      },
      {
        id: 'd3_container_of',
        prompt: 'What does the kernel\'s <code>container_of(ptr, type, member)</code> do?',
        options: ['Allocates a new <code>type</code> containing <code>member</code>.', 'Searches a list for the node whose <code>member</code> equals <code>ptr</code>.', 'Returns the address of the enclosing <code>type</code> object, by subtracting the member\'s offset from <code>ptr</code>.', 'Checks at run time that <code>ptr</code> points at a valid object.'],
        answer: 2,
        explain: 'It is pure address arithmetic: <code>(type *)((char *)ptr - offsetof(type, member))</code>, plus a compile-time type check. That is how a <code>list_head</code> embedded in a struct leads back to the struct.',
      },
      {
        id: 'd3_cache',
        prompt: 'Why is summing an array usually much faster than summing a linked list of the same values?',
        options: ['Arrays use less memory per element, nothing else.', 'Array elements are contiguous, so each cache line holds several of them and the prefetcher can load ahead; list nodes can be scattered.', 'The compiler cannot loop over a linked list.', 'Linked lists must be traversed recursively.'],
        answer: 1,
        explain: 'Both are O(n), but each list step can be a cache miss costing tens to hundreds of cycles. Memory layout often matters more than the big-O on modern CPUs.',
      },
    ],
  },

  /* ================================================================= Day 4 */
  {
    intro: 'C strings are just bytes ending in a zero, so string code is where most buffer overflows come from. Today: safe copying and parsing, and the attacks you must be able to explain.',
    sections: [
      {
        title: 'Strings, lengths and safe copies',
        body: `<p><code>char s[16] = "hi";</code> has <code>sizeof(s)</code> 16 and <code>strlen(s)</code> 2. Every copy must leave room for the terminating <code>'\\0'</code>.</p>
<ul>
<li><code>strcpy</code> has no size limit: never use it with outside input.</li>
<li><code>strncpy(dst, src, n)</code> does <b>not</b> terminate <code>dst</code> when <code>src</code> is <code>n</code> characters or longer, and pads with zeros otherwise.</li>
<li>Prefer <code>snprintf(dst, size, "%s", src)</code> or <code>strlcpy</code> where available: both always terminate and report truncation.</li>
</ul>`,
      },
      {
        title: 'Parsing numbers and commands',
        body: `<p>When parsing an unsigned number digit by digit, check for overflow <i>before</i> multiplying:</p>
<pre><code>if (value &gt; (UINT32_MAX - digit) / 10u) return -1;  /* would overflow */
value = value * 10u + digit;</code></pre>
<p>Reject empty strings, signs you do not accept, and trailing junk. With <code>strtoul</code>, check <code>errno</code> for <code>ERANGE</code> and that <code>endptr</code> moved and points at the end. To split a command line in place, replace separators with <code>'\\0'</code> and record a pointer to the start of each word, with a limit on the number of words.</p>`,
      },
      {
        title: 'Stack buffer overflows',
        body: `<p>Writing past a local array overwrites what is above it on the stack: other locals, saved registers and the <b>return address</b>. An attacker who controls the input can make the function "return" into code of their choice.</p>
<ul>
<li>A <b>stack canary</b> is a random value placed below the return address and checked before returning; if it changed, the program aborts.</li>
<li><b>ASLR</b> randomises where the stack, heap and libraries are, so attackers cannot hard-code addresses.</li>
<li><b>Non-executable stacks</b> (NX/DEP) stop injected code from running there.</li>
</ul>
<p>These make attacks harder; the fix is still bounds-checked code.</p>`,
      },
      {
        title: 'Format string bugs',
        body: `<p><code>printf(user_input)</code> lets the input choose the format. <code>%x</code> or <code>%s</code> read values the caller never passed (leaking stack contents), and <code>%n</code> <i>writes</i> to memory. Always write <code>printf("%s", user_input)</code>, and compile with <code>-Wformat-security</code>.</p>`,
      },
      {
        title: 'Reversing in place',
        body: `<p>Reverse a string with two indices moving inwards, swapping as they go. To reverse the <i>words</i> of a sentence in place, reverse the whole string, then reverse each word back.</p>`,
      },
    ],
    tips: [
      'When you write string code, say where the terminator goes and what happens on truncation.',
      'Explain overflow mitigations as layers: bounds checks first, then canaries, ASLR and NX.',
    ],
    quiz: [
      {
        id: 'd4_sizeof_strlen',
        prompt: 'For <code>char s[16] = "hi";</code>, what are <code>sizeof(s)</code> and <code>strlen(s)</code>?',
        options: ['3 and 2', '16 and 3', '16 and 2', '2 and 2'],
        answer: 2,
        explain: '<code>sizeof</code> is the size of the array object; <code>strlen</code> counts characters before the first <code>\'\\0\'</code>, not including it.',
      },
      {
        id: 'd4_strncpy',
        prompt: 'What can go wrong with <code>strncpy(dst, src, sizeof dst);</code>?',
        options: ['Nothing; it always terminates the string.', 'It can write one byte past the end of <code>dst</code>.', 'It fails to compile when <code>src</code> is longer.', 'If <code>src</code> is at least <code>sizeof dst</code> characters long, <code>dst</code> is left without a terminating <code>\'\\0\'</code>.'],
        answer: 3,
        explain: 'Later string functions then read past the end of <code>dst</code>. Use <code>snprintf</code> or <code>strlcpy</code>, or terminate explicitly: <code>dst[sizeof dst - 1] = \'\\0\';</code>.',
      },
      {
        id: 'd4_format_string',
        prompt: 'Why is <code>printf(user_input);</code> dangerous?',
        options: ['The input controls the format: <code>%x</code> can leak stack data and <code>%n</code> can write to memory.', 'It is slower than <code>puts</code>.', 'It cannot print strings longer than 256 characters.', 'Only because the output is not flushed.'],
        answer: 0,
        explain: 'Pass user data as an argument, never as the format: <code>printf("%s", user_input)</code>.',
      },
      {
        id: 'd4_canary',
        prompt: 'What does a stack canary do?',
        options: ['Makes the stack non-executable.', 'Detects that a buffer overflow has overwritten the area below the return address, and aborts before the function returns.', 'Prevents all buffer overflows.', 'Randomises the address of the stack.'],
        answer: 1,
        explain: 'It detects the overwrite; it does not prevent it, and it does not catch overflows that skip the canary or corrupt other locals. Randomising addresses is ASLR, and a non-executable stack is NX.',
      },
      {
        id: 'd4_parse_overflow',
        prompt: 'While parsing a decimal <code>uint32_t</code>, which check correctly detects that <code>value * 10 + digit</code> would overflow?',
        options: ['<code>if (value * 10 + digit &gt; UINT32_MAX)</code>', '<code>if (value * 10 + digit &lt; value)</code>', '<code>if (value &gt; (UINT32_MAX - digit) / 10)</code>', '<code>if (digit &gt; 9)</code>'],
        answer: 2,
        explain: 'Check before doing the arithmetic. The first test can never be true because the result has already wrapped, and the wrap-around test misses cases where the result wraps to a value that is still bigger than <code>value</code>.',
      },
    ],
  },

  /* ================================================================= Day 5 */
  {
    intro: 'Platform and real-time code must not fail or stall because of memory management. Today: pools, ring buffers, and the classic memory bugs and how to find them.',
    sections: [
      {
        title: 'Why avoid malloc in hot paths',
        body: `<ul>
<li><b>Timing</b>: allocation may search free lists or take a lock, so its run time is not bounded.</li>
<li><b>Fragmentation</b>: after many allocations and frees of mixed sizes, free memory is split into small holes and a large request fails even though enough memory is free in total.</li>
<li><b>Failure</b>: every allocation can return NULL, and handling that in an interrupt or packet path is hard.</li>
</ul>`,
      },
      {
        title: 'Fixed-block pools',
        body: `<p>A pool is an array of equal-sized blocks plus a <b>free list</b> threaded through the unused blocks. Allocation pops the head of the free list, and freeing pushes the block back: both O(1), with no fragmentation, because every block is interchangeable. Use one pool per object size (packet buffers, timers, messages), and check in <code>free</code> that the pointer really is a block of this pool.</p>`,
      },
      {
        title: 'Ring buffers between an ISR and a thread',
        body: `<p>A ring buffer has a <code>head</code> (written only by the producer) and a <code>tail</code> (written only by the consumer). With one producer and one consumer, no lock is needed:</p>
<ul>
<li>The producer writes the data first, then advances <code>head</code>. The consumer reads the data, then advances <code>tail</code>. On a multi-core system, put a memory barrier (or use C11 release/acquire atomics) between writing the data and publishing the index.</li>
<li><code>head == tail</code> means empty. To tell full from empty, leave one slot unused (full when <code>next(head) == tail</code>) or keep a separate count.</li>
<li>A power-of-two size lets you wrap indices with <code>&amp; (SIZE - 1)</code> instead of <code>%</code>.</li>
</ul>
<p>You need a lock once there are several producers or several consumers.</p>`,
      },
      {
        title: 'Leaks, double frees and use-after-free',
        body: `<ul>
<li><b>Leak</b>: memory that is never freed, so usage grows until allocation fails. Watch heap usage over time; valgrind and LeakSanitizer report the allocation site.</li>
<li><b>Double free</b>: freeing the same block twice corrupts the allocator's data. Set pointers to NULL after freeing.</li>
<li><b>Use-after-free</b>: using memory after it was freed, often after it has been reused for something else. AddressSanitizer catches it immediately with both stack traces.</li>
</ul>`,
      },
    ],
    tips: [
      'For a pool, mention O(1) allocation, no fragmentation, and checking pointers on free.',
      'For a ring buffer, say which side writes which index, and how you tell full from empty.',
    ],
    quiz: [
      {
        id: 'd5_pool',
        prompt: 'Why does a fixed-block pool never fragment?',
        options: ['It compacts memory in the background.', 'It only allows one allocation at a time.', 'Every block is the same size, so any free block can satisfy any request.', 'It allocates from the stack instead of the heap.'],
        answer: 2,
        explain: 'Fragmentation happens when holes are the wrong size for the request. With equal-sized blocks, any free block fits, and allocation is just popping the free list.',
      },
      {
        id: 'd5_ring_full',
        prompt: 'A ring buffer treats <code>head == tail</code> as empty. How can it tell when it is full?',
        options: ['Keep one slot always unused, so it is full when advancing <code>head</code> would make it equal <code>tail</code>; or keep a separate count.', 'It is full when <code>head == tail</code> as well.', 'Check whether the next slot contains zero.', 'It cannot; ring buffers are never full.'],
        answer: 0,
        explain: 'With N slots and both indices in 0..N-1 there are only N distinct differences, but N + 1 fill levels (0 to N). Sacrificing a slot or tracking a count resolves it.',
      },
      {
        id: 'd5_publish_order',
        prompt: 'In a lock-free single-producer ring buffer, in which order must the producer act?',
        options: ['Advance <code>head</code>, then write the data.', 'Write the data into the slot, then advance <code>head</code> (with a barrier or release store on multi-core systems).', 'Either order; only the consumer\'s order matters.', 'Disable interrupts, then the order does not matter.'],
        answer: 1,
        explain: 'Advancing <code>head</code> publishes the slot. If it is advanced first, the consumer can read the slot before the data is there.',
      },
      {
        id: 'd5_uaf',
        prompt: 'A program sometimes crashes inside unrelated code after freeing an object. Which tool is best at pinpointing a use-after-free?',
        options: ['<code>strace</code>', '<code>gprof</code>', 'Compiling with <code>-O0</code>.', 'AddressSanitizer, which reports the bad access along with where the memory was allocated and freed.'],
        answer: 3,
        explain: 'ASan quarantines freed memory and poisons it, so the first bad access is caught right away. Valgrind finds it too, more slowly.',
      },
      {
        id: 'd5_pow2',
        prompt: 'Why are ring buffer sizes often a power of two?',
        options: ['So the index can wrap with a cheap mask, <code>i &amp; (SIZE - 1)</code>, instead of a division.', 'Because memory can only be allocated in powers of two.', 'So the buffer is never full.', 'So it fits in one cache line.'],
        answer: 0,
        explain: 'Modulo by a non-constant or non-power-of-two value costs a division. With free-running unsigned indices and a power-of-two size, <code>head - tail</code> also gives the fill level directly, even after the indices wrap.',
      },
    ],
  },

  /* ================================================================= Day 6 */
  {
    intro: 'You must be able to explain the network stack, subnet by hand, and say exactly when byte-order conversion is needed. Draw each of these from memory before the interview.',
    sections: [
      {
        title: 'The layers',
        body: `<ul>
<li><b>1 Physical</b>: bits on copper, fibre or radio. Devices: cables, transceivers, PHYs, hubs.</li>
<li><b>2 Data link</b>: frames between neighbours, MAC addresses. Ethernet, Wi-Fi, VLANs. Device: switch.</li>
<li><b>3 Network</b>: packets end to end across networks, IP addresses. IPv4, IPv6, ICMP. Device: router.</li>
<li><b>4 Transport</b>: ports, and reliability for TCP. TCP, UDP.</li>
<li><b>5–7</b>: session, presentation and application; the TCP/IP model merges them into one application layer (HTTP, DNS, SSH).</li>
</ul>`,
      },
      {
        title: 'Switching versus routing',
        body: `<p>A <b>switch</b> forwards frames inside one network (a broadcast domain or VLAN) using the destination MAC and its learned MAC table. It does not change the frame.</p>
<p>A <b>router</b> forwards packets between networks using the destination IP and its routing table (longest prefix match). For each hop it decrements TTL, updates the IP checksum, and rewrites the Ethernet header with its own MAC as the source and the next hop's MAC as the destination. The IP addresses stay the same (without NAT).</p>`,
      },
      {
        title: 'Subnetting by hand',
        body: `<p>For 192.168.10.0/26: 26 network bits leave 6 host bits.</p>
<ul>
<li>Mask: 255.255.255.192 (the last octet has the top two bits set: 128 + 64).</li>
<li>Block size: 2<sup>6</sup> = 64, so this network is 192.168.10.0–192.168.10.63.</li>
<li>Network address .0, broadcast address .63, usable hosts 64 − 2 = <b>62</b> (.1 to .62).</li>
</ul>
<p>In C, the mask for a prefix length is <code>len == 0 ? 0 : 0xFFFFFFFFu &lt;&lt; (32 - len)</code>; the special case avoids shifting by 32.</p>`,
      },
      {
        title: 'Byte order: htons, htonl, ntohs, ntohl',
        body: `<p>Protocol fields are big-endian. Convert at the boundary: <code>hton*</code> when putting a host value into a packet or socket structure (for example <code>addr.sin_port = htons(8080)</code>), <code>ntoh*</code> when taking a value out. <code>s</code> is 16-bit (ports), <code>l</code> is 32-bit (IPv4 addresses). On a big-endian CPU they do nothing, so forgetting them is a bug that only shows up on little-endian machines.</p>`,
      },
    ],
    tips: [
      'Practise one subnetting example end to end: mask, range, broadcast, host count.',
      'Explain the difference between a switch and a router in two sentences.',
    ],
    quiz: [
      {
        id: 'd6_subnet26',
        prompt: 'For <code>192.168.10.0/26</code>, what are the broadcast address and the number of usable hosts?',
        options: ['192.168.10.255 and 254', '192.168.10.63 and 64', '192.168.10.64 and 62', '192.168.10.63 and 62'],
        answer: 3,
        explain: 'A /26 has 6 host bits: 64 addresses, .0 to .63. The first is the network and the last is the broadcast, leaving 62.',
      },
      {
        id: 'd6_router_layer',
        prompt: 'At which layer does a router make its forwarding decision, and on what?',
        options: ['Layer 2, on the destination MAC address.', 'Layer 3, on the destination IP address.', 'Layer 4, on the destination port.', 'Layer 1, on the input port.'],
        answer: 1,
        explain: 'Routers look up the destination IP in the routing table. Switches decide at layer 2 on the destination MAC.',
      },
      {
        id: 'd6_router_rewrites',
        prompt: 'When a router forwards a packet (no NAT), which of these does it change?',
        options: ['The source and destination MAC addresses and the TTL (and so the IP checksum), but not the IP addresses.', 'The source and destination IP addresses.', 'Nothing; routers forward packets unchanged.', 'Only the destination port.'],
        answer: 0,
        explain: 'The Ethernet header is rebuilt for each link. The IP addresses identify the endpoints and stay the same end to end.',
      },
      {
        id: 'd6_htons',
        prompt: 'You fill in <code>struct sockaddr_in</code> to listen on port 8080. What do you write?',
        options: ['<code>addr.sin_port = 8080;</code>', '<code>addr.sin_port = ntohl(8080);</code>', '<code>addr.sin_port = htons(8080);</code>', '<code>addr.sin_port = htonl(8080);</code>'],
        answer: 2,
        explain: 'Ports are 16-bit and must be in network byte order, so host-to-network-short. Without it, a little-endian machine would listen on port 36895 (0x1F90 byte-swapped).',
      },
      {
        id: 'd6_slash30',
        prompt: 'How many usable host addresses does a /30 subnet have?',
        options: ['4', '2', '1', '0'],
        answer: 1,
        explain: 'Two host bits give four addresses: network, two hosts, broadcast. That is why /30 (or /31, which has no broadcast) is used for point-to-point router links.',
      },
    ],
  },

  /* ================================================================= Day 7 */
  {
    intro: 'Every network feature starts by parsing and classifying addresses. Today: strict parsing, what the bits of a MAC address mean, and how ARP finds a neighbour.',
    sections: [
      {
        title: 'Parsing IPv4 addresses strictly',
        body: `<p>A strict dotted-quad parser accepts exactly four decimal parts separated by dots, each 0–255. Reject: fewer or more parts (<code>1.2.3</code>), values over 255, empty parts (<code>1..2.3</code>), signs, spaces, trailing characters, and usually leading zeros (<code>01.2.3.4</code>), because some libraries read them as octal. Build the result as <code>(a &lt;&lt; 24) | (b &lt;&lt; 16) | (c &lt;&lt; 8) | d</code>.</p>
<p>Private ranges (RFC 1918): 10.0.0.0/8, 172.16.0.0/12 (172.16–172.31) and 192.168.0.0/16. Loopback is 127.0.0.0/8.</p>`,
      },
      {
        title: 'MAC addresses',
        body: `<p>48 bits, written as six hex bytes: <code>00:1a:2b:3c:4d:5e</code>. In the first byte:</p>
<ul>
<li>Bit 0 (the least significant bit), the <b>I/G bit</b>: 1 means a group (multicast) address. <code>ff:ff:ff:ff:ff:ff</code> is broadcast.</li>
<li>Bit 1, the <b>U/L bit</b>: 1 means locally administered rather than assigned by the manufacturer.</li>
</ul>
<p>The first three bytes of a universal address are the vendor's OUI. IPv4 multicast maps to <code>01:00:5e</code> plus the low 23 bits of the group address.</p>`,
      },
      {
        title: 'ARP, step by step',
        body: `<ol>
<li>Host A wants to send to 10.0.0.2 on its own subnet but knows only the IP. It checks its ARP cache: no entry.</li>
<li>A broadcasts an ARP <b>request</b> (destination MAC <code>ff:ff:ff:ff:ff:ff</code>, EtherType 0x0806): "who has 10.0.0.2? tell 10.0.0.1".</li>
<li>Every host on the segment receives it; switches flood it. Only B answers, with a <b>unicast reply</b> containing its MAC.</li>
<li>A caches the mapping (typically for minutes) and sends the IP packet. B usually caches A's mapping from the request too.</li>
</ol>
<p>For a destination on another subnet, A ARPs for its <b>default gateway</b> instead.</p>`,
      },
      {
        title: 'Unicast, multicast and broadcast at a switch',
        body: `<ul>
<li><b>Known unicast</b>: forwarded out of the one port where the destination MAC was learned.</li>
<li><b>Unknown unicast</b>: flooded to all ports in the VLAN except the ingress port.</li>
<li><b>Broadcast</b>: always flooded the same way.</li>
<li><b>Multicast</b>: flooded by default, or sent only to interested ports when IGMP snooping is on.</li>
</ul>`,
      },
    ],
    tips: [
      'List the inputs a strict parser rejects before you start coding it.',
      'Narrate ARP as frames on the wire: broadcast request, unicast reply, cache.',
    ],
    quiz: [
      {
        id: 'd7_mac_multicast',
        prompt: 'Why is <code>01:00:5e:00:00:fb</code> a multicast MAC address?',
        options: ['Because it starts with 01:00.', 'Because its last byte is odd.', 'Because the least significant bit of the first byte (the I/G bit) is 1.', 'Because 00:5e is the multicast vendor code.'],
        answer: 2,
        explain: 'The first byte is 0x01, so the group bit is set. 01:00:5e is the range used for IPv4 multicast; this address carries mDNS (224.0.0.251).',
      },
      {
        id: 'd7_arp_reply',
        prompt: 'How are an ARP request and its reply normally sent?',
        options: ['The request is broadcast; the reply is unicast to the asker.', 'Both are broadcast.', 'Both are unicast.', 'The request is unicast to the router; the reply is broadcast.'],
        answer: 0,
        explain: 'The asker does not know the target\'s MAC, so it must broadcast. The target learns the asker\'s MAC from the request and replies directly.',
      },
      {
        id: 'd7_strict_parse',
        prompt: 'Which input should a strict IPv4 parser accept?',
        options: ['<code>1.2.3</code>', '<code>256.1.1.1</code>', '<code>1.2.3.4 </code> (with a trailing space)', '<code>10.0.0.255</code>'],
        answer: 3,
        explain: 'Exactly four parts, each 0–255, and nothing else, so <code>10.0.0.255</code> is valid. Whether it is a broadcast address depends on the prefix length, which is not the parser\'s job.',
      },
      {
        id: 'd7_private',
        prompt: 'Which of these is a private (RFC 1918) address?',
        options: ['172.32.0.1', '172.20.1.1', '192.169.1.1', '11.0.0.1'],
        answer: 1,
        explain: 'The private ranges are 10.0.0.0/8, 172.16.0.0/12 (172.16.0.0 to 172.31.255.255) and 192.168.0.0/16. 172.32.0.1 is just outside the /12.',
      },
      {
        id: 'd7_broadcast_switch',
        prompt: 'What does a switch do with a broadcast frame arriving on port 3 of VLAN 10?',
        options: ['Drops it.', 'Sends it to every port on the switch, in every VLAN.', 'Sends it to every other port in VLAN 10, but not back out of port 3.', 'Sends it only to the router port.'],
        answer: 2,
        explain: 'A VLAN is a broadcast domain. Flooding never sends the frame back out of the port it arrived on.',
      },
    ],
  },

  /* ================================================================= Day 8 */
  {
    intro: 'Parsing frame headers from a byte buffer is everyday work in network platform code. Today: the Ethernet and VLAN layout, and what checksums and CRCs can and cannot catch.',
    sections: [
      {
        title: 'Ethernet II with an 802.1Q tag',
        body: `<pre><code>| dst MAC 6 | src MAC 6 | TPID 0x8100 2 | PCP 3b DEI 1b VID 12b | EtherType 2 | payload | FCS 4 |</code></pre>
<p>Without a tag the header is 14 bytes; each tag adds 4. The minimum frame is 64 bytes including the FCS, so short payloads are padded to 46 bytes (42 when tagged). The 12-bit VLAN ID allows 4094 VLANs: 0 and 4095 are reserved.</p>`,
      },
      {
        title: 'VLANs, access ports and trunks',
        body: `<p>A VLAN splits one physical switch into several separate layer-2 networks (broadcast domains). Traffic between VLANs must go through a router or a layer-3 switch.</p>
<ul>
<li>An <b>access port</b> belongs to one VLAN and sends and receives untagged frames; it is where hosts connect.</li>
<li>A <b>trunk port</b> carries many VLANs between switches, each frame tagged with its VLAN ID. One <b>native VLAN</b> may be carried untagged.</li>
</ul>`,
      },
      {
        title: 'CRC versus checksum',
        body: `<p>Ethernet's <b>FCS</b> is a CRC-32 over the whole frame, computed in hardware. It detects all single-bit and double-bit errors, any odd number of bit errors, and every burst error up to 32 bits long; random errors slip through with probability about 1 in 2<sup>32</sup>.</p>
<p>The <b>Internet checksum</b> (IPv4 header, UDP, TCP) is a 16-bit one's-complement sum. It is cheap in software and easy to update incrementally when a router changes TTL, but weaker: it cannot detect reordered 16-bit words, and two errors can cancel out. It protects against corruption inside routers, where the link CRC has already been stripped and recomputed.</p>`,
      },
      {
        title: 'MTU, fragmentation and jumbo frames',
        body: `<ul>
<li>The <b>MTU</b> is the largest packet a link carries: 1500 bytes of IP for standard Ethernet.</li>
<li>IPv4 routers can <b>fragment</b> a larger packet into pieces that the destination reassembles. If one fragment is lost, the whole packet is lost, so most traffic avoids it: hosts set Don't Fragment and use Path MTU Discovery. IPv6 routers never fragment.</li>
<li><b>Jumbo frames</b> raise the MTU (commonly to 9000) to cut per-packet overhead in data centres and storage networks. Every device on the path must agree.</li>
</ul>`,
      },
    ],
    tips: [
      'Draw the tagged frame with sizes; interviewers often ask for the offsets in bytes.',
      'Contrast CRC (strong, hardware, per link) with the Internet checksum (weak, software, end to end or per header).',
    ],
    quiz: [
      {
        id: 'd8_access_trunk',
        prompt: 'What is the difference between an access port and a trunk port?',
        options: ['An access port carries one VLAN untagged; a trunk carries many VLANs, tagged with 802.1Q (except an optional untagged native VLAN).', 'Access ports are faster.', 'Trunk ports connect hosts; access ports connect switches.', 'An access port can only receive, not send.'],
        answer: 0,
        explain: 'Hosts normally sit on access ports and never see tags. Links between switches, and to routers or servers with several VLANs, are trunks.',
      },
      {
        id: 'd8_vlan_ids',
        prompt: 'How many VLAN IDs are usable in 802.1Q?',
        options: ['4096', '1024', '4094', '65534'],
        answer: 2,
        explain: 'The VID field is 12 bits (4096 values), but 0 means "priority tag only" and 4095 is reserved.',
      },
      {
        id: 'd8_min_frame',
        prompt: 'An untagged Ethernet frame carries a 20-byte payload. What happens?',
        options: ['It is sent as a 38-byte frame.', 'It is dropped as a runt.', 'It must be fragmented.', 'The payload is padded to 46 bytes so the frame reaches the 64-byte minimum.'],
        answer: 3,
        explain: '14 header + 46 payload + 4 FCS = 64 bytes. The minimum exists so collisions could be detected on old shared media. The receiver uses the IP total length to ignore the padding.',
      },
      {
        id: 'd8_checksum_weakness',
        prompt: 'Which error can the 16-bit Internet checksum not detect?',
        options: ['A single flipped bit.', 'Two 16-bit words swapped in position.', 'A changed TTL.', 'A missing byte at the end of the header.'],
        answer: 1,
        explain: 'Addition does not depend on order, so reordered words give the same sum. A CRC treats the data as a polynomial, so position matters, and it catches this.',
      },
      {
        id: 'd8_jumbo',
        prompt: 'What is required for jumbo frames to work across a network path?',
        options: ['Only the sending host must support them.', 'Only the switches must support them.', 'Every device on the path, including hosts and switches, must be configured for the larger MTU.', 'Nothing; Ethernet negotiates the MTU automatically.'],
        answer: 2,
        explain: 'A switch drops frames larger than its configured maximum (it cannot fragment at layer 2), so a single device with a 1500 MTU on the path breaks large transfers.',
      },
    ],
  },

  /* ================================================================= Day 9 */
  {
    intro: 'Today you follow a packet end to end, and treat every field that comes from the wire as untrusted input.',
    sections: [
      {
        title: 'The IPv4 header',
        body: `<pre><code>| ver 4b | IHL 4b | DSCP/ECN 8b | total length 16b |
| identification 16b | flags 3b | fragment offset 13b |
| TTL 8b | protocol 8b | header checksum 16b |
| source address 32b |
| destination address 32b |
| options (if IHL &gt; 5) |</code></pre>
<ul>
<li><b>IHL</b> is the header length in 32-bit words: 5 means 20 bytes, the maximum 15 means 60.</li>
<li><b>TTL</b> is decremented by every router; at zero the packet is dropped and an ICMP Time Exceeded is sent. It stops packets looping forever.</li>
<li><b>Protocol</b> says what follows: 1 ICMP, 6 TCP, 17 UDP.</li>
<li><b>Flags</b>: Don't Fragment and More Fragments; the <b>fragment offset</b> is in 8-byte units.</li>
</ul>`,
      },
      {
        title: 'Validating a header from the wire',
        body: `<p>Before reading any field, check, in this order: the buffer holds at least 20 bytes; version is 4; IHL ≥ 5; IHL × 4 ≤ buffer length; total length ≥ IHL × 4 and ≤ buffer length; the header checksum is correct. Every later read stays inside the checked lengths. Lengths taken from the packet itself are attacker-controlled; trusting them is how out-of-bounds reads happen.</p>`,
      },
      {
        title: 'TCP and UDP',
        body: `<p><b>TCP</b> opens with a three-way handshake: client SYN, server SYN-ACK, client ACK. It numbers every byte; the receiver acknowledges what it has, and lost segments are retransmitted, so data arrives complete and in order. <b>Flow control</b> (the receive window) stops a sender overrunning the receiver; <b>congestion control</b> slows down when the network drops packets.</p>
<p><b>UDP</b> just adds ports and a checksum: no connection, no retransmission, no ordering. Used where low latency matters more than every packet, or where the application handles loss: DNS, streaming, many control protocols.</p>`,
      },
      {
        title: 'Tracing a ping across a router',
        body: `<ol>
<li>The PC sees the server is on another subnet, so it ARPs for its default gateway's MAC.</li>
<li>It sends an ICMP Echo Request: destination IP = server, destination MAC = router.</li>
<li>The access switch learns the PC's MAC on its port and forwards the frame towards the router.</li>
<li>The router checks the header, looks up the server's network (longest prefix match), decrements TTL, updates the checksum, ARPs for the server (or next hop) if needed, and sends a new frame with its own MAC as source.</li>
<li>The server replies with an Echo Reply along the reverse path.</li>
</ol>`,
      },
    ],
    tips: [
      'When validating headers, say "lengths from the packet are untrusted" before you write a single check.',
      'Trace a packet out loud: ARP, switching, routing lookup, TTL, rewrite.',
    ],
    quiz: [
      {
        id: 'd9_ihl',
        prompt: 'An IPv4 header has IHL = 6. How long is the header?',
        options: ['6 bytes', '24 bytes', '48 bytes', '20 bytes'],
        answer: 1,
        explain: 'IHL counts 32-bit words: 6 × 4 = 24 bytes, so there are 4 bytes of options after the fixed 20-byte header.',
      },
      {
        id: 'd9_validate',
        prompt: 'Which check stops a parser reading past the end of a received buffer?',
        options: ['Checking that the TTL is not zero.', 'Checking that the version is 4.', 'Checking that the header checksum is correct.', 'Checking that IHL × 4 ≤ total length ≤ the number of bytes actually received.'],
        answer: 3,
        explain: 'The checksum covers only the header and can be made valid by an attacker; the version and TTL say nothing about lengths. Bounding every length against the real buffer size is what keeps reads in range.',
      },
      {
        id: 'd9_handshake',
        prompt: 'What is the TCP three-way handshake?',
        options: ['Client SYN, server SYN-ACK, client ACK.', 'Client ACK, server SYN, client FIN.', 'Client SYN, server ACK, server FIN.', 'Client HELLO, server HELLO, client DONE.'],
        answer: 0,
        explain: 'Each side sends its initial sequence number in a SYN and acknowledges the other\'s. Closing uses FIN and ACK in each direction.',
      },
      {
        id: 'd9_protocol_17',
        prompt: 'The IPv4 protocol field is 17. What follows the IP header?',
        options: ['TCP', 'ICMP', 'UDP', 'IPv6'],
        answer: 2,
        explain: 'The common values are 1 (ICMP), 6 (TCP) and 17 (UDP). The protocol field is how a host knows which handler gets the payload.',
      },
      {
        id: 'd9_ttl_purpose',
        prompt: 'What is the IPv4 TTL field for?',
        options: ['It is the number of seconds the packet may be buffered.', 'It limits how many routers a packet can cross, so a routing loop cannot keep it forever.', 'It sets the priority of the packet.', 'It tells the receiver how long to cache the sender\'s address.'],
        answer: 1,
        explain: 'Each router decrements it and drops the packet at zero, sending ICMP Time Exceeded. <code>traceroute</code> uses this by sending packets with TTL 1, 2, 3 and so on.',
      },
    ],
  },

  /* ================================================================ Day 10 */
  {
    intro: 'A switch\'s MAC table is its core data structure, and platform software sits between the ASIC that forwards and the CPU that controls it.',
    sections: [
      {
        title: 'Learning, flooding and ageing',
        body: `<p>For every frame, the switch <b>learns</b> the source MAC against the ingress port (and VLAN), then <b>looks up</b> the destination: forward to one port if known, <b>flood</b> to the VLAN if not.</p>
<p>Entries are refreshed whenever the station sends, and <b>aged out</b> after a period of silence (300 seconds is the usual default). Ageing frees space for stations that are active, and removes stale entries for devices that were unplugged. If a station moves to another port, its next frame re-learns it there. In software, a MAC table is a hash table keyed on VLAN and MAC.</p>`,
      },
      {
        title: 'Spanning Tree',
        body: `<p>Redundant links create loops. Ethernet has no TTL, so a broadcast on a looped network is copied forever and multiplies (a <b>broadcast storm</b>), MAC entries flap between ports, and the network grinds to a halt within seconds.</p>
<p>STP elects a <b>root bridge</b> (lowest bridge ID: priority, then MAC), each switch keeps its best path towards the root, and the remaining redundant ports are <b>blocked</b>. If an active link fails, a blocked port takes over. Rapid STP (802.1w) converges in a few seconds.</p>`,
      },
      {
        title: 'Link aggregation (LACP)',
        body: `<p>LACP (802.3ad/802.1AX) bundles several physical links into one logical link for more bandwidth and redundancy. To keep each flow's packets in order, the switch <b>hashes</b> header fields (MACs, IPs, ports) to pick one member link per flow. So a single flow never goes faster than one member link, and an unlucky hash can load links unevenly.</p>`,
      },
      {
        title: 'Data, control and management planes',
        body: `<ul>
<li><b>Data plane</b>: forwarding every packet at line rate; in the switching ASIC or NPU, using tables (MAC, routes, ACLs) that software programs.</li>
<li><b>Control plane</b>: protocols that decide what goes in those tables: STP, LACP, routing protocols, ARP. Runs on the CPU; the ASIC punts their packets up to it.</li>
<li><b>Management plane</b>: configuration and monitoring: CLI, SNMP, NETCONF, web UI.</li>
</ul>
<p>Platform software is the layer in between: the drivers and SDK calls that program the ASIC and move packets between it and the CPU.</p>`,
      },
    ],
    tips: [
      'Describe the per-frame algorithm: learn source, look up destination, forward or flood.',
      'When asked about LACP, mention per-flow hashing and why a single flow cannot use two links.',
    ],
    quiz: [
      {
        id: 'd10_ageing',
        prompt: 'Why does a switch age out MAC table entries?',
        options: ['To free space for active stations and remove entries for devices that have gone silent or disappeared.', 'Because the ASIC loses entries when it gets warm.', 'To force hosts to send ARP requests.', 'To stop broadcast storms.'],
        answer: 0,
        explain: 'Tables are finite (often tens of thousands of entries in hardware). Moved stations are handled by re-learning, and silent ones by ageing.',
      },
      {
        id: 'd10_station_move',
        prompt: 'A laptop with a learned MAC moves from port 2 to port 7 and sends a frame. What happens to the MAC table?',
        options: ['Nothing until the old entry ages out.', 'The switch keeps both entries and sends traffic to both ports.', 'The switch blocks port 7 until STP converges.', 'The entry is updated to port 7 as soon as the frame is learned.'],
        answer: 3,
        explain: 'Learning overwrites the port for that MAC and VLAN. Frequent moves between two ports (MAC flapping) are a classic sign of a loop.',
      },
      {
        id: 'd10_stp_root',
        prompt: 'How does Spanning Tree choose the root bridge?',
        options: ['The switch with the most ports.', 'The switch with the lowest bridge ID: the configured priority, then the MAC address as a tie-breaker.', 'The switch that booted first.', 'The switch closest to the router.'],
        answer: 1,
        explain: 'Leaving every priority at the default makes the switch with the lowest MAC the root, which may be an old access switch. Administrators set the priority so a core switch wins.',
      },
      {
        id: 'd10_lacp_flow',
        prompt: 'Two 10 Gb/s links are aggregated with LACP. How fast can a single TCP flow go?',
        options: ['20 Gb/s', '5 Gb/s', 'Up to 10 Gb/s, because each flow is hashed onto one member link to keep its packets in order.', 'It depends on the number of VLANs.'],
        answer: 2,
        explain: 'Aggregation adds capacity across many flows, not for one. Spreading one flow over both links would reorder its packets.',
      },
      {
        id: 'd10_planes',
        prompt: 'Where is a received STP BPDU processed?',
        options: ['On the CPU, in the control plane; the ASIC traps it and sends it up.', 'Entirely in the ASIC data plane.', 'In the management plane, by the CLI.', 'It is forwarded like any other frame and not processed.'],
        answer: 0,
        explain: 'Protocol packets addressed to the switch itself are punted to the CPU. Protecting that path from floods (control plane policing) is part of platform work.',
      },
    ],
  },

  /* ================================================================ Day 11 */
  {
    intro: 'Platform teams own the hardware around the switching ASIC: fans, sensors, power supplies, LEDs and transceivers. Know the buses, the boot flow and what a driver does.',
    sections: [
      {
        title: 'The buses inside a switch',
        body: `<ul>
<li><b>I²C</b> (and SMBus): two wires, addressed, slow (100 kHz–1 MHz). Temperature sensors, fan controllers, power supplies, EEPROMs, SFP modules, often behind I²C multiplexers.</li>
<li><b>SPI</b>: four wires plus a chip select per device, fast. Boot flash, some CPLDs and sensors.</li>
<li><b>MDIO</b>: two wires (MDC clock, MDIO data) for managing Ethernet <b>PHYs</b>: link status, speed, autonegotiation.</li>
<li><b>PCIe</b>: high-speed serial point-to-point links; the CPU talks to the switching ASIC and NICs over PCIe, with memory-mapped registers and DMA.</li>
</ul>`,
      },
      {
        title: 'Boot flow',
        body: `<ol>
<li><b>Boot ROM</b> in the SoC runs at reset and loads the first-stage bootloader from flash.</li>
<li><b>Bootloader</b> (such as U-Boot) initialises DRAM and basic devices, then loads the kernel, the <b>device tree</b> and often an initramfs.</li>
<li><b>Linux kernel</b> starts, reads the device tree to learn what hardware exists and at which addresses, and probes the matching drivers.</li>
<li><b>User space</b>: init (systemd or similar) starts the platform daemons and the network OS.</li>
</ol>`,
      },
      {
        title: 'What a device driver does',
        body: `<p>The kernel matches a device (from the device tree, or PCI IDs) to a driver and calls its <b>probe</b> function, which maps the registers, requests interrupts and DMA, initialises the hardware and registers it with a subsystem (network, hwmon, GPIO…). The driver accesses registers with <code>readl</code>/<code>writel</code>, handles interrupts, and exposes the device to user space through files in <code>/dev</code> or <code>/sys</code>, ioctls or netlink. User space never touches hardware directly; it crosses into the kernel through system calls.</p>`,
      },
      {
        title: 'Detecting an SFP transceiver',
        body: `<p>A <b>module-present</b> signal (MOD_ABS, usually read through a CPLD or GPIO expander) changes when a module is inserted; software sees an interrupt or polls it. It then reads the module's ID EEPROM over I²C at address <b>0x50</b> (0xA0 in 8-bit form): type, vendor, part number and supported speeds, defined by SFF-8472. Digital diagnostics (temperature, voltage, optical power) are at <b>0x51</b> (0xA2). Software then configures the port to match.</p>`,
      },
      {
        title: 'Polling, sensors and fans',
        body: `<ul>
<li>Every loop that waits for a hardware bit needs a <b>timeout</b> and an error return; hardware can hang, and an unbounded loop hangs the whole system.</li>
<li>Sensor registers often hold signed, fixed-point values: sign-extend correctly before scaling.</li>
<li>Fan control uses <b>hysteresis</b>, for example speed up at 70 °C but slow down only below 65 °C, so the fan does not oscillate around one threshold.</li>
<li>Mechanical inputs (buttons, some presence pins) bounce; debounce them in software.</li>
</ul>`,
      },
    ],
    tips: [
      'Name what lives on each bus in a switch: sensors and SFPs on I²C, PHYs on MDIO, the ASIC on PCIe.',
      'For the SFP question, give the pin, the I²C address and what you read from the EEPROM.',
    ],
    quiz: [
      {
        id: 'd11_mdio',
        prompt: 'What is MDIO used for?',
        options: ['Reading SFP EEPROMs.', 'Booting the CPU from flash.', 'Connecting the CPU to the switching ASIC at high speed.', 'Managing Ethernet PHYs: reading link status, setting speed and autonegotiation.'],
        answer: 3,
        explain: 'MDIO (with its clock, MDC) is the management interface defined by IEEE 802.3 for PHYs. Linux exposes it through the PHY library and <code>ethtool</code>.',
      },
      {
        id: 'd11_sfp_address',
        prompt: 'At which 7-bit I²C address is an SFP module\'s identification EEPROM?',
        options: ['0x50 (0xA0 as an 8-bit address); diagnostics are at 0x51.', '0x20', '0x68', '0x7F'],
        answer: 0,
        explain: 'SFF-8472 defines page A0h for identification and A2h for digital diagnostics. With many ports, these addresses repeat on every port, so switches put the modules behind I²C multiplexers.',
      },
      {
        id: 'd11_device_tree',
        prompt: 'What is the device tree for?',
        options: ['It lists the files in the root file system.', 'It describes the board\'s hardware (devices, addresses, interrupts) so the kernel can probe the right drivers without hard-coding them.', 'It stores the network configuration.', 'It is the tree of running processes.'],
        answer: 1,
        explain: 'One kernel image can then run on many boards, each with its own device tree blob passed in by the bootloader.',
      },
      {
        id: 'd11_poll_timeout',
        prompt: 'Why must a loop that polls a hardware status bit have a timeout?',
        options: ['To save power.', 'Because the compiler removes loops without one.', 'If the hardware never sets the bit (fault, missing device, wrong configuration), the loop would hang the system forever.', 'Timeouts make the bit change faster.'],
        answer: 2,
        explain: 'Return an error and let the caller retry, reset the device or report it. A hang in platform code can take down the whole switch.',
      },
      {
        id: 'd11_hysteresis',
        prompt: 'Why does fan control turn the fan up at 70 °C but down only below 65 °C?',
        options: ['Hysteresis: with a single threshold, a temperature hovering around it would switch the fan on and off constantly.', 'Sensors read 5 °C high when the fan is on.', 'Fans need 5 °C to spin up.', 'It is required by the I²C specification.'],
        answer: 0,
        explain: 'The gap between the two thresholds absorbs noise and small changes, so the output only changes on a real trend. The same idea is used in button debouncing and link-flap dampening.',
      },
    ],
  },

  /* ================================================================ Day 12 */
  {
    intro: 'Network operating systems run many processes and threads on embedded Linux. Know what each locking primitive is for, and why the kernel splits interrupt work in two.',
    sections: [
      {
        title: 'Processes and threads',
        body: `<p>A <b>process</b> has its own address space, file descriptors and resources. <b>Threads</b> inside a process share the address space (code, globals, heap) and file descriptors; each has its own stack, registers and thread-local storage.</p>
<p>A <b>context switch</b> saves one task's registers and restores another's. Switching between processes also changes the address space, which can flush TLB entries and loses cache warmth, so it costs more than switching threads of one process.</p>`,
      },
      {
        title: 'Mutex, spinlock, semaphore',
        body: `<ul>
<li><b>Mutex</b>: one owner at a time; waiters <i>sleep</i>. For longer critical sections in process context.</li>
<li><b>Spinlock</b>: waiters <i>busy-wait</i>. For very short sections, and in interrupt context, where sleeping is impossible. Never sleep while holding one: other CPUs spin uselessly, and if the holder is preempted or an interrupt handler on the same CPU wants the lock, the system can deadlock. That is why kernel code uses <code>spin_lock_irqsave</code> when an interrupt handler shares the lock.</li>
<li><b>Semaphore</b>: a counter; allows up to N holders or signals events. No ownership.</li>
</ul>`,
      },
      {
        title: 'Races on a shared counter',
        body: `<p>Two threads each run <code>counter++</code> a million times without a lock. The result is usually less than two million, because <code>counter++</code> is load, add, store, and the two threads overwrite each other's updates. Fixes: protect it with a mutex, or use an atomic increment (<code>atomic_fetch_add</code>, <code>__atomic_add_fetch</code>). <code>volatile</code> does not fix it.</p>`,
      },
      {
        title: 'Deadlock',
        body: `<p>Deadlock needs all four <b>Coffman conditions</b>: mutual exclusion, hold and wait, no preemption (locks cannot be taken away), and circular wait. Break any one and deadlock is impossible. The practical fix is a <b>global lock order</b>, which removes circular wait. Linux's lockdep checks lock order at run time and reports violations.</p>`,
      },
      {
        title: 'Top half and bottom half',
        body: `<p>The <b>top half</b> is the hard interrupt handler: it runs immediately, with that interrupt line masked, so it does the minimum (acknowledge the device, grab urgent data) and schedules the rest. The <b>bottom half</b> does the real work later with interrupts enabled:</p>
<ul>
<li><b>softirq</b>: fast and can run on several CPUs at once; used by networking (NAPI) and block I/O.</li>
<li><b>tasklet</b>: built on softirqs, but one tasklet never runs on two CPUs at once (now discouraged).</li>
<li><b>workqueue</b> (and threaded IRQs): runs in a kernel thread, so it <b>can sleep</b>, for example to take a mutex or talk to an I²C device.</li>
</ul>`,
      },
    ],
    tips: [
      'Choose a lock by context: can this code sleep? If not, spinlock; if yes, mutex.',
      'List the four deadlock conditions and say which one lock ordering breaks.',
    ],
    quiz: [
      {
        id: 'd12_thread_share',
        prompt: 'What do two threads of the same process <b>not</b> share?',
        options: ['Global variables.', 'The heap.', 'Their stacks and register state.', 'Open file descriptors.'],
        answer: 2,
        explain: 'Each thread has its own stack and registers (and thread-local storage); everything else in the address space is shared. A pointer to one thread\'s stack variable can still be used by another, which is a common source of bugs.',
      },
      {
        id: 'd12_spinlock_sleep',
        prompt: 'Why must kernel code not sleep while holding a spinlock?',
        options: ['Spinlocks are released automatically when a task sleeps.', 'Sleeping is only allowed in user space.', 'It would make the lock slower but is otherwise safe.', 'Other CPUs spin while waiting, and if the holder sleeps (or is interrupted by code wanting the same lock), the system can deadlock or waste CPUs for a long time.'],
        answer: 3,
        explain: 'Spinlocks assume the holder runs to the end of a short critical section without blocking. Use a mutex when the code inside may sleep.',
      },
      {
        id: 'd12_counter_race',
        prompt: 'Two threads each increment an unprotected shared <code>int</code> 1,000,000 times. What is the usual result?',
        options: ['Exactly 2,000,000.', 'Less than 2,000,000, because increments overwrite each other.', 'More than 2,000,000.', 'The program does not compile.'],
        answer: 1,
        explain: 'It is a data race (undefined behaviour in C11), and in practice lost updates. Use a mutex or an atomic increment.',
      },
      {
        id: 'd12_coffman',
        prompt: 'Which of these is <b>not</b> one of the four conditions for deadlock?',
        options: ['Priority inheritance.', 'Mutual exclusion.', 'Hold and wait.', 'Circular wait.'],
        answer: 0,
        explain: 'The four are mutual exclusion, hold and wait, no preemption and circular wait. Priority inheritance addresses priority inversion, a different problem.',
      },
      {
        id: 'd12_workqueue',
        prompt: 'An interrupt needs follow-up work that reads a sensor over I²C (which may sleep). Where should that work run?',
        options: ['In the top-half interrupt handler.', 'In a tasklet.', 'In a workqueue or threaded IRQ handler, which runs in a kernel thread and may sleep.', 'In a softirq.'],
        answer: 2,
        explain: 'Hard IRQ handlers, softirqs and tasklets run in atomic context and must not sleep. Workqueues and threaded IRQs run in process context.',
      },
    ],
  },

  /* ================================================================ Day 13 */
  {
    intro: 'Platform roles are largely about investigating problems. Interviewers want to hear a calm, systematic method and to know you can drive the standard tools.',
    sections: [
      {
        title: 'gdb essentials',
        body: `<pre><code>gdb ./app                 # start under the debugger
(gdb) break parse_header  # stop at a function (or file.c:123)
(gdb) run
(gdb) bt                  # backtrace: how did we get here?
(gdb) frame 2             # look at a caller's frame
(gdb) print *hdr          # inspect values
(gdb) watch rx_count      # stop whenever this value changes
(gdb) next / step / finish / continue</code></pre>
<p>Build with <code>-g</code> (and preferably <code>-O0</code> or <code>-Og</code>) so variables are visible. For embedded targets, gdb connects to a JTAG/SWD probe through gdbserver or OpenOCD.</p>`,
      },
      {
        title: 'Core dumps',
        body: `<p>Enable them with <code>ulimit -c unlimited</code> (and check <code>/proc/sys/kernel/core_pattern</code> to see where they go). After a crash, run <code>gdb ./app core</code> and type <code>bt</code> to see the crashing line and the call stack, then inspect variables in each frame. Keep the exact binary with its debug symbols for every release, or the core is hard to read.</p>`,
      },
      {
        title: 'Sanitizers and valgrind',
        body: `<ul>
<li><b>AddressSanitizer</b> (<code>-fsanitize=address</code>): buffer overflows on heap, stack and globals, use-after-free, double free, leaks. Compile-time instrumentation, about 2× slower.</li>
<li><b>UndefinedBehaviorSanitizer</b> (<code>-fsanitize=undefined</code>): signed overflow, invalid shifts, misaligned pointers, null dereference and more.</li>
<li><b>ThreadSanitizer</b>: data races.</li>
<li><b>Valgrind memcheck</b>: runs the unmodified binary on a simulated CPU (10–50× slower); finds invalid accesses, use of uninitialised memory and leaks.</li>
</ul>`,
      },
      {
        title: 'git bisect',
        body: `<pre><code>git bisect start
git bisect bad              # current commit has the bug
git bisect good v2.3        # this release did not
# build and test; then mark each commit git offers:
git bisect good   or   git bisect bad
git bisect reset</code></pre>
<p>It is a binary search, so 1000 commits take about 10 tests. With a script that exits non-zero on failure, <code>git bisect run ./test.sh</code> does it unattended.</p>`,
      },
      {
        title: 'Investigating a field problem',
        body: `<p>"A switch reboots about once a day." A strong answer is a method:</p>
<ol>
<li><b>Gather</b>: reset reason register, kernel logs and console output (persistent or remote), crash dumps or kdump, uptime pattern, software version, configuration, recent changes, which units are affected.</li>
<li><b>Hypothesise</b>: watchdog (hung process?), kernel panic, out of memory, power or thermal event.</li>
<li><b>Reproduce</b> in the lab with the same version, configuration and traffic; speed it up if you can.</li>
<li><b>Isolate</b> by changing one thing at a time; add logging or counters where evidence is missing.</li>
<li><b>Fix and confirm</b>: show the fix removes the cause, run long enough to be sure, and add a test or monitor so it cannot return silently.</li>
</ol>
<p>Prepare your own hardest-bug story in the same shape: symptom, hypotheses, narrowing down, fix, verification.</p>`,
      },
    ],
    tips: [
      'Lead with method: gather evidence, hypothesise, reproduce, isolate, fix, verify.',
      'Say which tool catches which class of bug; it shows real experience.',
    ],
    quiz: [
      {
        id: 'd13_watch',
        prompt: 'A variable is getting corrupted and you do not know by which code. Which gdb command helps most?',
        options: ['<code>bt</code>', '<code>watch variable</code>, which stops execution whenever the value changes.', '<code>list</code>', '<code>info registers</code>'],
        answer: 1,
        explain: 'A watchpoint (hardware-assisted on most CPUs) stops at the exact instruction that writes the value, and <code>bt</code> then shows who did it.',
      },
      {
        id: 'd13_core',
        prompt: 'A program crashed and left a core file. What is the quickest way to find the crashing line?',
        options: ['Read the core file with <code>hexdump</code>.', 'Run the program again under <code>strace</code>.', 'Rebuild with <code>-O3</code>.', 'Open it with <code>gdb ./program core</code> and run <code>bt</code>.'],
        answer: 3,
        explain: 'The backtrace shows the call stack at the moment of the crash. It needs the same binary with debug symbols that produced the core.',
      },
      {
        id: 'd13_ubsan',
        prompt: 'Which tool reports signed integer overflow at the moment it happens?',
        options: ['UndefinedBehaviorSanitizer (<code>-fsanitize=undefined</code>).', 'Valgrind memcheck.', 'AddressSanitizer.', 'git bisect.'],
        answer: 0,
        explain: 'Signed overflow is not a memory error, so ASan and valgrind do not see it. UBSan instruments arithmetic, shifts, alignment and more.',
      },
      {
        id: 'd13_bisect',
        prompt: 'A bug appeared somewhere in the last 1000 commits. About how many builds does <code>git bisect</code> need to find the commit?',
        options: ['About 500', 'About 100', 'About 10', 'Exactly 1000'],
        answer: 2,
        explain: 'Each test halves the range: log<sub>2</sub>(1000) ≈ 10. That is why a reliable, automated test script makes bisecting so effective.',
      },
      {
        id: 'd13_asan_valgrind',
        prompt: 'How does AddressSanitizer differ from valgrind?',
        options: ['ASan only works on Windows.', 'ASan is added at compile time and runs about 2× slower; valgrind runs the unmodified binary on a simulated CPU, much more slowly.', 'Valgrind finds data races; ASan finds only leaks.', 'They are the same tool with different names.'],
        answer: 1,
        explain: 'ASan is fast enough for CI and long test runs, and catches stack and global overflows that memcheck misses. Valgrind needs no rebuild, which helps with third-party binaries.',
      },
    ],
  },

  /* ================================================================ Day 14 */
  {
    intro: 'Technical skill gets you shortlisted; clear communication gets you hired. Today: structured stories, a steady approach to live coding, and good questions to ask.',
    sections: [
      {
        title: 'The STAR method',
        body: `<p>Answer behavioural questions as a short story:</p>
<ul>
<li><b>Situation</b>: the context, in one or two sentences.</li>
<li><b>Task</b>: what you were responsible for, or the problem to solve.</li>
<li><b>Action</b>: what <i>you</i> did, step by step. Spend most of the answer here, and say "I", not "we".</li>
<li><b>Result</b>: the outcome, with a number if possible, and what you learned.</li>
</ul>
<p>Aim for about two minutes per story.</p>`,
      },
      {
        title: 'Stories to prepare',
        body: `<ul>
<li>Working with another team or a team in another time zone: how you kept communication clear (written summaries, overlap hours, clear owners).</li>
<li>Explaining a technical problem to a manager: impact first, then options and a recommendation, without jargon.</li>
<li>Flagging a risk early: what you noticed, the evidence, who you told and when, and the options you proposed.</li>
<li>Learning something new quickly: how you approached it and what you delivered.</li>
<li>A technical disagreement: how you listened, used data to decide, and committed to the outcome.</li>
</ul>`,
      },
      {
        title: 'Live coding: a steady routine',
        body: `<ol>
<li><b>Clarify</b>: restate the problem, ask about inputs, sizes and edge cases, and work one example by hand.</li>
<li><b>Plan out loud</b>: describe a simple approach first, then improve it, with its time and space cost.</li>
<li><b>Code</b> cleanly, talking as you go.</li>
<li><b>Test</b>: walk through your example and the edge cases (empty, one element, maximum values) before saying you are done.</li>
</ol>
<p>If you get stuck, say what you are thinking and try a smaller case. Asking a good clarifying question is a strength, not a weakness.</p>`,
      },
      {
        title: 'Questions to ask them',
        body: `<ul>
<li>"Which platforms and hardware does the team support, and what is the split between new bring-up and maintenance?"</li>
<li>"What debugging tools and lab setup does the team use for field issues?"</li>
<li>"What would a new hire work on in the first three months?"</li>
<li>"How does the team work with hardware and other software teams, especially across time zones?"</li>
</ul>`,
      },
    ],
    tips: [
      'Keep a one-line summary of each STAR story so you can pick the right one quickly.',
      'In live coding, clarify and test out loud; interviewers score the process, not just the answer.',
    ],
    quiz: [
      {
        id: 'd14_star',
        prompt: 'What does STAR stand for?',
        options: ['Skills, Tools, Achievements, Results', 'Situation, Task, Action, Result', 'Summary, Timeline, Analysis, Review', 'Start, Test, Adjust, Repeat'],
        answer: 1,
        explain: 'It keeps behavioural answers short and concrete: context, your responsibility, what you did, and what happened.',
      },
      {
        id: 'd14_action',
        prompt: 'Which part of a STAR answer should get the most time?',
        options: ['Situation, so the interviewer understands the background.', 'Task.', 'Result, because only outcomes matter.', 'Action: what you personally did and why, described with "I" rather than "we".'],
        answer: 3,
        explain: 'The interviewer is assessing you. Keep the situation brief, and make your own decisions and actions clear.',
      },
      {
        id: 'd14_first_step',
        prompt: 'You are given a coding problem. What should you do first?',
        options: ['Clarify the problem: restate it, ask about inputs and edge cases, and work through an example.', 'Start typing the most efficient solution you can think of.', 'Ask for the solution.', 'Explain that you have seen the problem before.'],
        answer: 0,
        explain: 'Clarifying prevents solving the wrong problem and shows the habits of an engineer who works well with others. Then outline a plan before coding.',
      },
      {
        id: 'd14_risk',
        prompt: 'Which answer best shows "flagging a risk early"?',
        options: ['"I noticed the schedule might slip, so I worked late to catch up without telling anyone."', '"I waited until the deadline to see whether it would really be a problem."', '"I noticed the driver test coverage was low for the new board, showed the team lead the data a month before release, and proposed two options with their costs."', '"I told my manager the project was doomed."'],
        answer: 2,
        explain: 'Good answers show you noticed early, used evidence, told the right person in time, and came with options rather than just a problem.',
      },
      {
        id: 'd14_stuck',
        prompt: 'You get stuck halfway through a live coding problem. What is the best response?',
        options: ['Go quiet until you have the full answer.', 'Talk through what you are thinking, try a smaller example or a simpler approach, and ask a focused question if needed.', 'Start again with a different language.', 'Say you would normally look it up and stop.'],
        answer: 1,
        explain: 'Interviewers want to see how you reason when things are hard. Thinking aloud lets them give hints, and a working simple solution beats an unfinished clever one.',
      },
    ],
  },
];
