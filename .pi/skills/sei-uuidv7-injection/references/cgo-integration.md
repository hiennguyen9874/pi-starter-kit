# CGo Integration Reference

## Overview

This document covers C++/Go CGo integration for SEI UUID injection and extraction.

## Build System

### Makefile Structure

```makefile
# Build C++ static library
libinjector.a: gst_worker.o
	ar rcs libinjector.a gst_worker.o

# Compile C++ source
gst_worker.o: gst_worker.cpp gst_worker.h sei_utils.h
	g++ -c -std=c++17 -fPIC $(CFLAGS) gst_worker.cpp

# Link with Go
injector.go: libinjector.a
	go build -tags static

.PHONY: clean
clean:
	rm -f *.o *.a
```

### Build Flags

```makefile
CFLAGS = \
	-I$(shell go env GOROOT)/src/include \
	$(shell pkg-config --cflags gstreamer-1.0 \
	                            gstreamer-video-1.0 \
	                            gstreamer-codecparsers-1.0) \
	-I./api/pkg/common
```

## Go Cgo Structure

### Type Declarations

```go
package injector

/*
#cgo CFLAGS: -I./api/pkg/common
#cgo LDFLAGS: -lgstreamer-1.0 -lgstreamer-video-1.0 -lgstreamer-codecparsers-1.0

#include "gst_worker.h"
*/
import "C"
import (
	"unsafe"
)

// Worker config matches C struct layout
type WorkerConfig struct {
	SchemaUUID [16]byte
	Codec       int
	Container   int
	GenerateUUID bool
}

// Video config matches C struct layout
type VideoConfig struct {
	FirstFrameUUID [16]byte
	BaseTimestampMs int64
}
```

### Callbacks from C to Go

```go
//export injectVideoCallback
func injectVideoCallback(status C.int, userData unsafe.Pointer) {
    // Convert C status to Go
    s := int(status)

    // Handle completion
    if s == 1 { // GST_WORKER_STATUS_SUCCESS
        log.Info("Video injection completed successfully")
    } else {
        log.Error("Video injection failed")
    }

    // Clean up userData if needed
    if userData != nil {
        // userData was Go pointer passed to C
    }
}
```

## C Side Implementation

### Worker Context (C++)

```cpp
struct GstWorkerContext {
    /* Pipeline elements */
    GstElement *pipeline;
    GstElement *filesrc;
    GstElement *parser;
    GstElement *muxer;
    GstElement *filesink;

    /* Bus */
    GstBus *bus;
    guint bus_watch_id;

    /* Configuration */
    uint8_t schema_uuid[16];
    GstWorkerCodec codec;
    GstWorkerContainer container;
    gboolean generate_uuid;

    /* Callback to Go */
    GstWorkerCallback callback;
    void *callback_user_data;

    /* State */
    gboolean is_processing;
    gchar *last_error;
    guint32 frame_index;
    uint8_t last_uuid[16];

    /* Per-video config */
    uint8_t first_frame_uuid[16];
    int64_t base_timestamp_ms;

    /* Probe ID */
    gulong sei_probe_id;
};
```

### Go API Bridge

```cpp
extern "C" {

GstWorkerContext *gst_worker_create(const GstWorkerConfig *config) {
    // Initialize GStreamer
    if (!gst_is_initialized()) {
        gst_init(NULL, NULL);
    }

    GstWorkerContext *ctx = g_new0(GstWorkerContext, 1);

    // Copy config from Go
    if (config) {
        memcpy(ctx->schema_uuid, config->schema_uuid, 16);
        ctx->codec = static_cast<GstWorkerCodec>(config->codec);
        ctx->container = static_cast<GstWorkerContainer>(config->container);
        ctx->generate_uuid = config->generate_uuid;
    }

    // Create pipeline
    create_pipeline(ctx);

    return ctx;
}

void gst_worker_register_callback(GstWorkerContext *ctx,
                                GstWorkerCallback callback,
                                void *user_data) {
    ctx->callback = callback;
    ctx->callback_user_data = user_data;
}

gboolean gst_worker_process_video(GstWorkerContext *ctx,
                                const char *input_path,
                                const char *output_path) {
    // Set file locations
    g_object_set(ctx->filesrc, "location", input_path, NULL);
    g_object_set(ctx->filesink, "location", output_path, NULL);

    // Reset state
    ctx->frame_index = 0;
    ctx->has_initial_pts = FALSE;

    // Start pipeline
    GstStateChangeReturn ret = gst_element_set_state(
        ctx->pipeline, GST_STATE_PLAYING
    );

    ctx->is_processing = (ret == GST_STATE_CHANGE_SUCCESS);
    return ctx->is_processing;
}

} // extern "C"
```

