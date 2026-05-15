# MediaMTX SEI Integration Reference

## Overview

MediaMTX provides Go implementation for SEI UUIDv7 injection and extraction in live RTSP streams. This document covers the MediaMTX-specific patterns and integration points.

## SEI Package (mediamtx/internal/sei)

### Building SEI NAL Units

**H.264 SEI (36 bytes):**

```go
import "github.com/bluenviron/mediamtx/internal/sei"

frameUUID, _ := sei.GenerateUUIDv7()
seiNal := sei.BuildH264(frameUUID)
```

Raw NAL structure (no start codes):
```
[NAL Header: 0x06 (1 byte)]
[Payload Type: 0x05 (1 byte)]
[Payload Size: 0x20 (1 byte)]
[Schema UUID: 16 bytes]
[Frame UUID: 16 bytes]
[RBSP Trailing: 0x80 (1 byte)]
```

**H.265 SEI (37 bytes):**

```go
frameUUID, _ := sei.GenerateUUIDv7()
seiNal := sei.BuildH265(frameUUID)
```

Raw NAL structure (no start codes):
```
[NAL Header: 0x4E 0x01 (2 bytes)]
[Payload Type: 0x05 (1 byte)]
[Payload Size: 0x20 (1 byte)]
[Schema UUID: 16 bytes]
[Frame UUID: 16 bytes]
[RBSP Trailing: 0x80 (1 byte)]
```

### UUIDv7 Generation with NTP Timestamps

**Generate with system time:**

```go
frameUUID, err := sei.GenerateUUIDv7()
if err != nil {
    // Handle error
}
```

**Generate with NTP timestamp:**

```go
import "time"

// NTP timestamp from RTCP
ntpTime := time.Now()  // Or actual NTP time from RTCP Sender Report

frameUUID, err := sei.GenerateUUIDv7FromTime(ntpTime)
if err != nil {
    // Handle error
}
```

**NTP validation rules:**

- If timestamp is zero: Falls back to system time
- If timestamp differs from system time by > 1 day: Falls back to system time
- Otherwise: Uses NTP timestamp

This prevents incorrect timestamps from NTP clock skew or invalid sources.

### Extracting UUID from SEI

**H.264 extraction:**

```go
// Access unit as slice of NAL units
au := [][]byte{sps, pps, seiNal, idrSlice}

uuidString, err := sei.ExtractUUIDFromH264(au)
if err != nil {
    // No valid SEI found
}

// uuidString is in 8-4-4-4-12 format: "0192aabb-ccdd-1122-3344-556677889900"
```

**H.265 extraction:**

```go
// Access unit as slice of NAL units
au := [][]byte{vps, sps, pps, seiNal, idrSlice}

uuidString, err := sei.ExtractUUIDFromH265(au)
if err != nil {
    // No valid SEI found
}
```

### UUID String Conversion

**Binary to string:**

```go
uuidBytes := []byte{...}  // 16 bytes
uuidString := sei.FormatUUIDString(uuidBytes)
// Output: "0192aabb-ccdd-1122-3344-556677889900"
```

**String to binary:**

```go
uuidStr := "0192aabb-ccdd-1122-3344-556677889900"
frameUUID, err := sei.ParseUUIDString(uuidStr)
if err != nil {
    // Invalid UUID format
}
```

### Extracting Timestamp from UUID

```go
uuidStr := "0192aabb-ccdd-1122-3344-556677889900"
timestamp, err := sei.ExtractTimestampFromUUID(uuidStr)
if err != nil {
    // Invalid UUID
}

// timestamp is time.Time in UTC
// Used for record path variables (%Y, %m, %d, etc.)
```

## Codec Processor Integration

### H.264 SEI Injection

**Access unit remuxing with NTP timestamp:**

```go
package codecprocessor

import (
    "github.com/bluenviron/mediamtx/internal/sei"
    "github.com/bluenviron/mediamtx/internal/unit"
)

type h264 struct {
    Format *format.H264
    // ... other fields
}

func (t *h264) remuxAccessUnitWithNTP(
    au unit.PayloadH264,
    ntp time.Time,
) unit.PayloadH264 {
    // 1. Identify keyframe and count NAL units
    // 2. Try to extract existing SEI UUID
    // 3. Generate new UUID if needed (with NTP timestamp)
    // 4. Build and inject SEI NAL unit
    // 5. Prepend SPS/PPS on keyframes
}
```

**SEI preservation logic:**

