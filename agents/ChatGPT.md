# ChatGPT.md

## Project: Sol System Census

This file defines working context, constraints, and contribution expectations for ChatGPT-based agents interacting with this repository.

It is intentionally minimal and designed to evolve.

---

## 1. Project Overview

The Sol System Census is a composable knowledge system for representing the Solar System as a versioned, modular information graph.

Core concepts:

- **Objects**: celestial bodies, spacecraft, missions, observations
- **Packages**: modular extensions that add, modify, or annotate objects
- **Distributions**: curated sets of packages representing a coherent “view” of the system
- **Canonical**: the default distribution baseline (not privileged structurally, only socially)

The system prioritizes:
- reproducibility
- composability
- explicit versioning
- coexistence of multiple valid interpretations

---

## 2. Repository Structure (High-Level)

- `data/canonical/` → canonical baseline dataset (versioned)
- `data/packages/` → modular extensions
- `src/` → web/UI implementation
- `worker/` → backend or edge functions
- `archive/` → legacy builds and historical artifacts
- `agents/` → AI or human contributor manifests and invitations
- `docs/` → conceptual and technical documentation

---

## 3. Agent Role (ChatGPT / LLM behavior)

When contributing or suggesting changes, agents should:

### 3.1 Prioritize
- clarity over completeness
- minimal viable structure over overengineering
- composability over monolithic design
- reversibility of decisions

### 3.2 Avoid
- premature schema enforcement
- rigid ontology locking
- unnecessary abstraction layers
- assuming final architecture exists

### 3.3 Assume system state
- The system is **evolving and experimental**
- Canonical data is **not final truth, only baseline reference**
- Multiple conflicting packages may coexist intentionally

---

## 4. Contribution Types

Agents may assist in:

### 4.1 Data Layer
- object definitions
- corrections and annotations
- metadata normalization

### 4.2 Package Design
- creating modular extensions
- defining transformations over canonical data
- proposing alternative distributions

### 4.3 Distribution Design
- grouping packages into coherent views
- defining curated datasets for use cases (education, research, simulation)

### 4.4 Interface / UX
- improving visualization of solar system graph
- designing navigation between distributions
- reducing cognitive overload

### 4.5 Documentation
- clarifying terminology
- improving conceptual explanations
- reducing ambiguity between layers

---

## 5. Data Principles

- All entities should be versioned or traceable
- No destructive edits without historical reference
- Prefer additive modifications over overwrites
- Conflicts are allowed and expected across packages

---

## 6. Mental Model for Agents

Think in terms of:
