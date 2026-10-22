#include <limits.h>
#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#include <stddef.h>
#include <stdint.h>

#include "bit_ops.h"

//Ring Buffer
void ring_buffer_init(RingBuffer *rb)
{
    rb->head = 0u;
    rb->tail = 0u;
    rb->count = 0u;
}

bool ring_buffer_put(RingBuffer *rb, uint8_t value)
{
    if (rb->count == BUFFER_SIZE) {
        return false; // full
    }

    rb->data[rb->head] = value;
    rb->head = (rb->head + 1u) % BUFFER_SIZE;
    rb->count++;
    return true;
}

bool ring_buffer_get(RingBuffer *rb, uint8_t *value)
{
    if (rb->count == 0u) {
        return false; // empty
    }

    *value = rb->data[rb->tail];
    rb->tail = (rb->tail + 1u) % BUFFER_SIZE;
    rb->count--;
    return true;
}

int main(void)
{
    unsigned int value = 0b1010;
    unsigned int bit = 4;

    value |=  (1u << bit);  // set bit 1
    printf("Set:     %u\n", value);

    value &= ~(1u << bit);  // clear bit 1
    printf("Cleared: %u\n", value);

    value ^=  (1u << bit);  // toggle bit 1
    printf("Toggled: %u\n", value);

    memset(&value, 0, sizeof(value));  // reset value to 0
    printf("Reset:   %u\n", value);

    RingBuffer rb;
    uint8_t byte;

    ring_buffer_init(&rb);
    ring_buffer_put(&rb, 'A');
    ring_buffer_put(&rb, 'B');
    ring_buffer_put(&rb, 'C');
    ring_buffer_put(&rb, 'D');
    ring_buffer_put(&rb, 'E');
    ring_buffer_put(&rb, 'F');

    while (ring_buffer_get(&rb, &byte)) {
        printf("%c\n", byte);
    }

    byte = 'Z';

    memset(&rb, 0, sizeof(rb));  // reset ring buffer
    printf("Ring buffer reset: %c\n", byte);

}