```go
// Try to extract existing SEI UUID from incoming stream
var frameUUID [16]byte
uuidString, err := sei.ExtractUUIDFromH264(au)

if err == nil {
    // Existing SEI found - preserve it
    frameUUID, err = sei.ParseUUIDString(uuidString)
    if err == nil {
        log("Preserving existing SEI UUID: %s", uuidString)
    }
}

if err != nil || frameUUID == ([16]byte{}) {
    // No existing SEI or parse failed - generate new UUID
    frameUUID, err = sei.GenerateUUIDv7FromTime(ntp)
    if err != nil {
        log("SEI injection failed: %v", err)
        return t.remuxAccessUnitWithoutSEI(au, isKeyFrame)
    }
    log("Generated new SEI UUID: %s", sei.FormatUUIDString(frameUUID[:]))
}

// Build and inject SEI
seiNal := sei.BuildH264(frameUUID)
filteredAU := append(filteredAU, seiNal)
```

**Keyframe detection and parameter prepending:**

```go
isKeyFrame := false
var filteredAU [][]byte

for _, nalu := range au {
    typ := nalu[0] & 0x1F

    switch typ {
    case 6:  // SEI
        // Skip - we'll inject our own
        continue
    case 7:  // SPS
        // Save but don't add yet (prepend on keyframe)
        continue
    case 8:  // PPS
        // Save but don't add yet (prepend on keyframe)
        continue
    case 9:  // AUD
        // Remove
        continue
    case 5:  // IDR
        isKeyFrame = true
        filteredAU = append(filteredAU, sps, pps)  // Prepend params
    }
    filteredAU = append(filteredAU, nalu)
}
```

### H.265 SEI Injection

**Access unit remuxing with NTP timestamp:**

```go
func (t *h265) remuxAccessUnitWithNTP(
    au unit.PayloadH265,
    ntp time.Time,
) unit.PayloadH265 {
    // Similar to H.264 but with VPS/SPS/PPS parameter sets
    // NAL unit type extraction: (nalu[0] >> 1) & 0x3F
}
```

**H.265-specific NAL types:**

| NAL Type | Value | Description |
|-----------|--------|-------------|
| VPS | 32 | Video Parameter Set |
| SPS | 33 | Sequence Parameter Set |
| PPS | 34 | Picture Parameter Set |
| AUD | 35 | Access Unit Delimiter |
| PREFIX_SEI | 39 | Prefix SEI (our injection point) |
| IDR_W_RADL | 19 | IDR with RADL |
| IDR_N_LP | 20 | IDR with No Leading Picture |
| CRA | 21 | Clean Random Access |

**Keyframe detection (H.265):**

```go
isKeyFrame := false

for _, nalu := range au {
    typ := (nalu[0] >> 1) & 0x3F

    switch typ {
    case 19, 20, 21:  // IDR_W_RADL, IDR_N_LP, CRA
        isKeyFrame = true
        // Prepend VPS, SPS, PPS
        filteredAU = append(filteredAU, vps, sps, pps)
    }
    // ... rest of processing
}
```

### RTP Packet Processing

**Processing incoming RTP packet:**

```go
func (t *h264) ProcessRTPPacket(u *unit.Unit, hasNonRTSPReaders bool) error {
    pkt := u.RTPPackets[0]

    // 1. Update track parameters from RTP packet
    t.updateTrackParametersFromRTPPacket(pkt.Payload)

    // 2. Decode RTP to access unit (always decode to inject SEI)
    if t.decoder == nil {
        var err error
        t.decoder, err = t.Format.CreateDecoder()
        if err != nil {
            return err
        }
    }

    au, err := t.decoder.Decode(pkt)
    if err != nil {
        // Handle packet errors
        if errors.Is(err, rtph264.ErrNonStartingPacketAndNoPrevious) {
            return nil
        }
        return err
    }

    // 3. Remux and inject SEI with NTP timestamp
    u.Payload = t.remuxAccessUnitWithNTP(au, u.NTP)

    // 4. Re-encode into RTP (always re-encode since we injected SEI)
    if t.encoder == nil {
        err := t.createEncoder(&pkt.SSRC, &pkt.SequenceNumber)
        if err != nil {
            return err
        }
    }

    pkts, err := t.encoder.Encode(u.Payload.(unit.PayloadH264))
    if err != nil {
        return err
    }

    u.RTPPackets = pkts

    // Preserve original RTP timestamp
    for _, newPKT := range u.RTPPackets {
        newPKT.Timestamp = pkt.Timestamp
    }

    return nil
}
```

**Encoder creation:**

```go
func (t *h264) createEncoder(ssrc *uint32, initialSeqNum *uint16) error {
    t.encoder = &rtph264.Encoder{
        PayloadMaxSize:        t.RTPMaxPayloadSize,
        PayloadType:           t.Format.PayloadTyp,
        SSRC:                  ssrc,
        InitialSequenceNumber: initialSeqNum,
        PacketizationMode:     t.Format.PacketizationMode,
    }
    return t.encoder.Init()
}
```

