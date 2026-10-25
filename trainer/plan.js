/* ---------------------------------------------------------------------------
 * 14-day training plan for network platform software interviews (C on
 * switches, routers and access points). app.js renders it as the Training
 * plan view.
 *
 * Each day has:
 *   title, goal      shown on the day card
 *   problems         problem ids from problems.js, ticked when solved
 *   study            things to learn and explain out loud; the learner ticks
 *                    them off. Progress is stored per day by list position,
 *                    so add new items at the end of a day.
 * ------------------------------------------------------------------------- */

export const PLAN_TITLE = '14-day plan: network platform software';

export const PLAN_INTRO = 'For C software roles on switches, routers and access points: platform code, drivers, packet handling and debugging. Each day takes about two hours. Solve the problems under the target time, then answer the study questions out loud as if an interviewer had just asked them.';

export const PLAN = [
  {
    title: 'C warm-up: bits and registers',
    goal: 'Get fluent with masks and shifts again. Every later day builds on these.',
    problems: ['bit_ops', 'count_bits', 'bit_field'],
    study: [
      'What does volatile do, and name three places it is required in driver code.',
      'Why is 1 << 31 undefined behaviour but 1u << 31 fine?',
      'Where do globals, static locals, string literals and malloc memory live? (.data, .bss, .rodata, heap, stack)',
    ],
  },
  {
    title: 'Pointers and memory',
    goal: 'Show you understand what the compiler does with pointers, alignment and struct layout.',
    problems: ['align', 'my_memmove', 'reverse_bits'],
    study: [
      'const int *p, int *const p, const int *const p: what can change in each?',
      'Why does sizeof give different answers for an array and the same array passed to a function?',
      'Draw the layout of struct { char a; int b; char c; } with padding. How do you shrink it, and when do you use __attribute__((packed))?',
    ],
  },
  {
    title: 'Linked lists',
    goal: 'Linked lists are the most common C whiteboard question. Practise them until they are automatic.',
    problems: ['list_reverse', 'list_cycle'],
    study: [
      'Delete a node from a singly linked list given only a pointer to the head. Then with a pointer-to-pointer, with no special case for the head.',
      'How does the Linux kernel list (struct list_head plus container_of) work?',
      'Array versus linked list: compare insert, delete, lookup and cache behaviour.',
    ],
  },
  {
    title: 'Strings and the CLI',
    goal: 'Network operating systems are configured through a CLI, so string handling comes up often.',
    problems: ['str_copy', 'parse_u32', 'cli_split'],
    study: [
      'Explain a stack buffer overflow and how an attacker uses one. What do stack canaries and ASLR do about it?',
      'What is a format string bug? Why is printf(user_input) dangerous?',
      'Reverse a string in place, then reverse the words of a sentence in place. Practise both on paper.',
    ],
  },
  {
    title: 'Memory without malloc',
    goal: 'Show you can manage memory predictably, as platform and real-time code must.',
    problems: ['mem_pool', 'ring_buffer'],
    study: [
      'Why do embedded and kernel code avoid malloc in hot paths? Explain fragmentation and non-deterministic timing.',
      'An interrupt handler fills a ring buffer and a thread drains it. Which variables does each side write, and when do you need a lock or a memory barrier?',
      'What is a memory leak, a double free, and a use-after-free? How would you find each one?',
    ],
  },
  {
    title: 'Networking fundamentals',
    goal: 'You will be asked to explain the basics clearly. Practise until you can draw them from memory.',
    problems: ['endian', 'prefix_mask'],
    study: [
      'Name the OSI and TCP/IP layers, and give a protocol and a device for each lower layer.',
      'What does a switch do with a frame, and what does a router do with a packet? What is the difference between layer 2 and layer 3 forwarding?',
      'Subnetting by hand: for 192.168.10.0/26, give the mask, the broadcast address and the number of usable hosts.',
      'Network byte order is big-endian. When do you call htons, htonl, ntohs and ntohl?',
    ],
  },
  {
    title: 'Addresses',
    goal: 'Parse and classify the addresses that every network feature depends on.',
    problems: ['parse_ipv4', 'mac_addr'],
    study: [
      'Walk through ARP: host A wants to send to host B on the same subnet. Which frames go on the wire?',
      'Unicast, multicast, broadcast: how does a switch handle each, and what is flooding?',
      'Review: redo two earlier problems under time pressure without looking at your old code.',
    ],
  },
  {
    title: 'Frames and checksums',
    goal: 'Parse real packet headers safely from a byte buffer.',
    problems: ['eth_header', 'inet_checksum', 'crc16'],
    study: [
      'Draw an Ethernet II frame with an 802.1Q tag, labelling each field and its size.',
      'What is a VLAN, and what is the difference between an access port and a trunk port?',
      'Ethernet uses a CRC-32 (the FCS) and IP uses a 16-bit checksum. Why use each, and which errors can each one miss?',
      'What are MTU, fragmentation and jumbo frames?',
    ],
  },
  {
    title: 'IPv4 and the packet path',
    goal: 'Show you treat every length field from the wire as untrusted.',
    problems: ['ipv4_header'],
    study: [
      'Draw the IPv4 header. What are TTL, the protocol field and the fragmentation flags for?',
      'TCP versus UDP: explain the three-way handshake, reliability, ordering and flow control.',
      'Trace a ping from a PC through an access switch and a router to a server: ARP, MAC learning, routing lookup, TTL.',
    ],
  },
  {
    title: 'Switching',
    goal: 'Understand the core data structure of a switch, and where hardware and software meet.',
    problems: ['mac_table'],
    study: [
      'Explain MAC learning, flooding and ageing. Why does the table need ageing at all?',
      'What problem does Spanning Tree solve? What happens on a looped network without it?',
      'What does LACP (link aggregation) do, and how does a switch choose which member link a flow uses?',
      'Data plane, control plane and management plane: what runs in the switching ASIC, and what runs on the CPU?',
    ],
  },
  {
    title: 'Platform and hardware',
    goal: 'Platform teams own fans, sensors, power supplies, LEDs and transceivers. Speak their language.',
    problems: ['reg_poll', 'sensor_temp', 'fan_control', 'debounce'],
    study: [
      'Compare I2C, SPI, MDIO and PCIe: wires, speed, addressing, and what you find on each bus in a switch.',
      'Describe the boot flow: ROM, bootloader (such as U-Boot), Linux kernel, device tree, user space.',
      'What does a device driver do? Explain probe, register access, interrupts, and the kernel/user-space boundary.',
      'An SFP transceiver is plugged in. How does software detect it and read its EEPROM?',
    ],
  },
  {
    title: 'Linux and concurrency',
    goal: 'Most network operating systems run on embedded Linux with many processes and threads.',
    problems: [],
    study: [
      'Process versus thread: what do they share, and what does a context switch cost?',
      'Mutex, spinlock and semaphore: when do you use each? Why can you not sleep while holding a spinlock?',
      'Write two threads incrementing a shared counter without a lock. What goes wrong, and give two ways to fix it.',
      'Define deadlock and its four conditions. How does a consistent lock order prevent it?',
      'Interrupts: what are the top half and bottom half (softirq, tasklet, workqueue), and why split them?',
    ],
  },
  {
    title: 'Debugging',
    goal: 'The role is heavily about investigating issues. Show a calm, systematic method.',
    problems: [],
    study: [
      'Practise gdb: break, run, bt, frame, print, watch. Load a core dump and find the crashing line.',
      'Know what valgrind, AddressSanitizer and UBSan each catch. Run one on a bug you add on purpose.',
      'Use git bisect to find the commit that introduced a bug.',
      'Answer out loud: "A switch in the field reboots about once a day. How do you investigate?" Cover logs, crash dumps, reproducing it, isolating the cause, and confirming the fix.',
      'Prepare your hardest-bug story: symptom, hypotheses, how you narrowed it down, the fix, and how you verified it.',
    ],
  },
  {
    title: 'Behavioural prep and mock interview',
    goal: 'Pull it together. They want a team player who communicates clearly across teams and time zones.',
    problems: [],
    study: [
      'Write STAR stories for: working with another team or a remote team; explaining a technical problem to a manager; flagging a risk early; learning something new quickly; a technical disagreement.',
      'Mock interview: pick two random problems you have solved and redo them in 45 minutes, talking through your thinking the whole time.',
      'Answer the follow-up questions of five problems out loud, without notes.',
      'Prepare three questions to ask them, for example about the platform, the team\'s debugging tools, or what a new hire works on first.',
    ],
  },
];
