# D2 command patterns

```sh
# Validate and normalize source
d2 validate diagram.d2
d2 fmt diagram.d2

# Web SVG with light/dark themes and ELK
d2 --layout elk --theme 101 --dark-theme 200 diagram.d2 diagram.svg

# Live editing
d2 --watch --host localhost --port 8080 diagram.d2

# Static exports
d2 diagram.d2 diagram.png
d2 diagram.d2 diagram.pdf
d2 diagram.d2 diagram.pptx

# Simple terminal-safe output
d2 --ascii-mode standard diagram.d2 diagram.txt

# Render one board, then a board and all descendants
d2 --target='scenarios.failure' diagram.d2 failure.svg
d2 --target='layers.system.*' diagram.d2 system.pdf

# Animate a short composition
d2 --animate-interval 1200 diagram.d2 walkthrough.gif

# Pipeline without temporary D2 source
echo 'client -> api: HTTPS' | d2 - - > diagram.svg
echo 'client -> api' | d2 --stdout-format ascii - -

# CI formatting check
d2 fmt --check diagram.d2
```
