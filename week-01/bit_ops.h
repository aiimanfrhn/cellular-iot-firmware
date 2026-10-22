#include <stdint.h>
#include <stddef.h>

#define BUFFER_SIZE 8u

typedef struct {
        uint8_t data[BUFFER_SIZE];
        size_t head;   // next position to write
        size_t tail;   // next position to read
        size_t count;  // number of bytes stored
    } RingBuffer;