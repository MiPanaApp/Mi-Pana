---
name: Logic & State Management
description: Patterns for automatic ratings, real-time chat, and complex state management in the marketplace.
---

# Logic & State Management Skill

This skill governs the complex flow of data and state transitions within "Mi Pana".

## Core Responsibilities

1.  **Automatic Rating System**:
    *   Implement logic to prompt users for ratings after successful transactions.
    *   Aggregate ratings and update seller/buyer profiles accordingly.

2.  **Real-time Chat**:
    *   Manage bidirectional chat state using Supabase Realtime or similar.
    *   Handle message history, "read" receipts, and typing indicators.

3.  **Global & Local State**:
    *   Determine when to use global state (e.g., User Context, Cart) vs local component state.
    *   Implement clear data fetching and caching patterns.

4.  **Transaction Flow**:
    *   Ensure robust state transitions during the purchase process (Pending -> Confirmed -> Shipped -> Completed).

## Patterns

*   Use custom hooks for encapsulating complex state logic.
*   Maintain "single source of truth" for critical data like user authentication and cart items.
