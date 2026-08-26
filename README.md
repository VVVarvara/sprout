# Sprout — local nutrition & lifestyle coaching app

A complete, free, local-first coaching platform for a solo practice. No cloud services,
no license costs, no data leaving your machine. Everything lives in one folder:
the database is a single file (`data/sprout.db`) and uploaded documents sit in
`storage/uploads/`.

## What's inside

**For clients**
- Self-service registration (they get the intake questionnaire automatically)
- 30-second daily check-in: weight, sleep, energy / mood / stress (1–5), water, free note
- Dashboard with streak, weight change, and trend charts (weight, sleep, wellbeing)
- Questionnaires assigned by you, scored automatically with result bands
- Document upload (bloodwork, imaging reports, genetic tests…) — PDF/images up to 20 MB

**For you (the coach)**
- Client roster with "active / quiet" flags (quiet = no check-in for 3+ days)
- Per-client view: all charts, questionnaire answers in full, their check-in notes
- Private coach notes per client
- Assign any questionnaire to any client
- Access to every client's documents

## Requirements

Only [Node.js](https://nodejs.org) 18+ (free). Nothing else.

## Setup (one time)

```bash
npm install
npm run setup     # creates the database and demo accounts
```

## Run

```bash
npm run dev       # development, http://localhost:3000
```

or for the faster production build:

```bash
npm run build
npm start
```

## Log in

| Role | Email | Password |
|---|---|---|
| Coach (you) | `coach@local.test` | `coach1234` |
| Demo client (with 3 weeks of sample data) | `demo@local.test` | `client1234` |

**Change the coach password** before using it with real clients: the quickest way for now
is to delete `data/sprout.db`, edit the password in `scripts/seed.js`, and run
`npm run setup` again.

Real clients create their own accounts at `/register`.

## Where your data lives

| What | Where |
|---|---|
| Database (accounts, check-ins, answers, notes) | `data/sprout.db` |
| Uploaded documents | `storage/uploads/` |

Back up = copy those two paths. That's it.

## Adding your own questionnaires

Questionnaires are JSON stored in the database — see the two examples in
`scripts/seed.js`. Question types: `choice` (scored options), `scale` (range),
`number`, `text`. Add `bands` to map total scores to labels like "Strong foundation".
The two included instruments are original content written for this app; if you later
add validated clinical instruments (PSS-10, PSQI, etc.), check their license terms first.

## A note on client health data (GDPR)

Even running locally, once real clients upload medical documents you are processing
special-category data under GDPR Art. 9. Sensible minimums: get explicit consent,
keep your computer disk-encrypted, and delete data when a client asks. The
"everything stays on this machine" design makes compliance much easier, but doesn't
remove it.

## Ideas for the next iteration

- Habit plans with weekly targets
- In-app messaging between you and clients
- One-click export/backup (ZIP of database + documents)
- Meal photo log
- Audit log + consent records before onboarding clients with pathologies
