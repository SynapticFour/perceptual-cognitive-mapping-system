# Data-protection impact note

This note is not a legal opinion. It records the purpose, the data, the risks, and the measures in this repository.

## Purpose

Show a person their own result. With that person's explicit consent, save the result so they can open it again later or on another device.

## Data

Answers, response times, a session identifier, timestamps, and the derived profile. The questionnaire does not ask for a name, an email address, or a postal address. The restore secret is shown to the person. Only its SHA-256 hash is stored with the session.

## Risks

Anyone who has the restore link can open the answers. Answers about how a person thinks may concern health. A database compromise would expose the pseudonymous answers. It would not expose the restore secret, because the secret is not stored.

## Measures

By default the answers stay in the browser. Saving is a separate choice and is not pre-selected. Saved answers are pseudonymous and are stored with Supabase in the EU region configured for the project. Row-level security has no anonymous read of session rows. The routes that open or delete a session run on the server with the service role, compare the hash in constant time, and are rate-limited. The same secret deletes every row of that session. A daily job deletes a session 12 months after it was saved, if the person has not deleted it first. Saved answers are not evaluated for research, not aggregated across people, and not published.
