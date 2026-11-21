# Group Joiner

Students enter their name → it's matched against your Google Sheet → they enter student ID + group number → ID is saved to the sheet → they're redirected to their group's WhatsApp link.

## 1. Prepare the Google Sheet
Upload your Excel file to Google Sheets (File > Import), then set up two tabs:

**Students** (header in row 1)
| A: Name | B: Student ID | C: Group | D: Registered at |
Fill column A only. B–D are filled by the app.

**Groups** (header in row 1)
| A: Group number | B: WhatsApp invite link |

## 2. Create a service account
1. console.cloud.google.com → new project → enable **Google Sheets API**
2. IAM & Admin → Service Accounts → create one → Keys → Add key → JSON
3. Share your Google Sheet with the service account's `client_email` as **Editor**

## 3. Run locally
```
npm install
cp .env.example .env.local   # fill in the values from the JSON key + sheet URL
npm run dev
```

## 4. Deploy
Push to GitHub, import into Vercel, add the same four env vars, deploy.
When pasting GOOGLE_PRIVATE_KEY into Vercel, keep the `\n` sequences as they are.
