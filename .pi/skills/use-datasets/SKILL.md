---
name: use-datasets
description: "Use when loading, cleaning, transforming, streaming, saving, sharing, or semantically searching datasets with the Hugging Face datasets library, including load_dataset, Dataset.map/filter, DatasetDict splits, Arrow, streaming, FAISS indexes, local/remote files, or push_to_hub."
---

# Use Datasets

Reference: [datasets](https://huggingface.co/docs/datasets/llms.txt)

## Overview

Use the Hugging Face `datasets` library as the default path for ML/NLP dataset work: load data from the Hub, local files, or remote URLs; transform it with `Dataset.map()` and `Dataset.filter()`; handle large corpora with memory mapping or streaming; save/share cleaned datasets; and build FAISS-backed semantic search over embeddings.

## When to Use

Use this skill when the user needs to:
- Load CSV, TSV, text, JSON, JSONL, compressed files, pickled DataFrames, Hub datasets, or remote URLs.
- Clean, sample, rename, sort, split, tokenize, filter, or add columns to a `Dataset` or `DatasetDict`.
- Work with datasets too large for RAM or disk.
- Convert between 🤗 Datasets and Pandas/NumPy/PyTorch/TensorFlow formats.
- Save datasets locally, reload them offline, or push them to the Hugging Face Hub.
- Build semantic search by embedding rows and adding a FAISS index.

Do not use this skill for general Pandas-only analysis unless the data is intended to become a Hugging Face `Dataset` or model-training corpus.

## Quick Decision Guide

| Need | Use |
|---|---|
| Hub dataset | `load_dataset("dataset_id", split=...)` |
| Local/remote CSV, TSV, JSON, JSONL, text, pickle | `load_dataset(format, data_files=...)` |
| Huge but fits on disk | normal `load_dataset()`; rely on Arrow memory mapping |
| Too large for disk or needs online iteration | `load_dataset(..., streaming=True)` |
| Transform rows or add columns | `dataset.map(function)` |
| Remove rows | `dataset.filter(predicate)` |
| Speed up batch-friendly transforms | `map(..., batched=True)` |
| Multiprocess pure Python transforms | `map(..., num_proc=N)` |
| Preserve train/test/validation split names | pass `data_files` as a split-name dictionary |
| Offline handoff | `save_to_disk()` on online machine, `load_from_disk()` offline |
| Share dataset publicly or privately | login, then `dataset.push_to_hub("repo-name")` |
| Vector search | create embeddings column, `add_faiss_index()`, then `get_nearest_examples()` |

## Loading Datasets

Choose the loader from the file format and location.

```python
from datasets import load_dataset

# Hub dataset
dataset = load_dataset("glue", "mrpc", split="train")

# Local CSV/TSV
files = {"train": "train.tsv", "test": "test.tsv"}
dataset = load_dataset("csv", data_files=files, delimiter="\t")

# Local nested JSON with a top-level field
dataset = load_dataset("json", data_files="SQuAD_it-train.json", field="data")

# Remote compressed JSONL/JSON/CSV; decompression is automatic for common archives
url = "https://example.com/data.jsonl.gz"
dataset = load_dataset("json", data_files=url, split="train")
```

`data_files` can be a string, list, glob pattern, or dictionary mapping split names to file paths/URLs. Prefer the dictionary form when the files already represent `train`, `validation`, or `test` splits.

## Inspecting, Sampling, and Cleaning

Start with a small reproducible sample before transforming the whole dataset.

```python
sample = dataset["train"].shuffle(seed=42).select(range(1000))
sample[:3]
```

Common operations:

```python
# Verify uniqueness
for split in dataset.keys():
    assert len(dataset[split]) == len(dataset[split].unique("id"))

# Rename across all splits in a DatasetDict
dataset = dataset.rename_column("Unnamed: 0", "patient_id")

# Drop bad rows before applying string methods
dataset = dataset.filter(lambda x: x["condition"] is not None)

# Normalize an existing column
dataset = dataset.map(lambda x: {"condition": x["condition"].lower()})

# Add a new column
dataset = dataset.map(lambda x: {"review_length": len(x["review"].split())})

# Sort or filter using the new column
dataset["train"].sort("review_length")[:3]
dataset = dataset.filter(lambda x: x["review_length"] > 30)
```

When mapping over multiple splits, operating on a `DatasetDict` applies the transform to each split.

## Using `map()` Well

Use `batched=True` when the transform accepts lists of values, especially with fast tokenizers.

```python
from transformers import AutoTokenizer

tokenizer = AutoTokenizer.from_pretrained("bert-base-cased")

def tokenize_function(examples):
    return tokenizer(examples["text"], truncation=True)

tokenized = dataset.map(tokenize_function, batched=True)
```

Use `num_proc` for CPU-bound Python transforms when the transform itself is not already parallelized.

```python
tokenized = dataset.map(tokenize_function, batched=True, num_proc=8)
```

If a batched map returns more rows than it receives, either remove old columns or replicate old values with `overflow_to_sample_mapping`.

```python
def tokenize_and_split(examples):
    return tokenizer(
        examples["review"],
        truncation=True,
        max_length=128,
        return_overflowing_tokens=True,
    )

tokenized = dataset.map(
    tokenize_and_split,
    batched=True,
    remove_columns=dataset["train"].column_names,
)
```

To preserve original columns when splitting examples:

```python
def tokenize_and_split(examples):
    result = tokenizer(
        examples["review"],
        truncation=True,
        max_length=128,
        return_overflowing_tokens=True,
    )
    sample_map = result.pop("overflow_to_sample_mapping")
    for key, values in examples.items():
        result[key] = [values[i] for i in sample_map]
    return result
```

## Pandas Interop

Use Pandas when you need operations like `groupby()`, `value_counts()`, plotting, or `explode()`, then convert back.

```python
from datasets import Dataset

# Output format changes; underlying storage remains Arrow
dataset.set_format("pandas")
train_df = dataset["train"][:]  # slice to materialize a DataFrame

frequencies = (
    train_df["condition"]
    .value_counts()
    .to_frame()
    .reset_index()
    .rename(columns={"index": "condition", "count": "frequency"})
)

freq_dataset = Dataset.from_pandas(frequencies)
dataset.reset_format()
```

For list-valued columns, Pandas `explode()` is often the simplest path:

```python
dataset.set_format("pandas")
df = dataset[:]
comments_df = df.explode("comments", ignore_index=True)
comments_dataset = Dataset.from_pandas(comments_df)
```

## Splits, Saving, Offline Use, and Sharing

Create validation splits without touching the final test set.

```python
clean = dataset["train"].train_test_split(train_size=0.8, seed=42)
clean["validation"] = clean.pop("test")
clean["test"] = dataset["test"]
```

Save Arrow format when you want faithful, efficient reloads.

```python
from datasets import load_from_disk

clean.save_to_disk("my-dataset")
reloaded = load_from_disk("my-dataset")
```

Save portable JSONL/CSV files one split at a time.

```python
for split, split_dataset in clean.items():
    split_dataset.to_json(f"my-dataset-{split}.jsonl")
```

For offline machines: on an online machine, run `load_dataset(...)` and `save_to_disk(...)`; copy the saved directory; on the offline machine, use `load_from_disk(...)`.

To share on the Hub:

```python
from huggingface_hub import notebook_login

notebook_login()  # or `huggingface-cli login` in a terminal
clean.push_to_hub("my-dataset")
```

Never paste GitHub or Hugging Face tokens into code that may be committed or shared. Prefer environment variables or a `.env` file.

## Large Datasets and Streaming

Normal `load_dataset()` uses Apache Arrow memory mapping: the dataset can be much larger than RAM because data is accessed from filesystem-backed Arrow files instead of fully loaded into memory.

Use streaming when the corpus is too large to download or store locally.

```python
streamed = load_dataset(
    "json",
    data_files="https://example.com/huge.jsonl.zst",
    split="train",
    streaming=True,
)

first = next(iter(streamed))
```

Streaming returns an `IterableDataset`, so random indexing is unavailable. Use streaming-compatible methods:

```python
tokenized = streamed.map(lambda x: tokenizer(x["text"]), batched=True)
shuffled = streamed.shuffle(buffer_size=10_000, seed=42)
validation = shuffled.take(1000)
train = shuffled.skip(1000)
```

Combine large streamed corpora with `interleave_datasets()`.

```python
from itertools import islice
from datasets import interleave_datasets

combined = interleave_datasets([streamed_a, streamed_b])
preview = list(islice(combined, 2))
```

## Creating Datasets from APIs

For API-sourced data, fetch JSON records, save JSONL locally, then load with `load_dataset("json", ...)`.

```python
import os
import requests
import pandas as pd
from datasets import load_dataset

headers = {"Authorization": f"token {os.environ['GITHUB_TOKEN']}"}
url = "https://api.github.com/repos/huggingface/datasets/issues?state=all&per_page=100"
records = requests.get(url, headers=headers).json()

pd.DataFrame.from_records(records).to_json(
    "issues.jsonl", orient="records", lines=True
)
issues = load_dataset("json", data_files="issues.jsonl", split="train")
```

Respect API pagination and rate limits. Store intermediate JSONL files so a failed later transform does not require refetching everything.

## Semantic Search with FAISS

Build semantic search by making one searchable text column, embedding it, indexing the embeddings, and querying nearest neighbors.

```python
from datasets import Dataset
import pandas as pd

comments = Dataset.from_pandas(comments_df)
comments = comments.map(lambda x: {"comment_length": len(x["comments"].split())})
comments = comments.filter(lambda x: x["comment_length"] > 15)

comments = comments.map(
    lambda x: {
        "text": x["title"] + " \n " + x["body"] + " \n " + x["comments"]
    }
)
```

After creating embeddings as NumPy arrays:

```python
embeddings_dataset = comments.map(
    lambda x: {"embeddings": get_embeddings([x["text"]]).cpu().detach().numpy()[0]}
)
embeddings_dataset.add_faiss_index(column="embeddings")

question_embedding = get_embeddings(["How can I load a dataset offline?"]).cpu().detach().numpy()
scores, samples = embeddings_dataset.get_nearest_examples(
    "embeddings", question_embedding, k=5
)

results = pd.DataFrame.from_dict(samples)
results["scores"] = scores
results.sort_values("scores", ascending=False, inplace=True)
```

Use a sentence-transformer checkpoint suited to semantic search, such as `sentence-transformers/multi-qa-mpnet-base-dot-v1`, when the query is short and the documents are longer.

## Common Mistakes

| Mistake | Fix |
|---|---|
| Calling `.lower()` on missing strings | Filter `None` values first or handle them in the map function |
| Expecting `Dataset.sample()` | Use `dataset.shuffle(seed=...).select(range(n))` |
| Using `set_format("pandas")` and expecting a DataFrame object | Slice the dataset: `df = dataset[:]` |
| Forgetting `reset_format()` after Pandas work | Call `dataset.reset_format()` before normal Dataset access/training |
| Returning a different number of rows from batched `map()` while keeping old columns | Use `remove_columns=...` or replicate old columns using `overflow_to_sample_mapping` |
| Indexing a streamed dataset | Iterate, `take()`, or `skip()` instead |
| Materializing a huge streamed dataset with `list(...)` | Only take small previews or stream into training/preprocessing |
| Saving only cache-dependent work | Use `save_to_disk()` or export split files explicitly |
| Hardcoding tokens | Use environment variables, CLI login, or `.env` files |

## Completion Checklist

Before handing off dataset code:
- Show how data is loaded and which splits are produced.
- Inspect a small sample or schema (`features`, `column_names`, `num_rows`).
- Make transforms reproducible with seeds where sampling/splitting/shuffling matters.
- Use `batched=True` for tokenizer or list-friendly transforms.
- Avoid loading huge datasets into memory unless intentionally materializing a sample.
- Save or document the final dataset path/repo if downstream work depends on it.
