# GStreamer SEI Integration Reference

## Overview

This document covers GStreamer pipeline integration for SEI UUIDv7 injection and extraction.

## Pipeline Architecture

### Basic Injection Pipeline (Parser-only)

```
filesrc -> qtdemux -> h264parse/h265parse -> mp4mux -> filesink
           |             |                         |
           |             +-- pad probe (SEI) --+
```

### Full Re-encoding Pipeline

```
filesrc -> decodebin -> videoconvert -> encoder -> parse -> mux -> filesink
           |                                      |
           +-- pre-decode probe (extract)          +-- post-encode probe (inject)
```

## Pad Probes

### Pre-decode Probe (Extraction)

Installed on decoder source pad to extract UUIDs from incoming SEI:

```c
static GstPadProbeReturn sei_extract_probe(
    GstPad *pad,
    GstPadProbeInfo *info,
    gpointer user_data
) {
    GstBuffer *buf = GST_PAD_PROBE_INFO_BUFFER(info);

    // Check Access Unit start
    if (!tr_sei_is_access_unit_start(buf, is_h265)) {
        return GST_PAD_PROBE_OK;
    }

    // Parse UUID
    uint8_t frame_uuid[16];
    GstMapInfo map;
    if (gst_buffer_map(buf, &map, GST_MAP_READ)) {
        if (tr_sei_parse_uuid_flexible(map.data, map.size,
                                      schema_uuid, frame_uuid)) {
            // Attach metadata to buffer
            GstFrameMeta *meta = gst_frame_meta_add_simple(
                writable_buf, frame_uuid, schema_uuid, frame_index
            );
        }
        gst_buffer_unmap(buf, &map);
    }

    return GST_PAD_PROBE_OK;
}
```

### Post-encode Probe (Injection)

Installed on parser source pad to inject SEI NAL units:

```c
static GstPadProbeReturn sei_inject_probe(
    GstPad *pad,
    GstPadProbeInfo *info,
    gpointer user_data
) {
    GstBuffer *buf = GST_PAD_PROBE_INFO_BUFFER(info);

    // Check Access Unit start
    if (!tr_sei_is_access_unit_start(buf, is_h265)) {
        return GST_PAD_PROBE_OK;
    }

    // Generate or extract UUID
    uint8_t frame_uuid[16];
    GstFrameMeta *meta = GST_FRAME_META_GET(buf);
    if (meta) {
        memcpy(frame_uuid, meta->frame_uuid, 16);
    } else {
        tr_uuidv7_generate(frame_uuid);
    }

    // Build SEI NAL unit
    GstBuffer *sei_buf = tr_sei_build_uuid_nal_avc(
        schema_uuid, frame_uuid, is_h265
    );

    // Prepend SEI to buffer
    GstBuffer *composite = gst_buffer_append(sei_buf, gst_buffer_copy(buf));
    GST_BUFFER_PTS(composite) = GST_BUFFER_PTS(buf);
    GST_BUFFER_DTS(composite) = GST_BUFFER_DTS(buf);

    GST_PAD_PROBE_INFO_DATA(info) = composite;
    return GST_PAD_PROBE_OK;
}
```

### Event Handling (Segment Reset)

Reset timestamps to prevent negative running_time:

```c
if (GST_PAD_PROBE_INFO_TYPE(info) & GST_PAD_PROBE_TYPE_EVENT_DOWNSTREAM) {
    GstEvent *event = GST_PAD_PROBE_INFO_EVENT(info);
    if (GST_EVENT_TYPE(event) == GST_EVENT_SEGMENT) {
        GstSegment segment;
        gst_event_copy_segment(event, &segment);

        if (segment.format == GST_FORMAT_TIME) {
            segment.start = 0;
            segment.time = 0;
            segment.base = 0;

            GstEvent *new_event = gst_event_new_segment(&segment);
            GST_PAD_PROBE_INFO_DATA(info) = new_event;
        }
    }
}
```

## Element Configuration

### h264parse/h265parse

```c
GstElement *parser = gst_element_factory_make("h264parse", "parse");
g_object_set(parser, "config-interval", -1, NULL);  // Disable SPS/PPS injection
```

### mp4mux

```c
GstElement *mux = gst_element_factory_make("mp4mux", "mux");

// Fragmented MP4 (MediaMTX compatible)
g_object_set(mux, "fragment-duration", (guint64)1000, NULL);  // 1 second fragments

// Timescale (MPEG standard)
g_object_set(mux, "trak-timescale", (guint32)90000, NULL);
g_object_set(mux, "movie-timescale", (guint32)90000, NULL);

// Force trun version 1
g_object_set(mux, "reserved-max-duration", (guint64)GST_SECOND * 3600, NULL);
```

## Buffer Manipulation

