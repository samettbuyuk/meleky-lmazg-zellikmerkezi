# Security Specification for Melek Yılmaz Güzellik Merkezi

## 1. Data Invariants
- An appointment must have a valid date and time.
- Status must be one of: 'pending', 'confirmed', 'cancelled'.
- Only authorized admins can view or modify existing appointments.
- New appointments can be created by anyone, but they must be unique for a given slot (enforced by using `${date}_${time}` as ID).

## 2. The Dirty Dozen (Attacker Payloads)
1. **Unauthorized Read**: Try to list all appointments as a regular guest.
2. **Status Hijack**: Create an appointment with `status: 'confirmed'` immediately.
3. **Identity Spoofing**: Update someone else's appointment details.
4. **Massive Payload**: Send a 1MB string in the name field.
5. **Timestamp Forge**: Set `createdAt` to a date in the past.
6. **Path Poisoning**: Use a document ID with special characters or excessive length.
7. **Admin Escalation**: Create a document in/admins/ with your own UID.
8. **Shadow Field**: Adding `isVerified: true` to an appointment creation.
9. **Slot Stealing**: Overwriting an existing appointment at the same slot.
10. **Partial Update Abuse**: Changing only the `name` of a confirmed appointment without being an admin.
11. **PII Scraping**: Attempting to 'get' a specific appointment ID without being admin.
12. **Status Reversion**: Changing a 'cancelled' status back to 'pending'.

## 3. Test Runner
(I will implement the rules that block these in firestore.rules)