**Automatic decoder/encoder creation:**

MediaMTX creates decoder and encoder on-demand:

```go
// Decode step
if t.decoder == nil {
    var err error
    t.decoder, err = t.Format.CreateDecoder()
    if err != nil {
        return err
    }
}

// Encode step (always create after SEI injection)
if t.encoder == nil {
    err := t.createEncoder(&pkt.SSRC, &pkt.SequenceNumber)
    if err != nil {
        return err
    }
}
```

## Error Handling

**SEI generation failure:**

```go
frameUUID, err := sei.GenerateUUIDv7FromTime(ntp)
if err != nil {
    log("SEI injection failed: %v", err)
    // Fallback: process without SEI
    return t.remuxAccessUnitWithoutSEI(au, isKeyFrame)
}
```

**SEI extraction failure:**

```go
uuidString, err := sei.ExtractUUIDFromH264(au)
if err != nil {
    // No existing SEI - generate new
    // This is expected for streams without SEI
    log("No existing SEI found, generating new UUID")
} else {
    // Preserve existing SEI
    log("Found existing SEI UUID: %s", uuidString)
}
```

## Schema UUID

MediaMTX uses the same schema UUID as GStreamer implementation:

```go
var SchemaUUID = [16]byte{
    0xd8, 0xe2, 0x11, 0x22, 0x33, 0x44, 0x55, 0x77,
    0x88, 0x99, 0xaa, 0x10, 0x20, 0x30, 0x40, 0x50,
}
```

String format: `d8e21122-3344-5577-8899-aa1020304050`

## Record Path Variables

MediaMTX uses UUID timestamp for record path variables:

```go
// Extract timestamp from UUID for record path
timestamp, err := sei.ExtractTimestampFromUUID(uuidStr)

// Use in record path:
// %Y - year (4 digits)
// %m - month (2 digits)
// %d - day (2 digits)
// %H - hour (2 digits)
// %M - minute (2 digits)
// %S - second (2 digits)
// %uuid - UUID string (36 chars with hyphens)

// Example: /recordings/%path/%Y-%m-%d/%H/%uuid
```

This ensures temporal consistency between filename and directory structure.

## Integration with GStreamer

MediaMTX SEI injection is compatible with GStreamer SEI extraction:

- **SEI format**: Same user_data_unregistered structure
- **Schema UUID**: Same fixed identifier
- **UUIDv7**: Same RFC 9562 format
- **Raw NAL units**: MediaMTX outputs raw NALs, GStreamer parsers handle Annex-B/AVC conversion

**Example workflow:**
1. RTSP camera → MediaMTX (injects SEI with NTP timestamp)
2. MediaMTX → Kafka (publishes segment creation with first frame UUID)
3. Kafka → API (extracts frame using GStreamer)
4. GStreamer parses SEI to find UUID and extracts frame

## Best Practices

### SEI Preservation

Always try to preserve existing SEI from upstream cameras:

```go
uuidString, err := sei.ExtractUUIDFromH264(au)
if err == nil {
    // Preserve upstream SEI
    frameUUID, err = sei.ParseUUIDString(uuidString)
    if err == nil {
        return frameUUID
    }
}
// Fallback: generate new SEI
```

### NTP Timestamp Usage

Prefer NTP timestamps for UUID generation when available:

```go
// NTP from RTCP Sender Report is more accurate than system time
frameUUID, err = sei.GenerateUUIDv7FromTime(ntpTime)
```

### Keyframe Parameter Prepending

Always prepend parameter sets on keyframes:

```go
if isKeyFrame {
    filteredAU = append(filteredAU, sps, pps)  // H.264
    filteredAU = append(filteredAU, vps, sps, pps)  // H.265
}
```

### Logging

Log SEI operations for debugging:

```go
import "github.com/bluenviron/mediamtx/internal/logger"

t.Parent.Log(logger.Debug, "Preserving existing SEI UUID: %s", uuidString)
t.Parent.Log(logger.Debug, "Generated new SEI UUID: %s (no existing SEI)", uuidStr)
t.Parent.Log(logger.Warn, "SEI injection failed: %v", err)
```

## References

- MediaMTX SEI Package: `mediamtx/internal/sei/sei.go`
- MediaMTX H.264 Processor: `mediamtx/internal/codecprocessor/h264.go`
- MediaMTX H.265 Processor: `mediamtx/internal/codecprocessor/h265.go`
- MediaMTX Logger: `mediamtx/internal/logger/logger.go`
- gortsplib: https://github.com/bluenviron/gortsplib
- mediacommon: https://github.com/bluenviron/mediacommon
