---
name: creating-custom-tensorrt-plugins
description: Use when creating, building, registering, or loading custom TensorRT plugins in C++/CUDA, especially when wiring CMake targets, plugin creators, registration macros, or runtime library loading for ONNX/TRT engines.
---

# Creating Custom TensorRT Plugins

## Overview

Use this skill to implement a production-ready path for **create → build → register → load → validate** of TensorRT custom plugins.

Default target: a minimal, verifiable setup that builds a plugin `.so` and proves runtime registration before adding full engine/inference examples.

## When to Use

Use this skill when the user asks to:
- create a custom TensorRT plugin
- add CMake for plugin `.so` builds
- register plugin creators
- load plugins at runtime (`dlopen`, registry lookup, `loadLibrary`)
- use plugin with ONNX/TRT engine tooling

Do not use this skill for pure model accuracy tuning unrelated to plugin integration.

## Workflow

1. **Inspect existing code first**
   - Find plugin interface already used (`IPluginV2DynamicExt` or `IPluginV3`).
   - Reuse current interface unless user explicitly requests migration.

2. **Implement plugin essentials**
   - Plugin class (`enqueue`, shape/output, serialization, format support).
   - Plugin creator class (`getPluginName`, `getPluginVersion`, fields, create/deserialize).
   - Registration macro in implementation file:
     - `REGISTER_TENSORRT_PLUGIN(MyPluginCreator);`

3. **Build shared library with CMake**
   - Build plugin as `SHARED` target.
   - Link required libs: `nvinfer`, `nvinfer_plugin`, `CUDA::cudart` (plus others only if needed).
   - Prefer portable discovery via cache/env vars (e.g., `TENSORRT_ROOT`) over hardcoded distro-only paths.

4. **Load and verify runtime registration**
   - Minimal check app should:
     - load `.so` (`dlopen` with `RTLD_NOW | RTLD_LOCAL`) or `runtime->getPluginRegistry().loadLibrary(...)`
     - query creator by name/version from plugin registry
     - call `createPlugin()` once with a minimal valid `PluginFieldCollection`
   - Fail loudly if creator is missing or `createPlugin()` returns null.
   - Add a fast linker sanity check in the loop: `ldd -r /path/to/libplugin.so` must report no `undefined symbol`/`not found`.

5. **Only then add end-to-end example**
   - Build engine from ONNX or network API.
   - Ensure plugin is loaded before parse/deserialize.
   - Add run example after basic registration validation passes.

## Code Example: Plugin Creator + Registration

```cpp
#include "NvInfer.h"
#include "NvInferPlugin.h"

class MyPluginCreator : public nvinfer1::IPluginCreatorV3One {
public:
    char const* getPluginName() const noexcept override { return "MyPlugin"; }
    char const* getPluginVersion() const noexcept override { return "1"; }
    nvinfer1::PluginFieldCollection const* getFieldNames() noexcept override { return &mFC; }

    nvinfer1::IPluginV3* createPlugin(
        char const* name, nvinfer1::PluginFieldCollection const* fc, nvinfer1::TensorRTPhase phase) noexcept override
    {
        // create and return plugin instance
        return nullptr;
    }

    void setPluginNamespace(char const* libNamespace) noexcept override { mNamespace = libNamespace; }
    char const* getPluginNamespace() const noexcept override { return mNamespace.c_str(); }

private:
    nvinfer1::PluginFieldCollection mFC{};
    std::string mNamespace;
};

REGISTER_TENSORRT_PLUGIN(MyPluginCreator);
```

For V2-based plugins, creator type is typically `IPluginCreator`/`BaseCreator` and returns `IPluginV2DynamicExt*`.

## CMake Example (portable)

