---
name: Supabase Management
description: Expert guidance for managing Supabase PostgreSQL, Auth, and Storage for the Mi Pana marketplace.
---

# Supabase Management Skill

This skill provides specialized knowledge for developing and maintaining the Supabase backend for "Mi Pana".

## Core Responsibilities

1.  **PostgreSQL Schema & Migrations**:
    *   Design and manage tables for products, users, transactions, and ratings.
    *   Implement Row Level Security (RLS) policies to protect user data.
    *   Optimize queries for marketplace performance.

2.  **Authentication**:
    *   Configure Supabase Auth for email/password and social logins.
    *   Manage user profiles and roles (Buyer, Seller, Admin).

3.  **Storage**:
    *   Manage buckets for product images and user avatars.
    *   Implement secure upload/download patterns.

4.  **Edge Functions**:
    *   Use for complex server-side logic, like processing ratings or sending notifications.

## Best Practices

*   Always use RLS policies; never leave tables publicly writable.
*   Use migrations for all schema changes to maintain environment consistency.
*   Leverage Supabase real-time features for chat and live notifications.
