# Cellular IoT Firmware Learning Project

A 12-week hands-on embedded programming portfolio project. The goal is to build device-side firmware that reads a sensor, controls a cellular modem over UART, handles failures predictably, and sends telemetry over HTTP or MQTT.

## Background and focus

The learner brings 5–6 years of experience as an IoT modem section team lead, including 4G/5G networks, TCP, SMTP, HTTP, SMS, and carrier certification for IoT and automotive modules. This project focuses on adding demonstrable hands-on firmware skills: embedded C, MCU peripherals, UART modem control, RTOS, test automation, and hardware debugging.

## 12-week roadmap

| Week | Focus | Deliverable |
|---|---|---|
| 1 | Embedded C refresh, pointers, buffers, bit manipulation, Git | Ring buffer and C exercises with notes |
| 2 | Board/toolchain setup, build, flash, debug | Firmware running on an MCU with setup instructions |
| 3 | GPIO, timers, interrupts, UART | Button/LED behavior and UART logs |
| 4 | Modem AT command interface | Command sender, response parser, timeout handling |
| 5 | Modem state machine | Registration, retry, error, and reconnect behavior |
| 6 | Sensor over I²C or SPI | Sensor readings collected by firmware |
| 7 | RTOS fundamentals | Sensor, modem, and reporting tasks using queues/synchronization |
| 8 | Reliability and recovery | Watchdog, timeouts, bounded retries, and fault recovery |
| 9 | HTTP or MQTT telemetry | Device sends sample data to a test endpoint/broker |
| 10 | Python test tooling | Automated serial tests for errors and reconnects |
| 11 | Portfolio polish | Architecture, wiring, logs, demo, and limitations documented |
| 12 | Singapore job preparation | Project walkthrough, targeted CV bullets, role-gap review |

## Weekly routine

1. Open a GitHub issue for the week's outcome and break it into checkboxes.
2. Work on a short-lived branch and make focused commits.
3. Record what worked, what failed, and how it was checked in `docs/learning-log.md`.
4. Close the issue when the deliverable runs and its instructions are documented.

Suggested commit prefixes: `feat:`, `fix:`, `test:`, `docs:`, `build:`.

## Repository layout

- `firmware/` — MCU firmware and drivers
- `tests/` — firmware unit/integration test cases
- `tools/` — Python helpers for serial testing and logs
- `docs/` — architecture notes and weekly learning log

## Getting started

The exact board and toolchain will be recorded here after selection. Keep hardware-specific setup steps, pin mappings, build commands, and expected serial output in this README as the project develops.

## Safety and confidentiality

This is a personal learning project. Do not add employer source code, customer/carrier certification data, credentials, proprietary AT-command extensions, or confidential module details. Use public documentation and a test SIM/account only where appropriate. Never commit secrets; use local environment variables or an untracked configuration file.

## Current status

- [ ] Choose development board and modem
- [ ] Set up compiler, debugger, and Git workflow
- [ ] Complete Week 1 C exercises