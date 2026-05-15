---
name: sei-uuidv7-injection
description: Implement, debug, and extend SEI injection for H.264/H.265 video streams with UUIDv7 frame identifiers. Use for parsing or building SEI user_data_unregistered messages, injecting UUIDv7 into video bitstreams, integrating GStreamer pipelines with SEI probes, CGo integration between Go and C++ for video processing, timestamp management and Access Unit detection in GStreamer, MediaMTX or FFmpeg SEI handling, or extracting and verifying SEI messages in recorded videos
---

# SEI UUIDv7 Injection Skill

## Quick Start

**GStreamer pipeline:**

Inject UUIDv7 into H.264/H.265 stream with GStreamer:

```c
// Build SEI NAL unit (Annex-B format)
uint8_t frame_uuid[16];
tr_uuidv7_generate(frame_uuid);

GstBuffer *sei = tr_sei_build_uuid_nal(schema_uuid, frame_uuid, is_h265);

// Prepend to buffer at Access Unit start
if (tr_sei_is_access_unit_start(buf, is_h265)) {
    GstBuffer *composite = gst_buffer_append(sei, gst_buffer_copy(buf));
    GST_BUFFER_PTS(composite) = GST_BUFFER_PTS(buf);
    GST_PAD_PROBE_INFO_DATA(info) = composite;
}
```

Extract UUID from incoming SEI:

```c
uint8_t frame_uuid[16];
GstMapInfo map;
if (gst_buffer_map(buf, &map, GST_MAP_READ)) {
    if (tr_sei_parse_uuid_flexible(map.data, map.size, schema_uuid, frame_uuid)) {
        // UUID found in SEI
    }
    gst_buffer_unmap(buf, &map);
}
```

**MediaMTX (Go):**

```go
import "github.com/bluenviron/mediamtx/internal/sei"

// Generate UUID with NTP timestamp
ntpTime := time.Now()  // Or from RTCP
frameUUID, err := sei.GenerateUUIDv7FromTime(ntpTime)

// Build SEI NAL unit
seiNal := sei.BuildH264(frameUUID)  // or sei.BuildH265(frameUUID)

// Extract UUID from incoming access unit
au := [][]byte{vps, sps, pps, seiNal, idrSlice}
uuidString, err := sei.ExtractUUIDFromH264(au)
```

## Core Concepts

### SEI Message Structure

TrisRoad embeds UUIDv7 in SEI type 5 (user_data_unregistered):

- **Schema UUID** (16 bytes): Fixed system identifier `d8e21122-3344-5577-8899-aa1020304050`
- **Frame UUID** (16 bytes): UUIDv7 timestamp-ordered identifier per frame
- **Total size**: 32 bytes per SEI message

### UUIDv7 Format

Time-sortable UUID combining Unix timestamp + counter + random data:

- **Bytes 0-5**: Unix timestamp (milliseconds, 48 bits)
- **Bytes 6-11**: Monotonic counter (42 bits) for same-timestamp ordering
- **Bytes 12-15**: Random entropy (64 bits)

### Container Formats

- **Annex-B**: Start codes (`00 00 00 01`), used in MKV, WebM, raw streams
- **AVC**: Length-prefixed (4 bytes), required for MP4/MOV containers

Auto-detect format with `tr_sei_parse_uuid_flexible()`.

### Access Units

SEI must only be injected at Access Unit boundaries (start of new video frame).

Check with `tr_sei_is_access_unit_start(buf, is_h265)` or use h26xparse with `alignment=au`.

## Workflows

### Inject SEI in GStreamer Pipeline

1. Create pipeline: `filesrc -> qtdemux -> h264parse -> mp4mux -> filesink`
2. Install pad probe on parser src pad
3. In probe: Check Access Unit start, generate UUIDv7, build SEI, prepend to buffer
4. Handle SEGMENT event to reset timestamps to prevent negative running_time

See [gstreamer-integration.md](references/gstreamer-integration.md) for complete pipeline setup.

