# Security Specification for AlugaFácil

## Data Invariants
1. A property must have an `ownerId` matching the authenticated user.
2. A tenant must have an `ownerId` matching the authenticated user.
3. A contract must have an `ownerId` matching the authenticated user, and refer to valid `propertyId` and `tenantId`.
4. A payment must have an `ownerId` matching the authenticated user and refer to a valid `contractId`.
5. `createdAt` and `updatedAt` must be set by the server.

## Dirty Dozen Payloads (Potential Attacks)
1. **Identity Spoofing**: Attempt to create a property with a different `ownerId`.
2. **Unauthorized Read**: Attempt to read properties belonging to another user.
3. **Ghost Field Update**: Attempt to update a property with an extra hidden field like `isAdmin: true`.
4. **State Shortcut**: Attempt to change a payment status from `pending` to `paid` without a `paymentDate`.
5. **ID Poisoning**: Attempt to create a document with a massive 2KB ID.
6. **Orphaned Record**: Attempt to create a contract for a property the user doesn't own.
7. **Timestamp Spoofing**: Attempt to set `createdAt` to a historical date.
8. **Resource Exhaustion**: Send a massive string in the property description.
9. **PII Leak**: Attempt to list all tenants in the system without an owner filter.
10. **Immutable Field Change**: Attempt to change the `createdAt` field on an update.
11. **Negative Amount**: Attempt to set `rentAmount` to -100.
12. **Status Injection**: Attempt to set property status to an undefined value like "deleted-forever".

## Test Runner (firestore.rules.test.ts)
(To be implemented if needed, but I will focus on generating the rules now)