## Go Side Implementation

### Worker Wrapper

```go
type Injector struct {
	ctx      unsafe.Pointer
	callback  func(status int)
	doneChan  chan int
}

func NewInjector(config WorkerConfig) (*Injector, error) {
	// Convert Go config to C
	cConfig := (*C.GstWorkerConfig)(C.malloc(C.sizeof_GstWorkerConfig))
	defer C.free(unsafe.Pointer(cConfig))

	copy(cConfig.schema_uuid[:], config.SchemaUUID[:])
	cConfig.codec = C.int(config.Codec)
	cConfig.container = C.int(config.Container)
	cConfig.generate_uuid = C.gboolean(0)
	if config.GenerateUUID {
		cConfig.generate_uuid = C.gboolean(1)
	}

	// Create C worker
	cCtx := C.gst_worker_create(cConfig)
	if cCtx == nil {
		return nil, errors.New("failed to create worker")
	}

	// Create Go wrapper
	inj := &Injector{
		ctx:     cCtx,
		doneChan: make(chan int, 1),
	}

	// Register callback
	C.gst_worker_register_callback(
		cCtx,
		(C.GstWorkerCallback)(C.injectVideoCallback),
		unsafe.Pointer(inj),
	)

	return inj, nil
}

func (i *Injector) Inject(inputPath, outputPath string,
                          config VideoConfig) error {
	cInput := C.CString(inputPath)
	defer C.free(unsafe.Pointer(cInput))

	cOutput := C.CString(outputPath)
	defer C.free(unsafe.Pointer(cOutput))

	cConfig := (*C.GstVideoConfig)(C.malloc(C.sizeof_GstVideoConfig))
	defer C.free(unsafe.Pointer(cConfig))

	copy(cConfig.first_frame_uuid[:], config.FirstFrameUUID[:])
	cConfig.base_timestamp_ms = C.int64_t(config.BaseTimestampMs)

	// Set per-video config
	C.gst_worker_process_video_with_config(
		(*C.GstWorkerContext)(i.ctx),
		cInput, cOutput, cConfig,
	)

	return nil
}

func (i *Injector) Close() {
	if i.ctx != nil {
		C.gst_worker_destroy((*C.GstWorkerContext)(i.ctx))
		i.ctx = nil
	}
	close(i.doneChan)
}
```

### Synchronous Processing

```go
func (i *Injector) InjectSync(inputPath, outputPath string,
                            config VideoConfig) error {
	cInput := C.CString(inputPath)
	defer C.free(unsafe.Pointer(cInput))

	cOutput := C.CString(outputPath)
	defer C.free(unsafe.Pointer(cOutput))

	cConfig := (*C.GstVideoConfig)(C.malloc(C.sizeof_GstVideoConfig))
	defer C.free(unsafe.Pointer(cConfig))

	copy(cConfig.first_frame_uuid[:], config.FirstFrameUUID[:])
	cConfig.base_timestamp_ms = C.int64_t(config.BaseTimestampMs)

	status := C.gst_worker_process_video_with_config_sync(
		(*C.GstWorkerContext)(i.ctx),
		cInput, cOutput, cConfig,
	)

	if status != C.GST_WORKER_STATUS_SUCCESS {
		return fmt.Errorf("injection failed with status %d", status)
	}

	return nil
}
```

## Memory Management

### Go to C (No Copy)

```go
// Pass Go slice to C (zero copy)
cData := (*C.uchar)(&slice[0])
cSize := C.size_t(len(slice))

// C function reads directly from Go memory
C.process_data(cData, cSize)
```

