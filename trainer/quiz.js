/* ---------------------------------------------------------------------------
 * Concept quiz: the spoken questions of an embedded/firmware interview.
 * Each question: id, topic, prompt, options, answer (index into options),
 * explain. Prompt, options and explanation are static trusted HTML.
 * app.js renders it as the Concept quiz view. Answers are stored per id, so
 * keep ids stable once published.
 * ------------------------------------------------------------------------- */

export const QUIZ_TOPICS = [
  { id: 'c_compiler', title: 'C and the compiler', summary: 'volatile, promotion, padding' },
  { id: 'interrupts', title: 'Interrupts and concurrency', summary: 'ISRs, races, critical sections' },
  { id: 'rtos', title: 'RTOS', summary: 'Mutexes, semaphores, scheduling' },
  { id: 'memory', title: 'Memory', summary: 'Sections, stack, heap, DMA' },
  { id: 'buses', title: 'Hardware and buses', summary: 'GPIO, UART, I²C, SPI' },
  { id: 'reliability', title: 'Reliability and boot', summary: 'Watchdog, faults, flash' },
  { id: 'networking', title: 'Networking', summary: 'Byte order, headers, switching' },
];

export const QUIZ = [
  /* ===================================================== C and the compiler */
  {
    id: 'c_volatile', topic: 'c_compiler',
    prompt: 'What does <code>volatile</code> tell the compiler about a variable?',
    options: [
      'Accesses to it are atomic, so it is safe to share with an ISR.',
      'Every read and write in the source must really happen, and its value must not be cached in a register.',
      'It must be placed in RAM rather than flash.',
      'Interrupts are disabled while it is accessed.',
    ],
    answer: 1,
    explain: '<code>volatile</code> stops the compiler from optimising away or merging accesses, which is what you need for hardware registers and variables changed by an ISR. It does <b>not</b> make an access atomic and does not order it against ordinary (non-volatile) memory accesses.',
  },
  {
    id: 'c_const_volatile', topic: 'c_compiler',
    prompt: 'When does <code>const volatile</code> make sense?',
    options: [
      'Never; the two qualifiers contradict each other.',
      'For a lookup table that should be stored in flash.',
      'For a read-only hardware status register: your code must not write it, but its value can change at any time.',
      'For a constant that the optimiser should inline everywhere.',
    ],
    answer: 2,
    explain: '<code>const</code> means <i>this code may not write it</i>; <code>volatile</code> means <i>it can change outside this code</i>. A status or input-data register is exactly that combination.',
  },
  {
    id: 'c_volatile_counter', topic: 'c_compiler',
    prompt: 'An ISR and the main loop both run <code>count++</code> on <code>volatile uint32_t count</code>. Is this safe?',
    options: [
      'Yes, because <code>count</code> is <code>volatile</code>.',
      'Yes, because a 32-bit increment is a single instruction on ARM.',
      'Only if the optimiser is turned off.',
      'No. <code>count++</code> is a read-modify-write, and the ISR can run between the read and the write, losing an update.',
    ],
    answer: 3,
    explain: 'On a load/store architecture <code>count++</code> is load, add, store. If the interrupt fires between the load and the store, one increment is lost. Protect the main-loop update with a short critical section, or use an atomic operation (for example <code>LDREX/STREX</code> or C11 <code>atomic_fetch_add</code>).',
  },
  {
    id: 'c_struct_padding', topic: 'c_compiler',
    prompt: 'On a typical 32-bit ARM target, what is <code>sizeof</code> this struct?<pre><code>struct s {\n    uint8_t  a;\n    uint32_t b;\n    uint8_t  c;\n};</code></pre>',
    options: ['6', '12', '9', '8'],
    answer: 1,
    explain: '<code>b</code> must be 4-byte aligned, so 3 padding bytes follow <code>a</code>. The struct size is rounded up to its alignment (4), so <code>c</code> is followed by 3 more: 1 + 3 + 4 + 1 + 3 = 12. Ordering members largest-first (<code>b, a, c</code>) gives 8.',
  },
  {
    id: 'c_integer_promotion', topic: 'c_compiler',
    prompt: 'What does this print?<pre><code>uint8_t a = 200, b = 100;\nif (a + b &gt; 255) puts("big");\nelse            puts("small");</code></pre>',
    options: [
      '<code>big</code>, because both operands are promoted to <code>int</code> before the addition, so the sum is 300.',
      '<code>small</code>, because the sum wraps to 44 in 8 bits.',
      'It is undefined behaviour.',
      'It does not compile without a cast.',
    ],
    answer: 0,
    explain: 'Integer promotion converts <code>uint8_t</code> operands to <code>int</code> before arithmetic, so <code>a + b</code> is 300. The wrap to 44 only happens if you store the result back into a <code>uint8_t</code>.',
  },
  {
    id: 'c_signed_shift', topic: 'c_compiler',
    prompt: 'With a 32-bit <code>int</code>, what is wrong with <code>uint32_t mask = 1 &lt;&lt; 31;</code>?',
    options: [
      'Nothing; it produces 0x80000000.',
      'It is undefined behaviour: <code>1</code> is a signed <code>int</code> and the result does not fit. Write <code>1u &lt;&lt; 31</code>.',
      'It compiles to 0 because the shift wraps round.',
      'Shifts by more than 16 are not portable.',
    ],
    answer: 1,
    explain: 'Shifting a 1 into the sign bit of a signed <code>int</code> overflows, which is undefined behaviour in C. Using an unsigned constant (<code>1u</code>, or <code>UINT32_C(1)</code>) makes it well defined.',
  },

  /* ============================================= Interrupts and concurrency */
  {
    id: 'isr_should_do', topic: 'interrupts',
    prompt: 'Which is the best description of what an interrupt handler should do?',
    options: [
      'Handle the whole event, including logging it over UART, so nothing is missed.',
      'Wait on a mutex until the data structure it needs is free.',
      'Clear the interrupt source, move the urgent data somewhere safe (such as a ring buffer), signal the main code or a task, and return quickly.',
      'Allocate a buffer with <code>malloc</code> for each event.',
    ],
    answer: 2,
    explain: 'Long ISRs delay every other interrupt and the main code. Keep them short and deterministic, and defer the real work. Blocking calls, <code>malloc</code> and slow I/O do not belong in an ISR.',
  },
  {
    id: 'isr_printf', topic: 'interrupts',
    prompt: 'Why is calling <code>printf</code> from an ISR a bad idea?',
    options: [
      'It may be slow, block on the UART, use the heap or locks, and is usually not reentrant.',
      'It is fine as long as the format string is short.',
      'Floating-point registers are not available in handler mode.',
      'ISRs cannot call any function.',
    ],
    answer: 0,
    explain: 'If the main code was inside <code>printf</code> when the interrupt fired, re-entering it can corrupt its internal state. It can also take milliseconds, missing other interrupts. Log by copying data to a buffer and printing it later.',
  },
  {
    id: 'isr_flag_not_cleared', topic: 'interrupts',
    prompt: 'An ISR returns without clearing the peripheral\'s interrupt flag. What usually happens?',
    options: [
      'Nothing; the flag clears itself on exit.',
      'The interrupt is ignored until the next reset.',
      'The CPU raises a HardFault.',
      'The interrupt fires again as soon as the ISR returns, so the CPU is stuck re-entering it and the main code stops running.',
    ],
    answer: 3,
    explain: 'For level-style peripheral flags, the interrupt stays pending while the flag is set. The classic symptom is a device that "hangs" with the debugger always showing the same ISR.',
  },
  {
    id: 'isr_torn_read', topic: 'interrupts',
    prompt: 'On an 8-bit MCU, an ISR updates a 32-bit <code>volatile</code> tick counter. The main code reads it. What can go wrong?',
    options: [
      'Nothing, because the variable is <code>volatile</code>.',
      'The read takes several instructions, so the ISR can update it halfway through and main sees a mix of old and new bytes (a torn read).',
      'The compiler will refuse to read a 32-bit value on an 8-bit CPU.',
      'The counter will overflow sooner.',
    ],
    answer: 1,
    explain: 'Anything wider than the CPU\'s native access size is read in pieces. Fix it with a short critical section around the read, or by reading until two consecutive reads agree.',
  },
  {
    id: 'isr_critical_section', topic: 'interrupts',
    prompt: 'Your critical section disables interrupts and then unconditionally re-enables them at the end. What is the risk?',
    options: [
      'None; that is the standard pattern.',
      'It makes the code larger.',
      'If the caller already had interrupts disabled (for example a nested critical section), they are re-enabled too early. Save and restore the previous state instead, such as PRIMASK on Cortex-M.',
      'Interrupts that arrive while disabled are lost forever.',
    ],
    answer: 2,
    explain: 'Save the interrupt mask, disable, do the work, then restore the saved mask. Also keep the section as short as possible, because it adds to interrupt latency. (Pending interrupts are not lost; they run once interrupts are re-enabled.)',
  },
  {
    id: 'isr_reentrant', topic: 'interrupts',
    prompt: 'What makes a function reentrant?',
    options: [
      'It can be interrupted and safely called again before the first call finishes, because it uses no unprotected shared or static mutable state.',
      'It is declared <code>static inline</code>.',
      'It only uses <code>volatile</code> variables.',
      'It never calls other functions.',
    ],
    answer: 0,
    explain: 'Functions that keep state in static or global variables (classic <code>strtok</code>, many <code>printf</code> implementations) are not reentrant. Pass state in through parameters, or protect it.',
  },

  /* =================================================================== RTOS */
  {
    id: 'rtos_priority_inversion', topic: 'rtos',
    prompt: 'What is priority inversion, and what is the usual fix?',
    options: [
      'A low-priority task runs before a high-priority one because of round-robin scheduling; fix it by disabling time slicing.',
      'Interrupt priorities are numbered backwards on Cortex-M; fix it in the NVIC setup.',
      'Two tasks wait for each other forever; fix it by adding timeouts.',
      'A high-priority task waits for a mutex held by a low-priority task, and a medium-priority task preempts the low one, so the high task waits indefinitely. Fix it with a priority-inheritance mutex.',
    ],
    answer: 3,
    explain: 'With priority inheritance, the low task temporarily runs at the high task\'s priority while it holds the mutex, so the medium task cannot preempt it. The Mars Pathfinder resets in 1997 are the famous example.',
  },
  {
    id: 'rtos_mutex_vs_semaphore', topic: 'rtos',
    prompt: 'What is the key difference between a mutex and a binary semaphore?',
    options: [
      'There is none; they are the same object.',
      'A mutex has an owner: only the task that took it may give it back, and it usually supports priority inheritance. A semaphore is a signal that any task or ISR can give.',
      'A semaphore can only be used from interrupts.',
      'A mutex is faster because it never blocks.',
    ],
    answer: 1,
    explain: 'Use a mutex to protect a shared resource. Use a semaphore (or a task notification) to signal an event, for example from an ISR to the task that processes the data.',
  },
  {
    id: 'rtos_from_isr', topic: 'rtos',
    prompt: 'In FreeRTOS, how should an ISR signal a task that data is ready?',
    options: [
      'Call <code>xSemaphoreTake</code> with a long timeout.',
      'Call <code>vTaskDelay</code> until the task notices.',
      'Use the <code>FromISR</code> API, such as <code>xSemaphoreGiveFromISR</code>, then request a context switch if it woke a higher-priority task.',
      'Write to a global flag and call <code>vTaskSuspendAll</code>.',
    ],
    answer: 2,
    explain: 'Only the <code>...FromISR</code> functions are safe in an interrupt; they never block. Passing <code>&amp;xHigherPriorityTaskWoken</code> and calling <code>portYIELD_FROM_ISR</code> lets the woken task run as soon as the ISR exits.',
  },
  {
    id: 'rtos_deadlock', topic: 'rtos',
    prompt: 'Task A takes mutex 1 then mutex 2. Task B takes mutex 2 then mutex 1. Sometimes both hang. Best fix?',
    options: [
      'Make every task take the mutexes in the same global order.',
      'Raise task A\'s priority.',
      'Replace the mutexes with <code>volatile</code> flags.',
      'Add a <code>vTaskDelay(1)</code> between the two takes.',
    ],
    answer: 0,
    explain: 'This is a classic deadlock: each task holds one lock and waits for the other. A consistent lock order makes the cycle impossible. Timeouts can help you detect it, but do not fix it.',
  },
  {
    id: 'rtos_stack_overflow', topic: 'rtos',
    prompt: 'A task occasionally corrupts unrelated variables and the system crashes at random. What should you suspect first, and how do you check?',
    options: [
      'A compiler bug; switch to <code>-O0</code>.',
      'Flash wear; replace the board.',
      'Clock drift; recalibrate the oscillator.',
      'A task stack overflow. Check each task\'s stack high-water mark and enable the RTOS overflow checking.',
    ],
    answer: 3,
    explain: 'Large local arrays, deep call chains and <code>printf</code> can overflow a small task stack into neighbouring memory. In FreeRTOS use <code>uxTaskGetStackHighWaterMark</code> and <code>configCHECK_FOR_STACK_OVERFLOW</code>.',
  },
  {
    id: 'rtos_queue', topic: 'rtos',
    prompt: 'Why pass sensor readings to another task through an RTOS queue rather than a global variable?',
    options: [
      'Queues use less RAM.',
      'The queue copies each item and handles synchronisation: the receiver can block until data arrives, and nothing is overwritten half-read.',
      'Global variables cannot be read from another task.',
      'Queues are required by the MISRA C standard.',
    ],
    answer: 1,
    explain: 'A queue gives you a thread-safe buffer plus blocking and wake-up. With a global you must add your own locking and some way to signal "new data".',
  },

  /* ================================================================= Memory */
  {
    id: 'mem_sections', topic: 'memory',
    prompt: 'Where does <code>int counter = 5;</code> (a global) normally live, and where does <code>int buffer[256];</code> (a global with no initialiser) live?',
    options: [
      '<code>counter</code> in .data (in RAM, initial value copied from flash at start-up); <code>buffer</code> in .bss (RAM zeroed at start-up).',
      'Both on the stack.',
      'Both in flash, because they are globals.',
      '<code>counter</code> in .bss; <code>buffer</code> in .data.',
    ],
    answer: 0,
    explain: 'Initialised globals need their starting values stored in flash and copied to RAM. Zero-initialised globals only need RAM, which start-up code clears. <code>const</code> data usually stays in flash (.rodata).',
  },
  {
    id: 'mem_startup', topic: 'memory',
    prompt: 'On a bare-metal Cortex-M, what does the start-up code do before <code>main()</code>?',
    options: [
      'Nothing; the CPU jumps straight to <code>main</code>.',
      'It loads the program from flash into RAM.',
      'It initialises the stack pointer (from the vector table), copies .data from flash to RAM, zeroes .bss, usually sets up clocks, then calls <code>main</code>.',
      'It runs the RTOS scheduler.',
    ],
    answer: 2,
    explain: 'The reset handler prepares the C run-time environment. If .data is not copied or .bss not zeroed, globals start with garbage, which is a common bring-up bug.',
  },
  {
    id: 'mem_malloc', topic: 'memory',
    prompt: 'Why do many firmware coding standards forbid <code>malloc</code> after start-up?',
    options: [
      'Embedded C libraries do not provide <code>malloc</code>.',
      'It is always slower than a function call.',
      'It uses flash instead of RAM.',
      'Fragmentation and unpredictable timing: it can fail long after deployment, and the time it takes is not bounded.',
    ],
    answer: 3,
    explain: 'Prefer static allocation, or fixed-size block pools, which are O(1) and cannot fragment. If dynamic allocation is unavoidable, allocate once during initialisation.',
  },
  {
    id: 'mem_register', topic: 'memory',
    prompt: 'What does this line do?<pre><code>*(volatile uint32_t *)0x40021018 |= (1u &lt;&lt; 2);</code></pre>',
    options: [
      'Writes the value 4 to address 0x40021018, clearing the other bits.',
      'Reads the 32-bit register at 0x40021018, sets bit 2, and writes it back, leaving the other bits unchanged.',
      'Declares a pointer variable at that address.',
      'Shifts the register contents left by 2.',
    ],
    answer: 1,
    explain: 'It is a read-modify-write of a memory-mapped register. <code>volatile</code> makes sure both the read and the write happen. (On STM32F1, 0x40021018 is RCC_APB2ENR and bit 2 enables the GPIOA clock.)',
  },
  {
    id: 'mem_dma_cache', topic: 'memory',
    prompt: 'On a Cortex-M7 with the data cache on, the CPU fills a buffer and then starts a DMA transfer from it to a UART. Garbage comes out. Why?',
    options: [
      'The new data is still in the cache and has not reached RAM. Clean (flush) the cache for that buffer before starting the DMA.',
      'DMA cannot read from RAM.',
      'The buffer must be declared <code>const</code>.',
      'The UART baud rate is wrong.',
    ],
    answer: 0,
    explain: 'DMA reads RAM directly and does not see the cache. Clean before DMA reads memory (TX); invalidate before the CPU reads memory that DMA wrote (RX). Alternatively, put DMA buffers in a non-cacheable region.',
  },
  {
    id: 'mem_stack_overflow_cause', topic: 'memory',
    prompt: 'Which of these is the most likely to overflow a 1 KB stack?',
    options: [
      'A global array of 4 KB.',
      'A <code>static</code> local array of 2 KB.',
      'A 512-byte local array in a function that is called recursively.',
      'A <code>const</code> table of 8 KB.',
    ],
    answer: 2,
    explain: 'Globals, static locals and const tables are not on the stack. Large local arrays and recursion are, and each recursive call adds another 512 bytes here.',
  },

  /* ===================================================== Hardware and buses */
  {
    id: 'bus_i2c_vs_spi', topic: 'buses',
    prompt: 'Which statement about I²C and SPI is correct?',
    options: [
      'SPI uses device addresses; I²C uses a chip-select line per device.',
      'I²C uses two shared open-drain lines with device addresses; SPI uses separate data lines plus a chip select per device, is full duplex, and is usually much faster.',
      'Both need pull-up resistors on every line.',
      'I²C is full duplex; SPI is half duplex.',
    ],
    answer: 1,
    explain: 'I²C: SDA and SCL, 7-bit addressing, typically 100 kHz to 1 MHz. SPI: SCLK, MOSI, MISO and one CS per device, often tens of MHz, no addressing or acknowledgements.',
  },
  {
    id: 'bus_i2c_pullups', topic: 'buses',
    prompt: 'Why does an I²C bus need pull-up resistors?',
    options: [
      'To limit current to the sensor.',
      'To filter noise on long cables.',
      'They are only needed above 400 kHz.',
      'Devices can only pull the lines low (open-drain), so a resistor is needed to bring a line high when nobody is driving it.',
    ],
    answer: 3,
    explain: 'Open-drain lines let any device pull low without short-circuiting the others, which is what makes clock stretching and arbitration possible. Too weak a pull-up gives slow edges; too strong wastes current.',
  },
  {
    id: 'bus_uart_rate', topic: 'buses',
    prompt: 'A UART runs at 115200 baud, 8N1. Roughly how many bytes per second can it carry?',
    options: ['14400', '115200', '11520', '9600'],
    answer: 2,
    explain: '8N1 sends a start bit, 8 data bits and 1 stop bit: 10 bits per byte. 115200 / 10 = 11520 bytes per second, about 87 µs per byte.',
  },
  {
    id: 'bus_floating_input', topic: 'buses',
    prompt: 'A button connects a GPIO input to ground. With the button released, the pin reads random values. What is missing?',
    options: [
      'A pull-up resistor (internal or external), so the pin reads high when the button is open.',
      'A faster GPIO clock.',
      'A debounce delay.',
      'A capacitor in series with the button.',
    ],
    answer: 0,
    explain: 'With the button open, the pin is floating and picks up noise. A pull-up defines the idle level; the button then pulls it low. Debouncing is a separate problem that appears when the button changes state.',
  },
  {
    id: 'bus_spi_mode', topic: 'buses',
    prompt: 'An SPI sensor returns values that look shifted by one bit. Which setting should you check first?',
    options: [
      'The chip-select GPIO speed.',
      'The SPI mode (CPOL and CPHA): the clock idle level and which edge the data is sampled on must match the sensor\'s datasheet.',
      'The I²C address.',
      'The UART parity setting.',
    ],
    answer: 1,
    explain: 'A CPHA mismatch samples data on the wrong edge, which often looks like values shifted by one bit. Also check bit order (MSB first) and the maximum clock rate.',
  },
  {
    id: 'bus_endianness', topic: 'buses',
    prompt: 'A Cortex-M receives a 32-bit length field from a network protocol. What do you need to remember?',
    options: [
      'Nothing; all CPUs and protocols use the same byte order.',
      'Cortex-M is big-endian, like network byte order.',
      'Only floating-point values have a byte order.',
      'Cortex-M is normally little-endian, while network byte order is big-endian, so assemble the value byte by byte (or use <code>ntohl</code>).',
    ],
    answer: 3,
    explain: 'Reading the field byte by byte (<code>(p[0] &lt;&lt; 24) | …</code>) is correct on any CPU and avoids unaligned access too.',
  },

  /* =================================================== Reliability and boot */
  {
    id: 'rel_watchdog_kick', topic: 'reliability',
    prompt: 'Where should you refresh ("kick") the watchdog?',
    options: [
      'In the main loop or a supervisor task, only after checking that all the important tasks have made progress.',
      'In a periodic timer interrupt, so it never times out.',
      'At the start of <code>main()</code>, once.',
      'Inside every function.',
    ],
    answer: 0,
    explain: 'Kicking from a timer ISR defeats the watchdog: the ISR keeps running even if the main code is stuck in a loop. The kick should prove that the system is healthy.',
  },
  {
    id: 'rel_bootloader', topic: 'reliability',
    prompt: 'What is the main job of a firmware bootloader in a field-updatable device?',
    options: [
      'To initialise the RTOS.',
      'To compress the application in flash.',
      'To run first, check whether a valid application image is present (for example with a CRC or signature), install updates if needed, and then jump to the application.',
      'To provide <code>printf</code> over UART.',
    ],
    answer: 2,
    explain: 'A good bootloader never bricks the device: it validates an image before running it and keeps a way to recover, such as a second image slot or an update mode.',
  },
  {
    id: 'rel_brownout', topic: 'reliability',
    prompt: 'What does brown-out detection protect against?',
    options: [
      'Over-temperature.',
      'The CPU running erratically, or corrupting flash writes, when the supply voltage sags below the safe operating level. The MCU is held in reset instead.',
      'Electrostatic discharge on the pins.',
      'Running out of RAM.',
    ],
    answer: 1,
    explain: 'Without it, a slowly falling or noisy supply can execute random instructions or leave a half-written flash page. Enable it, especially in battery-powered devices.',
  },
  {
    id: 'rel_flash', topic: 'reliability',
    prompt: 'Which statement about on-chip NOR flash is correct?',
    options: [
      'You can overwrite any byte at any time, just like RAM.',
      'Flash has unlimited write cycles.',
      'Erasing sets a single bit to 1.',
      'Erasing works on a whole page or sector and sets bits to 1; programming can only change 1s to 0s; and each sector survives a limited number of erase cycles.',
    ],
    answer: 3,
    explain: 'To change data you erase the sector and rewrite it. Endurance is typically 10,000 to 100,000 cycles, which is why logs and settings use wear levelling or rotate between pages.',
  },
  {
    id: 'rel_hardfault', topic: 'reliability',
    prompt: 'Your Cortex-M lands in the HardFault handler. What is the most useful first step?',
    options: [
      'Read the stacked registers (especially PC and LR) from the exception stack frame and the fault status registers (CFSR, HFSR) to find the faulting instruction and cause.',
      'Increase the clock speed.',
      'Add more <code>volatile</code> keywords.',
      'Reflash the device and hope it does not happen again.',
    ],
    answer: 0,
    explain: 'The stacked PC points at (or near) the failing instruction; CFSR tells you whether it was, for example, a bus error, an unaligned access or a divide by zero. Look up the PC in the map file or with <code>addr2line</code>.',
  },
  {
    id: 'rel_low_power', topic: 'reliability',
    prompt: 'A battery device spends most of its time waiting for a 1 Hz timer. What is the usual way to save power?',
    options: [
      'Poll the timer flag in a tight loop.',
      'Lower the UART baud rate.',
      'Put the CPU into a sleep or stop mode (for example with <code>WFI</code>) and let the timer interrupt wake it.',
      'Turn off the watchdog.',
    ],
    answer: 2,
    explain: 'Busy-waiting keeps the core running at full current. Sleeping until an interrupt can cut consumption by orders of magnitude; deeper stop modes also gate clocks and peripherals, at the cost of a longer wake-up time.',
  },

  /* ============================================================= Networking */
  {
    id: 'net_ethertype', topic: 'networking',
    prompt: '<code>p</code> points at a received Ethernet frame (<code>uint8_t *</code>). Which is the safe, portable way to read the EtherType at bytes 12–13?',
    options: [
      '<code>uint16_t t = *(uint16_t *)(p + 12);</code>',
      '<code>uint16_t t = ntohl(*(uint32_t *)(p + 12));</code>',
      '<code>uint16_t t = (uint16_t)((p[12] &lt;&lt; 8) | p[13]);</code>',
      '<code>uint16_t t = p[12] + p[13];</code>',
    ],
    answer: 2,
    explain: 'Network byte order is big-endian, so the first byte is the high byte. Building the value from bytes works on any CPU. Casting to <code>uint16_t *</code> can fault on an unaligned address, breaks strict aliasing, and still gives the wrong value on a little-endian CPU without <code>ntohs</code>.',
  },
  {
    id: 'net_header_cast', topic: 'networking',
    prompt: 'Why is <code>struct ip_hdr *ip = (struct ip_hdr *)(frame + 14);</code> risky in driver code?',
    options: [
      'The IP header starts at an address that is only 2-byte aligned, the struct may contain padding the wire format does not have, and the cast breaks strict aliasing.',
      'Pointer arithmetic on <code>uint8_t *</code> is undefined behaviour.',
      'Structs cannot describe variable-length headers at all.',
      'It is not risky; this is exactly how all network stacks work.',
    ],
    answer: 0,
    explain: 'A 14-byte Ethernet header leaves the IP header misaligned for 4-byte fields, which faults on some CPUs. That is why many drivers reserve 2 bytes (<code>NET_IP_ALIGN</code>) before the frame. Stacks that do cast use packed, fixed-width structs, check lengths first, and build with <code>-fno-strict-aliasing</code>; parsing field by field with byte reads or <code>memcpy</code> avoids the problem.',
  },
  {
    id: 'net_ttl_checksum', topic: 'networking',
    prompt: 'A router decrements an IPv4 packet\'s TTL before forwarding it. What must it do with the header checksum?',
    options: [
      'Nothing; the checksum only covers the payload.',
      'Nothing; only the final host checks it.',
      'Set it to zero, which means "no checksum" in IPv4.',
      'Update it, because the checksum covers the IPv4 header. An incremental update (RFC 1624) avoids summing the whole header again.',
    ],
    answer: 3,
    explain: 'The IPv4 checksum is the one\'s-complement sum of the header\'s 16-bit words, and every hop verifies it. Changing TTL changes one word, so the checksum can be adjusted from the old and new values. (A zero UDP checksum means "none"; IPv4 has no such option.)',
  },
  {
    id: 'net_unknown_unicast', topic: 'networking',
    prompt: 'A learning switch receives a frame whose destination MAC is not in its forwarding table. What does it do?',
    options: [
      'Drops the frame.',
      'Floods it out of every port in the same VLAN except the one it arrived on, and learns the source MAC on the ingress port.',
      'Sends an ARP request for the destination MAC.',
      'Sends it back out of the port it arrived on.',
    ],
    answer: 1,
    explain: 'Unknown unicast is flooded within the VLAN, like broadcast. The source address is always learned, so the reply will be switched directly. ARP is an IP-layer mechanism; a layer-2 switch does not use it to forward.',
  },
  {
    id: 'net_vlan_tag', topic: 'networking',
    prompt: 'Where does an 802.1Q VLAN tag go in an Ethernet frame?',
    options: [
      'In the IP header\'s type-of-service byte.',
      'At the end of the frame, before the FCS.',
      'It is 4 bytes inserted after the source MAC: a TPID of <code>0x8100</code>, then 3 priority bits, a DEI bit and a 12-bit VLAN ID. The original EtherType follows.',
      'It replaces the destination MAC address.',
    ],
    answer: 2,
    explain: 'A parser must check for <code>0x8100</code> (or <code>0x88A8</code> for an outer QinQ tag) where it expects the EtherType, and skip 4 bytes per tag. The tag also makes the maximum frame 4 bytes longer, and the FCS must be recomputed when a tag is added or removed.',
  },
  {
    id: 'net_lpm', topic: 'networking',
    prompt: 'A route table has <code>10.0.0.0/8</code>, <code>10.1.0.0/16</code> and <code>10.1.2.0/24</code>. Which route does a packet for <code>10.1.3.7</code> use?',
    options: [
      '<code>10.0.0.0/8</code>, because it was added first.',
      '<code>10.1.2.0/24</code>, because it is the most specific route.',
      'None; the address matches more than one route.',
      '<code>10.1.0.0/16</code>, the longest prefix that actually matches.',
    ],
    answer: 3,
    explain: '<code>10.1.3.7</code> is not inside <code>10.1.2.0/24</code> (that covers 10.1.2.0–10.1.2.255), so the longest prefix that matches is the /16. Hardware does this with TCAM; software uses a trie such as a Patricia or multibit trie.',
  },
];