### Extract SEI from Recorded Video

1. Open video file with qtdemux or appropriate demuxer
2. Parse through NAL units using GstH264Parser/GstH265Parser
3. Look for SEI type 5 with matching schema UUID
4. Extract frame UUID from payload (last 16 bytes)

See [sei-parsing.md](references/sei-parsing.md) for parsing details and NAL types.

### Integrate CGo (Go + C++)

1. Define Go structs matching C layout with `//export` comments
2. Create C functions callable from Go with `extern "C"`
3. Use `import "C"` in Go to access C APIs
4. Manage memory: Go slices to C (zero copy), C to Go (allocate new)

See [cgo-integration.md](references/cgo-integration.md) for complete CGo patterns.

### Inject SEI in MediaMTX (Go)

MediaMTX provides pure Go implementation for SEI injection in RTSP streams:

1. Use `sei.BuildH264(frameUUID)` or `sei.BuildH265(frameUUID)` to build raw NAL units
2. Use `sei.GenerateUUIDv7FromTime(ntpTime)` for NTP-based UUID generation
3. Use `sei.ExtractUUIDFromH264(au)` to preserve existing SEI from upstream
4. MediaMTX automatically handles RTP packetization and Annex-B/AVC conversion

See [mediamtx-integration.md](references/mediamtx-integration.md) for MediaMTX-specific patterns.

### Generate UUIDv7 from Frame Timestamps

```c
// Calculate frame timestamp from PTS
uint64_t pts_ms = GST_TIME_AS_MSECONDS(GST_BUFFER_PTS(buf));
uint64_t frame_ts_ms = base_timestamp_ms + pts_ms;

// Generate with monotonicity across same timestamp
uuidv7_from_timestamp(frame_uuid, frame_ts_ms, last_uuid);
memcpy(last_uuid, frame_uuid, 16); // Update for next frame
```

See [uuidv7.md](references/uuidv7.md) for UUIDv7 generation and status codes.

## Common Patterns

### SEI Building for Different Codecs

```c
GstBuffer *sei;
if (is_h265) {
    sei = tr_sei_build_uuid_nal_avc(schema_uuid, frame_uuid, TRUE);
} else {
    sei = tr_sei_build_uuid_nal_avc(schema_uuid, frame_uuid, FALSE);
}
```

Use `tr_sei_build_uuid_nal_avc()` for MP4 output (length-prefixed format required).

### First Frame UUID Preservation

Extract first frame UUID from source or provide as config:

```c
if (frame_index == 1) {
    memcpy(frame_uuid, first_frame_uuid, 16);
} else {
    // Generate subsequent UUIDs
    uuidv7_from_timestamp(frame_uuid, frame_ts_ms, last_uuid);
}
```

### Timestamp Reset for MP4 Muxing

Prevent negative running_time in mp4mux by resetting SEGMENT event:

```c
if (GST_EVENT_TYPE(event) == GST_EVENT_SEGMENT) {
    GstSegment segment;
    gst_event_copy_segment(event, &segment);
    segment.start = 0;
    segment.time = 0;
    segment.base = 0;
    GstEvent *new_event = gst_event_new_segment(&segment);
    GST_PAD_PROBE_INFO_DATA(info) = new_event;
}
```

### Probe Registration and Cleanup

```c
// Install probe
GstPad *pad = gst_element_get_static_pad(parser, "src");
gulong probe_id = gst_pad_add_probe(pad,
    GST_PAD_PROBE_TYPE_BUFFER | GST_PAD_PROBE_TYPE_EVENT_DOWNSTREAM,
    probe_func, ctx, NULL);

// Remove probe
gst_pad_remove_probe(pad, probe_id);
gst_object_unref(pad);
```

## Troubleshooting

### SEI Not Found in Recorded Video