```cmake
cmake_minimum_required(VERSION 3.22)
project(my_trt_plugin LANGUAGES CXX CUDA)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CUDA_STANDARD 14)
if(NOT DEFINED CMAKE_CUDA_ARCHITECTURES OR CMAKE_CUDA_ARCHITECTURES STREQUAL "")
  set(CMAKE_CUDA_ARCHITECTURES 75)
endif()

set(TENSORRT_ROOT "$ENV{TENSORRT_ROOT}" CACHE PATH "TensorRT root")
if(NOT TENSORRT_ROOT)
  set(TENSORRT_ROOT /usr)
endif()

find_package(CUDAToolkit REQUIRED)
find_library(NVINFER_LIB nvinfer HINTS "${TENSORRT_ROOT}/lib" "/usr/lib/x86_64-linux-gnu" REQUIRED)
find_library(NVINFER_PLUGIN_LIB nvinfer_plugin HINTS "${TENSORRT_ROOT}/lib" "/usr/lib/x86_64-linux-gnu" REQUIRED)

add_library(my_plugin SHARED
  src/MyPlugin.cpp
  src/MyPluginCreator.cpp
  src/MyPluginKernels.cu
)

target_include_directories(my_plugin PRIVATE "${TENSORRT_ROOT}/include")
target_link_libraries(my_plugin PRIVATE ${NVINFER_LIB} ${NVINFER_PLUGIN_LIB} CUDA::cudart)
set_target_properties(my_plugin PROPERTIES OUTPUT_NAME my_plugin)
```

## Runtime Check Example (minimal)

```cpp
#include <dlfcn.h>
#include <iostream>
#include "NvInfer.h"
#include "NvInferPlugin.h"

int main(int argc, char** argv) {
    void* h = dlopen(argv[1], RTLD_NOW | RTLD_LOCAL);
    if (!h) return 1;

    auto* registry = getPluginRegistry();
    auto* creator = registry->getPluginCreator("MyPlugin", "1", "");
    if (!creator) {
        std::cerr << "Creator not found\n";
        return 2;
    }

    std::cout << "Found: " << creator->getPluginName() << " v" << creator->getPluginVersion() << "\n";
    dlclose(h);
    return 0;
}
```

## End-to-End Use Example (ONNX/TRT)

- Build plugin library first.
- Load plugin library before parsing ONNX or deserializing engine.
- With `trtexec`, use `--plugins=/path/to/libmy_plugin.so`.
- In C++, use either:
  - `runtime->getPluginRegistry().loadLibrary(path)` (runtime path), or
  - `dlopen(path, RTLD_LAZY)` + registry lookup.

## Validation Checklist

- Configure: CMake succeeds with CUDA compiler detected.
- Build: plugin `.so` produced.
- Runtime check: creator lookup succeeds.
- Runtime smoke check: `createPlugin()` succeeds.
- If engine path included: parser/runtime can deserialize with plugin loaded.

## Common Failure Modes

- Missing `REGISTER_TENSORRT_PLUGIN(...)` → creator not found at runtime.
- CUDA not configured (`CMAKE_CUDA_COMPILER`, `CMAKE_CUDA_ARCHITECTURES`) → configure/build failure.
- TensorRT headers/libs not discoverable → compile/link errors.
- Plugin loaded too late (after parse/deserialize) → unresolved custom op/plugin layer.
- Registry lookup passes but parse or `createPlugin()` fails with `undefined symbol` → likely TensorRT OSS/runtime mismatch or unavailable helper symbol in deployed TRT build.
- `ldd -r libplugin.so` shows unresolved helpers (for example `dataTypeSize(nvinfer1::DataType)`) → symbol is declared in OSS headers but not provided by deployed runtime; define/link that helper inside your plugin target (or link the exact object/library that defines it).

## References

- NVIDIA TensorRT repository: `https://github.com/NVIDIA/TensorRT`
- TensorRT plugin docs and samples (in TensorRT repo):
  - `samples/sampleNonZeroPlugin`
  - `samples/sampleOnnxMnistCoordConvAC`
  - `plugin/*` creators using `REGISTER_TENSORRT_PLUGIN(...)`

## Decision Defaults

- Prefer **minimal-first** delivery unless user asks full end-to-end immediately.
- Keep existing plugin interface (V2/V3) unless migration is explicitly requested.
- Keep changes surgical: add only files/targets required for build + registration validation.
