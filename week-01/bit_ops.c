#include <limits.h>
#include <stdio.h>

static unsigned int set_bit(unsigned int value, unsigned int bit)
{
    return value | (1u << bit);
}

static unsigned int clear_bit(unsigned int value, unsigned int bit)
{
    return value & ~(1u << bit);
}

static unsigned int toggle_bit(unsigned int value, unsigned int bit)
{
    return value ^ (1u << bit);
}

static int test_bit(unsigned int value, unsigned int bit)
{
    return (value & (1u << bit)) != 0u;
}

int main(void)
{
    const unsigned int bit_count = (unsigned int)(sizeof(unsigned int) * CHAR_BIT);
    const unsigned int bit = 3u;
    unsigned int value = 0xA5u;

    if (bit >= bit_count) {
        fprintf(stderr, "Bit index must be between 0 and %u.\n", bit_count - 1u);
        return 1;
    }

    printf("Initial value: 0x%X\n", value);
    printf("Bit %u is %s\n", bit, test_bit(value, bit) ? "set" : "clear");

    value = set_bit(value, bit);
    printf("After setting bit %u: 0x%X\n", bit, value);

    value = clear_bit(value, bit);
    printf("After clearing bit %u: 0x%X\n", bit, value);

    value = toggle_bit(value, bit);
    printf("After toggling bit %u: 0x%X\n", bit, value);
    printf("Bit %u is %s\n", bit, test_bit(value, bit) ? "set" : "clear");

    return 0;
}
