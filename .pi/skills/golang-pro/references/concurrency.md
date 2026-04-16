# Concurrency Patterns

Production concurrency patterns for Go with lifecycle-safe goroutines, channel coordination, bounded parallelism, and graceful shutdown.

## Core Concepts

| Primitive | Purpose |
|---|---|
| `goroutine` | Lightweight concurrent execution |
| `channel` | Communication + synchronization |
| `select` | Multiplex channel ops / cancellation |
| `sync.WaitGroup` | Wait for concurrent units to finish |
| `sync.Mutex`/`RWMutex` | Protect shared mutable state |
| `context.Context` | Cancellation and deadlines |

> Mantra: do not communicate by sharing memory; share memory by communicating.

## Worker Pool

```go
type Job struct {
    ID int
}

type Result struct {
    JobID int
    Err   error
}

func WorkerPool(ctx context.Context, workers int, jobs <-chan Job) <-chan Result {
    out := make(chan Result)
    var wg sync.WaitGroup

    for i := 0; i < workers; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobs {
                select {
                case <-ctx.Done():
                    return
                case out <- Result{JobID: j.ID}:
                }
            }
        }()
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}
```

## Fan-Out / Fan-In Pipeline

```go
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case <-ctx.Done():
                return
            case out <- n:
            }
        }
    }()
    return out
}

func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case <-ctx.Done():
                return
            case out <- n * n:
            }
        }
    }()
    return out
}

func merge(ctx context.Context, cs ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    out := make(chan int)

    output := func(c <-chan int) {
        defer wg.Done()
        for n := range c {
            select {
            case <-ctx.Done():
                return
            case out <- n:
            }
        }
    }

    wg.Add(len(cs))
    for _, c := range cs {
        go output(c)
    }

    go func() {
        wg.Wait()
        close(out)
    }()

    return out
}
```

## Bounded Concurrency

```go
import "golang.org/x/sync/semaphore"

type Limiter struct {
    sem *semaphore.Weighted
}

func NewLimiter(max int64) *Limiter {
    return &Limiter{sem: semaphore.NewWeighted(max)}
}

func (l *Limiter) Run(ctx context.Context, tasks []func() error) []error {
    var wg sync.WaitGroup
    var mu sync.Mutex
    errs := make([]error, 0)

    for _, task := range tasks {
        if err := l.sem.Acquire(ctx, 1); err != nil {
            return []error{err}
        }

        wg.Add(1)
        go func(t func() error) {
            defer wg.Done()
            defer l.sem.Release(1)
            if err := t(); err != nil {
                mu.Lock()
                errs = append(errs, err)
                mu.Unlock()
            }
        }(task)
    }

    wg.Wait()
    return errs
}
```

## errgroup with Cancellation

```go
import "golang.org/x/sync/errgroup"

func fetchAll(ctx context.Context, urls []string, limit int) ([]string, error) {
    g, ctx := errgroup.WithContext(ctx)
    g.SetLimit(limit)

    out := make([]string, len(urls))
    var mu sync.Mutex

    for i, u := range urls {
        i, u := i, u
        g.Go(func() error {
            res, err := fetchURL(ctx, u)
            if err != nil {
                return fmt.Errorf("fetch %s: %w", u, err)
            }
            mu.Lock()
            out[i] = res
            mu.Unlock()
            return nil
        })
    }

    if err := g.Wait(); err != nil {
        return nil, err
    }
    return out, nil
}
```

## Graceful Shutdown

```go
func waitForShutdown(server *http.Server) error {
    sigCh := make(chan os.Signal, 1)
    signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
    <-sigCh

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    return server.Shutdown(ctx)
}
```

## Shared State Strategies

- Prefer channel ownership when possible.
- Use `sync.Map` for read-heavy, low-write contention paths.
- Use sharded `map + RWMutex` for write-heavy hot paths.

## Select Patterns

```go
select {
case v := <-ch:
    _ = v
case <-time.After(time.Second):
    return errors.New("timeout")
case <-ctx.Done():
    return ctx.Err()
default:
    // optional non-blocking fallback
}
```

## Race Detection

```bash
go test -race ./...
go run -race ./cmd/myapp
```

## Common Failures

- Goroutine leaks caused by blocked sends with no receivers
- Closing channels from receiver side
- Missing `ctx.Done()` handling in loops
- Using `time.Sleep` for synchronization
- Mixing mutex/channel ownership with unclear invariants

## Quick Reference

| Pattern | Use Case |
|---|---|
| Worker pool | Bounded parallel processing |
| Fan-out/fan-in | Parallel transform + merge |
| Pipeline | Multi-stage streaming transforms |
| Semaphore | Cap concurrent external calls |
| errgroup | Fail-fast parallel tasks |
| Graceful shutdown | Draining services on SIGINT/SIGTERM |