### C to Go (Copy)

```go
// Allocate Go buffer
buf := make([]byte, size)

// Pass pointer to C
C.extract_data(unsafe.Pointer(&buf[0]), C.size_t(size))

// Go now owns the buffer
```

### String Conversion

```go
// Go string to C string
cStr := C.CString("hello")
defer C.free(unsafe.Pointer(cStr))

// C string to Go string
goStr := C.GoString(cStr)
```

### Byte Arrays (UUID)

```go
// Go [16]byte to C uint8_t[16]
var goUUID [16]byte
var cUUID [16]byte
copy(cUUID[:], goUUID[:])

// Pass to C
C.gst_worker_set_uuid((*C.uint8_t)(&cUUID[0]))
```

## Error Handling

### C Errors to Go

```cpp
// C side: set error
static void set_error(GstWorkerContext *ctx, const char *format, ...) {
    if (ctx->last_error) {
        g_free(ctx->last_error);
    }

    va_list args;
    va_start(args, format);
    ctx->last_error = g_strdup_vprintf(format, args);
    va_end(args);
}

// Go side: check error
func (i *Injector) GetError() string {
	if i.ctx == nil {
		return ""
	}
	cErr := C.gst_worker_get_error((*C.GstWorkerContext)(i.ctx))
	if cErr == nil {
		return ""
	}
	return C.GoString(cErr)
}
```

### Status Codes

```go
type Status int

const (
	StatusError    Status = 0
	StatusSuccess  Status = 1
	StatusCancelled Status = 2
)

// Convert C status to Go
func parseStatus(cStatus C.int) Status {
	switch Status(cStatus) {
	case 1:
		return StatusSuccess
	case 2:
		return StatusCancelled
	default:
		return StatusError
	}
}
```

## Thread Safety

### Mutex in C

```cpp
// Static mutex for UUID generation
static pthread_mutex_t uuid_lock = PTHREAD_MUTEX_INITIALIZER;

void uuidv7_new(uint8_t *uuid_out) {
    pthread_mutex_lock(&uuid_lock);
    // Generate UUID
    pthread_mutex_unlock(&uuid_lock);
}
```

### Go Side (No Mutex Needed)

Go's goroutine scheduler provides concurrency safety. Go callbacks are serialized.

## Build Commands

### Go Build with CGo

```bash
# Set CGO enabled
export CGO_ENABLED=1

# Build with static linking
go build -tags static -o injector ./cmd/injector

# Build with specific C++ standard
CXX=clang++ go build -ldflags="-lstdc++" ./cmd/injector
```

### Cross-compilation

```bash
# For Linux target from macOS
GOOS=linux GOARCH=amd64 CGO_ENABLED=1 \
    CC=x86_64-linux-gnu-gcc CXX=x86_64-linux-gnu-g++ \
    go build ./cmd/injector
```

## Testing

### Unit Tests

```go
func TestInjectorCreate(t *testing.T) {
	config := WorkerConfig{
		SchemaUUID:   common.DefaultSchemaUUID,
		Codec:        1, // H264
		Container:    0, // MP4
		GenerateUUID: true,
	}

	inj, err := NewInjector(config)
	if err != nil {
		t.Fatalf("Failed to create injector: %v", err)
	}
	defer inj.Close()

	if inj.ctx == nil {
		t.Fatal("Context is nil")
	}
}
```

### Integration Tests

```go
func TestInjectVideo(t *testing.T) {
	inj := setupInjector(t)
	defer inj.Close()

	input := "testdata/test.mp4"
	output := "testdata/out.mp4"

	config := VideoConfig{
		FirstFrameUUID: [16]byte{...},
		BaseTimestampMs:  time.Now().UnixMilli(),
	}

	err := inj.InjectSync(input, output, config)
	if err != nil {
		t.Fatalf("Injection failed: %v", err)
	}

	// Verify output
	verifySEIInjection(t, output)
}
```

## References

- CGo Documentation: https://pkg.go.dev/cmd/cgo
- GStreamer CGo Examples: https://gstreamer.freedesktop.org/documentation/application-development/
- Go FFI Best Practices: https://github.com/golang/go/wiki/cgo
