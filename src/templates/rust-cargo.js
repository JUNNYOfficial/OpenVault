/**
 * Rust Cargo.toml Template
 * Looks like a legitimate Cargo configuration for a Rust project.
 */

module.exports = {
  header: `[package]
name = "rusty-engine"
version = "0.1.0"
edition = "2021"
authors = ["Dev Team <dev@example.com>"]
description = "A high-performance async runtime for Rust"
license = "MIT OR Apache-2.0"
repository = "https://github.com/example/rusty-engine"
keywords = ["async", "runtime", "performance"]
categories = ["asynchronous", "network-programming"]
rust-version = "1.70"
`,
  sections: [
    `[dependencies]
# Core async runtime
tokio = { version = "1.35", features = ["full", "rt-multi-thread"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# HTTP client
reqwest = { version = "0.11", features = ["json", "rustls-tls"] }

# Configuration
config = "0.14"

# CLI
clap = { version = "4.4", features = ["derive"] }
`,
    `[dependencies.uuid]
version = "1.6"
features = ["v4", "serde"]

[dependencies.chrono]
version = "0.4"
features = ["serde"]

[dependencies.regex]
version = "1.10"
`,
    `[dev-dependencies]
# Testing
tokio-test = "0.4"
mockall = "0.12"
pretty_assertions = "1.4"

# Benchmarking
criterion = { version = "0.5", features = ["html_reports"] }

# Async testing helpers
wiremock = "0.6"
`,
    `[[bin]]
name = "rusty-engine"
path = "src/main.rs"

[[bin]]
name = "rusty-cli"
path = "src/bin/cli.rs"
`,
    `[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true
`,
    `[profile.dev]
opt-level = 0
debug = true
split-debuginfo = "unpacked"
`,
    `[features]
default = ["metrics", "tracing"]
metrics = ["prometheus"]
tracing = ["jaeger"]
full = ["metrics", "tracing", "experimental"]
experimental = []
`  ],
  footer: `
# See more keys and their definitions at https://doc.rust-lang.org/cargo/reference/manifest.html
`,
  slots: 7
};
