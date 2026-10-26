/* ---------------------------------------------------------------------------
 * Study guide: short notes to read before each concept-quiz topic. Keyed by
 * the topic ids in quiz.js, and written to cover what that topic's questions
 * ask. Each topic: intro, sections [{ title, body }], tips (things worth
 * saying out loud in an interview). All text is static trusted HTML.
 * ------------------------------------------------------------------------- */

export const GUIDE = {
  /* ===================================================== C and the compiler */
  c_compiler: {
    intro: 'Interviewers use small snippets to check that you know what the compiler is allowed to do with your code. Most questions come down to four ideas: <code>volatile</code>, integer conversions, undefined behaviour, and how data is laid out in memory.',
    sections: [
      {
        title: 'volatile: what it does, and what it does not',
        body: `<p><code>volatile</code> tells the compiler that a value can change, or that an access has an effect, outside the code it can see. So every read and write in the source must really happen, in order, and the value must not be kept in a register.</p>
<ul>
<li><b>Use it for</b> memory-mapped hardware registers, variables written by an ISR and read by the main loop (or the other way round), and memory changed by DMA.</li>
<li><b>It does not make an access atomic.</b> <code>count++</code> on a <code>volatile</code> is still load, add, store, and an interrupt can land in between and lose an update.</li>
<li><b>It does not order ordinary memory accesses</b> around it, and it is not a substitute for a mutex between threads.</li>
</ul>
<p><code>const volatile</code> is not a contradiction: <code>const</code> means <i>this code may not write it</i>, <code>volatile</code> means <i>it can change anyway</i>. That is exactly a read-only status register.</p>`,
      },
      {
        title: 'Integer promotion and the usual arithmetic conversions',
        body: `<p>Before arithmetic, types smaller than <code>int</code> (<code>uint8_t</code>, <code>int16_t</code>, <code>char</code>…) are promoted to <code>int</code>. So with <code>uint8_t a = 200, b = 100</code>, <code>a + b</code> is 300, not 44. It only wraps when you store the result back into a <code>uint8_t</code>.</p>
<p>When a signed and an unsigned operand of the same size meet, the signed one is converted to unsigned:</p>
<pre><code>int i = -1;
unsigned int u = 1;
if (i &lt; u) { /* never taken: -1 becomes 4294967295 */ }</code></pre>
<p>Build with <code>-Wall -Wextra -Wconversion -Wsign-compare</code> and these turn into warnings.</p>`,
      },
      {
        title: 'Undefined behaviour you will be asked about',
        body: `<ul>
<li><b>Signed overflow</b>, including shifting a 1 into the sign bit: <code>1 &lt;&lt; 31</code> with a 32-bit <code>int</code>. Write <code>1u &lt;&lt; 31</code> or <code>UINT32_C(1) &lt;&lt; 31</code>.</li>
<li><b>Shifting by the type's width or more</b>, or by a negative amount: <code>x &lt;&lt; 32</code> on a 32-bit value.</li>
<li><b>Out-of-bounds access</b>, using a pointer after its object is gone, and reading an uninitialised local.</li>
<li><b>Unaligned access</b> through a cast pointer, and accessing an object through an incompatible pointer type (strict aliasing).</li>
</ul>
<p>Undefined behaviour does not mean "crashes"; it means the compiler may assume it never happens, and optimise accordingly. Unsigned overflow, by contrast, is defined: it wraps modulo 2<sup>N</sup>.</p>`,
      },
      {
        title: 'Struct padding and alignment',
        body: `<p>Each member is placed at an offset that is a multiple of its alignment, and the struct's size is rounded up to its largest alignment:</p>
<pre><code>struct s {          // offset  size
    uint8_t  a;     //   0      1   + 3 padding
    uint32_t b;     //   4      4
    uint8_t  c;     //   8      1   + 3 padding
};                  // sizeof = 12; ordering b, a, c gives 8</code></pre>
<p>Order members from largest to smallest to save RAM. <code>__attribute__((packed))</code> removes padding but makes access slower (or faulting, on some cores), so do not use packed structs to parse wire formats casually; see the Networking guide.</p>`,
      },
      {
        title: 'Arrays, static, and macros',
        body: `<ul>
<li><b>Arrays decay to pointers</b> when passed to a function. In <code>void f(int a[10])</code>, <code>sizeof(a)</code> is the size of a pointer. Always pass the length.</li>
<li><b>A <code>static</code> local</b> is initialised once and keeps its value between calls; it lives in <code>.data</code>/<code>.bss</code>, not on the stack. <b><code>static</code> at file scope</b> means "private to this file" (internal linkage).</li>
<li><b>Macros substitute text.</b> <code>#define SQUARE(x) x * x</code> turns <code>SQUARE(a + 1)</code> into <code>a + 1 * a + 1</code>. Parenthesise every parameter and the whole body, and prefer <code>static inline</code> functions, which also evaluate arguments only once.</li>
</ul>`,
      },
    ],
    tips: [
      'volatile = "do not optimise these accesses away"; it is not atomic and not a lock.',
      'Say "integer promotion" and "usual arithmetic conversions" by name when you explain a snippet.',
      'Mention that you compile with warnings as errors and run sanitizers (UBSan) in host tests.',
    ],
  },

  /* ===================================================== Pointers and arrays */
  pointers: {
    intro: 'Pointers are the heart of C, and every embedded interview probes them. This guide builds up from the basics: what a pointer is, how arrays and pointers relate, and the patterns you will use every day: output parameters, pointers to pointers and function pointers. Draw boxes and arrows as you read.',
    sections: [
      {
        title: 'What a pointer is',
        body: `<p>A pointer is a variable that holds an <b>address</b>. <code>&amp;x</code> gives the address of <code>x</code>; <code>*p</code> (dereferencing) reads or writes the object at the address in <code>p</code>.</p>
<pre><code>int x = 5;
int *p = &amp;x;     /* p holds the address of x        */
*p = 9;          /* writes 9 into x                  */
printf("%d %d\\n", x, *p);   /* 9 9 */</code></pre>
<pre><code>address   name   value
0x2000    x      9
0x2004    p      0x2000   (points at x)</code></pre>
<p>The pointer's <b>type</b> says what lives at that address: how many bytes a dereference reads and how far <code>p + 1</code> moves. <code>NULL</code> means "points nowhere"; dereferencing it, or an uninitialised pointer, is undefined behaviour. Initialise every pointer, to a real object or to <code>NULL</code>.</p>`,
      },
      {
        title: 'Passing pointers to functions',
        body: `<p>C passes every argument <b>by value</b>: the function gets a copy. To let a function change the caller's variable, pass its address:</p>
<pre><code>void swap(int *a, int *b)
{
    int t = *a;
    *a = *b;
    *b = t;
}
swap(&amp;x, &amp;y);</code></pre>
<p>The same idea gives <b>output parameters</b>, the usual way to return a value <i>and</i> a status in C:</p>
<pre><code>int parse_u32(const char *s, uint32_t *out);   /* returns 0 on success */</code></pre>
<p>Mark pointers the function only reads as <code>const</code>, so both the reader and the compiler know the data will not change.</p>`,
      },
      {
        title: 'Arrays and pointer arithmetic',
        body: `<p>An array is a contiguous block of elements. In most expressions its name <b>decays</b> to a pointer to the first element (the exceptions are <code>sizeof</code>, <code>&amp;</code> and initialising a char array from a string literal).</p>
<ul>
<li><code>a[i]</code> is defined as <code>*(a + i)</code>.</li>
<li><code>p + 1</code> moves by <code>sizeof(*p)</code> bytes, not by one byte.</li>
<li>Subtracting two pointers into the same array gives the number of <i>elements</i> between them (a <code>ptrdiff_t</code>).</li>
<li>A pointer one past the last element may be computed and compared, but not dereferenced. Anything further out is undefined.</li>
</ul>
<pre><code>uint32_t sum(const uint8_t *buf, size_t len)
{
    uint32_t total = 0;
    for (const uint8_t *p = buf; p &lt; buf + len; p++)
        total += *p;
    return total;
}</code></pre>
<p>Because an array argument arrives as a pointer, a function never knows the array's length: always pass it.</p>`,
      },
      {
        title: 'Strings, 2D arrays and arrays of pointers',
        body: `<ul>
<li><code>char a[] = "hi";</code> is a writable 3-byte array holding a copy of the string. <code>const char *b = "hi";</code> is a pointer to a read-only string literal. <code>sizeof a</code> is 3; <code>sizeof b</code> is the size of a pointer.</li>
<li><code>int m[3][4];</code> stores three rows of four <code>int</code>s one after another, so <code>m[i][j]</code> is element <code>i * 4 + j</code> from the start. A function taking it needs the column count: <code>void f(int m[][4], size_t rows)</code>.</li>
<li><code>const char *names[] = { "eth0", "eth1" };</code> is an array of pointers, each pointing at its own string. <code>argv</code> in <code>main</code> is the same shape.</li>
</ul>`,
      },
      {
        title: 'Pointers to pointers, and void *',
        body: `<p>To let a function change the caller's <i>pointer</i> (not just the data it points at), pass the pointer's address:</p>
<pre><code>int buf_create(uint8_t **out, size_t n)
{
    uint8_t *p = malloc(n);
    if (!p) return -1;
    *out = p;          /* the caller's pointer now holds the block */
    return 0;
}
uint8_t *buf;
if (buf_create(&amp;buf, 256) == 0) { /* use buf */ }</code></pre>
<p>The same trick removes the head special case when editing linked lists. <code>void *</code> is a generic "address of something": <code>malloc</code>, <code>memcpy</code> and callback contexts use it. You cannot dereference it or do arithmetic on it in standard C; assign it to a pointer of the right type first.</p>`,
      },
      {
        title: 'Function pointers',
        body: `<p>A function pointer holds the address of a function, so code can choose what to call at run time. Embedded code uses them for callbacks, interrupt vector tables, state machines and driver operation tables (like Linux's <code>struct file_operations</code>).</p>
<pre><code>typedef void (*handler_t)(uint8_t event);

static void on_press(uint8_t e)   { /* ... */ }
static void on_release(uint8_t e) { /* ... */ }

static handler_t handlers[] = { on_press, on_release };
handlers[event](event);            /* call through the table */</code></pre>
<p>Without the typedef, an array of four such pointers is declared <code>void (*table[4])(uint8_t);</code>. The typedef is far easier to read.</p>`,
      },
      {
        title: 'The pointer bugs interviewers ask about',
        body: `<ul>
<li><b>Uninitialised pointer</b>: holds garbage, so writing through it corrupts random memory.</li>
<li><b>NULL dereference</b>: check pointers that can be NULL, such as the result of <code>malloc</code> or a lookup.</li>
<li><b>Dangling pointer</b>: points at a local that went out of scope, or at freed memory.</li>
<li><b>Out of bounds / off by one</b>: <code>&lt;=</code> instead of <code>&lt;</code> in a loop writes one element past the end.</li>
<li><b>Wrong size</b>: <code>sizeof(ptr)</code> when you meant the size of the array or of the pointed-to object.</li>
<li><b>Bad casts</b>: casting a <code>uint8_t *</code> buffer to <code>uint32_t *</code> can be misaligned and breaks strict aliasing; use <code>memcpy</code>.</li>
</ul>`,
      },
    ],
    tips: [
      'Say "a[i] is *(a + i)" and "an array argument is just a pointer, so pass the length".',
      'Draw the boxes and arrows when explaining pointers to pointers or list manipulation.',
      'Mention const on read-only pointer parameters; it shows you think about interfaces.',
    ],
  },

  /* ====================================================== Memory management */
  dynamic_memory: {
    intro: 'Where objects live, how long they live, and who is responsible for freeing them. Even where firmware bans <code>malloc</code> after start-up, interviews ask about it, and Linux platform code uses it everywhere. Learn the rules and the classic bugs.',
    sections: [
      {
        title: 'Storage duration: how long an object lives',
        body: `<ul>
<li><b>Automatic</b>: ordinary locals and parameters, on the stack. They exist until their block ends, then the memory is reused.</li>
<li><b>Static</b>: globals and <code>static</code> locals, in <code>.data</code> or <code>.bss</code>. They exist for the whole program.</li>
<li><b>Allocated</b>: from <code>malloc</code>, <code>calloc</code> or <code>realloc</code>, on the heap. They exist until you call <code>free</code>.</li>
</ul>
<p><b>Scope</b> (where a name is visible) is different from <b>lifetime</b> (how long the object exists). A <code>static</code> local is only visible inside its function but lives forever, which is why returning a pointer to it is safe while returning a pointer to an ordinary local is not.</p>`,
      },
      {
        title: 'Stack versus heap',
        body: `<ul>
<li><b>Stack</b>: allocation is automatic and almost free (moving the stack pointer), memory is released in reverse order when functions return, and size is limited: a few KB per task in firmware, typically 8 MB for a Linux main thread and less for other threads.</li>
<li><b>Heap</b>: any size and any lifetime, but slower, can fail, can fragment, and you must free every block exactly once.</li>
</ul>
<p>Large buffers (tens of KB and up) do not belong on a small stack: make them static, or allocate them once.</p>`,
      },
      {
        title: 'malloc, calloc, realloc and free',
        body: `<pre><code>struct pkt *p = malloc(n * sizeof *p);
if (p == NULL)
    return -ENOMEM;</code></pre>
<ul>
<li>Write <code>sizeof *p</code> rather than <code>sizeof(struct pkt)</code>: it stays correct if the pointer's type changes. In C there is no need to cast the result of <code>malloc</code>.</li>
<li><code>malloc</code> leaves the memory <b>uninitialised</b>; <code>calloc(n, size)</code> zeroes it, and checks that <code>n * size</code> does not overflow. With <code>malloc</code>, check <code>n &gt; SIZE_MAX / sizeof *p</code> yourself when <code>n</code> comes from outside.</li>
<li><code>realloc</code> may move the block. On failure it returns NULL and the old block is still allocated, so never write <code>p = realloc(p, n)</code>:
<pre><code>void *tmp = realloc(p, new_size);
if (tmp == NULL) { /* p is still valid: handle the error */ }
else p = tmp;</code></pre></li>
<li>Pass <code>free</code> exactly the pointer you got back, once. <code>free(NULL)</code> does nothing, so setting pointers to NULL after freeing makes an accidental second free harmless.</li>
</ul>`,
      },
      {
        title: 'Ownership and cleanup',
        body: `<p>For every allocation, decide who <b>owns</b> it, meaning who must free it, and write it down: "returns a string the caller must free", or a matching pair such as <code>buf_create</code> / <code>buf_destroy</code>.</p>
<p>When a function acquires several resources, use a single cleanup path so every error exit frees what was taken. This is the standard style in the Linux kernel:</p>
<pre><code>int load_config(const char *path)
{
    int rc = -1;
    char *text = NULL;
    struct cfg *cfg = NULL;

    text = read_file(path);
    if (!text) goto out;
    cfg = malloc(sizeof *cfg);
    if (!cfg) goto out;
    /* ... parse ... */
    rc = 0;
out:
    free(cfg);    /* free(NULL) is fine */
    free(text);
    return rc;
}</code></pre>`,
      },
      {
        title: 'Memory bugs and how to find them',
        body: `<ul>
<li><b>Leak</b>: a block is never freed, often on an early-return error path. Memory use grows until allocation fails.</li>
<li><b>Double free</b>: freeing the same block twice corrupts the allocator.</li>
<li><b>Use-after-free</b>: using a block after it was freed, possibly after it was reused for something else.</li>
<li><b>Invalid free</b>: freeing a pointer <code>malloc</code> did not return, such as the address of a local or a pointer into the middle of a block.</li>
<li><b>Overflow</b> past the end of a block, and <b>reading uninitialised memory</b> from <code>malloc</code>.</li>
</ul>
<p>Tools: AddressSanitizer (<code>-fsanitize=address</code>) catches overflows, use-after-free and double frees with stack traces of the allocation and the free; LeakSanitizer and valgrind report leaks; valgrind also reports uses of uninitialised values.</p>`,
      },
      {
        title: 'What firmware does instead',
        body: `<p>Small embedded systems usually avoid the general heap after start-up: allocation time is unbounded, the heap fragments, and there may be no good way to recover from failure. Common alternatives are static allocation, allocating everything once during initialisation, and fixed-block pools with O(1) allocate and free. See the Embedded memory topic and Day 5 of the plan for pools and ring buffers.</p>`,
      },
    ],
    tips: [
      'State the ownership rule for every pointer you return or store.',
      'Show the realloc pattern with a temporary variable; interviewers look for it.',
      'Name a tool for each bug: ASan for overflows and use-after-free, LeakSanitizer or valgrind for leaks.',
    ],
  },

  /* ============================================= Interrupts and concurrency */
  interrupts: {
    intro: 'Almost every firmware bug story involves an interrupt. Expect questions on what belongs in a handler, how to share data with it safely, and how priorities and latency work on Cortex-M.',
    sections: [
      {
        title: 'What happens when an interrupt fires',
        body: `<p>On Cortex-M the hardware finishes (or abandons) the current instruction, pushes R0–R3, R12, LR, PC and xPSR to the stack, loads the handler address from the vector table and runs it. Returning restores the registers. This is why a Cortex-M ISR can be an ordinary C function.</p>
<p><b>Interrupt latency</b> is the time from the request to the first instruction of the handler. Hardware adds a fixed amount (about 12 cycles on Cortex-M3/M4). Software adds the rest: every critical section that masks interrupts, and any equal- or higher-priority handler that is already running.</p>`,
      },
      {
        title: 'Keep handlers short',
        body: `<p>A good ISR: clears the interrupt source, moves urgent data somewhere safe (a ring buffer, a register snapshot), signals the main loop or a task, and returns.</p>
<ul>
<li><b>Do not</b> call <code>printf</code> (slow, may block, usually not reentrant), <code>malloc</code>, or anything that waits on a mutex or a peripheral.</li>
<li><b>Clear the flag.</b> If you return without clearing a level-style flag, the interrupt fires again immediately and the main code never runs. The debugger always shows the same ISR.</li>
<li><b>Edge vs level.</b> Edge-triggered fires once per transition (two quick edges can merge into one). Level-triggered stays asserted while the line is active, so the handler must remove the cause; this suits shared, open-drain interrupt lines.</li>
</ul>`,
      },
      {
        title: 'Sharing data between an ISR and the main code',
        body: `<ul>
<li>Mark shared variables <code>volatile</code> so the main loop really re-reads them.</li>
<li>Read-modify-write (<code>x++</code>, <code>x |= m</code>) in the main loop must be protected, because the ISR can run between the read and the write.</li>
<li>Values wider than the CPU's native access (a 32-bit tick count on an 8-bit MCU, a 64-bit value on Cortex-M) are read in pieces and can be <b>torn</b>: half old, half new.</li>
</ul>
<p>A critical section must <b>save and restore</b> the previous interrupt state, so it still works when nested:</p>
<pre><code>uint32_t primask = __get_PRIMASK();
__disable_irq();
shared_count++;
__set_PRIMASK(primask);   /* not __enable_irq() */</code></pre>
<p>Interrupts that arrive while masked are not lost; they stay pending and run when the mask is restored. A single-producer, single-consumer ring buffer (ISR writes head, main writes tail) needs no lock at all if each index is written by only one side.</p>`,
      },
      {
        title: 'The check-then-sleep race',
        body: `<pre><code>if (!data_ready) __WFI();   /* bug */</code></pre>
<p>If the interrupt fires after the check but before <code>WFI</code>, the CPU sleeps with work waiting. Fix: mask interrupts, check, sleep, unmask. On Cortex-M a pending interrupt still wakes <code>WFI</code> while PRIMASK is set, and the ISR runs as soon as you unmask:</p>
<pre><code>__disable_irq();
if (!data_ready) __WFI();
__enable_irq();</code></pre>`,
      },
      {
        title: 'Priorities, nesting and reentrancy',
        body: `<ul>
<li>On the Cortex-M NVIC, a <b>lower number is more urgent</b>. A strictly higher-priority interrupt preempts a running handler; equal or lower priorities wait until it returns.</li>
<li>With an RTOS, only interrupts at or below the configured maximum syscall priority may call the RTOS's "FromISR" functions.</li>
<li>A function is <b>reentrant</b> if it can be interrupted and called again before the first call finishes. That rules out unprotected static or global state; classic <code>strtok</code> is the textbook counter-example.</li>
</ul>`,
      },
    ],
    tips: [
      'Describe the ISR pattern: clear, capture, signal, return; do the real work in a task or the main loop.',
      'When asked about shared data, mention both volatile and atomicity: they solve different problems.',
      'Know that critical sections should save and restore PRIMASK, and should be as short as possible.',
    ],
  },

  /* =================================================================== RTOS */
  rtos: {
    intro: 'Questions use FreeRTOS names, but the ideas apply to Zephyr, ThreadX and Linux threads too: how the scheduler picks a task, how tasks wait, and the classic synchronisation bugs.',
    sections: [
      {
        title: 'Tasks and the scheduler',
        body: `<p>Each task has its own stack and a priority, and is <b>running</b>, <b>ready</b>, <b>blocked</b> (waiting for time or an event) or suspended. A preemptive priority scheduler always runs the highest-priority ready task. Equal priorities may share the CPU by time slicing.</p>
<p>When an ISR makes a higher-priority task ready, the switch happens on interrupt exit if the ISR asks for it:</p>
<pre><code>BaseType_t woken = pdFALSE;
xSemaphoreGiveFromISR(rx_sem, &amp;woken);
portYIELD_FROM_ISR(woken);</code></pre>`,
      },
      {
        title: 'Block, do not poll',
        body: `<ul>
<li>A task that spins in <code>while (!flag) {}</code> never blocks, so every lower-priority task (and the idle task, which can put the CPU to sleep) is starved. Wait on a semaphore, queue, event group or task notification instead.</li>
<li><code>vTaskDelay(n)</code> waits <i>n</i> ticks from now, so a loop of "work, then delay" drifts by the work time. For a fixed period use <code>vTaskDelayUntil(&amp;last_wake, period)</code>.</li>
<li>Delays are in ticks: convert with <code>pdMS_TO_TICKS(ms)</code>.</li>
</ul>`,
      },
      {
        title: 'Mutexes, semaphores and priority inversion',
        body: `<ul>
<li>A <b>mutex</b> protects a shared resource. It has an owner (only the task that took it may give it back) and usually <b>priority inheritance</b>.</li>
<li>A <b>semaphore</b> signals events or counts resources. Anyone can give it, including an ISR.</li>
</ul>
<p><b>Priority inversion:</b> a low-priority task holds a mutex the high-priority task needs, and a medium-priority task preempts the low one, so the high-priority task waits on the medium one. Priority inheritance temporarily raises the holder to the waiter's priority. (This bug famously reset the Mars Pathfinder lander.)</p>
<p>An ISR must never take a mutex: it cannot block, and if the mutex is held, the owner cannot run until the ISR finishes.</p>`,
      },
      {
        title: 'Deadlock',
        body: `<p>Task A takes lock 1 then lock 2; task B takes lock 2 then lock 1. Each ends up holding one and waiting for the other. The standard fix is a <b>global lock order</b>: everyone takes locks in the same order. Also keep lock scopes small, avoid calling unknown code while holding a lock, and use timeouts so a deadlock is reported rather than silent.</p>`,
      },
      {
        title: 'Queues and stacks',
        body: `<ul>
<li>A <b>queue</b> copies data between tasks (or from an ISR with <code>xQueueSendFromISR</code>), keeps it in order, buffers bursts, and lets the receiver block until data arrives. A global variable gives you none of that.</li>
<li>Every task has a fixed-size stack. Deep call chains, recursion, large local arrays and <code>printf</code> with floats all eat it. An overflow silently corrupts whatever is next in RAM, which looks like random crashes.</li>
<li>Turn on overflow checking (<code>configCHECK_FOR_STACK_OVERFLOW</code>), measure the high-water mark (<code>uxTaskGetStackHighWaterMark</code>) and leave a margin.</li>
</ul>`,
      },
    ],
    tips: [
      'Mutex for mutual exclusion, semaphore or notification for signalling. Say why.',
      'Explain priority inversion with three tasks, then the fix (priority inheritance).',
      'For "it crashes randomly", suspect stack overflow first and say how you would measure it.',
    ],
  },

  /* ======================================================== Embedded memory */
  memory: {
    intro: 'Firmware has no virtual memory and usually no spare RAM, so you are expected to know where every byte lives and what can go wrong with pointers, the stack, the heap and DMA.',
    sections: [
      {
        title: 'Where things live',
        body: `<ul>
<li><code>.text</code> (code) and <code>.rodata</code> (constants, string literals): flash.</li>
<li><code>.data</code>: initialised globals and statics. Lives in RAM, with the initial values stored in flash.</li>
<li><code>.bss</code>: zero-initialised globals and statics. RAM, cleared at start-up, takes no flash space.</li>
<li><b>Stack</b>: locals, return addresses, saved registers. <b>Heap</b>: <code>malloc</code>, if you have one.</li>
</ul>
<p>Before <code>main</code>, the reset handler sets the stack pointer (Cortex-M loads it from the vector table), copies <code>.data</code> from flash to RAM, zeroes <code>.bss</code>, sets up clocks (often <code>SystemInit</code>) and calls C++ constructors if any.</p>`,
      },
      {
        title: 'The stack',
        body: `<ul>
<li>Returning a pointer to a local is a bug: the stack frame is reused as soon as the function returns. Let the caller provide the buffer.</li>
<li>Large local arrays, recursion and deep call chains overflow small stacks (1–2 KB is common). Make big buffers static, or allocate them once.</li>
<li>Measure stack use by filling the stack with a known pattern at start-up and checking how much is overwritten, or use the RTOS high-water mark.</li>
</ul>`,
      },
      {
        title: 'The heap, and why firmware avoids it',
        body: `<p>Many coding standards (MISRA C, many safety standards) forbid <code>malloc</code> after start-up because allocation time is not deterministic, failure has to be handled everywhere, and the heap <b>fragments</b>: after many allocations and frees of mixed sizes there can be plenty of free memory in total but no single block large enough.</p>
<p>Alternatives: static allocation, allocate everything once at start-up, or <b>fixed-size block pools</b> (constant-time allocation, no fragmentation).</p>`,
      },
      {
        title: 'Pointers to hardware, copying and alignment',
        body: `<pre><code>#define RCC_APB2ENR (*(volatile uint32_t *)0x40021018u)
RCC_APB2ENR |= (1u &lt;&lt; 2);   /* read-modify-write: set bit 2 only */</code></pre>
<ul>
<li>The <code>volatile</code> pointer makes the compiler perform each access. A read-modify-write is not atomic; protect it if an ISR touches the same register.</li>
<li><code>memcpy</code> with overlapping source and destination is undefined; use <code>memmove</code>.</li>
<li>Cortex-M0/M0+ fault on any unaligned access. M3/M4/M7 allow unaligned single loads and stores but not multi-word ones. In C, read data at arbitrary offsets with <code>memcpy</code> or byte by byte.</li>
</ul>`,
      },
      {
        title: 'DMA and caches',
        body: `<p>On cores with a data cache (Cortex-M7, application processors), the CPU and the DMA engine can see different data:</p>
<ul>
<li><b>Before a DMA transfer from memory</b> (TX): <b>clean</b> the cache for the buffer, so data still in the cache is written to RAM.</li>
<li><b>After a DMA transfer into memory</b> (RX): <b>invalidate</b> the cache for the buffer, so the CPU reads the new data rather than stale cache lines.</li>
<li>Align DMA buffers to the cache line size (32 bytes on M7) and pad them to whole lines, or put them in a non-cacheable region.</li>
</ul>`,
      },
    ],
    tips: [
      'Be able to sketch the memory map: flash with .text/.rodata/.data initialisers, RAM with .data/.bss/heap/stack.',
      'Explain why static allocation or block pools are preferred over malloc in firmware.',
      'For DMA questions, say "clean before TX, invalidate after RX".',
    ],
  },

  /* ===================================================== Hardware and buses */
  buses: {
    intro: 'You do not need to be a hardware engineer, but you must be able to bring up a peripheral and debug it with a logic analyser. These are the facts that come up most.',
    sections: [
      {
        title: 'GPIO',
        body: `<ul>
<li><b>Push-pull</b> outputs drive high and low. <b>Open-drain</b> outputs can only pull low; a resistor pulls the line high. Open-drain lets several devices share one line (wired-AND), as in I²C and shared interrupt lines.</li>
<li>An input with nothing driving it <b>floats</b> and reads random values. A button to ground needs a pull-up (internal or external) so the released state reads 1.</li>
<li>Mechanical buttons bounce for a few milliseconds; debounce in software.</li>
</ul>`,
      },
      {
        title: 'UART',
        body: `<p>Asynchronous: no clock wire, both ends must agree on the baud rate. <b>8N1</b> means a start bit, 8 data bits, no parity, 1 stop bit, so 10 bits per byte. At 115200 baud that is about <b>11,520 bytes per second</b>.</p>
<p>Garbage characters and framing errors almost always mean mismatched baud rates, or a wrong peripheral clock so the divisor is wrong. Also check that TX goes to RX, the grounds are connected, and the voltage levels match (3.3 V vs 5 V vs RS-232).</p>`,
      },
      {
        title: 'I²C',
        body: `<ul>
<li>Two open-drain wires, SDA and SCL, with <b>pull-up resistors</b>. Many devices share the bus, each with an address.</li>
<li>Addresses are <b>7 bits</b>; the first byte on the wire is the address shifted left plus the R/W bit. A datasheet that says <code>0x90</code>/<code>0x91</code> means 7-bit address <code>0x48</code>.</li>
<li>Each byte is acknowledged. A NACK on the address usually means wrong address, missing pull-ups, the device unpowered, or wrong pins.</li>
<li>Typical speeds: 100 kHz, 400 kHz, 1 MHz. Slaves may hold SCL low to slow the master (clock stretching).</li>
</ul>`,
      },
      {
        title: 'SPI',
        body: `<ul>
<li>Four wires: SCK, MOSI, MISO and a chip select (CS) <b>per device</b>; there are no addresses. Full duplex: a byte goes out while a byte comes in.</li>
<li>Push-pull and fast (often tens of MHz). A device must release MISO when it is not selected.</li>
<li><b>Mode</b> = clock polarity (CPOL) and phase (CPHA). The wrong mode typically gives data shifted by one bit. Check it first, then the bit order (MSB first is usual).</li>
</ul>`,
      },
      {
        title: 'ADC and byte order',
        body: `<p>An N-bit ADC gives 2<sup>N</sup> codes across its reference voltage: <code>mV = counts × Vref_mV / 2<sup>N</sup></code>. A 12-bit reading of 2048 with 3.3 V reference is about 1.65 V. Use integer millivolts in firmware.</p>
<p>Cortex-M is little-endian; network protocols and many sensors send big-endian. Convert explicitly (<code>ntohl</code>, or build the value from bytes) whenever data crosses that boundary.</p>`,
      },
    ],
    tips: [
      'For any "it does not work" bus question, say you would put a logic analyser or scope on the lines first.',
      'Compare I²C and SPI on wires, addressing, speed and duplex.',
      'Know the 7-bit vs 8-bit I²C address trap and the 10-bits-per-byte UART calculation.',
    ],
  },

  /* =================================================== Reliability and boot */
  reliability: {
    intro: 'Devices in the field must recover on their own. Expect questions on watchdogs, faults, power problems, flash, and how firmware gets updated without bricking anything.',
    sections: [
      {
        title: 'Watchdogs',
        body: `<p>A watchdog resets the chip unless it is refreshed ("kicked") in time. Kick it from the main loop or a supervisor task <b>only after checking that every critical task has reported in</b>. Kicking from a timer interrupt is a mistake: the timer keeps running even when the application is stuck, so the watchdog never fires.</p>
<p>Prefer an independent watchdog with its own clock, and record the reset cause at boot so watchdog resets are visible.</p>`,
      },
      {
        title: 'Faults and asserts',
        body: `<p>On a Cortex-M <b>HardFault</b>, read the stacked registers: the stacked PC points at (or just after) the faulting instruction, and LR shows how you got there. The fault status registers (CFSR, HFSR, plus MMFAR/BFAR) say whether it was a bus error, an unaligned access, a divide by zero, an undefined instruction, and so on.</p>
<p>In shipped firmware, a failed assert should <b>record what failed</b> (file and line, or the PC) in RAM that survives reset or in flash, then <b>reset into a safe state</b>, and report the stored reason after boot. Do not silently carry on, and do not hang forever.</p>`,
      },
      {
        title: 'Power',
        body: `<ul>
<li><b>Brown-out detection</b> holds the chip in reset (or interrupts it) when the supply drops below a safe level, so the CPU never runs with unreliable logic or half-written flash.</li>
<li>To save power, sleep between events: <code>WFI</code> stops the core until an interrupt, deeper modes also stop clocks and peripherals. Wake on a timer or pin interrupt, do the work, sleep again. Polling in a busy loop keeps the CPU at full power.</li>
</ul>`,
      },
      {
        title: 'Flash',
        body: `<ul>
<li>Erasing sets a whole sector or page to 1s; programming can only change 1s to 0s. To change a byte you usually erase and rewrite the whole sector.</li>
<li>Erase is slow (milliseconds) and, on single-bank parts, stalls code running from the same flash.</li>
<li>Each sector survives only about <b>10,000–100,000 erase cycles</b>. Writing a counter every second wears a sector out in days. Write rarely, append records across a sector, and spread writes over several sectors (wear levelling).</li>
</ul>`,
      },
      {
        title: 'Bootloaders and updates',
        body: `<p>A bootloader runs first, decides which image to boot, verifies it, and can install a new one. Key points:</p>
<ul>
<li>A <b>CRC</b> catches accidental corruption. It does not stop a deliberately modified image: that needs a <b>signature</b> check with a public key held by the bootloader (secure boot).</li>
<li><b>A/B (dual-slot) updates</b> write the new image to the inactive slot, verify it, then switch. Power can fail at any moment and one good image always remains.</li>
<li><b>Rollback</b>: the new image must confirm itself after a successful start, otherwise the bootloader returns to the previous slot.</li>
</ul>`,
      },
    ],
    tips: [
      'Watchdog: kick only after health checks, never from a timer ISR.',
      'Separate integrity (CRC) from authenticity (signature) when talking about updates.',
      'Mention logging the reset cause and fault registers so field failures can be diagnosed.',
    ],
  },

  /* ============================================================= Networking */
  networking: {
    intro: 'For network platform roles you are expected to parse packets safely in C and to explain what switches and routers do with them. Know the header layouts, byte order and the numbers below.',
    sections: [
      {
        title: 'Byte order and safe parsing',
        body: `<p>Network byte order is <b>big-endian</b>. Build values from bytes; this works on any CPU and at any alignment:</p>
<pre><code>static uint16_t get_be16(const uint8_t *p)
{
    return (uint16_t)((p[0] &lt;&lt; 8) | p[1]);
}
uint16_t ethertype = get_be16(frame + 12);</code></pre>
<p>Casting a buffer pointer to a <code>uint16_t *</code> or to a header struct can fault on unaligned addresses (a 14-byte Ethernet header leaves the IP header 2-byte aligned), may include struct padding the wire format does not have, and breaks strict aliasing. Always check the length before reading a field.</p>`,
      },
      {
        title: 'Ethernet frames and VLANs',
        body: `<pre><code>| dst MAC 6 | src MAC 6 | [802.1Q tag 4] | EtherType 2 | payload 46–1500 | FCS 4 |</code></pre>
<ul>
<li>EtherType <code>0x0800</code> is IPv4, <code>0x86DD</code> IPv6, <code>0x0806</code> ARP.</li>
<li>An <b>802.1Q tag</b> is 4 bytes after the source MAC: TPID <code>0x8100</code>, then 3 priority bits, 1 DEI bit and a 12-bit VLAN ID. QinQ adds an outer tag with TPID <code>0x88A8</code>. A parser loops over tags until it reaches the real EtherType.</li>
<li>The <b>MTU</b> (1500) is the largest IP packet. The largest unfragmented UDP payload is 1500 − 20 − 8 = <b>1472</b>; the TCP equivalent (MSS) is 1460.</li>
</ul>`,
      },
      {
        title: 'Switching',
        body: `<ul>
<li>A switch <b>learns</b> the source MAC of every frame against the port it arrived on, and ages entries out after a few minutes.</li>
<li>Known destination: forward out of that one port. Unknown unicast, broadcast and (by default) multicast: <b>flood</b> to every port in the same VLAN except the ingress port.</li>
<li>Ethernet frames have no TTL, so a loop makes broadcasts circulate forever (a broadcast storm). <b>Spanning Tree</b> (STP, or Rapid STP) blocks redundant links and unblocks them when an active link fails.</li>
</ul>`,
      },
      {
        title: 'IP forwarding and ARP',
        body: `<ul>
<li>Routers pick the <b>longest prefix that matches</b>. With 10.0.0.0/8, 10.1.0.0/16 and 10.1.2.0/24, a packet to 10.1.3.7 uses the /16, because 10.1.3.7 is outside 10.1.2.0/24. Hardware uses TCAM; software uses tries.</li>
<li>Each hop decrements <b>TTL</b>, drops the packet at zero (sending ICMP Time Exceeded), and must update the IPv4 <b>header checksum</b>, which covers only the header. RFC 1624 describes the incremental update.</li>
<li>The IPv4 checksum is the one's-complement of the one's-complement sum of the header's 16-bit words, with carries folded back in.</li>
<li><b>ARP</b> finds the MAC for an IPv4 address on the local link: a broadcast request, a unicast reply, then a cache entry. Off-subnet traffic is sent to the default gateway's MAC.</li>
</ul>`,
      },
      {
        title: 'TCP and UDP',
        body: `<ul>
<li><b>TCP</b> is a reliable, ordered <b>byte stream</b>. It does not keep message boundaries: one <code>recv</code> can return part of a message or several at once. Add framing (for example a length prefix) and loop until a whole message has arrived.</li>
<li><b>UDP</b> keeps message boundaries (one datagram per <code>recv</code>) but gives no delivery, ordering or duplicate guarantees. It suits telemetry where the latest value matters more than every value.</li>
</ul>`,
      },
    ],
    tips: [
      'When parsing, say: check the length, read big-endian fields byte by byte, never trust a length field from the packet.',
      'Walk through what a switch does with a frame: learn source, look up destination, forward or flood.',
      'Know the numbers: 14-byte Ethernet header, 4-byte VLAN tag, 20-byte IPv4 header, 8-byte UDP header, 1500 MTU.',
    ],
  },

  /* ========================================================= Read the code */
  read_code: {
    intro: 'Written embedded interviews often show a short C snippet and ask "What does this print?" or "What is wrong with this code?". The snippets are chosen so the obvious answer is wrong. Slow down, write down the type of every sub-expression, and apply the rules of the language, not your intuition.',
    sections: [
      {
        title: 'A method: trace by hand, write down types, check widths',
        body: `<ol>
<li><b>Note the target.</b> How wide are <code>int</code>, <code>long</code> and pointers? On a 32-bit Cortex-M they are all 32 bits. If the question does not say, state your assumption.</li>
<li><b>Write the type next to each sub-expression.</b> <code>uint8_t + uint8_t</code> is <code>int</code>; <code>int</code> compared with <code>size_t</code> is <code>size_t</code>.</li>
<li><b>Check widths at every store.</b> A value only wraps or truncates when it is converted into a narrower type: an assignment, a cast, or a parameter.</li>
<li><b>Trace like a debugger.</b> Keep a little table of each variable's value after every statement, especially with <code>i++</code>, <code>static</code> locals and macros.</li>
<li><b>Ask "is this even defined?"</b> before computing an answer. Signed overflow, shifting into the sign bit and two unsequenced writes to one variable are undefined; say so.</li>
</ol>`,
      },
      {
        title: 'Integer promotion and the usual arithmetic conversions',
        body: `<p>Before any arithmetic, operands narrower than <code>int</code> (<code>uint8_t</code>, <code>uint16_t</code>, <code>char</code>, <code>short</code>) are promoted to <code>int</code>. Then, if the two operands still differ, the "smaller" one is converted to the other's type; if one is unsigned and at least as wide, the signed one becomes unsigned.</p>
<pre><code>uint8_t a = 200, b = 100;
a + b          // int 300, not 44
uint8_t m = 0x0F;
~m             // int 0xFFFFFFF0, not 0xF0
uint16_t d = 100 - 200;   // 65436: wraps only on the store</code></pre>
<p>Unsigned arithmetic wraps modulo 2<sup>N</sup> and is well defined. Signed overflow is undefined behaviour. Integer division truncates toward zero, and <code>%</code> takes the sign of the left operand: <code>-7 / 2 == -3</code>, <code>-7 % 2 == -1</code>.</p>`,
      },
      {
        title: 'Signed and unsigned comparisons',
        body: `<p>When <code>int</code> meets <code>unsigned int</code> or <code>size_t</code>, the <code>int</code> is converted to unsigned, so -1 becomes 4294967295:</p>
<pre><code>if (-1 &gt; sizeof(int))   // true: sizeof is an unsigned size_t
int i = -1; unsigned u = 1;
if (i &lt; u)              // false</code></pre>
<p>The same trap appears in loops: <code>for (unsigned i = n - 1; i &gt;= 0; i--)</code> never ends, because an unsigned value is always &gt;= 0. Build with <code>-Wsign-compare</code> (part of <code>-Wextra</code>).</p>`,
      },
      {
        title: 'sizeof, arrays and strings',
        body: `<ul>
<li><code>sizeof</code> on an array in the scope where it is declared gives the whole array: <code>char s[] = "UART"</code> has <code>sizeof</code> 5, because the literal includes the <code>'\\0'</code>. <code>strlen(s)</code> is 4.</li>
<li>On a pointer, or on an array parameter (which is really a pointer), <code>sizeof</code> gives the pointer size, 4 on a 32-bit MCU.</li>
<li>A struct's size includes padding: each member sits at a multiple of its alignment, and the total is rounded up to the largest alignment. Compute offsets one member at a time.</li>
</ul>`,
      },
      {
        title: 'Macros and precedence',
        body: `<p>Macros substitute text before the compiler sees it. Expand them on paper first:</p>
<pre><code>#define SQUARE(x) x * x
SQUARE(1 + 2)          // 1 + 2 * 1 + 2 == 5, not 9
#define MAX(a, b) ((a) &gt; (b) ? (a) : (b))
MAX(i++, j)            // i++ may run twice</code></pre>
<p>Precedence traps worth memorising: <code>==</code> and <code>!=</code> bind tighter than <code>&amp;</code>, <code>^</code> and <code>|</code>, so <code>x &amp; MASK == MASK</code> means <code>x &amp; (MASK == MASK)</code>. <code>+</code> and <code>-</code> bind tighter than <code>&lt;&lt;</code>, so <code>1 &lt;&lt; 2 + 3</code> is <code>1 &lt;&lt; 5</code>. When in doubt, the answer is "add parentheses".</p>`,
      },
      {
        title: '"What is wrong with this code?"',
        body: `<p>Scan for the usual embedded suspects, in roughly this order:</p>
<ul>
<li>A variable shared with an ISR that is not <code>volatile</code>, or a read-modify-write on it (<code>count++</code>, <code>flags |= x</code>) without a critical section.</li>
<li>A pointer to a local returned or stored beyond the function's lifetime.</li>
<li>Unbounded copies (<code>strcpy</code>, <code>sprintf</code>, <code>memcpy</code> with an external length) into fixed buffers.</li>
<li><code>malloc</code>, <code>printf</code> or blocking calls inside an ISR.</li>
<li>Signed shifts, missing <code>u</code> suffixes, and casts that hide truncation.</li>
</ul>`,
      },
    ],
    tips: [
      'Read the snippet aloud and name the rule you are applying: "both operands are promoted to int", "the usual arithmetic conversions make -1 unsigned".',
      'State your assumptions about the target (int is 32 bits, char signedness, endianness) before you answer.',
      'If the code is undefined behaviour, say so instead of guessing an output, then say how you would fix it.',
      'Mention that -Wall -Wextra -Werror would have flagged most of these snippets.',
    ],
  },
};
