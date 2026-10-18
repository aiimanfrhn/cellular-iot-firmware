# Architecture Notes

Fill this in as the project takes shape.

## Planned components

- MCU application and board support
- UART modem transport and AT response parser
- Modem connection state machine
- Sensor driver over I²C or SPI
- Telemetry encoder and HTTP/MQTT transport
- Python serial test tooling

## Decisions to record

For each major decision, note the date, options considered, choice, reason, and tradeoffs. Keep modem and network layers testable without requiring a live cellular connection where practical.