### Making Buffer Writable

```c
GstBuffer *writable_buf = gst_buffer_make_writable(buf);
if (!writable_buf) {
    g_error("Failed to make buffer writable");
}
```

### Appending Buffers

```c
// Creates new buffer, doesn't modify originals
GstBuffer *result = gst_buffer_append(buf1, buf2);
gst_buffer_unref(buf1);  // Refs transferred to result
gst_buffer_unref(buf2);
```

### Mapping/Unmapping

```c
GstMapInfo map;
if (gst_buffer_map(buf, &map, GST_MAP_READ)) {
    // Access: map.data[0..map.size-1]
    process(map.data, map.size);
    gst_buffer_unmap(buf, &map);
}
```

## Timestamp Management

### Shifting Timestamps to Start from 0

```c
static GstClockTime initial_pts = GST_CLOCK_TIME_NONE;
static gboolean has_initial_pts = FALSE;

GstClockTime current_pts = GST_BUFFER_PTS(buf);
if (GST_BUFFER_PTS_IS_VALID(buf)) {
    if (!has_initial_pts) {
        initial_pts = current_pts;
        has_initial_pts = TRUE;
    }

    buf = gst_buffer_make_writable(buf);
    GST_BUFFER_PTS(buf) = current_pts - initial_pts;

    if (GST_BUFFER_DTS_IS_VALID(buf)) {
        GST_BUFFER_DTS(buf) = GST_BUFFER_DTS(buf) - initial_pts;
    }
}
```

### PTS to Milliseconds

```c
uint64_t pts_ms = GST_TIME_AS_MSECONDS(GST_BUFFER_PTS(buf));
```

## Probe Installation

```c
GstPad *parser_src = gst_element_get_static_pad(parser, "src");
gulong probe_id = gst_pad_add_probe(
    parser_src,
    (GstPadProbeType)(
        GST_PAD_PROBE_TYPE_BUFFER |
        GST_PAD_PROBE_TYPE_EVENT_DOWNSTREAM
    ),
    sei_inject_probe,
    ctx,
    NULL
);
```

### Removing Probe

```c
GstPad *parser_src = gst_element_get_static_pad(parser, "src");
if (parser_src && probe_id) {
    gst_pad_remove_probe(parser_src, probe_id);
    gst_object_unref(parser_src);
}
```

## Pipeline State Management

```c
// Set state and wait
GstStateChangeReturn ret = gst_element_set_state(pipeline, GST_STATE_PLAYING);
if (ret == GST_STATE_CHANGE_FAILURE) {
    g_error("Failed to start pipeline");
}

// Wait for state change
GstState current_state;
ret = gst_element_get_state(pipeline, &current_state, NULL,
                                GST_CLOCK_TIME_NONE);
```

## Bus Watching

```c
GstBus *bus = gst_element_get_bus(pipeline);
guint bus_watch_id = gst_bus_add_watch(bus, bus_callback, ctx);

// Bus callback
static gboolean bus_callback(GstBus *bus, GstMessage *msg, gpointer data) {
    switch (GST_MESSAGE_TYPE(msg)) {
        case GST_MESSAGE_EOS:
            g_print("End of stream\n");
            break;
        case GST_MESSAGE_ERROR: {
            GError *error;
            gst_message_parse_error(msg, &error, NULL);
            g_error("Pipeline error: %s", error->message);
            g_error_free(error);
            break;
        }
        default:
            break;
    }
    return TRUE;
}
```

## NVIDIA DeepStream Meta

### Adding NvDs Meta

```c
NvDsUuidMeta *uuid_meta = g_malloc0(sizeof(NvDsUuidMeta));
tr_uuid_to_string(frame_uuid, uuid_meta->uuid);
uuid_meta->frame_index = frame_index;

NvDsMeta *meta = gst_buffer_add_nvds_meta(
    buf, uuid_meta, NULL,
    uuid_meta_copy_func, uuid_meta_release_func
);
meta->meta_type = NVDS_UUID_GST_META;
meta->gst_to_nvds_meta_transform_func = transform_func;
meta->gst_to_nvds_meta_release_func = release_func;
```

### Getting NvDs Meta

```c
NvDsMeta *meta = gst_buffer_get_nvds_meta(buf);
if (meta && meta->meta_type == NVDS_UUID_GST_META) {
    NvDsUuidMeta *uuid_meta = (NvDsUuidMeta *)meta->meta_data;
    // Use uuid_meta->uuid and uuid_meta->frame_index
}
```

## References

- GStreamer Documentation: https://gstreamer.freedesktop.org/documentation/
- GStreamer Base Plugins: https://gstreamer.freedesktop.org/documentation/plugins/
- NVIDIA DeepStream SDK: https://developer.nvidia.com/deepstream-sdk
