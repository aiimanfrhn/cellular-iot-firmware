/* ---------------------------------------------------------------------------
 * Learning guide page: for each subject area, what to remember (facts,
 * numbers, syntax) and what to understand (ideas to explain in your own
 * words). It summarises guide.js and plan-guide.js, so keep them in step.
 *
 * Each area: id, title, summary, remember [html], understand [{ title, body }],
 * and links to the full material: topics (quiz.js topic ids) and days
 * (1-based plan days). All text is static trusted HTML.
 * ------------------------------------------------------------------------- */

export const NOTES_INTRO = 'Everything the guides and quizzes cover, boiled down. <b>Remember</b> lists the facts, numbers and syntax to know by heart: cover the list and recite it. <b>Understand</b> lists the ideas you must be able to explain in your own words, as you would to an interviewer. When a point is shaky, open the full guide and take its quiz.';

export const NOTES = [
  /* ===================================================== C and the compiler */
  {
    id: 'c', title: 'C and the compiler', summary: 'volatile, conversions, undefined behaviour, bits, layout',
    topics: ['c_compiler'], days: [1, 2],
    remember: [
      '<code>volatile</code>: every read and write in the source really happens. It is <b>not</b> atomic and <b>not</b> a lock.',
      'Bit idioms: set <code>x |= 1u &lt;&lt; n</code>, clear <code>x &amp;= ~(1u &lt;&lt; n)</code>, toggle <code>x ^= 1u &lt;&lt; n</code>, test <code>(x &gt;&gt; n) &amp; 1u</code>.',
      'Field read: <code>(reg &gt;&gt; shift) &amp; mask</code>. <code>x &amp; (x - 1)</code> clears the lowest set bit.',
      'Types smaller than <code>int</code> are promoted to <code>int</code> before arithmetic.',
      'Signed meets unsigned of the same size: the signed one becomes unsigned, so <code>-1 &lt; 1u</code> is false.',
      '<code>1 &lt;&lt; 31</code> (32-bit <code>int</code>) and shifting by ≥ the width are undefined. Write <code>1u &lt;&lt; 31</code>.',
      'Signed overflow is undefined; unsigned arithmetic wraps.',
      '<code>const int *p</code>: value read-only. <code>int *const p</code>: pointer fixed.',
      'An array parameter is a pointer: <code>sizeof</code> gives the pointer size.',
      'Struct members are aligned; the size rounds up to the largest alignment. Order members largest first.',
    ],
    understand: [
      { title: 'Why volatile is not enough to share data with an ISR', body: 'It guarantees the access happens (visibility), not that a read-modify-write is indivisible (atomicity). <code>count++</code> is still load, add, store.' },
      { title: 'What undefined behaviour really means', body: 'Not "it crashes": the compiler may assume it never happens and optimise on that basis, for example deleting an overflow check.' },
      { title: 'Why padding exists, and the cost of packed', body: 'CPUs access naturally aligned data fastest, and some cannot access unaligned data at all. Packed saves RAM but makes access slower or faulting.' },
      { title: 'Macros versus inline functions', body: 'Macros substitute text: missing parentheses change precedence, and arguments can be evaluated twice. <code>static inline</code> functions avoid both.' },
    ],
  },

  /* ============================================== Data structures and strings */
  {
    id: 'data', title: 'Data structures and strings', summary: 'Lists, ring buffers, pools, safe string handling',
    topics: [], days: [3, 4, 5],
    remember: [
      'Reverse a list with <code>prev</code>, <code>cur</code>, <code>next</code>: O(n) time, O(1) space.',
      'Slow and fast pointers: they meet if there is a cycle; when fast reaches the end, slow is at the middle.',
      '<code>container_of(ptr, type, member)</code> = <code>ptr</code> minus <code>offsetof(type, member)</code>.',
      'Array: O(1) index, contiguous. List: O(1) insert or delete at a known node, pointer chasing.',
      '<code>sizeof</code> is the buffer size; <code>strlen</code> excludes the <code>\'\\0\'</code>. Always leave room for the terminator.',
      '<code>strncpy</code> may leave no terminator; prefer <code>snprintf</code> or <code>strlcpy</code>. Never <code>printf(user_input)</code>.',
      'Overflow check before <code>value * 10 + digit</code>: <code>value &gt; (UINT32_MAX - digit) / 10</code>.',
      'Ring buffer: producer writes <code>head</code>, consumer writes <code>tail</code>; <code>head == tail</code> is empty; keep one slot free to detect full; power-of-two size wraps with a mask.',
      'Fixed-block pool: free list, O(1) allocate and free, no fragmentation.',
    ],
    understand: [
      { title: 'Deleting with a pointer to a pointer', body: 'The <code>struct node **</code> points at whichever link refers to the current node, so the head needs no special case.' },
      { title: 'Why arrays usually beat lists in practice', body: 'Contiguous elements share cache lines and are prefetched; list nodes are scattered, so each step can be a cache miss.' },
      { title: 'How a stack overflow becomes an exploit', body: 'Overwriting past a local array reaches the saved return address. Canaries detect it, ASLR hides addresses, NX blocks injected code; bounds checks prevent it.' },
      { title: 'Why a single-producer, single-consumer ring needs no lock', body: 'Each index has exactly one writer, and the producer publishes data before advancing <code>head</code> (with a barrier on multi-core).' },
    ],
  },

  /* ================================================================= Memory */
  {
    id: 'memory', title: 'Memory', summary: 'Sections, stack, heap, alignment, DMA',
    topics: ['memory'], days: [2, 5],
    remember: [
      '<code>.text</code> and <code>.rodata</code>: flash. <code>.data</code>: RAM, initial values copied from flash. <code>.bss</code>: RAM, zeroed. Locals: stack. <code>malloc</code>: heap.',
      'Before <code>main</code>: set the stack pointer, copy <code>.data</code>, zero <code>.bss</code>, set up clocks, call constructors.',
      'Pointer arithmetic counts elements: <code>uint32_t *</code> + 1 moves 4 bytes.',
      '<code>memcpy</code> with overlap is undefined; use <code>memmove</code>.',
      'Cortex-M0/M0+ fault on any unaligned access; M3/M4/M7 allow unaligned single loads and stores only.',
      'DMA with a data cache: <b>clean</b> before TX, <b>invalidate</b> after RX; align buffers to the cache line (32 bytes on M7).',
      'Leak: never freed. Double free: freed twice. Use-after-free: used after free. AddressSanitizer catches the last two instantly.',
    ],
    understand: [
      { title: 'Why returning a pointer to a local is a bug', body: 'The stack frame is reused as soon as the function returns, so the pointer dangles. Let the caller pass the buffer.' },
      { title: 'Why firmware avoids malloc', body: 'Unbounded timing, fragmentation (enough memory in total but no single block large enough), and failures that must be handled everywhere.' },
      { title: 'Why the cache and DMA disagree', body: 'DMA reads and writes RAM directly, while the CPU may hold newer or older copies in its cache. Maintenance operations bring them back in line.' },
      { title: 'How to measure stack use', body: 'Fill the stack with a known pattern at start-up and see how much is overwritten, or read the RTOS high-water mark.' },
    ],
  },

  /* ============================================= Interrupts and concurrency */
  {
    id: 'interrupts', title: 'Interrupts and concurrency', summary: 'ISRs, shared data, critical sections, priorities',
    topics: ['interrupts'], days: [],
    remember: [
      'Good ISR: clear the source, capture urgent data, signal a task or the main loop, return.',
      'Never in an ISR: <code>printf</code>, <code>malloc</code>, blocking calls, taking a mutex.',
      'Returning without clearing a level-style flag makes the ISR fire again forever.',
      'Cortex-M NVIC: a lower number is more urgent; strictly higher priority preempts a running handler.',
      'Latency = request to first handler instruction: about 12 cycles of hardware on Cortex-M3/M4, plus every masked section.',
      'Critical section: save PRIMASK, disable, do the work, <b>restore</b> (not an unconditional enable).',
      'Masked interrupts stay pending and run when unmasked; they are not lost.',
      'Edge-triggered: once per transition. Level-triggered: while the line is active.',
    ],
    understand: [
      { title: 'The read-modify-write race', body: 'An ISR can run between the load and the store of <code>x++</code>, and one update is lost. Protect the main-loop side, or use an atomic operation.' },
      { title: 'Torn reads', body: 'A value wider than the CPU\'s native access is read in pieces, so an ISR can update it halfway through.' },
      { title: 'The check-then-sleep race', body: 'An interrupt between <code>if (!ready)</code> and <code>WFI</code> leaves work waiting while the CPU sleeps. Mask, check, <code>WFI</code>, unmask.' },
      { title: 'Reentrancy', body: 'A function that keeps state in static or global variables breaks if it is interrupted and called again before it finishes.' },
    ],
  },

  /* =================================================================== RTOS */
  {
    id: 'rtos', title: 'RTOS', summary: 'Scheduling, blocking, mutexes, priority inversion',
    topics: ['rtos'], days: [],
    remember: [
      'Task states: running, ready, blocked, suspended. The highest-priority ready task runs.',
      'From an ISR, use the <code>FromISR</code> calls and end with <code>portYIELD_FROM_ISR(woken)</code>.',
      '<code>vTaskDelay</code> is relative and drifts; <code>vTaskDelayUntil</code> gives a fixed period. Convert with <code>pdMS_TO_TICKS</code>.',
      'Mutex: one owner, priority inheritance, protects a resource. Semaphore: signals or counts, can be given from an ISR.',
      'An ISR never takes a mutex.',
      'Stack overflow: enable <code>configCHECK_FOR_STACK_OVERFLOW</code>, check <code>uxTaskGetStackHighWaterMark</code>.',
    ],
    understand: [
      { title: 'Priority inversion', body: 'Low holds a mutex High needs; Medium preempts Low, so High waits on Medium. Priority inheritance raises Low temporarily. (Mars Pathfinder.)' },
      { title: 'Deadlock and lock ordering', body: 'Two tasks take two locks in opposite orders and each waits for the other. A single global lock order makes it impossible.' },
      { title: 'Why block instead of polling', body: 'A busy-waiting task is always ready, so lower-priority tasks, and the idle task that saves power, never run.' },
      { title: 'Why queues instead of globals', body: 'Queues copy data safely, keep order, buffer bursts and let the receiver sleep until data arrives.' },
    ],
  },

  /* ================================================== Linux and concurrency */
  {
    id: 'linux', title: 'Linux and concurrency', summary: 'Threads, locks, deadlock, interrupt halves',
    topics: [], days: [12],
    remember: [
      'Threads share the address space, heap, globals and file descriptors; each has its own stack and registers.',
      'Mutex: waiters sleep. Spinlock: waiters spin, for short sections and interrupt context. Semaphore: a counter.',
      'Never sleep while holding a spinlock; use <code>spin_lock_irqsave</code> when an interrupt handler shares the lock.',
      'Deadlock needs all four: mutual exclusion, hold and wait, no preemption, circular wait.',
      'Top half: minimal, interrupt masked. Bottom half: softirq, tasklet, or workqueue / threaded IRQ (can sleep).',
      'Two threads doing <code>counter++</code> lose updates; fix with a mutex or an atomic increment, not <code>volatile</code>.',
    ],
    understand: [
      { title: 'Why a process switch costs more than a thread switch', body: 'Switching address spaces can flush TLB entries and loses cache warmth; threads of one process share the address space.' },
      { title: 'Choosing a lock by context', body: 'Ask "may this code sleep?" If not (interrupt context, holding a spinlock), use a spinlock; if yes, a mutex.' },
      { title: 'Why interrupt handling is split in two', body: 'The top half runs with the interrupt masked and delays everything else, so it does the minimum and defers the rest.' },
    ],
  },

  /* ===================================================== Hardware and buses */
  {
    id: 'hardware', title: 'Hardware, buses and platform', summary: 'GPIO, UART, I²C, SPI, MDIO, boot, drivers',
    topics: ['buses'], days: [11],
    remember: [
      'UART 8N1 = 10 bits per byte: 115200 baud ≈ 11,520 bytes/s.',
      'I²C: SDA and SCL, open-drain with pull-ups, 7-bit addresses, 100 kHz / 400 kHz / 1 MHz. Write byte <code>0x90</code> means address <code>0x48</code>.',
      'SPI: SCK, MOSI, MISO and one chip select per device; mode = CPOL + CPHA.',
      'MDIO manages Ethernet PHYs; PCIe connects the CPU to the switching ASIC and NICs.',
      'SFP: presence pin MOD_ABS; ID EEPROM at I²C <code>0x50</code> (0xA0), diagnostics at <code>0x51</code> (0xA2).',
      'ADC: mV = counts × Vref_mV / 2<sup>N</sup>. 12-bit, 3.3 V, 2048 → about 1.65 V.',
      'A floating input reads random values: add a pull-up or pull-down.',
      'Boot: ROM → bootloader (U-Boot) → kernel + device tree → user space.',
    ],
    understand: [
      { title: 'Open-drain versus push-pull', body: 'Open-drain only pulls low and a resistor pulls high, so several devices can share one line safely (I²C, shared interrupts).' },
      { title: 'How to debug a bus', body: 'Put a logic analyser on it. Then check the usual suspects: baud rate or clock, address convention, pull-ups, SPI mode, wiring.' },
      { title: 'What a device driver does', body: 'Probe matches the hardware, maps registers, requests interrupts and DMA, initialises the device and exposes it to user space through the kernel.' },
      { title: 'Timeouts and hysteresis in platform code', body: 'Every hardware wait needs a timeout so a fault cannot hang the system; thresholds need hysteresis so outputs do not oscillate.' },
    ],
  },

  /* =================================================== Reliability and boot */
  {
    id: 'reliability', title: 'Reliability and boot', summary: 'Watchdog, faults, power, flash, updates',
    topics: ['reliability'], days: [],
    remember: [
      'Kick the watchdog from the main loop after health checks, never from a timer ISR.',
      'HardFault: read the stacked PC and LR, then CFSR, HFSR, MMFAR and BFAR.',
      'Brown-out detection holds the chip in reset when the supply is too low.',
      'Flash: erase sets a sector to 1s; programming changes 1s to 0s; about 10,000–100,000 erase cycles.',
      'CRC = accidental corruption. Signature = authenticity (secure boot).',
      'A/B updates: write the inactive slot, verify, switch; roll back unless the new image confirms itself.',
      'Save power with <code>WFI</code> and deeper sleep modes between events, not busy loops.',
    ],
    understand: [
      { title: 'Why kicking the watchdog from a timer ISR defeats it', body: 'The timer keeps firing even when the application is stuck, so the watchdog never resets the hung system.' },
      { title: 'What to do when an assert fails in the field', body: 'Record what failed in memory that survives reset, reset into a safe state, and report the reason after boot.' },
      { title: 'Why you cannot write flash every second', body: 'Each sector wears out after a limited number of erases. Write rarely, append records, and spread writes across sectors.' },
      { title: 'Designing an update that survives power loss', body: 'Never erase the only good image. Keep two slots and switch only after the new one is verified and confirmed.' },
    ],
  },

  /* ============================================================= Networking */
  {
    id: 'networking', title: 'Networking', summary: 'Headers, addressing, switching, routing, TCP and UDP',
    topics: ['networking'], days: [6, 7, 8, 9, 10],
    remember: [
      'Sizes: Ethernet header 14 B (+4 per VLAN tag), FCS 4 B, IPv4 header 20–60 B, UDP 8 B, TCP 20+ B.',
      'MTU 1500; largest UDP payload 1472; TCP MSS 1460; minimum frame 64 B (payload padded to 46).',
      'EtherType: <code>0x0800</code> IPv4, <code>0x86DD</code> IPv6, <code>0x0806</code> ARP, <code>0x8100</code> VLAN tag.',
      'VLAN ID: 12 bits, 4094 usable. Access port: one VLAN untagged. Trunk: many VLANs tagged.',
      'IP protocol: 1 ICMP, 6 TCP, 17 UDP. IHL counts 32-bit words.',
      'Usable hosts = 2<sup>(32 − prefix)</sup> − 2. /26 = 255.255.255.192, 62 hosts. /30 = 2 hosts.',
      'Private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16.',
      'MAC first byte: bit 0 set = multicast, bit 1 set = locally administered. Broadcast = <code>ff:ff:ff:ff:ff:ff</code>.',
      '<code>hton*</code> when writing to the wire, <code>ntoh*</code> when reading; <code>s</code> = 16-bit, <code>l</code> = 32-bit.',
      'TCP handshake: SYN, SYN-ACK, ACK. MAC table ageing default: 300 s.',
    ],
    understand: [
      { title: 'What a switch does with a frame', body: 'Learn the source MAC on the ingress port, look up the destination, then forward to one port or flood the VLAN (never back out of the ingress port).' },
      { title: 'What a router does with a packet', body: 'Longest prefix match on the destination IP, decrement TTL, update the checksum, rewrite the MAC addresses; the IP addresses stay the same.' },
      { title: 'ARP', body: 'Broadcast "who has this IP?", unicast reply with the MAC, cache it. Off-subnet traffic goes to the default gateway\'s MAC.' },
      { title: 'Why Spanning Tree exists', body: 'Ethernet frames have no TTL, so a loop makes broadcasts circulate and multiply forever. STP blocks redundant links.' },
      { title: 'TCP is a stream, UDP is datagrams', body: 'One <code>recv</code> on TCP can return part of a message or several; add framing. UDP keeps boundaries but may lose or reorder.' },
      { title: 'Parsing packets safely', body: 'Lengths in a packet are untrusted: check them against the bytes received, and read multi-byte fields byte by byte in big-endian order.' },
      { title: 'Planes in a switch', body: 'The ASIC forwards every packet (data plane); the CPU runs protocols that program it (control plane); CLI and SNMP manage it (management plane).' },
    ],
  },

  /* ============================================================== Debugging */
  {
    id: 'debugging', title: 'Debugging', summary: 'gdb, core dumps, sanitizers, bisecting, method',
    topics: [], days: [13],
    remember: [
      'gdb: <code>break</code>, <code>run</code>, <code>bt</code>, <code>frame</code>, <code>print</code>, <code>watch</code>, <code>next</code> / <code>step</code> / <code>finish</code>. Build with <code>-g</code>.',
      'Core dumps: <code>ulimit -c unlimited</code>, then <code>gdb ./app core</code> and <code>bt</code>.',
      'ASan: memory errors, about 2× slower. UBSan: undefined behaviour. TSan: data races. Valgrind: no rebuild, 10–50× slower.',
      '<code>git bisect start</code>, <code>bad</code>, <code>good &lt;ref&gt;</code>, or <code>bisect run ./test.sh</code>: about log<sub>2</sub>(n) builds.',
    ],
    understand: [
      { title: 'A systematic method', body: 'Gather evidence, form hypotheses, reproduce, isolate by changing one thing at a time, fix, and verify the fix removes the cause.' },
      { title: 'Which tool for which bug', body: 'Corruption or crashes in memory: ASan or valgrind. Arithmetic surprises: UBSan. Intermittent multi-thread bugs: TSan. "It used to work": git bisect.' },
      { title: 'Your hardest-bug story', body: 'Symptom, hypotheses, how you narrowed it down, the fix, and how you proved it was fixed.' },
    ],
  },

  /* ======================================================= Interview skills */
  {
    id: 'interview', title: 'Interview skills', summary: 'STAR stories, live coding, questions to ask',
    topics: [], days: [14],
    remember: [
      'STAR: Situation, Task, Action, Result. Spend most of the time on Action, and say "I".',
      'Live coding: clarify, plan out loud, code, test with examples and edge cases.',
      'Prepare five stories: cross-team work, explaining to a manager, flagging a risk, learning fast, a disagreement.',
      'Bring three questions about the platform, the debugging setup, and what a new hire works on.',
    ],
    understand: [
      { title: 'Interviewers score the process', body: 'Clarifying, reasoning out loud and testing count as much as the final code.' },
      { title: 'What to do when stuck', body: 'Keep talking, try a smaller example or a simpler approach, and ask a focused question.' },
      { title: 'Explaining to non-specialists', body: 'Impact first, then the options and your recommendation, without jargon.' },
    ],
  },
];
