# SEI Parsing Reference

## Overview

This document provides technical reference for parsing H.264/H.265 SEI (Supplemental Enhancement Information) messages containing UUIDv7 identifiers.

## SEI Message Structure

### User Data Unregistered (Type 5)

The TrisRoad system uses SEI type 5 (user_data_unregistered) to embed UUIDs:

```
┌─────────────────────────────────────┐
│ SEI NAL Unit                     │
├─────────────────────────────────────┤
│ NAL Header (1 byte)               │
├─────────────────────────────────────┤
│ payloadType (5)                   │
│ payloadSize                        │
├─────────────────────────────────────┤
│ User Data Unregistered:            │
│   - uuid (16 bytes) - Schema UUID │
│   - data (16 bytes) - Frame UUID  │
└─────────────────────────────────────┘
```

### Schema UUID

Fixed UUID identifying TrisRoad system (always first 16 bytes):

```
d8e21122-3344-5577-8899-aa1020304050
```

Binary representation:
```c
uint8_t schema_uuid[16] = {
    0xd8, 0xe2, 0x11, 0x22, 0x33, 0x44, 0x55, 0x77,
    0x88, 0x99, 0xaa, 0x10, 0x20, 0x30, 0x40, 0x50
};
```

### Frame UUID

UUIDv7 timestamp-ordered identifier (always last 16 bytes):

- Encoded in 8-4-4-4-12 hexadecimal format
- Generated per frame for precise identification
- Time-ordered for efficient seeking and indexing

## Container Formats

### Annex-B (Raw H.264/H.265)

- Uses start codes: `00 00 00 01`
- Common in: MKV, WebM, raw streams
- MediaMTX default format

### AVC (MP4/MOV)

- Uses length prefixes (4 bytes)
- Common in: MP4, MOV, M4V
- Required for MP4 containers

Detection:
```c
gboolean is_annex_b = (data[0] == 0 && data[1] == 0 &&
                       data[2] == 0 && data[3] == 1);
```

## Parsing APIs

### GStreamer API (C)

```c
// Parse Annex-B format
gboolean tr_sei_parse_uuid(
    const uint8_t *annexb_data,
    gsize len,
    const uint8_t schema_uuid[16],
    uint8_t frame_uuid[16]
);

// Parse with auto-detection (Annex-B or AVC)
gboolean tr_sei_parse_uuid_flexible(
    const uint8_t *data,
    gsize size,
    const uint8_t schema_uuid[16],
    uint8_t frame_uuid[16]
);
```

### FFmpeg API (C++)

```cpp
// Parse AVC format
bool parse_sei_direct_avc(
    const uint8_t *data,
    size_t size,
    const uint8_t *schema_uuid,
    uint8_t *frame_uuid,
    bool is_h265
);

// Parse Annex-B format
bool parse_sei_direct_annexb(
    const uint8_t *data,
    size_t size,
    const uint8_t *schema_uuid,
    uint8_t *frame_uuid
);
```

## NAL Unit Types

### H.264/AVC

| Type | Value | Description         |
|-------|--------|---------------------|
| SPS   | 7      | Sequence Parameter Set |
| PPS   | 8      | Picture Parameter Set  |
| SEI   | 6      | Supplemental Enhancement Information |
| IDR   | 5      | Instantaneous Decoder Refresh |
| Non-IDR| 1      | Non-IDR slice |

### H.265/HEVC

| Type | Value | Description                      |
|-------|--------|----------------------------------|
| VPS   | 32     | Video Parameter Set              |
| SPS   | 33     | Sequence Parameter Set            |
| PPS   | 34     | Picture Parameter Set            |
| PREFIX_SEI | 39 | Prefix SEI (before picture)   |
| SUFFIX_SEI | 40 | Suffix SEI (after picture)    |
| IDR_N_LP | 20 | IDR with NAL unit leading picture |

## Access Unit Detection

SEI should only be injected at Access Unit boundaries (start of new frame).

Detection with GStreamer:
```c
gboolean tr_sei_is_access_unit_start(GstBuffer *buffer, gboolean is_h265);
```

When using h26xparse with `alignment=au`, every buffer represents an Access Unit.

## Error Handling

### Missing UUID

When SEI doesn't contain expected UUID:
- Log warning with source/camera context
- Continue processing (don't fail)
- Consider generating new UUID for injection

### Corrupted SEI

When SEI parsing fails:
- Log error with buffer offset and NAL type
- Skip to next NAL unit
- Validate buffer size before parsing

## References

- ITU-T H.264 (ISO/IEC 14496-10): SEI message specification
- ITU-T H.265 (ISO/IEC 23008-2): HEVC SEI extension
- GStreamer codecparsers: `gsth264parser.h`, `gsth265parser.h`
