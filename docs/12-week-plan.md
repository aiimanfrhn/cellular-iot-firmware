# 12-Week Plan

Assumption: 8–12 study hours per week. Adjust the pace to fit your schedule; aim to finish one running artifact each week.

## Month 1 — C and MCU foundation

### Week 1: Embedded C refresh
- [ ] Review pointers, structs, arrays, memory lifetime, and integer types
- [ ] Practice masks, shifts, and bit set/clear/test operations
- [ ] Implement a ring buffer
- [ ] Commit exercises and write a learning-log entry

### Week 2: Toolchain and board
- [ ] Choose an ARM MCU development board
- [ ] Install compiler/build tools and debugger
- [ ] Build, flash, and debug a minimal program
- [ ] Document setup and exact build steps

### Week 3: MCU peripherals
- [ ] Control GPIO and read a button
- [ ] Use a timer and an interrupt
- [ ] Send diagnostic logs over UART
- [ ] Record expected output and a debugging note

### Week 4: UART modem control
- [ ] Create a UART abstraction
- [ ] Send AT commands and collect responses
- [ ] Parse complete and error responses
- [ ] Add a timeout so commands cannot block forever

## Month 2 — Modem, sensor, and RTOS

### Week 5: Modem state machine
- [ ] Represent modem states explicitly
- [ ] Handle registration checks, retries, and reconnects
- [ ] Keep retry count and delays bounded
- [ ] Document failure/recovery transitions

### Week 6: Sensor interface
- [ ] Read a sensor over I²C or SPI
- [ ] Validate readings and report sensor errors
- [ ] Pass readings to the modem layer without coupling the driver to network logic

### Week 7: RTOS
- [ ] Port the application to FreeRTOS or Zephyr
- [ ] Split sensor sampling, modem control, and reporting into tasks
- [ ] Use a queue for data transfer
- [ ] Explain priorities and synchronization choices

### Week 8: Reliability
- [ ] Add watchdog or equivalent recovery behavior
- [ ] Test modem loss, invalid responses, and sensor failure
- [ ] Avoid unbounded waits and retries
- [ ] Record known failure modes and recovery behavior

## Month 3 — Telemetry, testing, and portfolio

### Week 9: Telemetry
- [ ] Choose HTTP or MQTT
- [ ] Send sample readings through the modem
- [ ] Keep credentials out of source control
- [ ] Save sanitized example logs

### Week 10: Automated tests
- [ ] Write Python serial tooling
- [ ] Test malformed responses, timeouts, and reconnect behavior
- [ ] Make test setup reproducible
- [ ] Record test results and remaining gaps

### Week 11: Portfolio polish
- [ ] Add an architecture diagram and wiring/pin notes
- [ ] Improve README build and demo instructions
- [ ] Record a short demonstration or sanitized logs
- [ ] List limitations and next steps honestly

### Week 12: Singapore job preparation
- [ ] Review target postings for firmware, IoT integration, connectivity, and validation roles
- [ ] Map each requirement to experience or project evidence
- [ ] Prepare a project walkthrough and role-specific CV bullets
- [ ] Identify the next learning gap from actual postings