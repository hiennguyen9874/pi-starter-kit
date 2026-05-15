# UUIDv7 Reference

## Overview

UUIDv7 is a time-sortable UUID variant (RFC 4122) that combines timestamp with random bits for lexicographic ordering.

## UUIDv7 Structure

```
┌─────────────────┬─────────────────┬─────────────┐
│ Timestamp (48b) │ Counter (42b)   │ Random (74b) │
│ unix_ts_ms     │ monotonic seq  │ entropy     │
└─────────────────┴─────────────────┴─────────────┘
```

### Breakdown

| Bytes | Field | Description                              |
|--------|--------|------------------------------------------|
| 0-5    | Timestamp (48 bits) | Unix timestamp in milliseconds (since epoch) |
| 6       | Version + Counter (bits 0-3) | Version = 0x7 (7) in first 4 bits |
| 6-11   | Counter (42 bits total) | Monotonic counter for same-timestamp ordering |
| 8       | Variant + Counter (bits 0-1) | Variant = 0x8 in first 2 bits |
| 12-15   | Random (64 bits) | Cryptographic random data |

## Generation

### C API (uuidv7.h)

```c
// Generate with system time
void uuidv7_new(uint8_t uuid_out[16]);

// Generate with specific timestamp
int uuidv7_from_timestamp(
    uint8_t uuid_out[16],
    uint64_t unix_ts_ms,
    const uint8_t *uuid_prev  // NULL for first, or previous UUID
);

// Generate low-level (provide random bytes)
int8_t uuidv7_generate(
    uint8_t *uuid_out,
    uint64_t unix_ts_ms,
    const uint8_t *rand_bytes,  // At least 10 bytes
    const uint8_t *uuid_prev      // Optional previous UUID
);
```

### Go API

```go
import "github.com/google/uuid/v7"

// Generate with system time
uuid.NewV7()

// Generate from timestamp
uuidv7.NewFromUnixMilli(timestamp_ms)
```

## Monotonicity

### Within Same Millisecond

Counter increments to preserve order:

```c
// When unix_ts_ms == prev_timestamp:
status = UUIDV7_STATUS_COUNTER_INC
// Uses only 4 random bytes (counter uses 10 bytes)
```

### Across Milliseconds

New timestamp resets counter:

```c
// When unix_ts_ms > prev_timestamp:
status = UUIDV7_STATUS_NEW_TIMESTAMP
// Uses all 10 random bytes
```

### Clock Rollback

If clock moves back >10 seconds, ignore previous UUID:

```c
// When unix_ts_ms + 10000 < prev_timestamp:
status = UUIDV7_STATUS_CLOCK_ROLLBACK
// Creates new UUID without monotonicity guarantee
```

## Status Codes

| Code | Name | Description |
|------|-------|-------------|
| 0 | UNPRECEDENTED | No previous UUID specified |
| 1 | NEW_TIMESTAMP | New timestamp used |
| 2 | COUNTER_INC | Counter incremented (same timestamp) |
| 3 | TIMESTAMP_INC | Timestamp incremented (counter overflow) |
| 4 | CLOCK_ROLLBACK | Clock moved back >10 seconds |
| -1 | ERR_TIMESTAMP | Invalid timestamp (> 2^48 - 1) |
| -2 | ERR_TIMESTAMP_OVERFLOW | Timestamp overflow at max value |

## String Conversion

### Binary to String (8-4-4-4-12)

```c
void uuidv7_to_string(const uint8_t uuid[16], char *string_out);
// Output: "018f5b5b-1234-7890-abcd-1234567890ab"
// Buffer must be 37 bytes (36 chars + NUL)
```

### String to Binary

```c
int uuidv7_from_string(const char *string, uint8_t uuid_out[16]);
// Input: "018f5b5b-1234-7890-abcd-1234567890ab"
// Returns 0 on success, -1 on failure
```

## Video Frame Integration

### Generation from Frame PTS

```c
// Calculate frame timestamp
uint64_t pts_ms = GST_TIME_AS_MSECONDS(GST_BUFFER_PTS(buf));
uint64_t frame_ts_ms = base_timestamp_ms + pts_ms;

// Generate UUIDv7 with monotonicity
uuidv7_from_timestamp(frame_uuid, frame_ts_ms, last_uuid);
memcpy(last_uuid, frame_uuid, 16); // Update for next frame
```

### First Frame UUID

Often extracted from existing SEI or provided as start point:

```c
if (frame_index == 1) {
    memcpy(frame_uuid, first_frame_uuid, 16);
} else {
    uuidv7_from_timestamp(frame_uuid, frame_ts_ms, last_uuid);
}
```

## Validation

### Format Check

```c
// Check version byte (byte 6)
bool is_uuidv7 = (uuid[6] & 0xF0) == 0x70;

// Check variant byte (byte 8)
bool is_variant_1 = (uuid[8] & 0xC0) == 0x80;
```

### Timestamp Extraction

```c
uint64_t extract_timestamp(const uint8_t uuid[16]) {
    uint64_t ts = 0;
    for (int i = 0; i < 6; i++) {
        ts = (ts << 8) | uuid[i];
    }
    return ts;
}
```

## References

- UUIDv7 Draft: https://datatracker.ietf.org/doc/html/draft-ietf-uuidrev-rfc4122bis
- LiosK UUIDv7 Implementation: https://github.com/LiosK/uuidv7
- Google UUID v7 Go: https://github.com/google/uuid/tree/main/v7
