# Go Idioms and Engineering Patterns

Merged idiomatic patterns from `golang-patterns` for day-to-day implementation and review.

## Core Principles

- Prefer simplicity and readability over cleverness.
- Make zero values useful.
- Accept interfaces where consumed, return concrete structs.
- Return early on errors to keep the happy path flat.

## Error Handling

### Wrap with context

```go
func LoadConfig(path string) (*Config, error) {
    data, err := os.ReadFile(path)
    if err != nil {
        return nil, fmt.Errorf("load config %s: %w", path, err)
    }

    var cfg Config
    if err := json.Unmarshal(data, &cfg); err != nil {
        return nil, fmt.Errorf("parse config %s: %w", path, err)
    }
    return &cfg, nil
}
```

### Use `errors.Is` and `errors.As`

```go
if errors.Is(err, sql.ErrNoRows) {
    return ErrNotFound
}

var ve *ValidationError
if errors.As(err, &ve) {
    return fmt.Errorf("invalid field %s: %w", ve.Field, err)
}
```

### Never ignore errors

```go
if err := writer.Close(); err != nil {
    log.Printf("close writer: %v", err)
}
```

## Interfaces and Package Design

- Keep interfaces small and behavior-focused.
- Define interfaces in the consuming package.
- Avoid package-level mutable state; inject dependencies.
- Use functional options for optional configuration.

```go
type UserStore interface {
    GetUser(id string) (*User, error)
    SaveUser(user *User) error
}

type Service struct {
    store UserStore
}
```

## Struct and API Patterns

### Functional options

```go
type Option func(*Server)

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}
```

### Embedding for composition

```go
type Logger struct{}
func (Logger) Log(msg string) {}

type Server struct {
    Logger
    addr string
}
```

## Performance Patterns

### Preallocate slices

```go
results := make([]Result, 0, len(items))
for _, item := range items {
    results = append(results, process(item))
}
```

### Use `sync.Pool` in high-churn paths

```go
var bufPool = sync.Pool{New: func() any { return new(bytes.Buffer) }}
```

### Avoid string concatenation in loops

```go
var sb strings.Builder
for i, p := range parts {
    if i > 0 {
        sb.WriteString(",")
    }
    sb.WriteString(p)
}
return sb.String()
```

## Tooling Baseline

```bash
go test ./...
go test -race ./...
go test -cover ./...
go vet ./...
golangci-lint run
go mod tidy
```

## Anti-Patterns

- Panic for expected errors
- Long functions with naked returns
- Context stored in structs instead of method parameters
- Mixing pointer and value receivers inconsistently
- Hidden global dependencies via `init()`

## Quick Review Checklist

- Errors wrapped with operation context?
- Context passed to blocking operations?
- Interfaces minimal and located in consumers?
- Goroutine lifecycle and shutdown path defined?
- Benchmarks/profiles used before optimization?