1. Verify parser has `alignment=au` configured
2. Check schema UUID matches exactly (16 bytes)
3. Confirm container format (Annex-B vs AVC) matches parser expectation
4. Use `tr_sei_parse_uuid_flexible()` for auto-detection

### Negative Timestamps or MP4 Corruption

1. Capture first frame PTS/DTS as baseline
2. Subtract baseline from all subsequent timestamps
3. Reset SEGMENT event start/time/base to 0
4. Verify mp4mux `fragment-duration` and `trak-timescale` settings

### Counter Overflow in UUIDv7

UUIDv7 automatically handles counter overflow by incrementing timestamp. If timestamp reaches max (2^48 - 1), generation fails with `UUIDV7_STATUS_ERR_TIMESTAMP_OVERFLOW`.

### CGo Build Failures

1. Ensure `CGO_ENABLED=1` is set
2. Check C++ standard matches `-std=c++17`
3. Verify GStreamer dev headers are installed
4. Use `pkg-config --cflags gstreamer-1.0` for correct includes

### Memory Leaks in Probes

Always unref buffers after appending:

```c
GstBuffer *composite = gst_buffer_append(sei_buf, original_copy);
gst_buffer_unref(sei_buf);      // Ref transferred to composite
gst_buffer_unref(original_copy);  // Ref transferred to composite
```

## API Reference

### SEI Parsing and Building

**Parse UUID:**
- `tr_sei_parse_uuid()` - Annex-B format only
- `tr_sei_parse_uuid_flexible()` - Auto-detect Annex-B/AVC
- `tr_sei_parse_uuid_avc()` - AVC format only

**Build SEI:**
- `tr_sei_build_uuid_nal()` - Annex-B format
- `tr_sei_build_uuid_nal_avc()` - AVC format
- `tr_sei_convert_annexb_to_avc()` - Format conversion

**Access Unit Detection:**
- `tr_sei_is_access_unit_start()` - Check AU boundary

### UUIDv7 Generation

- `uuidv7_new()` - Generate with system time
- `uuidv7_from_timestamp()` - Generate with specific timestamp
- `uuidv7_to_string()` - Convert binary to 8-4-4-4-12 format
- `uuidv7_from_string()` - Parse from string format

### CGo Worker

- `gst_worker_create()` - Create worker context
- `gst_worker_process_video()` - Process file asynchronously
- `gst_worker_process_video_sync()` - Process file synchronously
- `gst_worker_destroy()` - Cleanup and release resources

## Configuration

### Default Schema UUID

```c
uint8_t schema_uuid[16] = {
    0xd8, 0xe2, 0x11, 0x22, 0x33, 0x44, 0x55, 0x77,
    0x88, 0x99, 0xaa, 0x10, 0x20, 0x30, 0x40, 0x50
};
```

Go equivalent:
```go
var DefaultSchemaUUID = [16]byte{
    0xd8, 0xe2, 0x11, 0x22, 0x33, 0x44, 0x55, 0x77,
    0x88, 0x99, 0xaa, 0x10, 0x20, 0x30, 0x40, 0x50,
}
```

### MP4 Muxer Configuration

```c
g_object_set(mux, "fragment-duration", (guint64)1000, NULL);  // 1s fragments
g_object_set(mux, "trak-timescale", (guint32)90000, NULL);
g_object_set(mux, "movie-timescale", (guint32)90000, NULL);
```

## Reference Material

- **SEI Parsing**: [sei-parsing.md](references/sei-parsing.md) - Message structure, NAL types, parsing APIs
- **UUIDv7**: [uuidv7.md](references/uuidv7.md) - Format, generation, monotonicity, validation
- **GStreamer Integration**: [gstreamer-integration.md](references/gstreamer-integration.md) - Pipeline setup, probes, DeepStream meta
- **CGo Integration**: [cgo-integration.md](references/cgo-integration.md) - Build system, callbacks, memory management
- **MediaMTX Integration**: [mediamtx-integration.md](references/mediamtx-integration.md) - Go SEI package, RTP processing, NTP timestamps
