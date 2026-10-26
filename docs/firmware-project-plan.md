# Firmware Project Plan

The follow-on to the [interview prep plan](interview-prep-plan.md): build a small cellular IoT device that reads a sensor, controls a modem over UART, recovers from failures and sends telemetry over HTTP or MQTT. A working project gives you something concrete to walk an interviewer through, and it turns the patterns practised in the trainer into real firmware.

It assumes 8–12 hours a week and one running result per week. The code goes in `firmware/`, host-side tests in `tests/` and Python tooling in `tools/`. Record decisions in the [architecture notes](architecture.md#firmware-project) and progress in the [learning log](learning-log.md).

The C refresh and the job preparation from the original 12-week version are now covered by the trainer and the interview prep plan, so this plan starts at the board.

## Phase 1: Board and peripherals

### Week 1: Toolchain and board
- [ ] Choose an ARM Cortex-M development board and a cellular modem module with public AT-command documentation
- [ ] Install the compiler, build tools and debugger
- [ ] Build, flash and single-step a minimal program
- [ ] Write down the exact setup and build steps in `firmware/README.md`

### Week 2: GPIO, timers and interrupts
- [ ] Read a button and drive an LED; debounce the button (trainer: *button debouncer*)
- [ ] Run a periodic timer interrupt and a software timer layer on top of it (trainer: *software timers*)
- [ ] Record a debugging note: what went wrong and how you found it

### Week 3: UART
- [ ] Interrupt-driven UART receive into a ring buffer (trainer: *ring buffer*)
- [ ] Diagnostic logging over a second UART or the debug probe
- [ ] Send AT commands and collect complete response lines, with a timeout so a command cannot block forever (trainer: *poll a register with a timeout*)

## Phase 2: Modem, sensor and RTOS

### Week 4: Modem state machine
- [ ] Represent modem states explicitly: power-up, SIM check, registration, attached, error
- [ ] Handle registration checks, retries and reconnects, with bounded retry counts and delays
- [ ] Unit-test the response parser and state machine on the host, without a modem, in `tests/`

### Week 5: Sensor
- [ ] Read a sensor over I²C or SPI; validate readings and report sensor errors
- [ ] Filter and calibrate the readings (trainer: *moving average filter*, *lookup table interpolation*)
- [ ] Keep the driver independent of the network code

### Week 6: RTOS
- [ ] Port the application to FreeRTOS or Zephyr
- [ ] Split sensor sampling, modem control and reporting into tasks connected by queues
- [ ] Write down the task priorities and synchronisation choices, and why

### Week 7: Reliability
- [ ] Add a watchdog and decide what each task must do to keep it fed
- [ ] Test modem loss, malformed responses and sensor failure; avoid unbounded waits and retries
- [ ] List the known failure modes and how the device recovers from each

## Phase 3: Telemetry, testing and portfolio

### Week 8: Telemetry
- [ ] Choose HTTP or MQTT and send sample readings through the modem
- [ ] Add a CRC or checksum where the link needs one (trainer: *CRC-16/CCITT*)
- [ ] Keep credentials out of source control and save sanitised example logs

### Week 9: Automated tests
- [ ] Python serial tooling in `tools/` that drives the device and checks its responses
- [ ] Tests for malformed responses, timeouts and reconnects, with reproducible setup
- [ ] Record the results and the gaps that remain

### Week 10: Portfolio polish
- [ ] An architecture diagram, wiring and pin notes, and build and demo instructions
- [ ] A short demo video or sanitised logs
- [ ] An honest list of limitations and next steps
- [ ] A five-minute walkthrough you can give in an interview

## Ground rules

Use public documentation and a test SIM or account only. Do not add employer source code, customer or carrier certification data, credentials, proprietary AT-command extensions or confidential module details.
